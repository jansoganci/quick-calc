import type { MonthResult } from '../../core/detailed/index.ts'
import { formatTry } from '../../lib/money.ts'
import { AKIS_COPY, AKIS_STEP_LABELS, type AkisStepKey } from './labels.ts'

/**
 * Akış (DF-85, funnel): the base-scenario stabilized month read top to bottom
 * as a funnel. Every amount that leaves the funnel is a `MonthResult` field.
 * The amount left after each step is an engine field too, except after
 * personel, kira ve aidat and diğer giderler: those three are the previous
 * remainder minus that step's engine amount, a display identity recorded in
 * DETAILED_FINANCIAL_SPEC.md Appendix E.8. The last remainder is the engine's
 * `monthlyOperatingResult`. Widths and clip paths are visual only.
 */

export type AkisProduct = {
  productId: string
  name: string
  unitsFormatted: string
  grossFormatted: string
  /** Share of brüt ciro, 0–100. Visual only. */
  widthPercent: number
  /** Index into the component's fixed list of bar tones. */
  tone: number
}

export type AkisStep = {
  key: AkisStepKey
  label: string
  explain: string
  /** Where the amount comes from, in the owner's words. Null when there is nothing to add. */
  detail: string | null
  /** Engine amount that leaves the funnel at this step. */
  out: number
  outFormatted: string
  /** Amount left after this step. */
  remaining: number
  remainingFormatted: string
  /** CSS clip-path for the funnel band: top edge = remainder before this step, bottom = after. */
  clipPath: string
  /** The band is too narrow to hold its label inside. */
  isNarrow: boolean
  isLast: boolean
}

export type AkisView = {
  grossSales: number
  grossSalesFormatted: string
  operatingDaysFormatted: string
  products: AkisProduct[]
  steps: AkisStep[]
  result: number
  resultFormatted: string
  isLoss: boolean
  hasSales: boolean
}

const TONE_COUNT = 4
/** Below this share of brüt ciro the band's label moves outside, in ink. */
const NARROW_PERCENT = 22

function money(value: number): string {
  return `${formatTry(value)} TL`
}

function shareOf(value: number, gross: number): number {
  if (!(gross > 0)) return 0
  return Math.min(100, Math.max(0, (value / gross) * 100))
}

function clipBetween(topPercent: number, bottomPercent: number): string {
  const top = (100 - topPercent) / 2
  const bottom = (100 - bottomPercent) / 2
  return `polygon(${top.toFixed(2)}% 0, ${(100 - top).toFixed(2)}% 0, ${(100 - bottom).toFixed(2)}% 100%, ${bottom.toFixed(2)}% 100%)`
}

type StepSpec = {
  key: AkisStepKey
  out: (m: MonthResult) => number
  /** Engine remainder after this step; omitted where Appendix E.8 applies. */
  remaining?: (m: MonthResult) => number
  detail?: (m: MonthResult) => string | null
}

const STEPS: readonly StepSpec[] = [
  { key: 'vat', out: (m) => m.vatAmount, remaining: (m) => m.netRevenue },
  {
    key: 'productCogs',
    out: (m) => m.productCogs,
    remaining: (m) => m.grossProfitBeforeChannel,
    detail: () => AKIS_COPY.details.productCogs,
  },
  {
    key: 'channelCost',
    out: (m) => m.channelCost,
    remaining: (m) => m.totalContribution,
    detail: (m) => AKIS_COPY.details.channelCost(money(m.paymentPlatformFee), money(m.channelVariableCost)),
  },
  {
    key: 'payroll',
    out: (m) => m.monthlyPayroll,
    detail: (m) => (m.monthlyPayroll === 0 ? AKIS_COPY.details.payrollMissing : null),
  },
  {
    key: 'occupancy',
    out: (m) => m.monthlyOccupancyCost,
    detail: (m) => AKIS_COPY.details.occupancy(money(m.rentCost), money(m.monthlyAidat)),
  },
  { key: 'opex', out: (m) => m.monthlyOpex },
  {
    key: 'owner',
    out: (m) => m.monthlyOwnerCost,
    remaining: (m) => m.monthlyOperatingResult,
    detail: (m) => AKIS_COPY.details.owner(money(m.monthlyOwnerDraw), money(m.monthlyBagKur)),
  },
]

export function buildAkisView(month: MonthResult, operatingDaysPerMonth: number): AkisView {
  const gross = month.grossCustomerSales

  let before = gross
  const steps = STEPS.map((spec, index): AkisStep => {
    const out = spec.out(month)
    // Appendix E.8: previous remainder minus this step's engine amount.
    const remaining = spec.remaining ? spec.remaining(month) : before - out
    const topPercent = shareOf(before, gross)
    const bottomPercent = shareOf(remaining, gross)
    before = remaining
    return {
      key: spec.key,
      label: AKIS_STEP_LABELS[spec.key].label,
      explain: AKIS_STEP_LABELS[spec.key].explain,
      detail: spec.detail ? spec.detail(month) : null,
      out,
      outFormatted: `− ${money(out)}`,
      remaining,
      remainingFormatted: money(remaining),
      clipPath: clipBetween(topPercent, bottomPercent),
      isNarrow: bottomPercent < NARROW_PERCENT,
      isLast: index === STEPS.length - 1,
    }
  })

  return {
    grossSales: gross,
    grossSalesFormatted: money(gross),
    operatingDaysFormatted: formatTry(operatingDaysPerMonth),
    products: month.byProduct.map((line, index) => ({
      productId: line.productId,
      name: line.name,
      unitsFormatted: formatTry(line.units),
      grossFormatted: money(line.grossCustomerSales),
      widthPercent: shareOf(line.grossCustomerSales, gross),
      tone: index % TONE_COUNT,
    })),
    steps,
    result: month.monthlyOperatingResult,
    resultFormatted: money(month.monthlyOperatingResult),
    isLoss: month.monthlyOperatingResult < 0,
    hasSales: gross > 0,
  }
}
