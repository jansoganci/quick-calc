import type { DeliveryMode, PurchaseUnit } from '../../../core/detailed/index.ts'
import {
  emptyIngredient,
  emptyLine,
  emptyPosition,
  emptyProduct,
  emptyRecipeLine,
  initialForm,
  type DetailedFormState,
  type ProductRow,
} from '../formState.ts'

/**
 * Sample businesses are form data only: Turkish number strings exactly as an
 * owner would type them. No figure here is computed; the engine computes
 * everything after the form is filled (CLAUDE.md §3).
 */

export type SampleIngredient = {
  name: string
  /** Purchase quantity as typed, e.g. '1' or '2,5'. */
  quantity: string
  unit: PurchaseUnit
  /** Price paid for that quantity, VAT as on the invoice. */
  price: string
}

export type SampleProduct = {
  name: string
  normalPrice: string
  onlinePrice: string
  dailyQuantity: string
} & (
  | { /** Bought in ready-made: typed unit cost. */ unitCost: string }
  | { /** [ingredient name, usage per one product in g / ml / adet]. */ recipe: ReadonlyArray<readonly [string, string]> }
)

export type SamplePosition = {
  name: string
  headcount: string
  employerCost: string
  meal?: string
  transport?: string
  bonus?: string
}

export type SampleConcept = {
  id: string
  /** Shown in the chooser and in the "Örnek: …" note. */
  name: string
  /** One plain sentence for the chooser. */
  summary: string
  ingredients: readonly SampleIngredient[]
  products: readonly SampleProduct[]
  /** Percent strings: salon, takeaway, delivery. */
  channelMix: readonly [string, string, string]
  /** Percent strings: cash, card, meal card. */
  paymentMix: readonly [string, string, string]
  /** TL per order: takeaway, delivery. */
  packaging: readonly [string, string]
  delivery: { mode: DeliveryMode; platformFeeRate: string; ownCourierCost?: string }
  positions: readonly SamplePosition[]
  owner: { amount: string; bagKur: string }
  rent: string
  aidat: string
  opex: ReadonlyArray<readonly [string, string]>
  capex: ReadonlyArray<readonly [string, string]>
}

export function buildSampleForm(concept: SampleConcept): DetailedFormState {
  const base = initialForm()
  const ingredients = concept.ingredients.map((item) => ({
    ...emptyIngredient(),
    name: item.name,
    purchaseQuantity: item.quantity,
    purchaseUnit: item.unit,
    purchasePrice: item.price,
  }))
  const idOf = new Map(ingredients.map((row) => [row.name, row.id]))

  const products: ProductRow[] = concept.products.map((item) => {
    const row: ProductRow = {
      ...emptyProduct(),
      name: item.name,
      normalPrice: item.normalPrice,
      onlinePrice: item.onlinePrice,
      dailyQuantity: item.dailyQuantity,
    }
    if ('unitCost' in item) return { ...row, unitProductCost: item.unitCost }
    return {
      ...row,
      costSource: 'recipe',
      recipeLines: item.recipe.map(([ingredient, usage]) => ({
        // An unknown name is a data error in this file; samples.test.ts rejects it.
        ...emptyRecipeLine(idOf.get(ingredient) ?? ''),
        usageQuantity: usage,
      })),
    }
  })

  return {
    ...base,
    ingredients,
    products,
    channelMix: { salon: concept.channelMix[0], takeaway: concept.channelMix[1], delivery: concept.channelMix[2] },
    paymentMix: { cash: concept.paymentMix[0], card: concept.paymentMix[1], mealCard: concept.paymentMix[2] },
    packaging: { takeawayPerOrder: concept.packaging[0], deliveryPerOrder: concept.packaging[1] },
    delivery: {
      mode: concept.delivery.mode,
      platformFeeRate: concept.delivery.platformFeeRate,
      ownCourierCostPerDeliveryOrder: concept.delivery.ownCourierCost ?? '',
    },
    positions: concept.positions.map((item) => ({
      ...emptyPosition(),
      name: item.name,
      headcount: item.headcount,
      employerCostPerPerson: item.employerCost,
      mealCostPerPerson: item.meal ?? '',
      transportCostPerPerson: item.transport ?? '',
      averageBonusPerPerson: item.bonus ?? '',
    })),
    owner: { monthlyAmount: concept.owner.amount, bagKurMonthlyCost: concept.owner.bagKur },
    occupancy: { ...base.occupancy, monthlyRent: concept.rent, monthlyAidat: concept.aidat },
    opexLines: concept.opex.map(([name, amount]) => ({ ...emptyLine('opex', name), amount })),
    capexItems: concept.capex.map(([name, amount]) => ({ ...emptyLine('capex', name), amount })),
  }
}
