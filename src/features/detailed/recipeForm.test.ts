import { describe, expect, it } from 'vitest'
import { validateDetailedInput } from '../../core/detailed/index.ts'
import { ERROR_COPY, RECIPE_COPY } from './labels.ts'
import {
  emptyIngredient,
  emptyProduct,
  initialForm,
  type DetailedFormState,
  type IngredientRow,
} from './formState.ts'
import {
  addRecipeLine,
  buildRecipeErrorMap,
  closeRecipe,
  commitIngredientListName,
  commitRecipeIngredientName,
  listedIngredients,
  openRecipe,
  productsUsingIngredient,
  removeRecipeLine,
  resolvedRecipeUnitCost,
  updateIngredient,
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

function twoProductFlour(): DetailedFormState {
  const form = initialForm()
  form.ingredients = [flour()]
  form.products = [
    {
      ...emptyProduct(),
      id: 'p1',
      name: 'Poğaça',
      costSource: 'recipe',
      recipeLines: [{ id: 'r1', ingredientId: 'flour', usageQuantity: '180' }],
    },
    {
      ...emptyProduct(),
      id: 'p2',
      name: 'Simit',
      costSource: 'recipe',
      recipeLines: [{ id: 'r2', ingredientId: 'flour', usageQuantity: '50' }],
    },
  ]
  return form
}

describe('ingredient list', () => {
  it('hides an ingredient until it has a name', () => {
    const opened = openRecipe(initialForm(), 0)
    expect(listedIngredients(opened)).toEqual([])
    const id = opened.ingredients[0]?.id
    expect(id).toBeDefined()
    if (id === undefined) return
    const named = commitIngredientListName(opened, id, 'Un')
    expect(named.ok).toBe(true)
    if (!named.ok) return
    expect(listedIngredients(named.form).map((ingredient) => ingredient.name)).toEqual(['Un'])
  })

  it('renames a shared ingredient in place for every product', () => {
    const base = twoProductFlour()
    const renamed = commitIngredientListName(base, 'flour', 'Un tip 550')
    expect(renamed.ok).toBe(true)
    if (!renamed.ok) return
    expect(renamed.form.ingredients).toHaveLength(1)
    expect(renamed.form.ingredients[0]).toMatchObject({ id: 'flour', name: 'Un tip 550' })
    expect(renamed.form.products[0]?.recipeLines[0]?.ingredientId).toBe('flour')
    expect(renamed.form.products[1]?.recipeLines[0]?.ingredientId).toBe('flour')

    const cased = commitIngredientListName(base, 'flour', 'un')
    expect(cased.ok).toBe(true)
    if (!cased.ok) return
    expect(cased.form.ingredients[0]?.name).toBe('un')
    expect(cased.form.products[1]?.recipeLines[0]?.ingredientId).toBe('flour')
  })

  it('refuses a blank name and a name another ingredient already has', () => {
    const form = twoProductFlour()
    form.ingredients = [
      ...form.ingredients,
      { id: 'milk', name: 'Süt', purchaseQuantity: '1', purchaseUnit: 'L', purchasePrice: '40' },
    ]
    const blank = commitIngredientListName(form, 'flour', '   ')
    expect(blank).toEqual({ ok: false, reason: 'empty', form })
    const duplicate = commitIngredientListName(form, 'flour', 'süt')
    expect(duplicate).toEqual({ ok: false, reason: 'duplicate', form })
    expect(form.ingredients[0]?.name).toBe('Un')
  })

  it('drops the list row when the last recipe line is removed', () => {
    const opened = openRecipe(initialForm(), 0)
    const id = opened.ingredients[0]?.id
    if (id === undefined) return
    const named = commitIngredientListName(opened, id, 'Un')
    expect(named.ok).toBe(true)
    if (!named.ok) return
    expect(listedIngredients(named.form)).toHaveLength(1)
    const removed = removeRecipeLine(named.form, 0, 0)
    expect(listedIngredients(removed)).toEqual([])
  })

  it('changes both recipe costs when the shared purchase price changes', () => {
    const form = twoProductFlour()
    const next = updateIngredient(form, 'flour', { purchasePrice: '900' })
    expect(resolvedRecipeUnitCost(next, next.products[0]!)).toBeCloseTo(32.4, 10)
    expect(resolvedRecipeUnitCost(next, next.products[1]!)).toBeCloseTo(9, 10)
  })

  it('repeats a purchase error on the ingredient list path', () => {
    const form = twoProductFlour()
    form.ingredients = [{ ...flour(), purchaseQuantity: '0' }]
    const messages = buildRecipeErrorMap(form)
    expect(messages['products.0.recipeLines.0.purchaseQuantity']).toBe(RECIPE_COPY.purchaseQuantityZero)
    expect(messages['ingredients.flour.purchaseQuantity']).toBe(RECIPE_COPY.purchaseQuantityZero)
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
