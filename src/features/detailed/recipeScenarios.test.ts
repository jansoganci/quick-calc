/**
 * Twelve product scenarios, each asserted on its own.
 * These go through the form and the engine, not only the bare formula.
 */
import { describe, expect, it } from 'vitest'
import { validateDetailedInput } from '../../core/detailed/index.ts'
import { emptyProduct, initialForm, type DetailedFormState, type IngredientRow, type RecipeLine } from './formState.ts'
import { ERROR_COPY, RECIPE_COPY } from './labels.ts'
import {
  buildRecipeErrorMap,
  closeRecipe,
  recipeAmountText,
  resolvedRecipeUnitCost,
  updateIngredient,
  usageUnitLabel,
} from './recipeForm.ts'
import { decodeDraft, encodeDraft } from './storage.ts'
import { toDetailedInput } from './toInput.ts'
import { evaluateDetailed } from './viewModel.ts'

function ingredient(partial: Partial<IngredientRow> & Pick<IngredientRow, 'id' | 'name'>): IngredientRow {
  return {
    purchaseQuantity: '1',
    purchaseUnit: 'kg',
    purchasePrice: '0',
    ...partial,
  }
}

function line(partial: Partial<RecipeLine> & Pick<RecipeLine, 'ingredientId'>): RecipeLine {
  return { id: `line-${partial.ingredientId}`, usageQuantity: '', ...partial }
}

function formWith(
  ingredients: IngredientRow[],
  lines: RecipeLine[],
  manualCost = '1',
): DetailedFormState {
  const form = initialForm()
  form.delivery.mode = 'platformOnly'
  form.ingredients = ingredients
  form.products = [
    {
      ...emptyProduct(),
      id: 'p1',
      name: 'Poğaça',
      normalPrice: '50',
      onlinePrice: '60',
      dailyQuantity: '10',
      unitProductCost: manualCost,
      costSource: 'recipe',
      recipeLines: lines,
    },
  ]
  return form
}

function engineCost(form: DetailedFormState): number | undefined {
  const validation = validateDetailedInput(toDetailedInput(form))
  if (!validation.ok) return undefined
  return validation.input.products[0]?.unitProductCost
}

describe('recipe scenarios, one at a time', () => {
  it('1. 5 kg un, 450 TL, 180 g → 16,20 TL', () => {
    const form = formWith(
      [ingredient({ id: 'un', name: 'Un', purchaseQuantity: '5', purchasePrice: '450' })],
      [line({ ingredientId: 'un', usageQuantity: '180' })],
    )
    expect(engineCost(form)).toBeCloseTo(16.2, 10)
    expect(recipeAmountText(form, form.products[0]!)).toBe('16,20')
    expect(usageUnitLabel('kg')).toBe('g')
  })

  it('2. aynı un 5000 g alınırsa yine 16,20 TL', () => {
    const form = formWith(
      [ingredient({ id: 'un', name: 'Un', purchaseQuantity: '5000', purchaseUnit: 'g', purchasePrice: '450' })],
      [line({ ingredientId: 'un', usageQuantity: '180' })],
    )
    expect(engineCost(form)).toBeCloseTo(16.2, 10)
    expect(recipeAmountText(form, form.products[0]!)).toBe('16,20')
  })

  it('3. 1 L süt, 40 TL, 200 ml → 8,00 TL', () => {
    const form = formWith(
      [ingredient({ id: 'sut', name: 'Süt', purchaseQuantity: '1', purchaseUnit: 'L', purchasePrice: '40' })],
      [line({ ingredientId: 'sut', usageQuantity: '200' })],
    )
    expect(engineCost(form)).toBeCloseTo(8, 10)
    expect(recipeAmountText(form, form.products[0]!)).toBe('8,00')
    expect(usageUnitLabel('L')).toBe('ml')
  })

  it('4. aynı süt 1000 ml alınırsa yine 8,00 TL', () => {
    const form = formWith(
      [ingredient({ id: 'sut', name: 'Süt', purchaseQuantity: '1000', purchaseUnit: 'ml', purchasePrice: '40' })],
      [line({ ingredientId: 'sut', usageQuantity: '200' })],
    )
    expect(engineCost(form)).toBeCloseTo(8, 10)
  })

  it('5. 10 yumurta, 30 TL, 2 adet → 6,00 TL', () => {
    const form = formWith(
      [ingredient({ id: 'yumurta', name: 'Yumurta', purchaseQuantity: '10', purchaseUnit: 'adet', purchasePrice: '30' })],
      [line({ ingredientId: 'yumurta', usageQuantity: '2' })],
    )
    expect(engineCost(form)).toBeCloseTo(6, 10)
    expect(recipeAmountText(form, form.products[0]!)).toBe('6,00')
    expect(usageUnitLabel('adet')).toBe('adet')
  })

  it('6. un ve süt aynı reçetede toplanır → 24,20 TL', () => {
    const form = formWith(
      [
        ingredient({ id: 'un', name: 'Un', purchaseQuantity: '5', purchasePrice: '450' }),
        ingredient({ id: 'sut', name: 'Süt', purchaseQuantity: '1', purchaseUnit: 'L', purchasePrice: '40' }),
      ],
      [
        line({ id: 'a', ingredientId: 'un', usageQuantity: '180' }),
        line({ id: 'b', ingredientId: 'sut', usageQuantity: '200' }),
      ],
    )
    expect(engineCost(form)).toBeCloseTo(24.2, 10)
    expect(recipeAmountText(form, form.products[0]!)).toBe('24,20')
  })

  it('7. aynı un iki satırda, 180 g + 20 g → 18,00 TL', () => {
    const form = formWith(
      [ingredient({ id: 'un', name: 'Un', purchaseQuantity: '5', purchasePrice: '450' })],
      [
        line({ id: 'a', ingredientId: 'un', usageQuantity: '180' }),
        line({ id: 'b', ingredientId: 'un', usageQuantity: '20' }),
      ],
    )
    expect(engineCost(form)).toBeCloseTo(18, 10)
    expect(recipeAmountText(form, form.products[0]!)).toBe('18,00')
  })

  it('8. Türkçe tutar: 2,5 kg ve 1.250,50 TL, 100 g → 50,02 TL', () => {
    const form = formWith(
      [ingredient({ id: 'un', name: 'Un', purchaseQuantity: '2,5', purchasePrice: '1.250,50' })],
      [line({ ingredientId: 'un', usageQuantity: '100' })],
    )
    expect(engineCost(form)).toBeCloseTo(50.02, 10)
    expect(recipeAmountText(form, form.products[0]!)).toBe('50,02')
  })

  it('9. alış miktarı 0 ise maliyet yok, sonsuz sayı yok', () => {
    const form = formWith(
      [ingredient({ id: 'un', name: 'Un', purchaseQuantity: '0', purchasePrice: '450' })],
      [line({ ingredientId: 'un', usageQuantity: '180' })],
    )
    expect(resolvedRecipeUnitCost(form, form.products[0]!)).toBeUndefined()
    expect(engineCost(form)).toBeUndefined()
    expect(buildRecipeErrorMap(form)['products.0.recipeLines.0.purchaseQuantity']).toBe(
      RECIPE_COPY.purchaseQuantityZero,
    )
    const evaluation = evaluateDetailed(form, toDetailedInput(form))
    expect(evaluation.ok).toBe(false)
    if (!evaluation.ok) expect(evaluation.errors['products.0.unitProductCost']).toBe(ERROR_COPY.recipeIncomplete)
    expect(JSON.stringify(toDetailedInput(form))).not.toMatch(/Infinity|NaN/)
  })

  it('10. bir satır bozuksa sağlam satırın tutarı da maliyete yazılmaz', () => {
    const form = formWith(
      [
        ingredient({ id: 'un', name: 'Un', purchaseQuantity: '5', purchasePrice: '450' }),
        ingredient({ id: 'sut', name: 'Süt', purchaseQuantity: '0', purchaseUnit: 'L', purchasePrice: '40' }),
      ],
      [
        line({ id: 'a', ingredientId: 'un', usageQuantity: '180' }),
        line({ id: 'b', ingredientId: 'sut', usageQuantity: '200' }),
      ],
    )
    expect(engineCost(form)).toBeUndefined()
    expect(recipeAmountText(form, form.products[0]!)).toBeNull()
  })

  it('11. Elle gir, reçete dururken motora elle yazılan 25 TL gider', () => {
    const opened = formWith(
      [ingredient({ id: 'un', name: 'Un', purchaseQuantity: '5', purchasePrice: '450' })],
      [line({ ingredientId: 'un', usageQuantity: '180' })],
      '25',
    )
    const manual = closeRecipe(opened, 0)
    expect(manual.products[0]?.costSource).toBe('manual')
    expect(manual.products[0]?.recipeLines).toHaveLength(1)
    expect(engineCost(manual)).toBe(25)
    expect(recipeAmountText(manual, manual.products[0]!)).toBeNull()
  })

  it('12. ortak unun fiyatı 450’den 900’e çıkınca iki ürün birden değişir', () => {
    const form = formWith(
      [ingredient({ id: 'un', name: 'Un', purchaseQuantity: '5', purchasePrice: '450' })],
      [line({ ingredientId: 'un', usageQuantity: '180' })],
    )
    form.products.push({
      ...emptyProduct(),
      id: 'p2',
      name: 'Simit',
      normalPrice: '20',
      onlinePrice: '25',
      dailyQuantity: '40',
      unitProductCost: '9',
      costSource: 'recipe',
      recipeLines: [line({ id: 'simit', ingredientId: 'un', usageQuantity: '50' })],
    })
    expect(engineCost(form)).toBeCloseTo(16.2, 10)
    const validation = validateDetailedInput(toDetailedInput(form))
    expect(validation.ok).toBe(true)
    if (!validation.ok) return
    expect(validation.input.products[1]?.unitProductCost).toBeCloseTo(4.5, 10)

    const doubled = updateIngredient(form, 'un', { purchasePrice: '900' })
    const after = validateDetailedInput(toDetailedInput(doubled))
    expect(after.ok).toBe(true)
    if (!after.ok) return
    expect(after.input.products[0]?.unitProductCost).toBeCloseTo(32.4, 10)
    expect(after.input.products[1]?.unitProductCost).toBeCloseTo(9, 10)
    expect(recipeAmountText(doubled, doubled.products[0]!)).toBe('32,40')
    expect(recipeAmountText(doubled, doubled.products[1]!)).toBe('9,00')
  })

  it('eski taslak reçetesiz açılır ve elle girilen maliyet durur', () => {
    const form = formWith([], [], '18')
    form.products[0]!.costSource = 'manual'
    const stored = JSON.parse(encodeDraft({ form, businessName: '' })) as {
      form: { ingredients?: unknown; products: Array<Record<string, unknown>> }
    }
    delete stored.form.ingredients
    for (const product of stored.form.products) {
      delete product.costSource
      delete product.recipeLines
    }
    const restored = decodeDraft(JSON.stringify(stored))
    expect(restored?.form.products[0]?.costSource).toBe('manual')
    expect(restored?.form.products[0]?.unitProductCost).toBe('18')
    expect(engineCost(restored!.form)).toBe(18)
  })
})
