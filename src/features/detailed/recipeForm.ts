import {
  isPurchaseUnit,
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
import { RECIPE_COPY } from './labels.ts'

/**
 * Turns the recipe the owner typed into the one `unitProductCost` the engine
 * already knows. The formula lives in `core/detailed/recipeCost.ts`; this file
 * only parses strings, keeps the shared ingredient list consistent, and picks
 * the Turkish sentence for a structured error.
 */

export function parseAmount(raw: string): RecipeAmount {
  const parsed = parseTurkishNumber(raw)
  if (parsed.status === 'empty') return null
  if (parsed.status === 'invalid') return 'invalid'
  return parsed.value
}

export function sameIngredientName(left: string, right: string): boolean {
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
    const named = ingredient !== undefined && ingredient.name.trim() !== ''
    return {
      ingredientId: named ? line.ingredientId : '',
      usageQuantity: parseAmount(line.usageQuantity),
    }
  })
}

export function productDisplayName(product: ProductRow, index: number): string {
  const name = product.name.trim()
  return name === '' ? RECIPE_COPY.unnamedProduct(index + 1) : name
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

export function productsUsingIngredientList(
  form: DetailedFormState,
  ingredientId: string,
): ProductRow[] {
  if (ingredientId === '') return []
  return form.products.filter((product) =>
    product.recipeLines.some((line) => line.ingredientId === ingredientId),
  )
}

export function isIngredientUsedInRecipe(form: DetailedFormState, ingredientId: string): boolean {
  return productsUsingIngredient(form.products, ingredientId) > 0
}

/** Named ingredients, in list order. A blank A4 row stays out until it has a name. */
export function listedIngredients(form: DetailedFormState): IngredientRow[] {
  return form.ingredients.filter((ingredient) => ingredient.name.trim() !== '')
}

export function findIngredientByName(
  ingredients: readonly IngredientRow[],
  rawName: string,
): IngredientRow | undefined {
  const trimmed = rawName.trim()
  if (trimmed === '') return undefined
  return ingredients.find(
    (ingredient) => ingredient.name.trim() !== '' && sameIngredientName(ingredient.name, trimmed),
  )
}

/** Turkish-aware substring match against named ingredients. Empty query lists them all. */
export function matchingIngredients(
  ingredients: readonly IngredientRow[],
  query: string,
): IngredientRow[] {
  const named = ingredients.filter((ingredient) => ingredient.name.trim() !== '')
  const needle = query.trim().toLocaleLowerCase('tr-TR')
  if (needle === '') return named
  return named.filter((ingredient) =>
    ingredient.name.trim().toLocaleLowerCase('tr-TR').includes(needle),
  )
}

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

export function recipeLineCost(
  form: DetailedFormState,
  product: ProductRow,
  lineIndex: number,
): number | undefined {
  const line = product.recipeLines[lineIndex]
  if (!line) return undefined
  const result = recipeCost(
    toIngredientInputs(form.ingredients),
    toLineInputs([line], form.ingredients),
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

export type UnitFamily = 'mass' | 'volume' | 'count'

export function unitFamily(unit: PurchaseUnit): UnitFamily {
  if (unit === 'kg' || unit === 'g') return 'mass'
  if (unit === 'L' || unit === 'ml') return 'volume'
  return 'count'
}

export function usageUnitOf(ingredient: IngredientRow): UsageUnit | null {
  return ingredient.purchaseUnit === '' ? null : usageUnitFor(ingredient.purchaseUnit)
}

/** Cross-family units lock once the ingredient is used on any recipe line. */
export function isPurchaseUnitAllowed(
  form: DetailedFormState,
  ingredient: IngredientRow,
  unit: PurchaseUnit,
): boolean {
  if (ingredient.purchaseUnit === '' || !isIngredientUsedInRecipe(form, ingredient.id)) return true
  return unitFamily(unit) === unitFamily(ingredient.purchaseUnit)
}

function messageForCode(code: RecipeCostErrorCode, ingredientName: string): string | null {
  switch (code) {
    case 'empty_recipe':
      return RECIPE_COPY.emptyRecipe
    case 'ingredient_not_found':
      return RECIPE_COPY.ingredientMissing
    case 'invalid_unit':
      return RECIPE_COPY.ingredientMissing
    case 'not_a_number':
      return RECIPE_COPY.notANumber
    case 'purchase_quantity_empty':
      return RECIPE_COPY.purchaseQuantityEmpty
    case 'purchase_quantity_zero':
      return RECIPE_COPY.purchaseQuantityZero
    case 'purchase_price_empty':
      return RECIPE_COPY.purchasePriceEmpty
    case 'usage_quantity_empty':
      return RECIPE_COPY.usageEmpty(ingredientName)
  }
}

/** Line-level and list-level messages for products priced from a recipe. */
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
      const line = error.lineIndex < 0 ? undefined : product.recipeLines[error.lineIndex]
      const ingredient = line
        ? form.ingredients.find((item) => item.id === line.ingredientId)
        : undefined
      const ingredientName = ingredient?.name.trim() || RECIPE_COPY.ingredientName
      const message = messageForCode(error.code, ingredientName)
      if (message === null) continue
      if (error.lineIndex < 0) {
        messages[`products.${productIndex}.unitProductCost`] ??= message
        continue
      }
      if (error.field === 'usageQuantity' || error.field === 'ingredient') {
        messages[`products.${productIndex}.recipeLines.${error.lineIndex}.${error.field}`] ??=
          message
      }
      if (
        (error.field === 'purchaseQuantity' ||
          error.field === 'purchasePrice' ||
          error.field === 'purchaseUnit') &&
        line?.ingredientId
      ) {
        messages[`ingredients.${line.ingredientId}.${error.field}`] ??= message
      }
    }
  })
  return messages
}

export function incompleteRecipeNames(form: DetailedFormState): string[] {
  return form.products
    .map((product, index) => ({ product, index }))
    .filter(
      ({ product }) =>
        product.costSource === 'recipe' && resolvedRecipeUnitCost(form, product) === undefined,
    )
    .map(({ product, index }) => productDisplayName(product, index))
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
      ingredient.id !== ingredientId &&
      ingredient.name.trim() !== '' &&
      sameIngredientName(ingredient.name, trimmed),
  )
  if (taken) return { ok: false, reason: 'duplicate', form }
  if (current.name === trimmed) return { ok: true, form }
  return { ok: true, form: replaceIngredient(form, { ...current, name: trimmed }) }
}

function replaceProducts(form: DetailedFormState, products: ProductRow[]): DetailedFormState {
  return { ...form, products }
}

function replaceIngredient(form: DetailedFormState, next: IngredientRow): DetailedFormState {
  return {
    ...form,
    ingredients: form.ingredients.map((ingredient) => (ingredient.id === next.id ? next : ingredient)),
  }
}

/** Opens the helper. An existing recipe is kept; the first open starts with no lines. */
export function openRecipe(form: DetailedFormState, productIndex: number): DetailedFormState {
  const product = form.products[productIndex]
  if (!product) return form
  if (product.costSource === 'recipe') return form
  return replaceProducts(
    form,
    form.products.map((row, at) => (at === productIndex ? { ...row, costSource: 'recipe' } : row)),
  )
}

/**
 * Unlocks the typed cost (O2): last hand-typed value if there is one, otherwise
 * the recipe total. The recipe itself stays.
 */
export function closeRecipe(form: DetailedFormState, productIndex: number): DetailedFormState {
  const product = form.products[productIndex]
  if (!product || product.costSource === 'manual') return form
  const typed = product.unitProductCost.trim()
  const recipeTotal = resolvedRecipeUnitCost(form, product)
  const unitProductCost =
    typed !== '' ? product.unitProductCost : recipeTotal === undefined ? product.unitProductCost : formatTryExact(recipeTotal, 2)
  return replaceProducts(
    form,
    form.products.map((row, at) =>
      at === productIndex ? { ...row, costSource: 'manual', unitProductCost } : row,
    ),
  )
}

export function addBlankIngredient(form: DetailedFormState): { form: DetailedFormState; id: string } {
  const ingredient = emptyIngredient()
  return { form: { ...form, ingredients: [...form.ingredients, ingredient] }, id: ingredient.id }
}

export function discardBlankIngredient(form: DetailedFormState, ingredientId: string): DetailedFormState {
  const ingredient = form.ingredients.find((item) => item.id === ingredientId)
  if (!ingredient) return form
  if (ingredient.name.trim() !== '' || isIngredientUsedInRecipe(form, ingredientId)) return form
  return {
    ...form,
    ingredients: form.ingredients.filter((item) => item.id !== ingredientId),
  }
}

/**
 * O1: deleting an ingredient removes it and every recipe line that pointed at it.
 * Totals recalculate because those lines are gone.
 */
export function deleteIngredient(form: DetailedFormState, ingredientId: string): DetailedFormState {
  return {
    ...form,
    ingredients: form.ingredients.filter((ingredient) => ingredient.id !== ingredientId),
    products: form.products.map((product) => ({
      ...product,
      recipeLines: product.recipeLines.filter((line) => line.ingredientId !== ingredientId),
    })),
  }
}

export function attachIngredientToProduct(
  form: DetailedFormState,
  productIndex: number,
  ingredientId: string,
): DetailedFormState {
  const product = form.products[productIndex]
  if (!product || !form.ingredients.some((ingredient) => ingredient.id === ingredientId)) return form
  return replaceProducts(
    form,
    form.products.map((row, at) =>
      at === productIndex
        ? { ...row, recipeLines: [...row.recipeLines, emptyRecipeLine(ingredientId)] }
        : row,
    ),
  )
}

export function createIngredient(
  form: DetailedFormState,
  fields: Pick<IngredientRow, 'name' | 'purchaseQuantity' | 'purchaseUnit' | 'purchasePrice'>,
): { form: DetailedFormState; id: string } {
  const existing = findIngredientByName(form.ingredients, fields.name)
  if (existing) return { form, id: existing.id }
  const ingredient: IngredientRow = { ...emptyIngredient(), ...fields, name: fields.name.trim() }
  return { form: { ...form, ingredients: [...form.ingredients, ingredient] }, id: ingredient.id }
}

export function removeRecipeLine(
  form: DetailedFormState,
  productIndex: number,
  lineIndex: number,
): DetailedFormState {
  const product = form.products[productIndex]
  if (!product || product.recipeLines[lineIndex] === undefined) return form
  return replaceProducts(
    form,
    form.products.map((row, at) =>
      at === productIndex
        ? { ...row, recipeLines: row.recipeLines.filter((_, lineAt) => lineAt !== lineIndex) }
        : row,
    ),
  )
}

export function updateIngredient(
  form: DetailedFormState,
  ingredientId: string,
  patch: Partial<Pick<IngredientRow, 'purchaseQuantity' | 'purchaseUnit' | 'purchasePrice' | 'name'>>,
): DetailedFormState {
  if (!form.ingredients.some((ingredient) => ingredient.id === ingredientId)) return form
  if (patch.purchaseUnit !== undefined && patch.purchaseUnit !== '' && !isPurchaseUnit(patch.purchaseUnit)) {
    return form
  }
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
  return replaceProducts(
    form,
    form.products.map((productRow, at) =>
      at === productIndex
        ? {
            ...productRow,
            recipeLines: productRow.recipeLines.map((line, lineAt) =>
              lineAt === lineIndex ? { ...line, usageQuantity } : line,
            ),
          }
        : productRow,
    ),
  )
}
