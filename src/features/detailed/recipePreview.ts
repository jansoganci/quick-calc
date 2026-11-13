import {
  channelRestorePrice,
  esnafPrice,
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

export type ProductPriceSnapshot = {
  normalPrice: string
  onlinePrice: string
}

export type PurchaseSnapshot = {
  purchaseQuantity: string
  purchaseUnit: PurchaseUnit | ''
  purchasePrice: string
  /** Selling prices at open. Restore uses these so a tap does not add Δcost twice. */
  productPrices: Record<string, ProductPriceSnapshot>
}

export type PriceSuggestionField = 'normalPrice' | 'onlinePrice'

export type PriceSuggestion = {
  field: PriceSuggestionField
  exactText: string
  suggestedText: string
  applyValue: string
  canApply: boolean
}

export type PricePreviewLine = {
  productIndex: number
  productName: string
  usage: string
  costFrom: string
  costTo: string
  remainingText: string
  restoreText: string | null
  restoreOnlineText: string | null
  suggestions: PriceSuggestion[]
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

/** Appendix D: empty platform rate is 0; unreadable is unavailable. */
function platformFeeRateOf(form: DetailedFormState): number | null {
  const parsed = parseTurkishNumber(form.delivery.platformFeeRate)
  if (parsed.status === 'empty') return 0
  if (parsed.status !== 'ok') return null
  return parsed.value / 100
}

function buildSuggestion(
  field: PriceSuggestionField,
  current: number | null,
  exact: number,
): PriceSuggestion | null {
  const suggested = esnafPrice(exact)
  if (suggested === null) return null
  return {
    field,
    exactText: formatMoneyAmount(exact),
    suggestedText: formatCount(suggested),
    applyValue: String(suggested),
    canApply: current !== null && current < suggested,
  }
}

function baselineAmount(
  snapshot: PurchaseSnapshot,
  product: ProductRow,
  field: PriceSuggestionField,
): number | null {
  const stored = snapshot.productPrices[product.id]?.[field]
  return numeric(stored !== undefined ? stored : product[field])
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
  const platformFee = platformFeeRateOf(form)

  const lines: PricePreviewLine[] = used.map((product) => {
    const productIndex = form.products.indexOf(product)
    const oldCost = resolvedRecipeUnitCost(previousForm, previousForm.products[productIndex] ?? product)
    const newCost = resolvedRecipeUnitCost(form, product)
    const delta = oldCost !== undefined && newCost !== undefined ? newCost - oldCost : 0
    const remaining = remainingPerUnitDelta(delta)
    const remainingAbs = formatMoneyAmount(Math.abs(remaining))
    const costsReady = kind === 'rise' && oldCost !== undefined && newCost !== undefined
    const liveNormal = numeric(product.normalPrice)
    const liveOnline = numeric(product.onlinePrice)
    const baselineNormal = baselineAmount(opened, product, 'normalPrice')
    const baselineOnline = baselineAmount(opened, product, 'onlinePrice')
    const salonExact =
      costsReady && baselineNormal !== null ? salonRestorePrice(baselineNormal, delta, vat) : null
    const onlineExact =
      costsReady && baselineOnline !== null && platformFee !== null
        ? channelRestorePrice(baselineOnline, delta, vat, platformFee)
        : null
    const suggestions: PriceSuggestion[] = []
    if (salonExact !== null) {
      const salonSuggest = buildSuggestion('normalPrice', liveNormal, salonExact)
      if (salonSuggest) suggestions.push(salonSuggest)
    }
    if (onlineExact !== null) {
      const onlineSuggest = buildSuggestion('onlinePrice', liveOnline, onlineExact)
      if (onlineSuggest) suggestions.push(onlineSuggest)
    }
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
        salonExact === null || liveNormal === null
          ? null
          : RECIPE_COPY.priceRiseRestore(formatMoneyAmount(salonExact), formatMoneyAmount(liveNormal)),
      restoreOnlineText:
        onlineExact === null || liveOnline === null
          ? null
          : RECIPE_COPY.priceRiseRestoreOnline(
              formatMoneyAmount(onlineExact),
              formatMoneyAmount(liveOnline),
            ),
      suggestions,
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

export function snapshotOf(
  ingredient: IngredientRow,
  products: readonly ProductRow[] = [],
): PurchaseSnapshot {
  return {
    purchaseQuantity: ingredient.purchaseQuantity,
    purchaseUnit: ingredient.purchaseUnit,
    purchasePrice: ingredient.purchasePrice,
    productPrices: Object.fromEntries(
      products.map((product) => [
        product.id,
        { normalPrice: product.normalPrice, onlinePrice: product.onlinePrice },
      ]),
    ),
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
