import type {
  CostLine,
  QuickCalculationResult,
  QuickSimulationRow,
} from '../../core/quick/index.ts'
import { formatTry, formatTryExact } from '../../lib/money.ts'
import { formatCount } from '../../lib/number.ts'
import { formatPercentValue } from '../../lib/percent.ts'
import { BREAKDOWN_LABELS, COPY, SIM_LABELS, type HeadlineSegment } from './labels.ts'

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
  vat: 'var(--qc-bar-vat)',
  variable: 'var(--qc-bar-variable)',
  payroll: 'var(--qc-bar-payroll)',
  rent: 'var(--qc-bar-rent)',
  otherOpex: 'var(--qc-bar-other-opex)',
  pos: 'var(--qc-bar-pos)',
  investmentRecovery: 'var(--qc-bar-investment-recovery)',
  remaining: 'var(--qc-bar-remaining)',
}

const RULE_COLORS = {
  row: 'var(--qc-rule-row)',
  group: 'var(--qc-rule-mid)',
  total: 'var(--qc-ink)',
} as const

export type BarSegment = {
  key: CostLine | 'remaining'
  label: string
  color: string
  width: number
  showLabel: boolean
  amountFormatted: string
}

export type BreakdownRow = {
  key: CostLine | 'remaining'
  label: string
  note?: string
  amountFormatted: string
  shareFormatted: string
  color: string
  emphasis: boolean
  rule: string
}

export type OutputItem = {
  key: string
  label: string
  value: string
  unit: string
}

export type SimulationDisplayRow = {
  label: QuickSimulationRow['label']
  scenario: string
  volume: string
  cost: string
  earnings: string
  isCurrent: boolean
  rule: string
}

export type QuickView = {
  headline: string
  headlineSegments: HeadlineSegment[]
  copyText: string
  headlineCost: string
  ticketFormatted: string
  bar: BarSegment[]
  breakdown: BreakdownRow[]
  outputs: OutputItem[]
  simulation: SimulationDisplayRow[]
  paybackNote: string | null
}

function shareOf(amount: number, ticket: number): string {
  if (ticket <= 0) return '—'
  return formatPercentValue((amount / ticket) * 100)
}

function toPercents(shares: number[]): number[] {
  if (shares.length === 0) return []
  const rounded = shares.map((share) => Math.round(share * 1000) / 10)
  const total = rounded.reduce((sum, value) => sum + value, 0)
  const lastIndex = rounded.length - 1
  const last = rounded[lastIndex]
  if (last === undefined) return rounded
  rounded[lastIndex] = Math.round((last + (100 - total)) * 10) / 10
  return rounded
}

function paybackDisplay(
  payback: QuickCalculationResult['payback'],
  recoveryPeriodMonths: number,
): { value: string; unit: string; note: string | null } {
  if ('months' in payback) {
    return {
      value: formatTryExact(payback.months, 1),
      unit: 'ay',
      note: payback.exceedsRecoveryPeriod
        ? COPY.paybackExceeds(formatCount(recoveryPeriodMonths))
        : null,
    }
  }
  return { value: '—', unit: '', note: COPY.paybackUnavailable }
}

function buildSimulationRows(simulation: QuickSimulationRow[]): SimulationDisplayRow[] {
  return simulation.map((row, index) => {
    const isLast = index === simulation.length - 1
    const nextIsCurrent = simulation[index + 1]?.isCurrent === true
    return {
      label: row.label,
      scenario: SIM_LABELS[row.label],
      volume: formatCount(row.dailySales),
      cost:
        row.estimatedTotalCostPerSale === null
          ? '\u2014'
          : `${formatTryExact(row.estimatedTotalCostPerSale, 2)} TL`,
      earnings: `${formatTry(row.monthlyOperatingEarnings)} TL`,
      isCurrent: row.isCurrent,
      rule: isLast
        ? RULE_COLORS.total
        : row.isCurrent || nextIsCurrent
          ? RULE_COLORS.group
          : RULE_COLORS.row,
    }
  })
}

export function buildQuickView(
  result: QuickCalculationResult,
  simulation: QuickSimulationRow[],
  recoveryPeriodMonths: number,
): QuickView {
  const perSale = result.perSale
  const breakdown = result.breakdownPerSale
  const ticket = breakdown?.averageSale ?? perSale?.grossTicket ?? 0

  if (perSale === null || breakdown === null) {
    const payback = paybackDisplay(result.payback, recoveryPeriodMonths)
    return {
      headline: COPY.zeroVolume,
      headlineSegments: [{ text: COPY.zeroVolume, tone: 'text' }],
      copyText: [
        `${COPY.headlineTicket}: ${formatTryExact(ticket, 2)} TL`,
        `${COPY.simCost}: —`,
        `${BREAKDOWN_LABELS.remaining}: —`,
        `${COPY.monthlyEarnings}: ${formatTry(result.monthly.operatingEarnings)} TL`,
        `${COPY.payback}: ${payback.unit ? `${payback.value} ${payback.unit}` : payback.value}`,
      ].join('\n'),
      headlineCost: '',
      ticketFormatted: `${formatTryExact(ticket, 2)} TL`,
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
      simulation: buildSimulationRows(simulation),
      paybackNote: payback.note,
    }
  }

  const remaining = perSale.remainingProfit
  const costAmounts = COST_ORDER.map((line) => breakdown.lines.find((entry) => entry.line === line)?.amount ?? 0)
  const remainingAmount = remaining < 0 ? 0 : remaining
  const costTotal = costAmounts.reduce((sum, amount) => sum + amount, 0)
  const rentNote =
    result.monthly.rentCost === 0 || result.monthly.rentWithholdingTax === 0
      ? undefined
      : `${formatTry(result.monthly.rentPaidToLandlord)} TL net + ${formatTry(result.monthly.rentWithholdingTax)} TL stopaj`

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
  const segmentAmounts = [...costAmounts, remaining]
  const bar: BarSegment[] = keys.map((key, index) => ({
    key,
    label: BREAKDOWN_LABELS[key],
    color: BAR_COLORS[key],
    width: Math.max(0, widths[index] ?? 0),
    showLabel: (widths[index] ?? 0) >= 15,
    amountFormatted: `${formatTryExact(segmentAmounts[index] ?? 0, 2)} TL`,
  }))

  const breakdownRows: BreakdownRow[] = keys.map((key, index) => {
    const amount = key === 'remaining' ? remaining : (costAmounts[index] ?? 0)
    const isLastCost = key === 'investmentRecovery'
    const isRemaining = key === 'remaining'
    return {
      key,
      label: BREAKDOWN_LABELS[key],
      ...(key === 'rent' && rentNote ? { note: rentNote } : {}),
      amountFormatted: `${formatTryExact(amount, 2)} TL`,
      shareFormatted: shareOf(amount, ticket),
      color: BAR_COLORS[key],
      emphasis: isRemaining,
      rule: isRemaining ? RULE_COLORS.total : isLastCost ? RULE_COLORS.group : RULE_COLORS.row,
    }
  })

  const payback = paybackDisplay(result.payback, recoveryPeriodMonths)
  const costText = `${formatTryExact(perSale.estimatedTotalCost, 2)} TL`
  const remainingText = `${formatTryExact(remaining, 2)} TL`
  const ticketText = `${formatTryExact(ticket, 2)} TL`
  const headlineSegments =
    remaining < 0
      ? COPY.headlineLossSentence(ticketText, `${formatTryExact(Math.abs(remaining), 2)} TL`)
      : COPY.headlineSentence(ticketText, costText, remainingText)

  return {
    headline: headlineSegments.map((segment) => segment.text).join(''),
    headlineSegments,
    copyText: [
      `${COPY.headlineTicket}: ${ticketText}`,
      `${COPY.simCost}: ${costText}`,
      `${BREAKDOWN_LABELS.remaining}: ${remainingText}`,
      `${COPY.monthlyEarnings}: ${formatTry(result.monthly.operatingEarnings)} TL`,
      `${COPY.payback}: ${payback.unit ? `${payback.value} ${payback.unit}` : payback.value}`,
    ].join('\n'),
    headlineCost: costText,
    ticketFormatted: ticketText,
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
    simulation: buildSimulationRows(simulation),
    paybackNote: payback.note,
  }
}
