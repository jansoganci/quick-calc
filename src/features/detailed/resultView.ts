import {
  type Channel,
  type DetailedResult,
  type MonthResult,
  type ScenarioKey,
} from '../../core/detailed/index.ts'
import { formatCount } from '../../lib/number.ts'
import { formatTry } from '../../lib/money.ts'
import { formatPercent } from '../../lib/percent.ts'
import {
  BREAKDOWN_LABELS,
  CHANNEL_LABELS,
  CHANNEL_ORDER,
  SCENARIO_ORDER,
  COPY,
  DELIVERY_MODE_LABELS,
  RAMP_UP_LABELS,
  SCENARIO_LABELS,
  type BreakdownKey,
} from './labels.ts'

/**
 * Shapes `DetailedResult` into rows, segments and numeric series for the result
 * components. It reads engine figures and formats them; it derives no new financial
 * quantity. Charts receive raw values and do their own pixel arithmetic, which is
 * visual-only and stays in the component.
 */

export type BreakdownRow = {
  key: BreakdownKey
  label: string
  amount: string
  share: string
  widthPercent: number
  colorClass: string
}

/**
 * Nine stops of one monotone ramp, in the order the money leaves the gross figure.
 * The last two tones are Detailed's own additions to the Quick ramp.
 */
const BREAKDOWN_COLORS: Record<BreakdownKey, string> = {
  vat: 'bg-qc-bar-vat',
  productCogs: 'bg-qc-bar-variable',
  channelVariableCost: 'bg-qc-bar-channel',
  paymentPlatformFee: 'bg-qc-bar-payroll',
  payroll: 'bg-qc-bar-rent',
  owner: 'bg-qc-bar-owner',
  occupancy: 'bg-qc-bar-other-opex',
  opex: 'bg-qc-bar-pos',
  operatingResult: 'bg-qc-bar-remaining',
}

const BREAKDOWN_ORDER: readonly BreakdownKey[] = [
  'vat',
  'productCogs',
  'channelVariableCost',
  'paymentPlatformFee',
  'payroll',
  'owner',
  'occupancy',
  'opex',
  'operatingResult',
]

function breakdownAmount(month: MonthResult, key: BreakdownKey): number {
  switch (key) {
    case 'vat':
      return month.vatAmount
    case 'productCogs':
      return month.productCogs
    case 'channelVariableCost':
      return month.channelVariableCost
    case 'paymentPlatformFee':
      return month.paymentPlatformFee
    case 'payroll':
      return month.monthlyPayroll
    case 'owner':
      return month.monthlyOwnerCost
    case 'occupancy':
      return month.monthlyOccupancyCost
    case 'opex':
      return month.monthlyOpex
    case 'operatingResult':
      return month.monthlyOperatingResult
  }
}

export type BreakdownView = {
  rows: BreakdownRow[]
  total: string
  /** True when the operating result is negative, so the bar cannot close at 100%. */
  isDeficit: boolean
  deficitCaption: string | null
}

/**
 * The bar reconciles exactly, because the engine's own identity says so:
 * gross = VAT + variable costs + fixed costs + operating result.
 *
 * When the result is negative the bar cannot draw the closing segment, so the cost
 * segments are shown as shares of total cost and a caption states the overrun.
 */
export function buildBreakdown(month: MonthResult): BreakdownView {
  const gross = month.grossCustomerSales
  const isDeficit = month.monthlyOperatingResult < 0
  const visibleKeys = isDeficit
    ? BREAKDOWN_ORDER.filter((key) => key !== 'operatingResult')
    : BREAKDOWN_ORDER

  const basis = isDeficit
    ? visibleKeys.reduce((sum, key) => sum + breakdownAmount(month, key), 0)
    : gross

  const rows: BreakdownRow[] = visibleKeys.map((key) => {
    const amount = breakdownAmount(month, key)
    const fraction = basis === 0 ? 0 : amount / basis
    return {
      key,
      label: BREAKDOWN_LABELS[key],
      amount: `${formatTry(amount)} TL`,
      share: formatPercent(gross === 0 ? 0 : amount / gross),
      widthPercent: fraction * 100,
      colorClass: BREAKDOWN_COLORS[key],
    }
  })

  // The last segment absorbs the rounding remainder so the row totals exactly 100%.
  const last = rows[rows.length - 1]
  if (last !== undefined) {
    const drawn = rows.slice(0, -1).reduce((sum, row) => sum + row.widthPercent, 0)
    last.widthPercent = Math.max(0, 100 - drawn)
  }

  if (isDeficit) {
    return {
      rows: [
        ...rows,
        {
          key: 'operatingResult',
          label: BREAKDOWN_LABELS.operatingResult,
          amount: `${formatTry(month.monthlyOperatingResult)} TL`,
          share: formatPercent(gross === 0 ? 0 : month.monthlyOperatingResult / gross),
          widthPercent: 0,
          colorClass: BREAKDOWN_COLORS.operatingResult,
        },
      ],
      total: `${formatTry(gross)} TL`,
      isDeficit,
      deficitCaption:
        gross === 0
          ? null
          : `Toplam maliyet aylık cironun ${formatPercent(basis / gross)}’i.`,
    }
  }

  return { rows, total: `${formatTry(gross)} TL`, isDeficit, deficitCaption: null }
}

export type ChannelRow = {
  channel: Channel
  label: string
  units: string
  gross: string
  net: string
  cogs: string
  variable: string
  fee: string
  contribution: string
}

export function buildChannelRows(month: MonthResult): ChannelRow[] {
  return CHANNEL_ORDER.map((channel) => {
    const line = month.byChannel[channel]
    return {
      channel,
      label: CHANNEL_LABELS[channel],
      units: formatCount(line.units),
      gross: formatTry(line.grossCustomerSales),
      net: formatTry(line.netRevenue),
      cogs: formatTry(line.productCogs),
      variable: line.channelVariableCost === 0 ? COPY.none : formatTry(line.channelVariableCost),
      fee: formatTry(line.paymentPlatformFee),
      contribution: formatTry(line.contribution),
    }
  })
}

export function buildChannelTotals(month: MonthResult): Omit<ChannelRow, 'channel' | 'label'> {
  return {
    units: formatCount(month.totalUnits),
    gross: formatTry(month.grossCustomerSales),
    net: formatTry(month.netRevenue),
    cogs: formatTry(month.productCogs),
    variable: formatTry(month.channelVariableCost),
    fee: formatTry(month.paymentPlatformFee),
    contribution: formatTry(month.totalContribution),
  }
}

export type ProjectionSeries = { key: ScenarioKey; label: string; values: number[] }

export type ProjectionData = {
  series: ProjectionSeries[]
  min: number
  max: number
  months: number
}

export function buildProjection(result: DetailedResult): ProjectionData {
  const series = SCENARIO_ORDER.map((key) => ({
    key,
    label: SCENARIO_LABELS[key],
    values: result.scenarios[key].projection.map((month) => month.monthlyOperatingResult),
  }))

  const all = series.flatMap((entry) => entry.values)
  return {
    series,
    min: Math.min(0, ...all),
    max: Math.max(0, ...all),
    months: result.meta.assumptions.projectionHorizonMonths,
  }
}

export type PaybackData = {
  cumulative: number[]
  target: number
  paybackMonth: number | null
  min: number
  max: number
  months: number
}

/**
 * Cumulative base operating result against the investment line. The running sum is
 * the same quantity §14.2 defines payback on — it is not a second definition.
 */
export function buildPaybackChart(result: DetailedResult): PaybackData {
  const base = result.scenarios.base
  const cumulative: number[] = []
  let running = 0
  for (const month of base.projection) {
    running += month.monthlyOperatingResult
    cumulative.push(running)
  }

  const target = result.totalInitialInvestment
  return {
    cumulative,
    target,
    paybackMonth: base.payback.available ? base.payback.month : null,
    min: Math.min(0, ...cumulative),
    max: Math.max(target, ...cumulative),
    months: result.meta.assumptions.projectionHorizonMonths,
  }
}

export type MonthRow = {
  month: string
  units: string
  netRevenue: string
  contribution: string
  fixedCost: string
  operatingResult: string
}

export function buildMonthRows(result: DetailedResult): MonthRow[] {
  return result.scenarios.base.projection.map((month) => ({
    month: `${formatCount(month.month ?? 0)}.`,
    units: formatCount(month.totalUnits),
    netRevenue: formatTry(month.netRevenue),
    contribution: formatTry(month.totalContribution),
    fixedCost: formatTry(month.monthlyFixedCost),
    operatingResult: formatTry(month.monthlyOperatingResult),
  }))
}

export type AssumptionRow = { label: string; value: string }

/**
 * Spec §16.4 makes this block mandatory, including the three annual rates at 0%.
 * The delivery rows are the only conditional ones: with no delivery share they reach
 * no figure, and §15 says the UI should suppress them.
 */
export function buildAssumptionRows(result: DetailedResult, hasDelivery: boolean): AssumptionRow[] {
  const assumptions = result.meta.assumptions
  const rows: AssumptionRow[] = [
    { label: COPY.vatRate, value: formatPercent(assumptions.vatRate) },
    { label: COPY.operatingDays, value: formatCount(assumptions.operatingDaysPerMonth) },
    { label: COPY.rentWithholdingRate, value: formatPercent(assumptions.rentWithholdingRate) },
    {
      label: COPY.projectionHorizon,
      value: `${formatCount(assumptions.projectionHorizonMonths)} ay`,
    },
    { label: COPY.rampUp, value: RAMP_UP_LABELS[assumptions.rampUpPreset] },
    {
      label: COPY.scenarioDeltas,
      value: SCENARIO_ORDER.map((key) => formatPercent(assumptions.scenarioVolumeDeltas[key])).join(
        ' · ',
      ),
    },
  ]

  if (hasDelivery) {
    rows.push(
      { label: COPY.deliveryModeLabel, value: DELIVERY_MODE_LABELS[assumptions.deliveryMode] },
      { label: COPY.platformFeeRate, value: formatPercent(assumptions.platformFeeRate) },
    )
  }

  rows.push(
    { label: COPY.posCommission, value: formatPercent(assumptions.posCommissionRate) },
    { label: COPY.mealCardCommission, value: formatPercent(assumptions.mealCardCommissionRate) },
    {
      label: COPY.salesPriceAnnualIncrease,
      value: formatPercent(assumptions.salesPriceAnnualIncrease),
    },
    {
      label: COPY.productCogsAnnualIncrease,
      value: formatPercent(assumptions.productCogsAnnualIncrease),
    },
    {
      label: COPY.fixedCostAnnualIncrease,
      value: formatPercent(assumptions.fixedCostAnnualIncrease),
    },
    { label: COPY.engineVersion, value: result.meta.detailedEngineVersion },
  )

  return rows
}
