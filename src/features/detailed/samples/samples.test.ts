import { describe, expect, it } from 'vitest'
import { toDetailedInput } from '../toInput.ts'
import { evaluateDetailed } from '../viewModel.ts'
import { buildSampleForm, SAMPLE_CONCEPTS } from './index.ts'

function percentSum(values: readonly string[]): number {
  return values.reduce((sum, value) => sum + Number(value.replace(',', '.')), 0)
}

describe('sample concepts', () => {
  it('has five concepts with unique ids', () => {
    expect(SAMPLE_CONCEPTS).toHaveLength(5)
    expect(new Set(SAMPLE_CONCEPTS.map((concept) => concept.id)).size).toBe(5)
  })

  for (const concept of SAMPLE_CONCEPTS) {
    describe(concept.name, () => {
      it('has a 10–12 product menu, recipes where a product is made in-house', () => {
        expect(concept.products.length).toBeGreaterThanOrEqual(10)
        expect(concept.products.length).toBeLessThanOrEqual(12)
        const withRecipe = concept.products.filter((product) => 'recipe' in product)
        expect(withRecipe.length).toBeGreaterThanOrEqual(concept.products.length - 3)
      })

      it('only uses ingredients from its own list, and lists none it never uses', () => {
        const names = new Set(concept.ingredients.map((item) => item.name))
        const used = new Set<string>()
        for (const product of concept.products) {
          if (!('recipe' in product)) continue
          for (const [ingredient] of product.recipe) {
            expect(names.has(ingredient), `${product.name}: ${ingredient}`).toBe(true)
            used.add(ingredient)
          }
        }
        expect([...names].filter((name) => !used.has(name))).toEqual([])
      })

      it('splits channels and payments to 100%', () => {
        expect(percentSum(concept.channelMix)).toBe(100)
        expect(percentSum(concept.paymentMix)).toBe(100)
      })

      it('calculates without errors and ends the month positive', () => {
        const form = buildSampleForm(concept)
        const evaluation = evaluateDetailed(form, toDetailedInput(form))
        expect(evaluation.ok, JSON.stringify(evaluation.ok ? null : evaluation.errors)).toBe(true)
        if (!evaluation.ok) return
        // A sample may honestly not pay back inside the horizon (owner figures,
        // 18 Nov 2026), but its month must never end negative.
        expect(evaluation.view.akis.isLoss).toBe(false)
      })
    })
  }
})
