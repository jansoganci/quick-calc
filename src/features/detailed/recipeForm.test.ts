import { describe, expect, it } from 'vitest'
import { validateDetailedInput } from '../../core/detailed/index.ts'
import { RECIPE_COPY } from './labels.ts'
import {
  emptyIngredient,
  emptyProduct,
  initialForm,
  type DetailedFormState,
  type IngredientRow,
} from './formState.ts'
import {
  attachIngredientToProduct,
  buildRecipeErrorMap,
  closeRecipe,
  commitIngredientListName,
  createIngredient,
  deleteIngredient,
  findIngredientByName,
  isPurchaseUnitAllowed,
  matchingIngredients,
  listedIngredients,
  openRecipe,
  removeRecipeLine,
  resolvedRecipeUnitCost,
  sameIngredientName,
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
    expect(evaluation.errors['products.0.unitProductCost']).toBe(
      RECIPE_COPY.hesaplaRecipeIncomplete('Poğaça'),
    )
  })
})

describe('Turkish-aware name match', () => {
  it('treats i/İ and ı/I as the same name after trim', () => {
    expect(sameIngredientName('İsot', 'isot')).toBe(true)
    expect(sameIngredientName('Iğdır', 'ığdır')).toBe(true)
    expect(findIngredientByName([flour()], ' un ' )?.id).toBe('flour')
    expect(findIngredientByName([flour()], 'Un tip 550')).toBeUndefined()
  })

  it('searches named ingredients with the same Turkish case rules', () => {
    const isot: IngredientRow = { ...flour(), id: 'isot', name: 'İsot' }
    expect(matchingIngredients([flour(), isot], 'un').map((item) => item.id)).toEqual(['flour'])
    expect(matchingIngredients([flour(), isot], 'isot').map((item) => item.id)).toEqual(['isot'])
    expect(matchingIngredients([flour(), isot], '').map((item) => item.id)).toEqual(['flour', 'isot'])
  })
})

describe('shared ingredients', () => {
  it('renames from the list in place for every product', () => {
    const base = twoProductFlour()
    const renamed = commitIngredientListName(base, 'flour', 'Un tip 550')
    expect(renamed.ok).toBe(true)
    if (!renamed.ok) return
    expect(renamed.form.ingredients).toHaveLength(1)
    expect(renamed.form.ingredients[0]).toMatchObject({ id: 'flour', name: 'Un tip 550' })
    expect(renamed.form.products[0]?.recipeLines[0]?.ingredientId).toBe('flour')
    expect(renamed.form.products[1]?.recipeLines[0]?.ingredientId).toBe('flour')
  })

  it('links a typed name to the ingredient that already has it', () => {
    let form = openRecipe(initialForm(), 0)
    const created = createIngredient(form, {
      name: 'Un',
      purchaseQuantity: '5',
      purchaseUnit: 'kg',
      purchasePrice: '450',
    })
    form = attachIngredientToProduct(created.form, 0, created.id)
    expect(form.products[0]?.recipeLines[0]?.ingredientId).toBe(created.id)
    const again = createIngredient(form, {
      name: 'un',
      purchaseQuantity: '1',
      purchaseUnit: 'kg',
      purchasePrice: '1',
    })
    expect(again.id).toBe(created.id)
    expect(again.form.ingredients).toHaveLength(1)
  })

  it('keeps an unused ingredient when its last recipe line is removed', () => {
    const form = attachIngredientToProduct(
      { ...initialForm(), ingredients: [flour()] },
      0,
      'flour',
    )
    const removed = removeRecipeLine(form, 0, 0)
    expect(removed.products[0]?.recipeLines).toEqual([])
    expect(removed.ingredients).toEqual([flour()])
  })

  it('O1: deleting an ingredient in use removes its recipe lines', () => {
    const form = twoProductFlour()
    const next = deleteIngredient(form, 'flour')
    expect(next.ingredients).toEqual([])
    expect(next.products[0]?.recipeLines).toEqual([])
    expect(next.products[1]?.recipeLines).toEqual([])
    expect(resolvedRecipeUnitCost(next, next.products[0]!)).toBeUndefined()
  })

  it('keeps the recipe when the owner goes back to typing the cost', () => {
    const withFlour = attachIngredientToProduct(
      { ...openRecipe(initialForm(), 0), ingredients: [flour()] },
      0,
      'flour',
    )
    const used = {
      ...withFlour,
      products: withFlour.products.map((product, index) =>
        index === 0 ? { ...product, recipeLines: [{ ...product.recipeLines[0]!, usageQuantity: '180' }] } : product,
      ),
    }
    const closed = closeRecipe(used, 0)
    expect(closed.products[0]?.costSource).toBe('manual')
    expect(closed.products[0]?.recipeLines).toHaveLength(1)
    expect(closed.products[0]?.unitProductCost).toBe('16,20')
    const reopened = openRecipe(closed, 0)
    expect(reopened.products[0]?.recipeLines).toHaveLength(1)
    expect(reopened.ingredients).toHaveLength(1)
  })

  it('O2: restores the last hand-typed value when going back to typing', () => {
    const form = priced((draft) => {
      draft.ingredients = [flour()]
      const product = draft.products[0]
      if (!product) return
      product.unitProductCost = '25'
      product.costSource = 'recipe'
      product.recipeLines = [{ id: 'r1', ingredientId: 'flour', usageQuantity: '180' }]
    })
    const closed = closeRecipe(form, 0)
    expect(closed.products[0]?.unitProductCost).toBe('25')
    expect(closed.products[0]?.costSource).toBe('manual')
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
    const blank = emptyIngredient()
    const form = { ...initialForm(), ingredients: [blank] }
    expect(listedIngredients(form)).toEqual([])
    const named = commitIngredientListName(form, blank.id, 'Un')
    expect(named.ok).toBe(true)
    if (!named.ok) return
    expect(listedIngredients(named.form).map((ingredient) => ingredient.name)).toEqual(['Un'])
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

  it('changes both recipe costs when the shared purchase price changes', () => {
    const form = twoProductFlour()
    const next = updateIngredient(form, 'flour', { purchasePrice: '900' })
    expect(resolvedRecipeUnitCost(next, next.products[0]!)).toBeCloseTo(32.4, 10)
    expect(resolvedRecipeUnitCost(next, next.products[1]!)).toBeCloseTo(9, 10)
  })

  it('puts a purchase error on the ingredient list path, not on the recipe line', () => {
    const form = twoProductFlour()
    form.ingredients = [{ ...flour(), purchaseQuantity: '0' }]
    const messages = buildRecipeErrorMap(form)
    expect(messages['products.0.recipeLines.0.purchaseQuantity']).toBeUndefined()
    expect(messages['ingredients.flour.purchaseQuantity']).toBe(RECIPE_COPY.purchaseQuantityZero)
  })

  it('locks cross-family units once the ingredient is in a recipe', () => {
    const form = twoProductFlour()
    expect(isPurchaseUnitAllowed(form, flour(), 'g')).toBe(true)
    expect(isPurchaseUnitAllowed(form, flour(), 'adet')).toBe(false)
    expect(isPurchaseUnitAllowed(form, flour(), 'L')).toBe(false)
    const unused = { ...flour(), id: 'salt', name: 'Tuz' }
    expect(isPurchaseUnitAllowed({ ...form, ingredients: [...form.ingredients, unused] }, unused, 'adet')).toBe(
      true,
    )
  })
})

describe('openRecipe', () => {
  it('switches the cost source without inventing a blank ingredient', () => {
    const form = openRecipe(initialForm(), 0)
    expect(form.products[0]?.costSource).toBe('recipe')
    expect(form.products[0]?.unitProductCost).toBe('')
    expect(form.ingredients).toEqual([])
    expect(form.products[0]?.recipeLines).toEqual([])
  })
})
