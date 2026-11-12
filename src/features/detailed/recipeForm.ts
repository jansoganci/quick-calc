import {
  recipeCost,
  usageUnitFor,
  type PurchaseUnit,
  type RecipeAmount,
  type RecipeCostErrorCode,
  type RecipeIngredientCostInput,
  type RecipeLineCostInput,
  type UsageUnit,
} from '../../core/detailed/index.ts'
import { formatTryExact } from '../../lib/money.ts'
import { parseTurkishNumber } from '../../lib/number.ts'
import {
  emptyIngredient,
  emptyRecipeLine,
  type DetailedFormState,
  type IngredientRow,
  type ProductRow,
  type RecipeLine,
} from './formState.ts'
import { ERROR_COPY, RECIPE_COPY } from './labels.ts'

/**
 * Turns the recipe the owner typed into the one `unitProductCost` the engine
 * already knows. The formula lives in `core/detailed/recipeCost.ts`; this file
 * only parses strings, keeps the shared ingredient list consistent, and picks
 * the Turkish sentence for a structured error.
 */

function parseAmount(raw: string): RecipeAmount {
  const parsed = parseTurkishNumber(raw)
  if (parsed.status === 'empty') return null
  if (parsed.status === 'invalid') return 'invalid'
  return parsed.value
}

function sameName(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase('tr-TR') === right.trim().toLocaleLowerCase('tr-TR')
}

function toIngredientInputs(ingredients: readonly IngredientRow[]): RecipeIngredientCostInput[] {
  return ingredients.map((ingredient) => ({
    id: ingredient.id,
    purchaseQuantity: parseAmount(ingredient.purchaseQuantity),
    purchaseUnit: ingredient.purchaseUnit,
    purchasePrice: parseAmount(ingredient.purchasePrice),
  }))
}

function toLineInputs(
  lines: readonly RecipeLine[],
  ingredients: readonly IngredientRow[],
): RecipeLineCostInput[] {
  return lines.map((line) => {
    const ingredient = ingredients.find((item) => item.id === line.ingredientId)
    // A blank name has not named an ingredient yet, even if a row was opened for it.
    const named = ingredient !== undefined && ingredient.name.trim() !== ''
    return {
      ingredientId: named ? line.ingredientId : '',
      usageQuantity: parseAmount(line.usageQuantity),
    }
  })
}

export function productsUsingIngredient(
  products: readonly ProductRow[],
  ingredientId: string,
): number {
  if (ingredientId === '') return 0
  return products.filter((product) =>
    product.recipeLines.some((line) => line.ingredientId === ingredientId),
  ).length
}

/** Named ingredients, in list order. A blank row opened for a new recipe line stays hidden. */
export function listedIngredients(form: DetailedFormState): IngredientRow[] {
  return form.ingredients.filter((ingredient) => ingredient.name.trim() !== '')
}

/** The raw recipe total, or `undefined` when the recipe cannot price the product. */
export function resolvedRecipeUnitCost(
  form: DetailedFormState,
  product: ProductRow,
): number | undefined {
  const result = recipeCost(
    toIngredientInputs(form.ingredients),
    toLineInputs(product.recipeLines, form.ingredients),
  )
  return result.ok ? result.unitProductCost : undefined
}

/** Presentation only. `null` when the recipe is not a finished cost. */
export function recipeAmountText(form: DetailedFormState, product: ProductRow): string | null {
  if (product.costSource !== 'recipe') return null
  const cost = resolvedRecipeUnitCost(form, product)
  return cost === undefined ? null : formatTryExact(cost, 2)
}

export function usageUnitLabel(unit: PurchaseUnit): UsageUnit {
  return usageUnitFor(unit)
}

function messageForCode(code: RecipeCostErrorCode): string | null {
  switch (code) {
    case 'empty_recipe':
      return null
    case 'ingredient_not_found':
      return RECIPE_COPY.ingredientMissing
    case 'invalid_unit':
      return ERROR_COPY.invalid_value
    case 'not_a_number':
      return ERROR_COPY.not_a_number
    case 'purchase_quantity_empty':
      return RECIPE_COPY.purchaseQuantityEmpty
    case 'purchase_quantity_zero':
      return RECIPE_COPY.purchaseQuantityZero
    case 'purchase_price_empty':
      return RECIPE_COPY.purchasePriceEmpty
    case 'usage_quantity_empty':
      return RECIPE_COPY.usageQuantityEmpty
  }
}

/** Line-level messages for products currently priced from a recipe. Not engine errors. */
export function buildRecipeErrorMap(form: DetailedFormState): Record<string, string> {
  const messages: Record<string, string> = {}
  form.products.forEach((product, productIndex) => {
    if (product.costSource !== 'recipe') return
    const result = recipeCost(
      toIngredientInputs(form.ingredients),
      toLineInputs(product.recipeLines, form.ingredients),
    )
    if (result.ok) return
    for (const error of result.errors) {
      if (error.lineIndex < 0) continue
      const message = messageForCode(error.code)
      if (message === null) continue
      const key = `products.${productIndex}.recipeLines.${error.lineIndex}.${error.field}`
      messages[key] ??= message
      if (error.field !== 'purchaseQuantity' && error.field !== 'purchasePrice') continue
      const ingredientId = product.recipeLines[error.lineIndex]?.ingredientId
      if (!ingredientId) continue
      messages[`ingredients.${ingredientId}.${error.field}`] ??= message
    }
  })
  return messages
}

export type IngredientListNameCommit =
  | { ok: true; form: DetailedFormState }
  | { ok: false; reason: 'empty' | 'duplicate'; form: DetailedFormState }

/**
 * Renames the shared ingredient itself. Every recipe that points at it keeps
 * the same id and therefore the new name. A blank or already-used name is refused.
 */
export function commitIngredientListName(
  form: DetailedFormState,
  ingredientId: string,
  rawName: string,
): IngredientListNameCommit {
  const current = form.ingredients.find((ingredient) => ingredient.id === ingredientId)
  if (!current) return { ok: true, form }
  const trimmed = rawName.trim()
  if (trimmed === '') return { ok: false, reason: 'empty', form }
  const taken = form.ingredients.some(
    (ingredient) =>
      ingredient.id !== ingredientId && ingredient.name.trim() !== '' && sameName(ingredient.name, trimmed),
  )
  if (taken) return { ok: false, reason: 'duplicate', form }
  if (current.name === trimmed) return { ok: true, form }
  return { ok: true, form: replaceIngredient(form, { ...current, name: trimmed }) }
}

function replaceProducts(
  form: DetailedFormState,
  products: ProductRow[],
): DetailedFormState {
  return { ...form, products }
}

export function dropUnusedIngredients(form: DetailedFormState): DetailedFormState {
  const used = new Set(
    form.products.flatMap((product) => product.recipeLines.map((line) => line.ingredientId)),
  )
  const ingredients = form.ingredients.filter((ingredient) => used.has(ingredient.id))
  if (ingredients.length === form.ingredients.length) return form
  return { ...form, ingredients }
}

function mapLine(
  form: DetailedFormState,
  productIndex: number,
  lineIndex: number,
  map: (line: RecipeLine) => RecipeLine,
): DetailedFormState {
  return replaceProducts(
    form,
    form.products.map((product, at) =>
      at === productIndex
        ? {
            ...product,
            recipeLines: product.recipeLines.map((line, lineAt) =>
              lineAt === lineIndex ? map(line) : line,
            ),
          }
        : product,
    ),
  )
}

/** Opens the helper. An existing recipe is kept; the first open starts one blank line. */
export function openRecipe(form: DetailedFormState, productIndex: number): DetailedFormState {
  const product = form.products[productIndex]
  if (!product) return form
  if (product.recipeLines.length > 0) {
    if (product.costSource === 'recipe') return form
    return replaceProducts(
      form,
      form.products.map((row, at) => (at === productIndex ? { ...row, costSource: 'recipe' } : row)),
    )
  }
  const ingredient = emptyIngredient()
  return {
    ...form,
    ingredients: [...form.ingredients, ingredient],
    products: form.products.map((row, at) =>
      at === productIndex
        ? { ...row, costSource: 'recipe', recipeLines: [emptyRecipeLine(ingredient.id)] }
        : row,
    ),
  }
}

/** Hides the helper. The typed cost is used again; the recipe itself stays. */
export function closeRecipe(form: DetailedFormState, productIndex: number): DetailedFormState {
  const product = form.products[productIndex]
  if (!product || product.costSource === 'manual') return form
  return replaceProducts(
    form,
    form.products.map((row, at) => (at === productIndex ? { ...row, costSource: 'manual' } : row)),
  )
}

export function addRecipeLine(form: DetailedFormState, productIndex: number): DetailedFormState {
  const product = form.products[productIndex]
  if (!product) return form
  const ingredient = emptyIngredient()
  return {
    ...form,
    ingredients: [...form.ingredients, ingredient],
    products: form.products.map((row, at) =>
      at === productIndex
        ? { ...row, recipeLines: [...row.recipeLines, emptyRecipeLine(ingredient.id)] }
        : row,
    ),
  }
}

export function removeRecipeLine(
  form: DetailedFormState,
  productIndex: number,
  lineIndex: number,
): DetailedFormState {
  const product = form.products[productIndex]
  if (!product || product.recipeLines[lineIndex] === undefined) return form
  return dropUnusedIngredients(
    replaceProducts(
      form,
      form.products.map((row, at) =>
        at === productIndex
          ? { ...row, recipeLines: row.recipeLines.filter((_, lineAt) => lineAt !== lineIndex) }
          : row,
      ),
    ),
  )
}

export function updateIngredient(
  form: DetailedFormState,
  ingredientId: string,
  patch: Partial<Pick<IngredientRow, 'purchaseQuantity' | 'purchaseUnit' | 'purchasePrice'>>,
): DetailedFormState {
  if (!form.ingredients.some((ingredient) => ingredient.id === ingredientId)) return form
  return {
    ...form,
    ingredients: form.ingredients.map((ingredient) =>
      ingredient.id === ingredientId ? { ...ingredient, ...patch } : ingredient,
    ),
  }
}

export function updateRecipeUsage(
  form: DetailedFormState,
  productIndex: number,
  lineIndex: number,
  usageQuantity: string,
): DetailedFormState {
  const product = form.products[productIndex]
  if (!product || product.recipeLines[lineIndex] === undefined) return form
  return mapLine(form, productIndex, lineIndex, (line) => ({ ...line, usageQuantity }))
}

function replaceIngredient(form: DetailedFormState, next: IngredientRow): DetailedFormState {
  return {
    ...form,
    ingredients: form.ingredients.map((ingredient) => (ingredient.id === next.id ? next : ingredient)),
  }
}

/**
 * Writes the name the owner finished typing.
 *
 * A name that already exists links this line to that ingredient, so there is
 * still one price. Renaming an ingredient other products use splits a new
 * ingredient off this line instead of renaming theirs. A private ingredient is
 * renamed in place.
 */
export function commitRecipeIngredientName(
  form: DetailedFormState,
  productIndex: number,
  lineIndex: number,
  rawName: string,
): DetailedFormState {
  const product = form.products[productIndex]
  const line = product?.recipeLines[lineIndex]
  if (!product || !line) return form

  const trimmed = rawName.trim()
  const current = form.ingredients.find((ingredient) => ingredient.id === line.ingredientId) ?? null
  const shared = current !== null && productsUsingIngredient(form.products, current.id) > 1

  if (trimmed === '') {
    if (!current || current.name === '') return form
    if (!shared) return replaceIngredient(form, { ...current, name: '' })
    const created = emptyIngredient()
    return mapLine(
      { ...form, ingredients: [...form.ingredients, created] },
      productIndex,
      lineIndex,
      (recipeLine) => ({ ...recipeLine, ingredientId: created.id }),
    )
  }

  const match =
    form.ingredients.find(
      (ingredient) => ingredient.name.trim() !== '' && sameName(ingredient.name, trimmed),
    ) ?? null

  if (match && current && match.id === current.id) {
    if (current.name === trimmed) return form
    return replaceIngredient(form, { ...current, name: trimmed })
  }

  if (match) {
    const relinked = mapLine(form, productIndex, lineIndex, (recipeLine) => ({
      ...recipeLine,
      ingredientId: match.id,
    }))
    return dropUnusedIngredients(relinked)
  }

  if (current && !shared) {
    return replaceIngredient(form, { ...current, name: trimmed })
  }

  const created: IngredientRow = {
    ...emptyIngredient(),
    name: trimmed,
    purchaseQuantity: current?.purchaseQuantity ?? '',
    purchaseUnit: current?.purchaseUnit ?? 'kg',
    purchasePrice: current?.purchasePrice ?? '',
  }
  return mapLine(
    { ...form, ingredients: [...form.ingredients, created] },
    productIndex,
    lineIndex,
    (recipeLine) => ({ ...recipeLine, ingredientId: created.id }),
  )
}
