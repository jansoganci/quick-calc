import {
  calculateDetailed,
  validateDetailedInput,
  type DetailedInput,
  type DetailedResolvedInput,
  type DetailedResult,
  type ScenarioKey,
} from '../../core/detailed/index.ts'
import { formatCount } from '../../lib/number.ts'
import { formatTry } from '../../lib/money.ts'
import type { DetailedFormState } from './formState.ts'
import { buildErrorMap, type ErrorMap } from './errors.ts'
import { buildReportInputGroups, type ReportInputGroup } from './reportView.ts'
import { collectGuardrails, type Guardrail } from './guardrails.ts'
import {
  COPY,
  SCENARIO_LABELS,
  SCENARIO_ORDER,
  SECTION_ECHO_LABELS,
  UNAVAILABLE_COPY,
  VERDICT,
  type SectionId,
  type VerdictSegment,
} from './labels.ts'
import {
  buildAssumptionRows,
  buildBreakdown,
  buildChannelRows,
  buildChannelTotals,
  buildMonthRows,
  buildPaybackChart,
  buildProjection,
  type AssumptionRow,
  type BreakdownView,
  type ChannelRow,
  type MonthRow,
  type PaybackData,
  type ProjectionData,
} from './resultView.ts'

/**
 * The single boundary between the Detailed engine and the Detailed UI. Components
 * receive formatted strings and never touch `DetailedResult` themselves.
 */

export type AvailableFigure = { available: true; value: string } | { available: false; message: string }

export type ScenarioRow = {
  key: ScenarioKey
  label: string
  isBase: boolean
  operatingResult: string
  netRevenue: string
  contribution: string
  payback: string
}

export type DetailedView = {
  verdict: VerdictSegment[]
  copyText: string
  monthlyOperatingResult: string
  breakEvenPerDay: AvailableFigure
  breakEvenUnitsPerDay: string | null
  breakEvenUnitsPerMonth: string | null
  payback: AvailableFigure
  initialInvestment: string
  plannedUnitsPerDay: string
  horizonMonths: string
  scenarios: ScenarioRow[]
  sectionEcho: Partial<Record<SectionId, string>>
  breakdown: BreakdownView
  channels: ChannelRow[]
  channelTotals: Omit<ChannelRow, 'channel' | 'label'>
  projection: ProjectionData
  paybackChart: PaybackData
  monthRows: MonthRow[]
  assumptions: AssumptionRow[]
  guardrails: Guardrail[]
  hasDelivery: boolean
  /** `meta.detailedEngineVersion`, which the report's colophon states. */
  engineVersion: string
  /**
   * The report's input appendix. It rides on the view because the report is a
   * presentation of this same view model — the figures a reader audits are the
   * figures the screen shows, formatted once (plan T-07).
   */
  reportInputs: ReportInputGroup[]
}

export type DetailedEvaluation =
  | { ok: true; view: DetailedView }
  | { ok: false; errors: ErrorMap; errorSections: SectionId[] }

function paybackText(result: DetailedResult, scenario: ScenarioKey): AvailableFigure {
  const payback = result.scenarios[scenario].payback
  const horizon = formatCount(result.meta.assumptions.projectionHorizonMonths)

  if (payback.available) {
    return payback.month === 0
      ? { available: false, message: UNAVAILABLE_COPY.paybackNoInvestment }
      : { available: true, value: `${formatCount(payback.month)}. ay` }
  }

  return {
    available: false,
    message:
      payback.reason === 'not_reached_within_horizon'
        ? UNAVAILABLE_COPY.payback.not_reached_within_horizon(horizon)
        : UNAVAILABLE_COPY.payback.non_positive_operating_result,
  }
}

function buildVerdict(result: DetailedResult): VerdictSegment[] {
  const base = result.scenarios.base.stabilizedMonth
  const operatingResult = base.monthlyOperatingResult
  const payback = result.scenarios.base.payback

  if (base.totalUnits === 0) {
    return VERDICT.zeroVolume(`${formatTry(base.monthlyFixedCost)} TL`)
  }
  if (operatingResult < 0) {
    return VERDICT.deficit(`${formatTry(Math.abs(operatingResult))} TL`)
  }
  if (operatingResult === 0) {
    return VERDICT.breakEvenResult()
  }

  const resultText = `${formatTry(operatingResult)} TL`
  if (payback.available) {
    return payback.month === 0
      ? VERDICT.profitNoInvestment(resultText)
      : VERDICT.profitWithPayback(
          resultText,
          `${formatTry(result.totalInitialInvestment)} TL`,
          formatCount(payback.month),
        )
  }
  return VERDICT.profitNoPayback(
    resultText,
    formatCount(result.meta.assumptions.projectionHorizonMonths),
  )
}

function buildSectionEcho(result: DetailedResult): Partial<Record<SectionId, string>> {
  const base = result.scenarios.base.stabilizedMonth
  return {
    products: `${formatTry(base.grossCustomerSales)} TL`,
    positions: `${formatTry(base.monthlyPayroll)} TL`,
    owner: `${formatTry(base.monthlyOwnerCost)} TL`,
    occupancy: `${formatTry(base.monthlyOccupancyCost)} TL`,
    opex: `${formatTry(base.monthlyOpex)} TL`,
    capex: `${formatTry(result.totalInitialInvestment)} TL`,
  }
}

function buildScenarioRows(result: DetailedResult): ScenarioRow[] {
  return SCENARIO_ORDER.map((key) => {
    const month = result.scenarios[key].stabilizedMonth
    const payback = paybackText(result, key)
    return {
      key,
      label: SCENARIO_LABELS[key],
      isBase: key === 'base',
      operatingResult: `${formatTry(month.monthlyOperatingResult)} TL`,
      netRevenue: `${formatTry(month.netRevenue)} TL`,
      contribution: `${formatTry(month.totalContribution)} TL`,
      payback: payback.available ? payback.value : payback.message,
    }
  })
}

function buildCopyText(result: DetailedResult, view: Omit<DetailedView, 'copyText'>): string {
  const lines = [
    `${COPY.monthlyOperatingResult}: ${view.monthlyOperatingResult}`,
    `${COPY.breakEven}: ${
      view.breakEvenPerDay.available ? view.breakEvenPerDay.value : view.breakEvenPerDay.message
    }`,
    `${COPY.payback}: ${view.payback.available ? view.payback.value : view.payback.message}`,
    `${COPY.initialInvestment}: ${view.initialInvestment}`,
  ]
  for (const scenario of view.scenarios) {
    lines.push(`${scenario.label}: ${scenario.operatingResult}`)
  }
  lines.push(`${COPY.engineVersion} ${result.meta.detailedEngineVersion}`)
  return lines.join('\n')
}

function buildView(result: DetailedResult, input: DetailedResolvedInput): DetailedView {
  const base = result.scenarios.base.stabilizedMonth
  const hasDelivery = input.channelMix.delivery > 0

  const breakEvenPerDay: AvailableFigure = result.breakEven.available
    ? { available: true, value: `${formatCount(result.breakEven.unitsPerDay)} ürün/gün` }
    : {
        available: false,
        message:
          result.breakEven.reason === 'no_sales_volume'
            ? UNAVAILABLE_COPY.breakEven.no_sales_volume
            : UNAVAILABLE_COPY.breakEven.non_positive_contribution,
      }

  const withoutCopy: Omit<DetailedView, 'copyText'> = {
    verdict: buildVerdict(result),
    monthlyOperatingResult: `${formatTry(base.monthlyOperatingResult)} TL`,
    breakEvenPerDay,
    breakEvenUnitsPerDay: result.breakEven.available
      ? `${formatCount(result.breakEven.unitsPerDay)} ürün`
      : null,
    breakEvenUnitsPerMonth: result.breakEven.available
      ? `${formatCount(result.breakEven.unitsPerMonth)} ürün`
      : null,
    payback: paybackText(result, 'base'),
    initialInvestment: `${formatTry(result.totalInitialInvestment)} TL`,
    plannedUnitsPerDay: `${formatCount(
      base.totalUnits / input.assumptions.operatingDaysPerMonth,
    )} ürün/gün`,
    horizonMonths: formatCount(result.meta.assumptions.projectionHorizonMonths),
    scenarios: buildScenarioRows(result),
    sectionEcho: buildSectionEcho(result),
    breakdown: buildBreakdown(base),
    channels: buildChannelRows(base),
    channelTotals: buildChannelTotals(base),
    projection: buildProjection(result),
    paybackChart: buildPaybackChart(result),
    monthRows: buildMonthRows(result),
    assumptions: buildAssumptionRows(result, hasDelivery),
    guardrails: collectGuardrails(input),
    hasDelivery,
    engineVersion: result.meta.detailedEngineVersion,
    reportInputs: buildReportInputGroups(input, result),
  }

  return { ...withoutCopy, copyText: buildCopyText(result, withoutCopy) }
}

export function evaluateDetailed(
  form: DetailedFormState,
  input: DetailedInput,
): DetailedEvaluation {
  const validation = validateDetailedInput(input)
  if (!validation.ok) {
    const { byPath, sections } = buildErrorMap(validation.errors, form)
    return { ok: false, errors: byPath, errorSections: sections }
  }
  return { ok: true, view: buildView(calculateDetailed(validation.input), validation.input) }
}

/** The section-header label for an echoed figure, or `null` when a section has none. */
export function echoLabel(section: SectionId): string | null {
  return SECTION_ECHO_LABELS[section] ?? null
}
