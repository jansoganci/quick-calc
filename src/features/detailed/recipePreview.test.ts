import { describe, expect, it } from 'vitest'
import { emptyProduct, initialForm, type IngredientRow } from './formState.ts'
import { RECIPE_COPY } from './labels.ts'
import { buildPricePreview, snapshotOf } from './recipePreview.ts'

function named(partial: Partial<IngredientRow> & Pick<IngredientRow, 'id' | 'name'>): IngredientRow {
  return {
    purchaseQuantity: '1',
    purchaseUnit: 'kg',
    purchasePrice: '0',
    ...partial,
  }
}

describe('Zam geldi preview (O3, §7.4 fixtures)', () => {
  const ingredients = [
    named({ id: 'ekmek', name: 'Ekmek', purchaseQuantity: '10', purchaseUnit: 'adet', purchasePrice: '80' }),
    named({ id: 'kiyma', name: 'Kıyma', purchaseQuantity: '1', purchaseUnit: 'kg', purchasePrice: '450' }),
    named({ id: 'domates', name: 'Domates', purchaseQuantity: '1', purchaseUnit: 'kg', purchasePrice: '40' }),
    named({ id: 'marul', name: 'Marul', purchaseQuantity: '1', purchaseUnit: 'kg', purchasePrice: '35' }),
  ]

  const form = initialForm()
  form.ingredients = ingredients
  form.assumptions.vatRate = '10'
  form.products = [
    {
      ...emptyProduct(),
      id: 'h',
      name: 'Hamburger',
      normalPrice: '220',
      onlinePrice: '230',
      dailyQuantity: '25',
      costSource: 'recipe',
      recipeLines: [
        { id: 'a', ingredientId: 'ekmek', usageQuantity: '1' },
        { id: 'b', ingredientId: 'kiyma', usageQuantity: '120' },
        { id: 'c', ingredientId: 'domates', usageQuantity: '30' },
        { id: 'd', ingredientId: 'marul', usageQuantity: '20' },
      ],
    },
    {
      ...emptyProduct(),
      id: 'k',
      name: 'Köfte ekmek',
      normalPrice: '160',
      onlinePrice: '180',
      dailyQuantity: '20',
      costSource: 'recipe',
      recipeLines: [
        { id: 'e', ingredientId: 'ekmek', usageQuantity: '1' },
        { id: 'f', ingredientId: 'kiyma', usageQuantity: '100' },
        { id: 'g', ingredientId: 'domates', usageQuantity: '20' },
      ],
    },
  ]

  const opened = snapshotOf({ ...ingredients[1]!, purchasePrice: '380' })
  const kiyma = form.ingredients[1]!

  it('shows Hamburger 55,50 → 63,90 and salon restore 229,24', () => {
    const preview = buildPricePreview(form, kiyma, opened)
    expect(preview?.kind).toBe('rise')
    expect(preview?.heading).toBe(RECIPE_COPY.priceRiseHeading('Kıyma'))
    expect(preview?.summary).toContain('Kilosu')
    const hamburger = preview?.lines.find((line) => line.productName === 'Hamburger')
    expect(hamburger?.costFrom).toBe('55,50')
    expect(hamburger?.costTo).toBe('63,90')
    expect(hamburger?.remainingText).toBe(RECIPE_COPY.priceRiseRemainingDown('8,40'))
    expect(hamburger?.restoreText).toContain('229,24')
    expect(hamburger?.restoreText).toContain('220,00')
    const salon = hamburger?.suggestions.find((item) => item.field === 'normalPrice')
    expect(salon?.suggestedText).toBe('230')
    expect(salon?.applyValue).toBe('230')
    expect(salon?.canApply).toBe(true)
  })

  it('shows Hamburger online restore 241,07 and esnaf 242 without writing the price', () => {
    const preview = buildPricePreview(form, kiyma, opened)
    const hamburger = preview?.lines.find((line) => line.productName === 'Hamburger')
    expect(hamburger?.restoreOnlineText).toContain('241,07')
    expect(hamburger?.restoreOnlineText).toContain('230,00')
    const online = hamburger?.suggestions.find((item) => item.field === 'onlinePrice')
    expect(online?.suggestedText).toBe('242')
    expect(online?.applyValue).toBe('242')
    expect(online?.canApply).toBe(true)
    expect(form.products[0]?.onlinePrice).toBe('230')
  })

  it('shows Köfte ekmek 46,80 → 53,80 and salon restore 167,70', () => {
    const preview = buildPricePreview(form, kiyma, opened)
    const kofte = preview?.lines.find((line) => line.productName === 'Köfte ekmek')
    expect(kofte?.costFrom).toBe('46,80')
    expect(kofte?.costTo).toBe('53,80')
    expect(kofte?.remainingText).toBe(RECIPE_COPY.priceRiseRemainingDown('7,00'))
    expect(kofte?.restoreText).toContain('167,70')
    expect(kofte?.restoreOnlineText).toContain('189,22')
    expect(kofte?.suggestions.find((item) => item.field === 'normalPrice')?.suggestedText).toBe('168')
    expect(kofte?.suggestions.find((item) => item.field === 'onlinePrice')?.suggestedText).toBe('190')
  })

  it('O3: a price drop has no restore line and says arttı', () => {
    const cheaper = { ...kiyma, purchasePrice: '300' }
    const preview = buildPricePreview(form, cheaper, snapshotOf(kiyma))
    expect(preview?.kind).toBe('drop')
    expect(preview?.heading).toBe(RECIPE_COPY.priceDropHeading('Kıyma'))
    expect(preview?.lines[0]?.restoreText).toBeNull()
    expect(preview?.lines[0]?.restoreOnlineText).toBeNull()
    expect(preview?.lines[0]?.suggestions).toEqual([])
    expect(preview?.lines.every((line) => line.remainingText.includes('arttı'))).toBe(true)
  })

  it('omits Bu fiyatı yaz after a tap so Δcost is not added twice', () => {
    const openedAt = snapshotOf({ ...ingredients[1]!, purchasePrice: '380' }, form.products)
    const applied = {
      ...form,
      products: form.products.map((product, index) =>
        index === 0 ? { ...product, normalPrice: '230', onlinePrice: '242' } : product,
      ),
    }
    const preview = buildPricePreview(applied, kiyma, openedAt)
    const hamburger = preview?.lines.find((line) => line.productName === 'Hamburger')
    expect(hamburger?.restoreText).toContain('229,24')
    expect(hamburger?.restoreText).toContain('230,00')
    expect(hamburger?.suggestions.find((item) => item.field === 'normalPrice')?.canApply).toBe(false)
    expect(hamburger?.suggestions.find((item) => item.field === 'onlinePrice')?.canApply).toBe(false)
  })

  it('does not preview when the ingredient is unused', () => {
    const unusedForm = { ...form, products: form.products.map((product) => ({ ...product, recipeLines: [] })) }
    expect(buildPricePreview(unusedForm, kiyma, opened)).toBeNull()
  })
})
