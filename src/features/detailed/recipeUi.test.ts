import { describe, expect, it } from 'vitest'
import { emptyProduct, initialForm, type RecipeLine } from './formState.ts'
import { RECIPE_COPY } from './labels.ts'
import {
  deleteIngredient,
  isPurchaseUnitAllowed,
  openRecipe,
} from './recipeForm.ts'

describe('recipe UI contracts', () => {
  it('keeps only usage on a recipe line', () => {
    const line: RecipeLine = { id: 'r1', ingredientId: 'flour', usageQuantity: '180' }
    expect(Object.keys(line).sort()).toEqual(['id', 'ingredientId', 'usageQuantity'])
  })

  it('labels usage by unit, never Gramaj', () => {
    expect(RECIPE_COPY.usageLabel).toEqual({
      adet: 'Kaç adet?',
      g: 'Kaç gram?',
      ml: 'Kaç ml?',
    })
  })

  it('locks cross-family units once the ingredient is on a recipe', () => {
    const form = initialForm()
    form.ingredients = [
      {
        id: 'flour',
        name: 'Un',
        purchaseQuantity: '5',
        purchaseUnit: 'kg',
        purchasePrice: '450',
      },
    ]
    form.products = [
      {
        ...emptyProduct(),
        costSource: 'recipe',
        recipeLines: [{ id: 'r1', ingredientId: 'flour', usageQuantity: '180' }],
      },
    ]
    const flour = form.ingredients[0]!
    expect(isPurchaseUnitAllowed(form, flour, 'g')).toBe(true)
    expect(isPurchaseUnitAllowed(form, flour, 'adet')).toBe(false)
    expect(
      RECIPE_COPY.unitFamilyLock('Kıyma', RECIPE_COPY.unitFamilyUsed.g, RECIPE_COPY.unitFamilyBlocked.g),
    ).toBe('Kıyma reçetelerde gramla yazılı. Adet ya da litreye geçemez.')
  })

  it('O1 confirmation names the products that used the ingredient', () => {
    const form = initialForm()
    form.ingredients = [
      {
        id: 'flour',
        name: 'Un',
        purchaseQuantity: '5',
        purchaseUnit: 'kg',
        purchasePrice: '450',
      },
    ]
    form.products = [
      {
        ...emptyProduct(),
        name: 'Poğaça',
        costSource: 'recipe',
        recipeLines: [{ id: 'r1', ingredientId: 'flour', usageQuantity: '180' }],
      },
      {
        ...emptyProduct(),
        name: 'Simit',
        costSource: 'recipe',
        recipeLines: [{ id: 'r2', ingredientId: 'flour', usageQuantity: '50' }],
      },
    ]
    expect(RECIPE_COPY.deleteConfirm('Un', '2', 'Poğaça, Simit')).toContain('Poğaça, Simit')
    const next = deleteIngredient(form, 'flour')
    expect(next.products.every((product) => product.recipeLines.length === 0)).toBe(true)
  })

  it('does not invent a recipe line when opening the editor', () => {
    const form = openRecipe(initialForm(), 0)
    expect(form.products[0]?.recipeLines).toEqual([])
    expect(form.ingredients).toEqual([])
  })
})
