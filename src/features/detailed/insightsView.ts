import {
  applyJanuaryTest,
  buildFixedCostDays,
  buildSalonMenuEconomics,
  type BreakEvenResult,
  type DetailedResolvedInput,
  type FixedCostDayKey,
  type FixedCostDays,
  type MonthResult,
} from '../../core/detailed/index.ts'
import { formatTry } from '../../lib/money.ts'
import { formatCount, formatDecimalExact, parseTurkishNumber } from '../../lib/number.ts'
import { formatPercent } from '../../lib/percent.ts'
import { COPY, UNAVAILABLE_COPY } from './labels.ts'

/**
 * Appendix B display mapping. Formulas stay in `src/core/detailed`; this file
 * formats those helpers for the results area.
 */

export type SalonMenuRow = {
  productId: string
  name: string
  sellingPrice: string
  unitProductCost: string
  foodCostRate: string
  remainingPerUnit: string
  isWeakest: boolean
}

export type SalonMenuView = {
  products: SalonMenuRow[]
  weakestNote: string | null
}

export type FixedCostDaysView = {
  available: boolean
  note: string
  lines: string[]
  unavailableMessage: string | null
  coversMonth: boolean
}

export type JanuaryBasis = {
  month: MonthResult
  breakEven: BreakEvenResult
  operatingDaysPerMonth: number
}

export type JanuaryPreview = {
  wageInvalid: boolean
  rentInvalid: boolean
  monthlyOperatingResult: string
  breakEvenValue: string | null
  breakEvenMessage: string | null
  days: FixedCostDaysView
}

const DAY_LABELS: Record<FixedCostDayKey, string> = {
  rent: COPY.fixedCostDayRent,
  payroll: COPY.fixedCostDayPayroll,
  other: COPY.fixedCostDayOther,
}

/** One-decimal display; 0,0 is empty and stays hidden. */
function displaysAsDay(days: number): boolean {
  return Number.isFinite(days) && Math.round(days * 10) !== 0
}

function formatDayCount(days: number): string {
  return formatDecimalExact(days, 1)
}

export function buildSalonMenuView(input: DetailedResolvedInput): SalonMenuView {
  const menu = buildSalonMenuEconomics(input)
  const products = menu.products.map((row) => ({
    productId: row.productId,
    name: row.name,
    sellingPrice: formatTry(row.sellingPrice),
    unitProductCost: formatTry(row.unitProductCost),
    foodCostRate: row.foodCostRate === null ? COPY.none : formatPercent(row.foodCostRate),
    remainingPerUnit: formatTry(row.remainingPerUnit),
    isWeakest: menu.weakestProductId === row.productId,
  }))
  const weakest = products.find((row) => row.isWeakest)
  return {
    products,
    weakestNote: weakest ? COPY.weakestProductNote(weakest.name) : null,
  }
}

export function formatFixedCostDays(
  days: FixedCostDays,
  operatingDaysPerMonth: number,
): FixedCostDaysView {
  const note = COPY.fixedCostDaysNote(formatCount(operatingDaysPerMonth))
  if (!days.available) {
    return {
      available: false,
      note,
      lines: [],
      unavailableMessage: COPY.fixedCostDaysUnavailable,
      coversMonth: false,
    }
  }

  const shown = days.buckets.filter((bucket) => displaysAsDay(bucket.days))
  const remainder =
    days.operatingDaysPerMonth - shown.reduce((sum, bucket) => sum + bucket.days, 0)

  const lines: string[] = []
  shown.forEach((bucket, index) => {
    const count = formatDayCount(bucket.days)
    const label = DAY_LABELS[bucket.key]
    lines.push(
      index === 0
        ? COPY.fixedCostDaysFirst(count, label)
        : COPY.fixedCostDaysNext(count, label),
    )
  })
  if (remainder < 0) {
    lines.push(COPY.fixedCostDaysUncovered)
  } else if (!displaysAsDay(remainder)) {
    lines.push(COPY.fixedCostDaysRemainderNone)
  } else {
    lines.push(COPY.fixedCostDaysRemainder(formatDayCount(remainder)))
  }

  return {
    available: true,
    note,
    lines,
    unavailableMessage: null,
    coversMonth: remainder >= 0,
  }
}

export function buildFixedCostDaysView(
  month: MonthResult,
  operatingDaysPerMonth: number,
): FixedCostDaysView {
  return formatFixedCostDays(buildFixedCostDays(month, operatingDaysPerMonth), operatingDaysPerMonth)
}

function parseIncreaseRate(raw: string): { rate: number; invalid: boolean } {
  const parsed = parseTurkishNumber(raw)
  if (parsed.status === 'empty') return { rate: 0, invalid: false }
  if (parsed.status === 'invalid') return { rate: 0, invalid: true }
  return { rate: parsed.value / 100, invalid: false }
}

function formatBreakEven(result: BreakEvenResult): {
  breakEvenValue: string | null
  breakEvenMessage: string | null
} {
  if (result.available) {
    return {
      breakEvenValue: `${formatCount(result.unitsPerDay)} ürün/gün`,
      breakEvenMessage: null,
    }
  }
  return {
    breakEvenValue: null,
    breakEvenMessage:
      result.reason === 'no_sales_volume'
        ? UNAVAILABLE_COPY.breakEven.no_sales_volume
        : UNAVAILABLE_COPY.breakEven.non_positive_contribution,
  }
}

export function previewJanuary(
  basis: JanuaryBasis,
  wageText: string,
  rentText: string,
): JanuaryPreview {
  const wage = parseIncreaseRate(wageText)
  const rent = parseIncreaseRate(rentText)
  const next = applyJanuaryTest(basis.month, basis.breakEven, basis.operatingDaysPerMonth, {
    wageIncreaseRate: wage.rate,
    rentIncreaseRate: rent.rate,
  })
  const breakEven = formatBreakEven(next.breakEven)
  return {
    wageInvalid: wage.invalid,
    rentInvalid: rent.invalid,
    monthlyOperatingResult: `${formatTry(next.monthlyOperatingResult)} TL`,
    breakEvenValue: breakEven.breakEvenValue,
    breakEvenMessage: breakEven.breakEvenMessage,
    days: formatFixedCostDays(next.days, basis.operatingDaysPerMonth),
  }
}
