import {
  calculateQuick,
  QUICK_DEFAULTS,
  QUICK_LIMITS,
  simulateQuick,
  validateQuickInput,
  type CostLine,
  type QuickCalculationInput,
  type QuickCalculationResult,
  type QuickInputField,
  type QuickSimulationRow,
  type ValidationError,
} from '../../core/quick/index.ts'
import { formatPercent, formatPercentValue } from '../../lib/percent.ts'
import { formatTry, formatTryExact } from '../../lib/money.ts'
import { parseTurkishNumber } from './parse.ts'
import {
  BREAKDOWN_LABELS,
  COPY,
  ERROR_COPY,
  FIELD_LABELS,
  FIELD_UNITS,
  SIM_LABELS,
  ZERO_VOLUME_HEADLINE,
  type FieldUnit,
} from './labels.ts'

export type QuickField = QuickInputField

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

export type FormValues = Record<QuickField, string>
export type QuickFormState = FormValues

export const EMPTY_FORM: FormValues = {
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

const COST_ORDER: CostLine[] = [
  'vat',
  'variable',
  'payroll',
  'rent',
  'otherOpex',
  'pos',
  'investmentRecovery',
]

const BAR_COLORS: Record<CostLine | 'remaining', string> = {
  vat: '#C3C8CE',
  variable: '#3F4650',
  payroll: '#545C68',
  rent: '#6B7280',
  otherOpex: '#8A9199',
  pos: '#A8AEB6',
  investmentRecovery: '#CFD3D8',
  remaining: '#1D3A5F',
}

export type BarSegment = {
  key: CostLine | 'remaining'
  label: string
  color: string
  width: number
  showLabel: boolean
}

export type BreakdownRow = {
  key: CostLine | 'remaining'
  label: string
  amount: string
  share: string
  swatch: string
  weight: '400' | '600'
  rule: 'hair' | 'mid' | 'ink'
}

export type OutputItem = {
  key: string
  label: string
  value: string
  unit: string
}

export type SimulationDisplayRow = {
  key: QuickSimulationRow['label']
  scenario: string
  volume: string
  cost: string
  earnings: string
  isCurrent: boolean
}

export type QuickView = {
  headline: string
  copyText: string
  costHeadline: string
  ticketHeadline: string
  bar: BarSegment[]
  breakdown: BreakdownRow[]
  outputs: OutputItem[]
  simulation: SimulationDisplayRow[]
}

export type EvaluateFormResult =
  | { ok: true; view: QuickView }
  | { ok: false; errors: Partial<Record<QuickField, string>> }

function toRawInput(form: FormValues): QuickCalculationInput {
  const raw: QuickCalculationInput = {}
  for (const field of PRIMARY_FIELDS) {
    const parsed = parseTurkishNumber(form[field])
    if (parsed.status === 'empty') raw[field] = undefined
    else if (parsed.status === 'invalid') raw[field] = Number.NaN
    else raw[field] = parsed.value
  }
  return raw
}

function formatLimit(field: QuickField, limit: number): string {
  const unit = FIELD_UNITS[field]
  if (unit === 'TL') return `${formatTry(limit)} ${unit}`
  if (unit === '%') return formatPercent(limit)
  return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(limit)} ${unit}`
}

export function errorMessage(error: ValidationError): string {
  const unit = FIELD_UNITS[error.field]
  if (error.code === 'required') return ERROR_COPY.required
  if (error.code === 'not_a_number') return ERROR_COPY.notANumber
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

function shareOf(amount: number, ticket: number): string {
  if (ticket <= 0) return '—'
  return formatPercentValue((amount / ticket) * 100)
}

function toPercents(shares: number[]): number[] {
  if (shares.length === 0) return []
  const rounded = shares.map((share) => Math.round(share * 1000) / 10)
  const total = rounded.reduce((sum, value) => sum + value, 0)
  rounded[rounded.length - 1] = Math.round((rounded[rounded.length - 1] + (100 - total)) * 10) / 10
  return rounded
}

function paybackDisplay(payback: QuickCalculationResult['payback']): { value: string; unit: string } {
  if ('available' in payback && payback.available === false) return { value: '—', unit: '' }
  return { value: formatTryExact(payback.months, 1), unit: 'ay' }
}

export function buildQuickView(
  result: QuickCalculationResult,
  simulation: QuickSimulationRow[],
): QuickView {
  const ticket = result.monthly.averageSale
  const perSale = result.perSale
  const breakdown = result.breakdownPerSale

  if (perSale === null || breakdown === null) {
    const payback = paybackDisplay(result.payback)
    return {
      headline: ZERO_VOLUME_HEADLINE,
      copyText: [
        `${COPY.headlineTicket}: ${formatTryExact(ticket, 2)} TL`,
        `${COPY.simCost}: —`,
        `${BREAKDOWN_LABELS.remaining}: —`,
        `${COPY.monthlyEarnings}: ${formatTry(result.monthly.operatingEarnings)} TL`,
        `${COPY.payback}: ${payback.unit ? `${payback.value} ${payback.unit}` : payback.value}`,
      ].join('\n'),
      costHeadline: '—',
      ticketHeadline: `${formatTryExact(ticket, 2)} TL`,
      bar: [],
      breakdown: [],
      outputs: [
        {
          key: 'earnings',
          label: COPY.monthlyEarnings,
          value: formatTry(result.monthly.operatingEarnings),
          unit: 'TL',
        },
        {
          key: 'gross',
          label: COPY.grossMargin,
          value: result.grossProfitMargin === null ? '—' : formatPercentValue(result.grossProfitMargin * 100),
          unit: '',
        },
        {
          key: 'operating',
          label: COPY.operatingMargin,
          value:
            result.operatingProfitMargin === null ? '—' : formatPercentValue(result.operatingProfitMargin * 100),
          unit: '',
        },
        {
          key: 'payback',
          label: COPY.payback,
          value: payback.value,
          unit: payback.unit,
        },
      ],
      simulation: simulation.map((row) => ({
        key: row.label,
        scenario: SIM_LABELS[row.label],
        volume: new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(row.dailySales),
        cost: row.estimatedTotalCostPerSale === null ? '—' : `${formatTryExact(row.estimatedTotalCostPerSale, 2)} TL`,
        earnings: `${formatTry(row.monthlyOperatingEarnings)} TL`,
        isCurrent: row.isCurrent,
      })),
    }
  }

  const remaining = perSale.remainingProfit
  const costAmounts = COST_ORDER.map((line) => breakdown.lines.find((entry) => entry.line === line)?.amount ?? 0)
  const remainingAmount = remaining < 0 ? 0 : remaining
  const costTotal = costAmounts.reduce((sum, amount) => sum + amount, 0)

  let shares: number[]
  if (remaining < 0) {
    const scale = costTotal > 0 ? 1 / costTotal : 0
    shares = [...costAmounts.map((amount) => amount * scale), 0]
  } else {
    const denom = ticket > 0 ? ticket : 1
    shares = [...costAmounts.map((amount) => amount / denom), remainingAmount / denom]
  }

  const widths = toPercents(shares)
  const keys: Array<CostLine | 'remaining'> = [...COST_ORDER, 'remaining']
  const bar: BarSegment[] = keys.map((key, index) => ({
    key,
    label: BREAKDOWN_LABELS[key],
    color: BAR_COLORS[key],
    width: Math.max(0, widths[index] ?? 0),
    showLabel: (widths[index] ?? 0) >= 15,
  }))

  const breakdownRows: BreakdownRow[] = keys.map((key, index) => {
    const amount = key === 'remaining' ? remaining : costAmounts[index]
    const isLastCost = key === 'investmentRecovery'
    const isRemaining = key === 'remaining'
    return {
      key,
      label: BREAKDOWN_LABELS[key],
      amount: `${formatTryExact(amount, 2)} TL`,
      share: shareOf(amount, ticket),
      swatch: BAR_COLORS[key],
      weight: isRemaining ? '600' : '400',
      rule: isRemaining ? 'ink' : isLastCost ? 'mid' : 'hair',
    }
  })

  const payback = paybackDisplay(result.payback)
  const costText = `${formatTryExact(perSale.estimatedTotalCost, 2)} TL`
  const remainingText = `${formatTryExact(remaining, 2)} TL`
  const ticketText = `${formatTryExact(ticket, 2)} TL`

  return {
    headline: `${ticketText}’lik ortalama satışın ${costText}’si maliyete gidiyor, ${remainingText}’si işletmede kalıyor.`,
    copyText: [
      `${COPY.headlineTicket}: ${ticketText}`,
      `${COPY.simCost}: ${costText}`,
      `${BREAKDOWN_LABELS.remaining}: ${remainingText}`,
      `${COPY.monthlyEarnings}: ${formatTry(result.monthly.operatingEarnings)} TL`,
      `${COPY.payback}: ${payback.unit ? `${payback.value} ${payback.unit}` : payback.value}`,
    ].join('\n'),
    costHeadline: costText,
    ticketHeadline: ticketText,
    bar,
    breakdown: breakdownRows,
    outputs: [
      {
        key: 'earnings',
        label: COPY.monthlyEarnings,
        value: formatTry(result.monthly.operatingEarnings),
        unit: 'TL',
      },
      {
        key: 'gross',
        label: COPY.grossMargin,
        value: result.grossProfitMargin === null ? '—' : formatPercentValue(result.grossProfitMargin * 100),
        unit: '',
      },
      {
        key: 'operating',
        label: COPY.operatingMargin,
        value:
          result.operatingProfitMargin === null ? '—' : formatPercentValue(result.operatingProfitMargin * 100),
        unit: '',
      },
      {
        key: 'payback',
        label: COPY.payback,
        value: payback.value,
        unit: payback.unit,
      },
    ],
    simulation: simulation.map((row) => ({
      key: row.label,
      scenario: SIM_LABELS[row.label],
      volume: new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(row.dailySales),
      cost: row.estimatedTotalCostPerSale === null ? '—' : `${formatTryExact(row.estimatedTotalCostPerSale, 2)} TL`,
      earnings: `${formatTry(row.monthlyOperatingEarnings)} TL`,
      isCurrent: row.isCurrent,
    })),
  }
}

export function evaluateForm(form: FormValues): EvaluateFormResult {
  const validated = validateQuickInput(toRawInput(form))
  if (!validated.ok) {
    const errors: Partial<Record<QuickField, string>> = {}
    for (const error of validated.errors) {
      if (errors[error.field] === undefined) errors[error.field] = errorMessage(error)
    }
    return { ok: false, errors }
  }

  const result = calculateQuick(validated.input)
  const simulation = simulateQuick(validated.input)
  return { ok: true, view: buildQuickView(result, simulation) }
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

export function fieldLimitHint(field: QuickField): string | undefined {
  const spec = QUICK_LIMITS[field]
  if (spec.max !== undefined && (field === 'averageTicket' || field === 'variableCostPerSale')) {
    return ERROR_COPY.aboveMax(formatLimit(field, spec.max))
  }
  return undefined
}

export function assumptionsSummary(): string {
  const days = QUICK_DEFAULTS.operatingDaysPerMonth
  const months = QUICK_DEFAULTS.capexRecoveryPeriodMonths
  const card = formatPercentValue(QUICK_DEFAULTS.cardPaymentShare * 100)
  const pos = formatPercentValue(QUICK_DEFAULTS.posCommissionRate * 100)
  return `${days} gün · ${months} ay · ${card} · ${pos}`
}
