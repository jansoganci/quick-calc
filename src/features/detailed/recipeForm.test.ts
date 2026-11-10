import { describe, expect, it } from 'vitest'
import { validateDetailedInput } from '../../core/detailed/index.ts'
import { ERROR_COPY } from './labels.ts'
import {
  emptyIngredient,
  emptyProduct,
  initialForm,
  type DetailedFormState,
  type IngredientRow,
} from './formState.ts'
import {
  addRecipeLine,
  closeRecipe,
  commitRecipeIngredientName,
  openRecipe,
  productsUsingIngredient,
  removeRecipeLine,
  resolvedRecipeUnitCost,
} from './recipeForm.ts'
import { toDetailedInput } from './toInput.ts'
import { evaluateDetailed } from './viewModel.ts'

function flour(): IngredientRow {
  return {
    id: 'flour',
    name: 'Un',
    purchaseQuantity: '5',
    purchaseUnit: 'kg',
    purchasePrice: '450',
  }
}

/** A product the engine will accept once its unit cost is a real number. */
function priced(mutate: (form: DetailedFormState) => void): DetailedFormState {
  const form = initialForm()
  form.products = [
    {
      ...emptyProduct(),
      id: 'p1',
      name: 'Poğaça',
      normalPrice: '50',
      onlinePrice: '60',
      dailyQuantity: '10',
      unitProductCost: '1',
    },
  ]
  form.delivery.mode = 'platformOnly'
  mutate(form)
  return form
}

describe('recipe cost reaches the engine as unitProductCost', () => {
  it('sends 16.2 for 5 kg at 450 TL and 180 g, ignoring the typed cost', () => {
    const form = priced((draft) => {
      draft.ingredients = [flour()]
      const product = draft.products[0]
      if (!product) return
      product.costSource = 'recipe'
      product.recipeLines = [{ id: 'r1', ingredientId: 'flour', usageQuantity: '180' }]
    })

    const input = toDetailedInput(form)
    const validation = validateDetailedInput(input)
    expect(validation.ok).toBe(true)
    if (!validation.ok) return
    expect(validation.input.products[0]?.unitProductCost).toBeCloseTo(16.2, 10)
    expect(resolvedRecipeUnitCost(form, form.products[0]!)).toBeCloseTo(16.2, 10)
  })

  it('keeps the typed cost when the recipe is set aside', () => {
    const form = priced((draft) => {
      draft.ingredients = [flour()]
      const product = draft.products[0]
      if (!product) return
      product.unitProductCost = '25'
      product.costSource = 'manual'
      product.recipeLines = [{ id: 'r1', ingredientId: 'flour', usageQuantity: '180' }]
    })
    const validation = validateDetailedInput(toDetailedInput(form))
    expect(validation.ok).toBe(true)
    if (!validation.ok) return
    expect(validation.input.products[0]?.unitProductCost).toBe(25)
  })

  it('does not price a line whose ingredient has no name', () => {
    const form = priced((draft) => {
      draft.ingredients = [{ ...flour(), name: '  ' }]
      const product = draft.products[0]
      if (!product) return
      product.costSource = 'recipe'
      product.recipeLines = [{ id: 'r1', ingredientId: 'flour', usageQuantity: '180' }]
    })
    expect(resolvedRecipeUnitCost(form, form.products[0]!)).toBeUndefined()
  })

  it('withholds the cost and asks for the recipe to be finished', () => {
    const form = priced((draft) => {
      const product = draft.products[0]
      if (!product) return
      product.costSource = 'recipe'
      product.recipeLines = []
    })
    const input = toDetailedInput(form)
    const products = input.products as Array<{ unitProductCost?: unknown }>
    expect(products[0]?.unitProductCost).toBeUndefined()

    const evaluation = evaluateDetailed(form, input)
    expect(evaluation.ok).toBe(false)
    if (evaluation.ok) return
    expect(evaluation.errors['products.0.unitProductCost']).toBe(ERROR_COPY.recipeIncomplete)
  })
})

describe('shared ingredients', () => {
  it('renames a private ingredient and splits a shared one', () => {
    const base = initialForm()
    base.ingredients = [flour()]
    base.products = [
      {
        ...emptyProduct(),
        id: 'p1',
        recipeLines: [{ id: 'r1', ingredientId: 'flour', usageQuantity: '180' }],
      },
      {
        ...emptyProduct(),
        id: 'p2',
        recipeLines: [{ id: 'r2', ingredientId: 'flour', usageQuantity: '50' }],
      },
    ]
    expect(productsUsingIngredient(base.products, 'flour')).toBe(2)

    const renamed = commitRecipeIngredientName(base, 0, 0, 'un')
    expect(renamed.ingredients.find((ingredient) => ingredient.id === 'flour')?.name).toBe('un')
    expect(renamed.products[1]?.recipeLines[0]?.ingredientId).toBe('flour')

    const split = commitRecipeIngredientName(base, 0, 0, 'Un tip 550')
    expect(split.ingredients.find((ingredient) => ingredient.id === 'flour')?.name).toBe('Un')
    expect(split.products[1]?.recipeLines[0]?.ingredientId).toBe('flour')
    const created = split.ingredients.find((ingredient) => ingredient.name === 'Un tip 550')
    expect(created?.purchasePrice).toBe('450')
    expect(created?.purchaseUnit).toBe('kg')
    expect(split.products[0]?.recipeLines[0]?.ingredientId).toBe(created?.id)
  })

  it('links a typed name to the ingredient that already has it', () => {
    let form = openRecipe(initialForm(), 0)
    form.ingredients = [...form.ingredients, flour()]
    const placeholder = form.products[0]?.recipeLines[0]?.ingredientId
    form = commitRecipeIngredientName(form, 0, 0, 'Un')
    expect(form.products[0]?.recipeLines[0]?.ingredientId).toBe('flour')
    expect(form.ingredients.some((ingredient) => ingredient.id === placeholder)).toBe(false)
  })

  it('drops an ingredient when its last line is removed', () => {
    const opened = openRecipe(initialForm(), 0)
    const removed = removeRecipeLine(opened, 0, 0)
    expect(removed.products[0]?.recipeLines).toEqual([])
    expect(removed.ingredients).toEqual([])
    expect(removed.products[0]?.costSource).toBe('recipe')
  })

  it('keeps the recipe when the owner goes back to typing the cost', () => {
    const opened = addRecipeLine(openRecipe(initialForm(), 0), 0)
    expect(opened.products[0]?.recipeLines).toHaveLength(2)
    const closed = closeRecipe(opened, 0)
    expect(closed.products[0]?.costSource).toBe('manual')
    expect(closed.products[0]?.recipeLines).toHaveLength(2)
    const reopened = openRecipe(closed, 0)
    expect(reopened.products[0]?.recipeLines).toHaveLength(2)
    expect(reopened.ingredients).toHaveLength(2)
  })
})

describe('openRecipe', () => {
  it('starts from a blank ingredient rather than a typed cost', () => {
    const form = openRecipe(initialForm(), 0)
    expect(form.products[0]?.costSource).toBe('recipe')
    expect(form.products[0]?.unitProductCost).toBe('')
    expect(form.ingredients).toHaveLength(1)
    expect(form.ingredients[0]).toMatchObject({ name: '', purchaseUnit: 'kg' })
    expect(form.products[0]?.recipeLines[0]?.ingredientId).toBe(form.ingredients[0]?.id)
    expect(emptyIngredient().id).not.toBe(form.ingredients[0]?.id)
  })
})
