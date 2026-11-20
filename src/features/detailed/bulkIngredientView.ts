import { raisedPurchasePrice } from '../../core/detailed/index.ts'
import { formatTryExact } from '../../lib/money.ts'
import { formatDecimal, parseTurkishNumber } from '../../lib/number.ts'
import type { DetailedFormState, IngredientRow } from './formState.ts'
import { BULK_INGREDIENT_COPY } from './labels.ts'
import { purchaseWord } from './recipePreview.ts'

export type IngredientPriceWrite = { ingredientId: string; value: string }
export type IngredientPriceUndo = IngredientPriceWrite

export function buildBulkIngredientRows(
  ingredients: readonly IngredientRow[],
  selectedIds: ReadonlySet<string>,
  rate: number | null,
) {
  const rows = ingredients.map((ingredient) => {
    const parsed = parseTurkishNumber(ingredient.purchasePrice)
    const price = parsed.status === 'ok' && parsed.value > 0 ? parsed.value : null
    const next = price !== null && rate !== null ? raisedPurchasePrice(price, rate) : null
    const purchase = purchaseWord(ingredient)
    return {
      id: ingredient.id,
      name: ingredient.name,
      selected: selectedIds.has(ingredient.id),
      preview: price === null
        ? BULK_INGREDIENT_COPY.noPrice
        : next === null
          ? BULK_INGREDIENT_COPY.current(purchase, formatDecimal(price, 2))
          : BULK_INGREDIENT_COPY.preview(purchase, formatDecimal(price, 2), formatTryExact(next, 2)),
      write: selectedIds.has(ingredient.id) && next !== null
        ? { ingredientId: ingredient.id, value: formatTryExact(next, 2) }
        : null,
    }
  })
  const writes = rows.flatMap((row) => row.write ? [row.write] : [])
  return { rows, writes, ingredientCount: writes.length }
}

/** One immutable form update; keep exact prior strings for undo. */
export function writeIngredientPrices(form: DetailedFormState, writes: readonly IngredientPriceWrite[]) {
  const undo: IngredientPriceUndo[] = []
  const ingredients = form.ingredients.map((ingredient) => {
    const write = writes.find((item) => item.ingredientId === ingredient.id)
    if (!write || write.value === ingredient.purchasePrice) return ingredient
    undo.push({ ingredientId: ingredient.id, value: ingredient.purchasePrice })
    return { ...ingredient, purchasePrice: write.value }
  })
  return { form: { ...form, ingredients }, undo }
}

export function undoIngredientPrices(form: DetailedFormState, undo: readonly IngredientPriceUndo[]): DetailedFormState {
  return {
    ...form,
    ingredients: form.ingredients.map((ingredient) => {
      const previous = undo.find((item) => item.ingredientId === ingredient.id)
      return previous ? { ...ingredient, purchasePrice: previous.value } : ingredient
    }),
  }
}
