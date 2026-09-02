import {
  calculateQuick,
  QUICK_DEFAULTS,
  QUICK_LIMITS,
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

export type FieldSpan = 'half' | 'full'

export const FIELD_LAYOUT: readonly { field: QuickField; span: FieldSpan }[] = [
  { field: 'averageTicket', span: 'half' },
  { field: 'dailySalesVolume', span: 'half' },
  { field: 'variableCostPerSale', span: 'full' },
  { field: 'monthlyRent', span: 'half' },
  { field: 'otherMonthlyOpex', span: 'half' },
  { field: 'employeeCount', span: 'half' },
  { field: 'averageEmployeeMonthlyCost', span: 'half' },
  { field: 'initialCapex', span: 'full' },
]

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
