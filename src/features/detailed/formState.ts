import {
  DETAILED_DEFAULTS,
  type DeliveryMode,
  type ProjectionHorizonMonths,
  type RampUpPreset,
  type RentInputBasis,
} from '../../core/detailed/index.ts'
import { formatDecimal } from '../../lib/number.ts'

/**
 * The form holds raw strings, exactly as typed. Nothing here interprets them —
 * `toInput.ts` turns them into a `DetailedInput` and the engine's own validation is
 * the only thing allowed to narrow them.
 *
 * Rates are entered and stored as percentages (`'3,59'`), because that is the unit
 * an owner knows. The conversion to the engine's 0–1 fraction happens in one place.
 */

export type ProductRow = {
  id: string
  name: string
  normalPrice: string
  onlinePrice: string
  dailyQuantity: string
  unitProductCost: string
}

export type PositionRow = {
  id: string
  name: string
  headcount: string
  employerCostPerPerson: string
  mealCostPerPerson: string
  transportCostPerPerson: string
  averageBonusPerPerson: string
}

export type LineRow = {
  id: string
  name: string
  amount: string
}

export type DetailedFormState = {
  products: ProductRow[]
  channelMix: { salon: string; takeaway: string; delivery: string }
  packaging: { takeawayPerOrder: string; deliveryPerOrder: string }
  paymentMix: { cash: string; card: string; mealCard: string }
  posCommissionRate: string
  mealCardCommissionRate: string
  delivery: {
    mode: DeliveryMode | null
    platformFeeRate: string
    ownCourierCostPerDeliveryOrder: string
  }
  positions: PositionRow[]
  owner: { monthlyAmount: string; bagKurMonthlyCost: string }
  occupancy: { monthlyRent: string; rentInputBasis: RentInputBasis; monthlyAidat: string }
  opexLines: LineRow[]
  capexItems: LineRow[]
  assumptions: {
    vatRate: string
    operatingDaysPerMonth: string
    projectionHorizonMonths: ProjectionHorizonMonths
    rampUpPreset: RampUpPreset
    scenarioVolumeDeltas: { bad: string; base: string; good: string }
    salesPriceAnnualIncrease: string
    productCogsAnnualIncrease: string
    fixedCostAnnualIncrease: string
  }
}

let nextId = 0

function makeId(prefix: string): string {
  nextId += 1
  return `${prefix}-${nextId}`
}

/** A 0–1 rate rendered as the percentage string the field shows. */
export function rateToPercentInput(rate: number): string {
  return formatDecimal(rate * 100, 2)
}

export function emptyProduct(): ProductRow {
  return {
    id: makeId('product'),
    name: '',
    normalPrice: '',
    onlinePrice: '',
    dailyQuantity: '',
    unitProductCost: '',
  }
}

export function emptyPosition(): PositionRow {
  return {
    id: makeId('position'),
    name: '',
    headcount: '',
    employerCostPerPerson: '',
    mealCostPerPerson: '',
    transportCostPerPerson: '',
    averageBonusPerPerson: '',
  }
}

export function emptyLine(prefix: 'opex' | 'capex', name = ''): LineRow {
  return { id: makeId(prefix), name, amount: '' }
}

/**
 * The starting form. Every editable default from `core/detailed/defaults.ts` is
 * pre-filled so the user sees what the calculation would otherwise assume silently;
 * every money field starts empty, and an empty optional money field resolves to 0.
 *
 * Section 01 opens with one blank product row because products are the only thing
 * the model cannot proceed without.
 */
export function initialForm(): DetailedFormState {
  return {
    products: [emptyProduct()],
    channelMix: {
      salon: rateToPercentInput(DETAILED_DEFAULTS.channelMix.salon),
      takeaway: rateToPercentInput(DETAILED_DEFAULTS.channelMix.takeaway),
      delivery: rateToPercentInput(DETAILED_DEFAULTS.channelMix.delivery),
    },
    packaging: { takeawayPerOrder: '', deliveryPerOrder: '' },
    paymentMix: {
      cash: rateToPercentInput(DETAILED_DEFAULTS.paymentMix.cash),
      card: rateToPercentInput(DETAILED_DEFAULTS.paymentMix.card),
      mealCard: rateToPercentInput(DETAILED_DEFAULTS.paymentMix.mealCard),
    },
    posCommissionRate: rateToPercentInput(DETAILED_DEFAULTS.posCommissionRate),
    mealCardCommissionRate: rateToPercentInput(DETAILED_DEFAULTS.mealCardCommissionRate),
    delivery: {
      // Never pre-selected: DF-10a says the owner knows this better than any default,
      // and spec §6.4 makes it required as soon as the delivery share is above zero.
      mode: null,
      platformFeeRate: rateToPercentInput(DETAILED_DEFAULTS.platformFeeRate.platformOnly),
      ownCourierCostPerDeliveryOrder: '',
    },
    positions: [],
    owner: { monthlyAmount: '', bagKurMonthlyCost: '' },
    occupancy: {
      monthlyRent: '',
      rentInputBasis: DETAILED_DEFAULTS.rentInputBasis,
      monthlyAidat: '',
    },
    opexLines: [],
    capexItems: [],
    assumptions: {
      vatRate: rateToPercentInput(DETAILED_DEFAULTS.vatRate),
      operatingDaysPerMonth: String(DETAILED_DEFAULTS.operatingDaysPerMonth),
      projectionHorizonMonths: DETAILED_DEFAULTS.projectionHorizonMonths,
      rampUpPreset: DETAILED_DEFAULTS.rampUpPreset,
      scenarioVolumeDeltas: {
        bad: rateToPercentInput(DETAILED_DEFAULTS.scenarioVolumeDeltas.bad),
        base: rateToPercentInput(DETAILED_DEFAULTS.scenarioVolumeDeltas.base),
        good: rateToPercentInput(DETAILED_DEFAULTS.scenarioVolumeDeltas.good),
      },
      salesPriceAnnualIncrease: rateToPercentInput(DETAILED_DEFAULTS.salesPriceAnnualIncrease),
      productCogsAnnualIncrease: rateToPercentInput(DETAILED_DEFAULTS.productCogsAnnualIncrease),
      fixedCostAnnualIncrease: rateToPercentInput(DETAILED_DEFAULTS.fixedCostAnnualIncrease),
    },
  }
}
