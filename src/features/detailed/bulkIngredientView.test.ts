import { describe, expect, it } from 'vitest'
import { calculateDetailed, validateDetailedInput } from '../../core/detailed/index.ts'
import { formatTry } from '../../lib/money.ts'
import { buildIngredientMonthlyEffect, buildIngredientPriceRows, undoIngredientPrices, writeIngredientPrices } from './bulkIngredientView.ts'
import { initialForm, type IngredientRow } from './formState.ts'
import { buildSampleForm, SAMPLE_CONCEPTS } from './samples/index.ts'
import { toDetailedInput } from './toInput.ts'
import { evaluateDetailed } from './viewModel.ts'

const ingredients: IngredientRow[] = [
  { id: 'meat', name: 'Dana kıyma', purchaseQuantity: '1', purchaseUnit: 'kg', purchasePrice: '750,00' },
  { id: 'tomato', name: 'Domates', purchaseQuantity: '1', purchaseUnit: 'kg', purchasePrice: '50' },
  { id: 'cheese', name: 'Peynir', purchaseQuantity: '1', purchaseUnit: 'kg', purchasePrice: '2.500' },
  { id: 'empty', name: 'Ayran', purchaseQuantity: '1', purchaseUnit: 'adet', purchasePrice: '' },
]

describe('DF-90 direct ingredient price rows', () => {
  it('omits empty and same-price writes and formats rises, drops, and kuruş', () => {
    const view = buildIngredientPriceRows(ingredients, {
      meat: '900', tomato: '30', cheese: '2500', empty: '8,50',
    })
    expect(view.rows.map((row) => row.currentText)).toEqual([
      'Kilosu 750 TL', 'Kilosu 50 TL', 'Kilosu 2.500 TL', 'Fiyat yok',
    ])
    expect(view.rows.map((row) => row.changeText)).toEqual(['+%20', '-%40', '', ''])
    expect(view.writes).toEqual([
      { ingredientId: 'meat', value: '900' },
      { ingredientId: 'tomato', value: '30' },
      { ingredientId: 'empty', value: '8,50' },
    ])
    expect(view.changedCount).toBe(3)
    expect(buildIngredientPriceRows(ingredients, { meat: '862,50' }).writes).toEqual([
      { ingredientId: 'meat', value: '862,50' },
    ])
    expect(buildIngredientPriceRows(ingredients, {}).writes).toEqual([])
  })

  it('shows an error and skips invalid, zero, and negative prices', () => {
    for (const value of ['abc', '0', '-1']) {
      const view = buildIngredientPriceRows(ingredients, { meat: value })
      expect(view.rows[0]?.error).toBe('Lütfen geçerli bir fiyat gir.')
      expect(view.writes).toEqual([])
    }
  })

  it('names a multi-item purchase quantity in the current price', () => {
    const pack = { ...ingredients[0]!, purchaseQuantity: '12', purchaseUnit: 'adet' as const, purchasePrice: '150' }
    expect(buildIngredientPriceRows([pack], {}).rows[0]?.currentText).toBe('12 adet 150 TL')
  })

  it('marks only changes above +100% or below −50% as large', () => {
    const large = buildIngredientPriceRows(ingredients, { meat: '9.000', tomato: '20' })
    expect(large.rows[0]?.changeText).toBe('+%1.100')
    expect(large.rows[0]?.isLargeChange).toBe(true)
    expect(large.rows[1]?.isLargeChange).toBe(true)
    const ordinary = buildIngredientPriceRows(ingredients, { meat: '1.500', tomato: '25' })
    expect(ordinary.rows[0]?.isLargeChange).toBe(false)
    expect(ordinary.rows[1]?.isLargeChange).toBe(false)
  })

  it('restores exact previous strings and only written ingredient fields', () => {
    const form = initialForm()
    form.ingredients = ingredients
    const writes = buildIngredientPriceRows(ingredients, { meat: '900', tomato: '30' }).writes
    const result = writeIngredientPrices(form, writes)
    expect(result.form.ingredients.map((row) => row.purchasePrice)).toEqual(['900', '30', '2.500', ''])
    expect(undoIngredientPrices(result.form, result.undo).ingredients.map((row) => row.purchasePrice))
      .toEqual(['750,00', '50', '2.500', ''])
    expect(form.ingredients[0]?.purchasePrice).toBe('750,00')
  })
})

describe('DF-90 monthly effect', () => {
  const sample = SAMPLE_CONCEPTS.find((item) => item.id === 'hamburgerci')!
  const before = buildSampleForm(sample)
  const after = {
    ...before,
    ingredients: before.ingredients.map((item) => item.name === 'Dana kıyma' ? { ...item, purchasePrice: '900' } : item),
  }

  it('matches the validated base monthly result for both forms', () => {
    const effect = buildIngredientMonthlyEffect(before, after)
    const oldEvaluation = evaluateDetailed(before, toDetailedInput(before))
    const newEvaluation = evaluateDetailed(after, toDetailedInput(after))
    expect(oldEvaluation.ok).toBe(true)
    expect(newEvaluation.ok).toBe(true)
    if (!oldEvaluation.ok || !newEvaluation.ok) return
    expect(`${effect?.before} TL`).toBe(oldEvaluation.view.monthlyOperatingResult)
    expect(`${effect?.after} TL`).toBe(newEvaluation.view.monthlyOperatingResult)
    const oldValidation = validateDetailedInput(toDetailedInput(before))
    const newValidation = validateDetailedInput(toDetailedInput(after))
    expect(oldValidation.ok && newValidation.ok).toBe(true)
    if (!oldValidation.ok || !newValidation.ok) return
    const oldMonthly = calculateDetailed(oldValidation.input).scenarios.base.stabilizedMonth.monthlyOperatingResult
    const newMonthly = calculateDetailed(newValidation.input).scenarios.base.stabilizedMonth.monthlyOperatingResult
    expect(effect?.change).toBe(`${newMonthly > oldMonthly ? '+' : ''}${formatTry(newMonthly - oldMonthly)}`)
  })

  it('is unavailable if either form is invalid', () => {
    expect(buildIngredientMonthlyEffect({ ...before, products: [] }, after)).toBeNull()
    expect(buildIngredientMonthlyEffect(before, { ...after, products: [] })).toBeNull()
  })
})
