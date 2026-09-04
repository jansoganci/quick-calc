import {
  calculateQuick,
  QUICK_DEFAULTS,
  QUICK_LIMITS,
  resolveMonthlyPayroll,
  resolveRentCost,
  simulateQuick,
  validateQuickInput,
  type PrimaryInputField,
  type QuickCalculationInput,
  type RentInputBasis,
  type SecondaryInputField,
  type ValidationError,
} from '../../core/quick/index.ts'

import { formatPercent, formatPercentValue } from '../../lib/percent.ts'

import { formatTry } from '../../lib/money.ts'

import { formatCount, formatDecimal } from '../../lib/number.ts'

import { parseTurkishNumber } from './parse.ts'
import { buildQuickView } from './resultView.ts'
import type { QuickView } from './resultView.ts'

import {
  ERROR_COPY,
  COPY,
  FIELD_LABELS,
  FIELD_UNITS,
  type FieldUnit,
} from './labels.ts'

export type QuickField = PrimaryInputField | SecondaryInputField

export type { RentInputBasis }

export { QUICK_DEFAULTS }

export const PRIMARY_FIELDS: readonly QuickField[] = [
  'averageTicket',
  'dailySalesVolume',
  'variableCostPerSale',
  'monthlyRent',
  'otherMonthlyOpex',
  'employeeCount',
  'averageEmployeeMonthlyCost',
  'initialCapex',
] as const

export const SECONDARY_FIELDS: readonly SecondaryInputField[] = [
  'operatingDaysPerMonth',
  'capexRecoveryPeriodMonths',
  'cardPaymentShare',
  'posCommissionRate',
] as const

const PERCENT_FIELDS: ReadonlySet<QuickField> = new Set(['cardPaymentShare', 'posCommissionRate'])

export type {
  BarSegment,
  BreakdownRow,
  OutputItem,
  QuickView,
  SimulationDisplayRow,
} from './resultView.ts'
export { buildQuickView } from './resultView.ts'

export type FormValues = Record<QuickField, string>

export type QuickFormState = FormValues & { rentInputBasis: RentInputBasis }

export const EMPTY_FORM: QuickFormState = {
  monthlyRent: '',
  employeeCount: '',
  averageEmployeeMonthlyCost: '',
  otherMonthlyOpex: '',
  initialCapex: '',
  averageTicket: '',
  dailySalesVolume: '',
  variableCostPerSale: '',
  operatingDaysPerMonth: '',
  capexRecoveryPeriodMonths: '',
  cardPaymentShare: '',
  posCommissionRate: '',
  rentInputBasis: 'gross',
}

/**
 * The form a first-time visitor lands on: a plausible mid-size Istanbul cafe.
 *
 * The eight primary fields start filled so the first screen is a readable
 * example with one button rather than eight blank boxes — most arrivals come
 * from a link and have no figures of their own to type yet. Nothing here is a
 * result: DIRECTION V6 still holds, the result column stays empty until
 * `Hesapla` is pressed, and every figure below is an input the visitor
 * overwrites.
 *
 * The secondary fields stay empty on purpose. `toRawInput` skips empty
 * assumptions so the engine applies `QUICK_DEFAULTS`, which keeps the defaults
 * stated exactly once (U4) instead of copied into this literal.
 */
export const EXAMPLE_FORM: QuickFormState = {
  averageTicket: '180',
  dailySalesVolume: '120',
  variableCostPerSale: '45',
  monthlyRent: '85.000',
  otherMonthlyOpex: '60.000',
  employeeCount: '4',
  averageEmployeeMonthlyCost: '32.000',
  initialCapex: '1.500.000',
  operatingDaysPerMonth: '',
  capexRecoveryPeriodMonths: '',
  cardPaymentShare: '',
  posCommissionRate: '',
  rentInputBasis: 'gross',
}

export type FieldSpan = 'half' | 'full'

export type FieldGroupId = 'sales' | 'monthlyCosts' | 'capex'

/**
 * A row inside a group. `payroll` is the one row that is not a single field:
 * scope §6.1 keeps headcount and per-employee cost as two of the eight locked
 * inputs, but they are one cost to the business, so they share a row and a
 * label. Rent stays a plain field row — the form renders its basis control and
 * stopaj hint around it, as it already did.
 */
export type FieldRow =
  | { kind: 'field'; field: QuickField; span: FieldSpan }
  | { kind: 'payroll' }

export type FieldGroup = { id: FieldGroupId; rows: readonly FieldRow[] }

/**
 * The eight primary inputs, grouped. Replaces the flat `FIELD_LAYOUT`, which
 * interleaved sales and cost fields under one heading and split payroll away
 * from the other monthly costs.
 *
 * Sales comes first: a visitor describes what they sell before what they pay.
 * Initial investment is its own group because it is not a monthly cost and must
 * not land inside the monthly subtotal.
 */
export const FIELD_GROUPS: readonly FieldGroup[] = [
  {
    id: 'sales',
    rows: [
      { kind: 'field', field: 'averageTicket', span: 'half' },
      { kind: 'field', field: 'dailySalesVolume', span: 'half' },
      { kind: 'field', field: 'variableCostPerSale', span: 'full' },
    ],
  },
  {
    id: 'monthlyCosts',
    rows: [
      // Rent spans both columns: it carries the basis control and the stopaj
      // hint beneath it, and as a half-width cell it left its row partner
      // top-aligned against ~50px of empty space.
      { kind: 'field', field: 'monthlyRent', span: 'full' },
      { kind: 'payroll' },
      { kind: 'field', field: 'otherMonthlyOpex', span: 'full' },
    ],
  },
  {
    id: 'capex',
    rows: [{ kind: 'field', field: 'initialCapex', span: 'full' }],
  },
]

/**
 * `4 kişi × 32.000,00 TL = 128.000,00 TL` beneath the payroll row. The result
 * table shows `Personel` as one line; without this the form is the only place
 * the user has to do that multiplication in their head.
 *
 * `null` while either input is empty or unparseable — the same contract as
 * `rentCostHint`, which is the existing precedent for money derived from a
 * user's own input being shown before `Hesapla`.
 */
export function payrollHint(form: FormValues): string | null {
  const count = parseTurkishNumber(form.employeeCount)
  const perEmployee = parseTurkishNumber(form.averageEmployeeMonthlyCost)
  if (count.status !== 'ok' || perEmployee.status !== 'ok') return null
  const payroll = resolveMonthlyPayroll({
    employeeCount: count.value,
    averageEmployeeMonthlyCost: perEmployee.value,
  })
  return COPY.payrollHint(
    `${formatCount(count.value)} ${FIELD_UNITS.employeeCount}`,
    `${formatTry(perEmployee.value)} TL`,
    `${formatTry(payroll)} TL`,
  )
}

/**
 * Rent + payroll + other monthly opex, as a number.
 *
 * **This is deliberately not the engine's `fixedCost`**, which also carries the
 * capex recovery allocation (`core/quick/calculate.ts`). Initial investment is
 * its own input group and must not inflate a figure labelled "monthly costs";
 * `viewModel.test.ts` pins the difference so the two can never drift apart.
 *
 * Rent goes through `resolveRentCost` rather than being read raw, so a `Net`
 * entry is counted at what it actually costs the business — otherwise this
 * total would disagree with the `Kira` line in the result breakdown.
 */
export function monthlyCostsTotalValue(form: QuickFormState): number | null {
  const rent = parseTurkishNumber(form.monthlyRent)
  const count = parseTurkishNumber(form.employeeCount)
  const perEmployee = parseTurkishNumber(form.averageEmployeeMonthlyCost)
  const otherOpex = parseTurkishNumber(form.otherMonthlyOpex)
  if (
    rent.status !== 'ok' ||
    count.status !== 'ok' ||
    perEmployee.status !== 'ok' ||
    otherOpex.status !== 'ok'
  ) {
    return null
  }
  const rentCost = resolveRentCost({
    monthlyRent: rent.value,
    rentInputBasis: form.rentInputBasis,
    rentWithholdingRate: QUICK_DEFAULTS.rentWithholdingRate,
  }).rentCost
  const payroll = resolveMonthlyPayroll({
    employeeCount: count.value,
    averageEmployeeMonthlyCost: perEmployee.value,
  })
  return rentCost + payroll + otherOpex.value
}

/** The monthly-cost subtotal as it appears beside the group heading. */
export function monthlyCostsTotal(form: QuickFormState): string | null {
  const total = monthlyCostsTotalValue(form)
  return total === null ? null : `${formatTry(total)} TL`
}

export type EvaluateFormResult =
  | { ok: true; view: QuickView }
  | { ok: false; errors: Partial<Record<QuickField, string>> }

function toRawInput(form: QuickFormState): QuickCalculationInput {
  const raw: QuickCalculationInput = {}
  for (const field of PRIMARY_FIELDS) {
    const parsed = parseTurkishNumber(form[field])
    if (parsed.status === 'empty') raw[field] = undefined
    else if (parsed.status === 'invalid') raw[field] = Number.NaN
    else raw[field] = parsed.value
  }
  for (const field of SECONDARY_FIELDS) {
    const parsed = parseTurkishNumber(form[field])
    if (parsed.status === 'empty') continue
    if (parsed.status === 'invalid') raw[field] = Number.NaN
    else raw[field] = PERCENT_FIELDS.has(field) ? parsed.value / 100 : parsed.value
  }
  raw.rentInputBasis = form.rentInputBasis
  return raw
}

function formatLimit(field: QuickField, limit: number): string {
  const unit = FIELD_UNITS[field]
  if (unit === 'TL') return `${formatTry(limit)} ${unit}`
  if (unit === '%') return formatPercent(limit)
  return `${formatCount(limit)} ${unit}`
}

export function errorMessage(error: ValidationError): string {
  if (error.code === 'required') return ERROR_COPY.required
  if (error.code === 'not_a_number') return ERROR_COPY.notANumber
  if (error.code === 'invalid_value' || error.field === 'rentInputBasis') {
    return ERROR_COPY.invalidValue
  }
  if (error.code === 'below_min') {
    if (error.limit === 0) return ERROR_COPY.exclusiveZero
    if (error.limit === undefined) return ERROR_COPY.notANumber
    return ERROR_COPY.belowMin(formatLimit(error.field, error.limit))
  }
  if (error.limit === undefined) return ERROR_COPY.notANumber
  return ERROR_COPY.aboveMax(formatLimit(error.field, error.limit))
}

export { FIELD_UNITS }

export type { FieldUnit }

export function evaluateForm(form: QuickFormState): EvaluateFormResult {
  const validated = validateQuickInput(toRawInput(form))
  if (!validated.ok) {
    const errors: Partial<Record<QuickField, string>> = {}
    for (const error of validated.errors) {
      if (error.field === 'rentInputBasis') continue
      if (errors[error.field] === undefined) errors[error.field] = errorMessage(error)
    }
    return { ok: false, errors }
  }

  const result = calculateQuick(validated.input)
  const simulation = simulateQuick(validated.input)
  return {
    ok: true,
    view: buildQuickView(result, simulation, validated.input.capexRecoveryPeriodMonths),
  }
}

export function allPrimaryFilled(form: FormValues): boolean {
  return PRIMARY_FIELDS.every((field) => form[field].trim() !== '')
}

const GROUP_HEADINGS: Record<FieldGroupId, string> = {
  sales: COPY.salesGroup,
  monthlyCosts: COPY.monthlyCostsGroup,
  capex: COPY.capexGroup,
}

export function groupHeading(id: FieldGroupId): string {
  return GROUP_HEADINGS[id]
}

/**
 * The figure beside a group heading. Only the monthly-cost group has one — sales
 * inputs do not sum to anything meaningful, and the capex group is a single
 * field that would only repeat itself.
 */
export function groupSummary(form: QuickFormState, id: FieldGroupId): string | null {
  // `null` means the group has no summary slot at all. The monthly-cost group
  // always has one, falling back to `—` while a figure is missing, so the slot
  // does not appear and disappear as the user types.
  if (id !== 'monthlyCosts') return null
  return monthlyCostsTotal(form) ?? COPY.noValue
}

export function fieldLabel(field: QuickField): string {
  return FIELD_LABELS[field]
}

export function fieldUnit(field: QuickField): FieldUnit {
  return FIELD_UNITS[field]
}

export function fieldHint(field: QuickField): string | undefined {
  if (field === 'averageTicket') return 'KDV dahil tutar'
  return undefined
}

export function fieldNumberFormat(field: QuickField): {
  grouped: boolean
  maxFractionDigits: number
} {
  if (PERCENT_FIELDS.has(field)) return { grouped: false, maxFractionDigits: 4 }
  if (field === 'operatingDaysPerMonth' || field === 'capexRecoveryPeriodMonths') {
    return { grouped: true, maxFractionDigits: 0 }
  }
  return { grouped: true, maxFractionDigits: 2 }
}

export function rentCostHint(form: QuickFormState): string | null {
  const parsed = parseTurkishNumber(form.monthlyRent)
  if (parsed.status !== 'ok') return null
  const rent = resolveRentCost({
    monthlyRent: parsed.value,
    rentInputBasis: form.rentInputBasis,
    rentWithholdingRate: QUICK_DEFAULTS.rentWithholdingRate,
  })
  return COPY.rentCostHint(
    formatTry(rent.rentPaidToLandlord),
    formatTry(rent.rentWithholdingTax),
    formatTry(rent.rentCost),
  )
}

export function fieldLimitHint(field: QuickField): string | undefined {
  const spec = QUICK_LIMITS[field]
  if (spec.max !== undefined && (field === 'averageTicket' || field === 'variableCostPerSale')) {
    return ERROR_COPY.aboveMax(formatLimit(field, spec.max))
  }
  return undefined
}

export type AssumptionRow = {
  field: SecondaryInputField
  label: string
  unit: FieldUnit
  placeholder: string
  valueFormatted: string
  source: 'user' | 'default'
}

/** The default as the user would type it: a ratio assumption is entered as a percentage. */

export function assumptionPlaceholder(field: SecondaryInputField): string {
  const stored = QUICK_DEFAULTS[field]
  return formatDecimal(PERCENT_FIELDS.has(field) ? stored * 100 : stored, 2)
}

export function assumptionRows(form: FormValues): AssumptionRow[] {
  return SECONDARY_FIELDS.map((field) => {
    const parsed = parseTurkishNumber(form[field])
    const source = parsed.status === 'ok' ? 'user' : 'default'
    const stored =
      parsed.status === 'ok'
        ? PERCENT_FIELDS.has(field)
          ? parsed.value / 100
          : parsed.value
        : QUICK_DEFAULTS[field]
    const unit = FIELD_UNITS[field]
    return {
      field,
      label: FIELD_LABELS[field],
      unit,
      placeholder: assumptionPlaceholder(field),
      valueFormatted: PERCENT_FIELDS.has(field)
        ? formatPercentValue(stored * 100)
        : `${formatDecimal(stored, 2)} ${unit}`,
      source,
    }
  })
}

/** The VAT rate is a system assumption, never a user input (§6.4). */

export function vatRateFormatted(): string {
  return formatPercent(QUICK_DEFAULTS.vatRate)
}

export function rentWithholdingRateFormatted(): string {
  return formatPercent(QUICK_DEFAULTS.rentWithholdingRate)
}
