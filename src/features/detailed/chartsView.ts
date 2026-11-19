import {
  RAMP_UP_TABLES,
  buildPaybackPath,
  type DetailedResult,
  type ScenarioKey,
} from '../../core/detailed/index.ts'
import { formatCount } from '../../lib/number.ts'
import { formatTry } from '../../lib/money.ts'
import { formatPercent } from '../../lib/percent.ts'
import { CHART_COPY, SCENARIO_ORDER } from './labels.ts'

/**
 * The three Sonuç charts (DF-87, UI spec §4.5). Every amount is an engine field
 * or the Appendix E.9 payback path; this module only picks, formats and sizes
 * them. Widths and heights are visual-only percentages.
 */

const money = (value: number) => `${formatTry(value)} TL`

export type MonthBar = {
  month: number
  label: string
  amount: string
  isLoss: boolean
  /** Height inside its own half of the plot (above or below zero), 0–100. */
  heightPercent: number
}

export type MonthsChartView = {
  bars: MonthBar[]
  /** Share of the plot height above the zero line, 0–100. */
  upPercent: number
  hasLoss: boolean
  steadyLabel: string
  steadyAmount: string
  steadyCaption: string
  sentence: string
}

export type ScenarioBar = {
  key: ScenarioKey
  label: string
  isBase: boolean
  amount: string
  isLoss: boolean
  widthPercent: number
  payback: string
}

export type PaybackBoxState = 'loss' | 'paying' | 'payback' | 'free'

export type PaybackBox = { month: number; state: PaybackBoxState; tag: string }

export type PaybackProgress = {
  label: string
  target: string
  amount: string
  share: string
  widthPercent: number
}

export type PaybackCalendarView = {
  headline: string
  note: string
  boxes: PaybackBox[]
  legend: { state: Exclude<PaybackBoxState, 'payback'>; label: string }[]
  progress: PaybackProgress | null
  sentence: string
}

export type ResultChartsView = {
  months: MonthsChartView
  scenarios: ScenarioBar[]
  payback: PaybackCalendarView
}

/**
 * Chart 1: the opening months while sales ramp up, then the first full month.
 * After that month the result only moves with the annual increases.
 */
function buildMonthsChart(result: DetailedResult): MonthsChartView {
  const assumptions = result.meta.assumptions
  const projection = result.scenarios.base.projection
  const shown = Math.min(projection.length, RAMP_UP_TABLES[assumptions.rampUpPreset].length + 1)
  const values = projection.slice(0, shown).map((month) => month.monthlyOperatingResult)

  const maxUp = Math.max(0, ...values)
  const maxDown = Math.max(0, ...values.map((value) => -value))
  const range = maxUp + maxDown

  const bars = values.map((value, index) => ({
    month: index + 1,
    label: CHART_COPY.monthLabel(formatCount(index + 1)),
    amount: money(value),
    isLoss: value < 0,
    heightPercent:
      value < 0 ? (maxDown > 0 ? (-value / maxDown) * 100 : 0) : maxUp > 0 ? (value / maxUp) * 100 : 0,
  }))

  const steady = values[values.length - 1] ?? 0
  const escalated =
    assumptions.salesPriceAnnualIncrease !== 0 ||
    assumptions.productCogsAnnualIncrease !== 0 ||
    assumptions.fixedCostAnnualIncrease !== 0

  const leadingLosses = values.findIndex((value) => value >= 0)
  const cumulative = buildPaybackPath(projection, result.totalInitialInvestment).cumulative
  let sentence: string
  if (steady < 0 || leadingLosses === -1) {
    sentence = CHART_COPY.monthsAllLoss
  } else if (leadingLosses === 0) {
    sentence = CHART_COPY.monthsAllPositive
  } else if (leadingLosses === 1) {
    sentence = CHART_COPY.monthsFirstLoss(money(Math.abs(values[0] ?? 0)), formatCount(2))
  } else {
    sentence = CHART_COPY.monthsLossRun(
      formatCount(leadingLosses),
      money(Math.abs(cumulative[leadingLosses - 1] ?? 0)),
      formatCount(leadingLosses + 1),
    )
  }

  return {
    bars,
    upPercent: range > 0 ? (maxUp / range) * 100 : 100,
    hasLoss: maxDown > 0,
    steadyLabel: CHART_COPY.steadyFrom(formatCount(shown)),
    steadyAmount: money(steady),
    steadyCaption: escalated ? CHART_COPY.steadyCaptionEscalated : CHART_COPY.steadyCaption,
    sentence,
  }
}

function scenarioLabel(key: ScenarioKey, delta: number): string {
  if (key === 'base') return CHART_COPY.scenarioBase
  const percent = formatPercent(Math.abs(delta)).replace(/,0$/, '')
  if (delta < 0) return CHART_COPY.scenarioDown(percent)
  if (delta > 0) return CHART_COPY.scenarioUp(percent)
  return CHART_COPY.scenarioSame
}

function scenarioPayback(result: DetailedResult, key: ScenarioKey): string {
  const payback = result.scenarios[key].payback
  if (payback.available) {
    return payback.month === 0
      ? CHART_COPY.scenarioPaybackNoInvestment
      : CHART_COPY.scenarioPaybackMonth(formatCount(payback.month))
  }
  return payback.reason === 'not_reached_within_horizon'
    ? CHART_COPY.scenarioPaybackNotReached(formatCount(result.meta.assumptions.projectionHorizonMonths))
    : CHART_COPY.scenarioPaybackLoss
}

/** Chart 2: the three stabilized months side by side, base emphasised. */
function buildScenarioBars(result: DetailedResult): ScenarioBar[] {
  const values = SCENARIO_ORDER.map(
    (key) => result.scenarios[key].stabilizedMonth.monthlyOperatingResult,
  )
  const maxUp = Math.max(0, ...values)
  return SCENARIO_ORDER.map((key, index) => {
    const value = values[index] ?? 0
    return {
      key,
      label: scenarioLabel(key, result.meta.assumptions.scenarioVolumeDeltas[key]),
      isBase: key === 'base',
      amount: money(value),
      isLoss: value < 0,
      widthPercent: maxUp > 0 ? (Math.max(0, value) / maxUp) * 100 : 0,
      payback: scenarioPayback(result, key),
    }
  })
}

const LEGEND_ORDER = ['loss', 'paying', 'free'] as const
const LEGEND_LABELS = {
  loss: CHART_COPY.legendLoss,
  paying: CHART_COPY.legendPaying,
  free: CHART_COPY.legendFree,
} as const
const BOX_TAGS: Record<PaybackBoxState, string> = {
  loss: CHART_COPY.boxLoss,
  paying: '',
  payback: CHART_COPY.boxPayback,
  free: CHART_COPY.boxFree,
}

/**
 * Chart 3, the kumbara calendar: one box per projection month of the base
 * scenario. DF-36 payback decides the "döndü" box; Appendix E.9 adds the
 * share recovered and the estimate when the horizon ends first.
 */
function buildPaybackCalendar(result: DetailedResult): PaybackCalendarView {
  const base = result.scenarios.base
  const investment = result.totalInitialInvestment
  const horizon = formatCount(result.meta.assumptions.projectionHorizonMonths)
  const path = buildPaybackPath(base.projection, investment)
  const noInvestment = base.payback.available && base.payback.month === 0
  const paybackMonth = base.payback.available && base.payback.month > 0 ? base.payback.month : null

  const boxes = base.projection.map((row, index): PaybackBox => {
    const month = row.month ?? index + 1
    let state: PaybackBoxState
    if (row.monthlyOperatingResult < 0) state = 'loss'
    else if (noInvestment) state = 'free'
    else if (paybackMonth === null || month < paybackMonth) state = 'paying'
    else state = month === paybackMonth ? 'payback' : 'free'
    return { month, state, tag: BOX_TAGS[state] }
  })

  const present = new Set(boxes.map((box) => (box.state === 'payback' ? 'paying' : box.state)))
  const legend = LEGEND_ORDER.filter((state) => present.has(state)).map((state) => ({
    state,
    label: LEGEND_LABELS[state],
  }))

  if (noInvestment) {
    return {
      headline: CHART_COPY.paybackNoInvestment,
      note: CHART_COPY.paybackNoteNoInvestment,
      boxes,
      legend,
      progress: null,
      sentence: CHART_COPY.paybackNoInvestmentSentence,
    }
  }

  const note = CHART_COPY.paybackNote(money(investment))
  if (paybackMonth !== null) {
    return {
      headline: CHART_COPY.paybackMonth(formatCount(paybackMonth)),
      note,
      boxes,
      legend,
      progress: null,
      sentence: CHART_COPY.paybackReached(formatCount(paybackMonth)),
    }
  }

  const share = path.recoveredShare ?? 0
  const estimate = path.estimatedMonthBeyondHorizon
  const outlook =
    estimate === null
      ? CHART_COPY.paybackNever
      : CHART_COPY.paybackEstimate(formatCount(estimate))
  return {
    headline: CHART_COPY.paybackNotReached(horizon),
    note,
    boxes,
    legend,
    progress: {
      label: CHART_COPY.progressLabel(horizon),
      target: `${CHART_COPY.progressTarget} ${money(investment)}`,
      amount: money(path.cumulativeAtHorizon),
      share: formatPercent(share),
      widthPercent: Math.min(100, Math.max(0, share * 100)),
    },
    sentence:
      path.cumulativeAtHorizon > 0
        ? `${CHART_COPY.paybackShare(horizon, formatPercent(share))} ${outlook}`
        : `${CHART_COPY.paybackEmpty(horizon)} ${outlook}`,
  }
}

export function buildResultCharts(result: DetailedResult): ResultChartsView {
  return {
    months: buildMonthsChart(result),
    scenarios: buildScenarioBars(result),
    payback: buildPaybackCalendar(result),
  }
}
