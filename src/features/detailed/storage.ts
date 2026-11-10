import { PURCHASE_UNITS } from '../../core/detailed/index.ts'
import type { DetailedFormState, IngredientRow, ProductRow } from './formState.ts'

/**
 * Draft persistence for Detailed Feasibility, as `TECH_STACK_AND_CONSTRAINTS.md`
 * §4.2 requires. This module is the codec only: it turns a form into a string and
 * a string back into a form, and it never touches `localStorage`.
 *
 * The split is not stylistic. `tsconfig.json` compiles this file with `lib:
 * ["ES2022"]` and no DOM, so a `localStorage` reference here fails `typecheck`.
 * Every browser call lives in `hooks/draftStorage.ts`, which `tsconfig.app.json`
 * compiles with the DOM lib. Keeping the codec pure also lets it be tested in the
 * `node` environment Vitest already runs, with no new dependency.
 */

export const STORAGE_KEY = 'maliyet.detailed.draft.v1'

const DRAFT_VERSION = 1

/**
 * What a session is worth keeping: the inputs, plus the business name the report
 * is titled with.
 *
 * The calculated result is deliberately absent. DESIGN_DIRECTION V6 is locked — no
 * result appears before the visitor presses `Hesapla` — and the result has exactly
 * one source of truth in `core/detailed`, so storing it would create a second,
 * unverifiable copy of a figure that is cheap to recompute.
 *
 * `businessName` sits BESIDE `form`, never inside it. `DetailedFormState` is what
 * `toInput.ts` hands the engine, and the name changes no figure — letting it into
 * that shape would put document metadata on the calculation path. It is optional
 * in the stored payload, so a draft written before the report existed still
 * decodes, with an empty name and no version bump.
 */
export type Draft = {
  form: DetailedFormState
  businessName: string
}

type StoredDraft = {
  version: typeof DRAFT_VERSION
  form: DetailedFormState
  businessName: string
}

const PRODUCT_KEYS = [
  'id',
  'name',
  'normalPrice',
  'onlinePrice',
  'dailyQuantity',
  'unitProductCost',
] as const

const POSITION_KEYS = [
  'id',
  'name',
  'headcount',
  'employerCostPerPerson',
  'mealCostPerPerson',
  'transportCostPerPerson',
  'averageBonusPerPerson',
] as const

const LINE_KEYS = ['id', 'name', 'amount'] as const

const DELIVERY_MODES = ['platformOnly', 'platformCourier'] as const
const RENT_INPUT_BASES = ['net', 'gross'] as const
const RAMP_UP_PRESETS = ['slow', 'normal', 'fast'] as const
const PROJECTION_HORIZONS = [12, 24, 36] as const

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Every listed key present on `value` and holding a string. */
function hasStrings(value: unknown, keys: readonly string[]): boolean {
  return isObject(value) && keys.every((key) => typeof value[key] === 'string')
}

function isRowArray(value: unknown, keys: readonly string[]): boolean {
  return Array.isArray(value) && value.every((row) => hasStrings(row, keys))
}

function isOneOf(list: readonly unknown[], value: unknown): boolean {
  return list.includes(value)
}

const COST_SOURCES = ['manual', 'recipe'] as const

function isRecipeLine(value: unknown): boolean {
  return hasStrings(value, ['id', 'ingredientId', 'usageQuantity'])
}

function isIngredient(value: unknown): boolean {
  return (
    hasStrings(value, ['id', 'name', 'purchaseQuantity', 'purchasePrice']) &&
    isObject(value) &&
    isOneOf(PURCHASE_UNITS, value.purchaseUnit)
  )
}

/**
 * Recipe fields are optional on the wire so a draft written before them still
 * opens. Present-but-wrong is a corrupt draft: the whole payload is rejected,
 * same as every other field this codec does not recognise.
 */
function isRecipeExtensionOk(form: Record<string, unknown>): boolean {
  if ('ingredients' in form && form.ingredients !== undefined) {
    if (!Array.isArray(form.ingredients) || !form.ingredients.every(isIngredient)) return false
  }
  if (!Array.isArray(form.products)) return false
  return form.products.every((product) => {
    if (!isObject(product)) return false
    if ('costSource' in product && product.costSource !== undefined) {
      if (!isOneOf(COST_SOURCES, product.costSource)) return false
    }
    if ('recipeLines' in product && product.recipeLines !== undefined) {
      if (!Array.isArray(product.recipeLines) || !product.recipeLines.every(isRecipeLine)) {
        return false
      }
    }
    return true
  })
}

/** Fills the fields a pre-recipe draft does not have. Does not invent recipe lines. */
function withRecipeDefaults(form: DetailedFormState): DetailedFormState {
  const stored = form as DetailedFormState & {
    ingredients?: IngredientRow[]
    products: Array<ProductRow & { costSource?: ProductRow['costSource']; recipeLines?: ProductRow['recipeLines'] }>
  }
  return {
    ...form,
    ingredients: stored.ingredients ?? [],
    products: stored.products.map((product) => ({
      ...product,
      costSource: product.costSource ?? 'manual',
      recipeLines: product.recipeLines ?? [],
    })),
  }
}

/**
 * A whole-payload check. Anything unexpected rejects the entire draft rather than
 * being repaired: a half-recovered form is harder for the owner to trust than a
 * clean one, and the fields here are their own financial inputs.
 */
function isFormShape(value: unknown): value is DetailedFormState {
  if (!isObject(value)) return false

  if (!isRowArray(value.products, PRODUCT_KEYS)) return false
  if (!isRowArray(value.positions, POSITION_KEYS)) return false
  if (!isRowArray(value.opexLines, LINE_KEYS)) return false
  if (!isRowArray(value.capexItems, LINE_KEYS)) return false

  if (!hasStrings(value.channelMix, ['salon', 'takeaway', 'delivery'])) return false
  if (!hasStrings(value.packaging, ['takeawayPerOrder', 'deliveryPerOrder'])) return false
  if (!hasStrings(value.paymentMix, ['cash', 'card', 'mealCard'])) return false
  if (typeof value.posCommissionRate !== 'string') return false
  if (typeof value.mealCardCommissionRate !== 'string') return false

  const delivery = value.delivery
  if (!hasStrings(delivery, ['platformFeeRate', 'ownCourierCostPerDeliveryOrder'])) return false
  if (!isObject(delivery)) return false
  if (delivery.mode !== null && !isOneOf(DELIVERY_MODES, delivery.mode)) return false

  if (!hasStrings(value.owner, ['monthlyAmount', 'bagKurMonthlyCost'])) return false

  const occupancy = value.occupancy
  if (!hasStrings(occupancy, ['monthlyRent', 'monthlyAidat'])) return false
  if (!isObject(occupancy) || !isOneOf(RENT_INPUT_BASES, occupancy.rentInputBasis)) return false

  const assumptions = value.assumptions
  if (
    !hasStrings(assumptions, [
      'vatRate',
      'operatingDaysPerMonth',
      'salesPriceAnnualIncrease',
      'productCogsAnnualIncrease',
      'fixedCostAnnualIncrease',
    ])
  ) {
    return false
  }
  if (!isObject(assumptions)) return false
  if (!isOneOf(PROJECTION_HORIZONS, assumptions.projectionHorizonMonths)) return false
  if (!isOneOf(RAMP_UP_PRESETS, assumptions.rampUpPreset)) return false
  if (!hasStrings(assumptions.scenarioVolumeDeltas, ['bad', 'base', 'good'])) return false

  return true
}

export function encodeDraft(draft: Draft): string {
  const stored: StoredDraft = {
    version: DRAFT_VERSION,
    form: draft.form,
    businessName: draft.businessName,
  }
  return JSON.stringify(stored)
}

/**
 * `null` for anything that is not a draft this version wrote — absent, unparseable,
 * from a future or past shape, or corrupt. The caller falls back to a fresh form,
 * so a bad draft costs the user a blank page, never a crash or a wrong figure.
 */
export function decodeDraft(raw: string | null): Draft | null {
  if (raw === null) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (!isObject(parsed)) return null
  if (parsed.version !== DRAFT_VERSION) return null
  if (!isObject(parsed.form) || !isFormShape(parsed.form)) return null
  if (!isRecipeExtensionOk(parsed.form)) return null

  // A missing name is the normal case for a draft written before the report
  // existed, and a corrupt one is metadata — neither may sink the financial
  // inputs, which is the one thing this codec exists to protect.
  const businessName = typeof parsed.businessName === 'string' ? parsed.businessName : ''
  return { form: withRecipeDefaults(parsed.form), businessName }
}
