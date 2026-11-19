import { DETAILED_LIMITS, raisedPrice } from '../../core/detailed/index.ts'
import { formatCount, formatDecimal, parseTurkishNumber } from '../../lib/number.ts'
import type { DetailedFormState, ProductRow } from './formState.ts'
import { BULK_PRICE_COPY, RECIPE_COPY } from './labels.ts'
import type { PricePreview, PriceSuggestionField } from './recipePreview.ts'

export type ProductPriceWrite = { productIndex: number; field: PriceSuggestionField; value: string }
export type ProductPriceUndo = ProductPriceWrite & { productId: string }
export type BulkPriceChannel = 'both' | 'normalPrice' | 'onlinePrice'

export function bulkRate(raw: string): number | null {
  const parsed = parseTurkishNumber(raw)
  if (parsed.status !== 'ok') return null
  const rate = parsed.value / 100
  const limit = DETAILED_LIMITS.bulkPriceRaiseRate
  return rate >= limit.min && rate <= limit.max ? rate : null
}

export function pricePreviewWrites(preview: PricePreview): ProductPriceWrite[] {
  return preview.lines.flatMap((line) =>
    line.suggestions.filter((suggestion) => suggestion.canApply).map((suggestion) => ({
      productIndex: line.productIndex,
      field: suggestion.field,
      value: suggestion.applyValue,
    })),
  )
}

export function buildBulkPriceRows(
  products: readonly ProductRow[],
  selectedIds: ReadonlySet<string>,
  channel: BulkPriceChannel,
  rate: number | null,
) {
  const fields: PriceSuggestionField[] = channel === 'both' ? ['normalPrice', 'onlinePrice'] : [channel]
  const rows = products.map((product, productIndex) => {
    const selected = selectedIds.has(product.id)
    const previews = fields.map((field) => {
      const parsed = parseTurkishNumber(product[field])
      const price = parsed.status === 'ok' ? parsed.value : null
      const next = price !== null && rate !== null ? raisedPrice(price, rate) : null
      return {
        field,
        text: next === null
          ? price === null || price <= 0 ? BULK_PRICE_COPY.noPrice : BULK_PRICE_COPY.enterRate
          : BULK_PRICE_COPY.preview(BULK_PRICE_COPY.fieldLabels[field], formatDecimal(price!, 2), formatCount(next)),
        write: selected && next !== null
          ? { productIndex, field, value: formatCount(next) }
          : null,
      }
    })
    return {
      id: product.id,
      name: product.name.trim() || RECIPE_COPY.unnamedProduct(productIndex + 1),
      selected,
      previews,
    }
  })
  const writes = rows.flatMap((row) => row.previews.flatMap((item) => item.write ? [item.write] : []))
  const productCount = new Set(writes.map((write) => write.productIndex)).size
  return { rows, writes, productCount }
}

/** One immutable form update; snapshot only fields actually written. */
export function writeProductPrices(form: DetailedFormState, writes: readonly ProductPriceWrite[]) {
  const undo: ProductPriceUndo[] = []
  const products = form.products.map((product, productIndex) => {
    const changes = writes.filter((write) => write.productIndex === productIndex)
    if (changes.length === 0) return product
    const next = { ...product }
    for (const change of changes) {
      if (next[change.field] === change.value) continue
      undo.push({ ...change, productId: product.id, value: next[change.field] })
      next[change.field] = change.value
    }
    return next
  })
  return { form: { ...form, products }, undo }
}

export function undoProductPrices(form: DetailedFormState, undo: readonly ProductPriceUndo[]): DetailedFormState {
  return {
    ...form,
    products: form.products.map((product, index) => {
      const previous = undo.filter((item) => item.productIndex === index && item.productId === product.id)
      if (previous.length === 0) return product
      const next = { ...product }
      for (const item of previous) next[item.field] = item.value
      return next
    }),
  }
}
