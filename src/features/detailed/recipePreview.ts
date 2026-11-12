import {
  isPurchaseUnit,
  remainingPerUnitDelta,
  salonRestorePrice,
  unitPriceFromPurchase,
  usageUnitFor,
  type PurchaseUnit,
} from '../../core/detailed/index.ts'
import { formatTryExact } from '../../lib/money.ts'
import { formatCount, formatDecimal, parseTurkishNumber } from '../../lib/number.ts'
import type { DetailedFormState, IngredientRow, ProductRow } from './formState.ts'
import { RECIPE_COPY } from './labels.ts'
import {
  parseAmount,
  productDisplayName,
  productsUsingIngredientList,
  resolvedRecipeUnitCost,
} from './recipeForm.ts'

export type PurchaseSnapshot = {
  purchaseQuantity: string
  purchaseUnit: PurchaseUnit | ''
  purchasePrice: string
}

export type PricePreviewLine = {
  productIndex: number
  productName: string
  usage: string
  costFrom: string
  costTo: string
  remainingText: string
  restoreText: string | null
}

export type PricePreview = {
  kind: 'rise' | 'drop'
  heading: string
  summary: string
  lines: PricePreviewLine[]
  footnote: string
}

function numeric(raw: string): number | null {
  const parsed = parseAmount(raw)
  return typeof parsed === 'number' ? parsed : null
}

function unitPriceOf(ingredient: {
  purchaseQuantity: string
  purchaseUnit: PurchaseUnit | ''
  purchasePrice: string
}): number | null {
  if (ingredient.purchaseUnit === '' || !isPurchaseUnit(ingredient.purchaseUnit)) return null
  const quantity = numeric(ingredient.purchaseQuantity)
  const price = numeric(ingredient.purchasePrice)
  if (quantity === null || price === null) return null
  return unitPriceFromPurchase(quantity, ingredient.purchaseUnit, price)
}

export function formatMoneyAmount(value: number): string {
  return formatTryExact(value, 2)
}

export function formatUnitPriceValue(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(value)
}

export function purchaseWord(ingredient: IngredientRow): string {
  const quantity = numeric(ingredient.purchaseQuantity)
  if (ingredient.purchaseUnit === '') return ''
  if (quantity === 1) return RECIPE_COPY.purchaseAsTyped[ingredient.purchaseUnit]
  const qtyText =
    quantity === null
      ? ingredient.purchaseQuantity.trim()
      : Number.isInteger(quantity)
        ? formatCount(quantity)
        : formatUnitPriceValue(quantity)
  return `${qtyText} ${ingredient.purchaseUnit}`
}

function formWithPurchase(
  form: DetailedFormState,
  ingredientId: string,
  snapshot: PurchaseSnapshot,
): DetailedFormState {
  return {
    ...form,
    ingredients: form.ingredients.map((ingredient) =>
      ingredient.id === ingredientId
        ? {
            ...ingredient,
            purchaseQuantity: snapshot.purchaseQuantity,
            purchaseUnit: snapshot.purchaseUnit,
            purchasePrice: snapshot.purchasePrice,
          }
        : ingredient,
    ),
  }
}

function vatRateOf(form: DetailedFormState): number {
  const parsed = parseTurkishNumber(form.assumptions.vatRate)
  if (parsed.status !== 'ok') return 0
  return parsed.value / 100
}

function usageText(product: ProductRow, ingredient: IngredientRow): string {
  const line = product.recipeLines.find((item) => item.ingredientId === ingredient.id)
  const usage = line?.usageQuantity.trim() ?? ''
  const unit = ingredient.purchaseUnit === '' ? '' : usageUnitFor(ingredient.purchaseUnit)
  return `${usage} ${unit}`.trim()
}

/**
 * D1 trigger: the open row's unit price differs from the value at open, and the
 * ingredient is used in at least one recipe. Comparison is against the snapshot;
 * nothing is stored afterwards.
 */
export function buildPricePreview(
  form: DetailedFormState,
  ingredient: IngredientRow,
  opened: PurchaseSnapshot,
): PricePreview | null {
  const used = productsUsingIngredientList(form, ingredient.id)
  if (used.length === 0) return null
  const now = unitPriceOf(ingredient)
  const then = unitPriceOf(opened)
  if (now === null || then === null) return null
  if (now === then) return null

  const previousForm = formWithPurchase(form, ingredient.id, opened)
  const kind: 'rise' | 'drop' = now > then ? 'rise' : 'drop'
  const fromPrice = formatMoneyAmount(numeric(opened.purchasePrice) ?? 0)
  const toPrice = formatMoneyAmount(numeric(ingredient.purchasePrice) ?? 0)
  const count = formatCount(used.length)
  const purchase = purchaseWord(ingredient)
  const vat = vatRateOf(form)

  const lines: PricePreviewLine[] = used.map((product) => {
    const productIndex = form.products.indexOf(product)
    const oldCost = resolvedRecipeUnitCost(previousForm, previousForm.products[productIndex] ?? product)
    const newCost = resolvedRecipeUnitCost(form, product)
    const delta = oldCost !== undefined && newCost !== undefined ? newCost - oldCost : 0
    const remaining = remainingPerUnitDelta(delta)
    const remainingAbs = formatMoneyAmount(Math.abs(remaining))
    const normal = numeric(product.normalPrice)
    const restore =
      kind === 'rise' && normal !== null && oldCost !== undefined && newCost !== undefined
        ? salonRestorePrice(normal, delta, vat)
        : null
    return {
      productIndex,
      productName: productDisplayName(product, productIndex),
      usage: RECIPE_COPY.priceRiseUsage(usageText(product, ingredient), ingredient.name.trim()),
      costFrom: oldCost === undefined ? '—' : formatMoneyAmount(oldCost),
      costTo: newCost === undefined ? '—' : formatMoneyAmount(newCost),
      remainingText:
        remaining >= 0
          ? RECIPE_COPY.priceRiseRemainingUp(remainingAbs)
          : RECIPE_COPY.priceRiseRemainingDown(remainingAbs),
      restoreText:
        restore === null || normal === null
          ? null
          : RECIPE_COPY.priceRiseRestore(formatMoneyAmount(restore), formatMoneyAmount(normal)),
    }
  })

  return {
    kind,
    heading:
      kind === 'rise'
        ? RECIPE_COPY.priceRiseHeading(ingredient.name.trim())
        : RECIPE_COPY.priceDropHeading(ingredient.name.trim()),
    summary:
      kind === 'rise'
        ? RECIPE_COPY.priceRiseSummary(purchase, fromPrice, toPrice, count)
        : RECIPE_COPY.priceDropSummary(purchase, fromPrice, toPrice, count),
    lines,
    footnote: RECIPE_COPY.priceRiseFoot(formatDecimal(vat * 100, 2)),
  }
}

export function snapshotOf(ingredient: IngredientRow): PurchaseSnapshot {
  return {
    purchaseQuantity: ingredient.purchaseQuantity,
    purchaseUnit: ingredient.purchaseUnit,
    purchasePrice: ingredient.purchasePrice,
  }
}

export function compactPurchase(ingredient: IngredientRow): string {
  const quantity = ingredient.purchaseQuantity.trim()
  const unit = ingredient.purchaseUnit
  if (quantity === '' || unit === '') return ''
  return `${quantity} ${unit}`
}

export function compactPurchasePrice(ingredient: IngredientRow): string {
  const raw = ingredient.purchasePrice.trim()
  if (raw === '') return ''
  const value = numeric(raw)
  return value === null ? `${raw} TL` : `${formatMoneyAmount(value)} TL`
}

export function purchaseWithPrice(ingredient: IngredientRow): string {
  const purchase = compactPurchase(ingredient)
  const price = compactPurchasePrice(ingredient)
  if (purchase === '' || price === '') return purchase || price
  return `${purchase} ${price}`
}

export function unitPriceCaption(ingredient: IngredientRow): string {
  if (ingredient.purchaseUnit === '') return ''
  const value = unitPriceOf(ingredient)
  if (value === null) return ''
  const word = RECIPE_COPY.unitPriceWord[usageUnitFor(ingredient.purchaseUnit)]
  return `${word.toLocaleLowerCase('tr-TR')} ${formatUnitPriceValue(value)} TL`
}

export function unitPriceDisplay(ingredient: IngredientRow): string | null {
  if (ingredient.purchaseUnit === '') return null
  const value = unitPriceOf(ingredient)
  if (value === null) return null
  return formatUnitPriceValue(value)
}
