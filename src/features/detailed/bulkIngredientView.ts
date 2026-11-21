import { calculateDetailed, validateDetailedInput } from '../../core/detailed/index.ts'
import { formatTry, formatTryExact } from '../../lib/money.ts'
import { formatCount, formatDecimal, parseTurkishNumber } from '../../lib/number.ts'
import type { DetailedFormState, IngredientRow } from './formState.ts'
import { BULK_INGREDIENT_COPY } from './labels.ts'
import { purchaseWord } from './recipePreview.ts'
import { toDetailedInput } from './toInput.ts'

export type IngredientPriceWrite = { ingredientId: string; value: string }
export type IngredientPriceUndo = IngredientPriceWrite

/**
 * One format for every purchase price this panel shows or writes: whole lira
 * stays whole (`900`), kuruş always has two digits (`862,50`, `8,50`).
 */
function formatPurchasePrice(value: number): string {
  return Number.isInteger(value) ? formatCount(value) : formatTryExact(value, 2)
}

export function buildIngredientPriceRows(
  ingredients: readonly IngredientRow[],
  typed: Record<string, string>,
) {
  const rows = ingredients.map((ingredient) => {
    const oldParsed = parseTurkishNumber(ingredient.purchasePrice)
    const oldPrice = oldParsed.status === 'ok' && oldParsed.value > 0 ? oldParsed.value : null
    const raw = typed[ingredient.id] ?? ''
    const parsed = parseTurkishNumber(raw)
    const isInvalid = parsed.status === 'invalid' || (parsed.status === 'ok' && parsed.value <= 0)
    const newPrice = parsed.status === 'ok' && parsed.value > 0 ? parsed.value : null
    const isChanged = newPrice !== null && newPrice !== oldPrice
    const changePercent = isChanged && oldPrice !== null ? (newPrice / oldPrice - 1) * 100 : null
    const changeText = changePercent === null
      ? ''
      : BULK_INGREDIENT_COPY.changePercent(changePercent > 0, formatDecimal(Math.abs(changePercent), 1))
    return {
      id: ingredient.id,
      name: ingredient.name,
      currentText: oldPrice === null
        ? BULK_INGREDIENT_COPY.noPrice
        : BULK_INGREDIENT_COPY.current(purchaseWord(ingredient), formatPurchasePrice(oldPrice)),
      typed: raw,
      error: isInvalid ? BULK_INGREDIENT_COPY.invalidPrice : null,
      changeText,
      isLargeChange: changePercent !== null && (changePercent > 100 || changePercent < -50),
      write: isChanged && newPrice !== null ? { ingredientId: ingredient.id, value: formatPurchasePrice(newPrice) } : null,
    }
  })
  const writes = rows.flatMap((row) => row.write ? [row.write] : [])
  return { rows, writes, changedCount: writes.length }
}

/** Appendix E.10: same validated base month as evaluateDetailed, display only. */
export function buildIngredientMonthlyEffect(before: DetailedFormState, after: DetailedFormState) {
  const oldValidation = validateDetailedInput(toDetailedInput(before))
  const newValidation = validateDetailedInput(toDetailedInput(after))
  if (!oldValidation.ok || !newValidation.ok) return null
  const oldResult = calculateDetailed(oldValidation.input).scenarios.base.stabilizedMonth.monthlyOperatingResult
  const newResult = calculateDetailed(newValidation.input).scenarios.base.stabilizedMonth.monthlyOperatingResult
  const change = newResult - oldResult
  return {
    before: formatTry(oldResult),
    after: formatTry(newResult),
    change: `${change > 0 ? '+' : ''}${formatTry(change)}`,
  }
}

export type IngredientMonthlyEffect = NonNullable<ReturnType<typeof buildIngredientMonthlyEffect>>

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
