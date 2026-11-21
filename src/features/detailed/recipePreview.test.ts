import { describe, expect, it } from 'vitest'
import { emptyProduct, initialForm, type IngredientRow } from './formState.ts'
import { RECIPE_COPY } from './labels.ts'
import { buildBulkCostPreview, buildPricePreview, snapshotOf } from './recipePreview.ts'
import { pricePreviewWrites, writeProductPrices } from './bulkPriceView.ts'
import { buildSampleForm, SAMPLE_CONCEPTS } from './samples/index.ts'

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

  it('Tüm önerileri yaz uses every applicable single-button value', () => {
    const preview = buildPricePreview(form, kiyma, opened)
    expect(preview).not.toBeNull()
    const writes = pricePreviewWrites(preview!)
    expect(writes).toEqual(preview!.lines.flatMap((line) => line.suggestions
      .filter((suggestion) => suggestion.canApply)
      .map((suggestion) => ({ productIndex: line.productIndex, field: suggestion.field, value: suggestion.applyValue }))))
    expect(writes).toHaveLength(4)
    const result = writeProductPrices(form, writes)
    expect(result.form.products.map((product) => [product.normalPrice, product.onlinePrice])).toEqual([
      ['230', '242'], ['168', '190'],
    ])
  })
})

describe('DF-90 combined ingredient cost preview', () => {
  const sample = SAMPLE_CONCEPTS.find((concept) => concept.id === 'hamburgerci')!
  const before = buildSampleForm(sample)
  const beef = before.ingredients.find((item) => item.name === 'Dana kıyma')!
  const bun = before.ingredients.find((item) => item.name === 'Hamburger ekmeği')!
  const tomato = before.ingredients.find((item) => item.name === 'Domates')!

  function withPrices(beefPrice?: string, bunPrice?: string) {
    return {
      ...before,
      ingredients: before.ingredients.map((item) =>
        item.id === beef.id && beefPrice !== undefined ? { ...item, purchasePrice: beefPrice }
          : item.id === bun.id && bunPrice !== undefined ? { ...item, purchasePrice: bunPrice }
            : item,
      ),
    }
  }

  it('matches each single-ingredient cost delta and suggestion for the three beef burgers', () => {
    const after = withPrices('900')
    const combined = buildBulkCostPreview(before, after)
    const single = buildPricePreview(after, after.ingredients.find((item) => item.id === beef.id)!, snapshotOf(beef, before.products))
    expect(combined?.lines.map((line) => line.productName)).toEqual(['Klasik burger', 'Cheeseburger', 'Double burger'])
    expect(combined?.summary).toContain('3 ürünün maliyeti değişti.')
    for (const line of combined?.lines ?? []) {
      const counterpart = single?.lines.find((item) => item.productName === line.productName)
      expect(line.costFrom).toBe(counterpart?.costFrom)
      expect(line.costTo).toBe(counterpart?.costTo)
      expect(line.suggestions).toEqual(counterpart?.suggestions)
      expect(line.usage).toBe('Dana kıyma ↑')
    }
  })

  it('adds two ingredient effects once per product and omits products using neither', () => {
    const combined = buildBulkCostPreview(before, withPrices('900', '180'))
    expect(combined?.lines.find((line) => line.productName === 'Klasik burger')).toMatchObject({
      costFrom: '108,35', costTo: '128,85', usage: 'Hamburger ekmeği ↑, Dana kıyma ↑',
    })
    // Double: 240 g kıyma = 216; 1 ekmek = 15; 40 g cheddar = 20,8;
    // 25 g domates = 1,125; 15 g marul = 0,75; 25 g sos = 4,5.
    // Sum = 258,175, shown as 258,18 TL (Appendix A).
    expect(combined?.lines.find((line) => line.productName === 'Double burger')?.costTo).toBe('258,18')
    expect(combined?.lines.some((line) => line.productName === 'Patates (porsiyon)')).toBe(false)
    expect(combined?.lines.some((line) => line.productName === 'Tavuk burger')).toBe(true)
  })

  it('nets a beef rise and tomato drop per recipe, with no suggestion for a drop-only product', () => {
    const tomatoOnly = {
      ...emptyProduct(),
      id: 'tomato-only',
      name: 'Domates tabağı',
      normalPrice: '40',
      onlinePrice: '50',
      dailyQuantity: '1',
      costSource: 'recipe' as const,
      recipeLines: [{ id: 'tomato-line', ingredientId: tomato.id, usageQuantity: '25' }],
    }
    const oldForm = { ...before, products: [...before.products, tomatoOnly] }
    const newForm = {
      ...oldForm,
      ingredients: oldForm.ingredients.map((item) => item.id === beef.id
        ? { ...item, purchasePrice: '900' }
        : item.id === tomato.id ? { ...item, purchasePrice: '30' } : item),
    }
    const preview = buildBulkCostPreview(oldForm, newForm)
    const classic = preview?.lines.find((line) => line.productName === 'Klasik burger')
    // 120 g × (900 − 750) / 1000 + 25 g × (30 − 45) / 1000 = +17,625 TL.
    expect(classic?.costFrom).toBe('108,35')
    expect(classic?.costTo).toBe('125,98')
    expect(classic?.usage).toBe('Dana kıyma ↑, Domates ↓')
    expect(classic?.suggestions.some((item) => item.canApply)).toBe(true)
    expect(preview?.lines.some((line) => line.productName === 'Tavuk burger')).toBe(false)

    const tomatoLine = preview?.lines.find((line) => line.productName === 'Domates tabağı')
    expect(tomatoLine?.costFrom).toBe('1,13')
    expect(tomatoLine?.costTo).toBe('0,75')
    expect(tomatoLine?.remainingText).toContain('kalan 0,38 TL arttı')
    expect(tomatoLine?.restoreText).toBeNull()
    expect(tomatoLine?.restoreOnlineText).toBeNull()
    expect(tomatoLine?.suggestions).toEqual([])
    expect(preview?.summary).toBe('1 malzeme zamlandı. 1 malzeme ucuzladı. 4 ürünün maliyeti değişti.')
  })

  it('shows only the drop clause and no price suggestions for tomato alone', () => {
    const after = {
      ...before,
      ingredients: before.ingredients.map((item) => item.id === tomato.id ? { ...item, purchasePrice: '30' } : item),
    }
    const preview = buildBulkCostPreview(before, after)
    expect(preview?.summary).toBe('1 malzeme ucuzladı. 3 ürünün maliyeti değişti.')
    expect(preview?.lines.every((line) => line.suggestions.length === 0 && line.restoreText === null && line.restoreOnlineText === null)).toBe(true)
  })
})
