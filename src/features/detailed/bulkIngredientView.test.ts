import { describe, expect, it } from 'vitest'
import { bulkRate } from './bulkPriceView.ts'
import { buildBulkIngredientRows, undoIngredientPrices, writeIngredientPrices } from './bulkIngredientView.ts'
import { initialForm, type IngredientRow } from './formState.ts'

const ingredients: IngredientRow[] = [
  { id: 'meat', name: 'Dana kıyma', purchaseQuantity: '1', purchaseUnit: 'kg', purchasePrice: '750,00' },
  { id: 'empty', name: 'Ayran', purchaseQuantity: '1', purchaseUnit: 'adet', purchasePrice: '' },
]

describe('DF-89 ingredient bulk write', () => {
  it('shows current purchase price without a rate, then skips an empty price', () => {
    const selected = new Set(['meat', 'empty'])
    const current = buildBulkIngredientRows(ingredients, selected, bulkRate(''))
    expect(current.rows.map((row) => row.preview)).toEqual(['Kilosu: 750 TL', 'Fiyat yok'])
    const raised = buildBulkIngredientRows(ingredients, selected, bulkRate('15'))
    expect(raised.rows.map((row) => row.preview)).toEqual(['Kilosu: 750 → 862,50 TL', 'Fiyat yok'])
    expect(raised.writes).toEqual([{ ingredientId: 'meat', value: '862,50' }])
  })

  it('restores exact previous strings and only written ingredient fields', () => {
    const form = initialForm()
    form.ingredients = ingredients
    const writes = buildBulkIngredientRows(ingredients, new Set(['meat', 'empty']), bulkRate('15')).writes
    const result = writeIngredientPrices(form, writes)
    expect(result.form.ingredients.map((row) => row.purchasePrice)).toEqual(['862,50', ''])
    expect(undoIngredientPrices(result.form, result.undo).ingredients.map((row) => row.purchasePrice))
      .toEqual(['750,00', ''])
    expect(form.ingredients[0]?.purchasePrice).toBe('750,00')
  })
})
