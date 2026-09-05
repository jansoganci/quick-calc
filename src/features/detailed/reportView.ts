import type {
  DetailedResolvedInput,
  DetailedResult,
  ResolvedCapexItem,
  ResolvedOpexLine,
  ResolvedPosition,
  ResolvedProduct,
} from '../../core/detailed/index.ts'
import { formatTry, formatTryExact } from '../../lib/money.ts'
import { formatCount } from '../../lib/number.ts'
import { formatPercent } from '../../lib/percent.ts'
import {
  CHANNEL_LABELS,
  CHANNEL_ORDER,
  COPY,
  DELIVERY_MODE_LABELS,
  PAYMENT_LABELS,
  PAYMENT_ORDER,
  POSITION_LABELS,
  PRODUCT_LABELS,
  RENT_BASIS_LABELS,
  REPORT_COPY,
  SECTION_ECHO_LABELS,
  SECTION_LABELS,
  type SectionId,
} from './labels.ts'

/**
 * The report's input appendix, and the two strings the print flow needs.
 *
 * A feasibility document that states conclusions without stating what was
 * assumed cannot be checked by the person receiving it, so the report restates
 * every input the calculation used. Two rules keep that honest:
 *
 * 1. **Values are the engine's resolved input**, not the raw strings the user
 *    typed. What the calculation used is what an auditor needs, and a default
 *    applied to a blank field becomes visible rather than staying silent.
 * 2. **Nothing here derives a figure.** Group totals are engine outputs read off
 *    the base stabilized month (`fixedFactor: 1`), never sums computed in this
 *    file — summing the lines would be a second source of truth for a financial
 *    figure (CLAUDE.md §3), and per-row derived figures are rejected outright by
 *    DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md §4.6.
 *
 * Formatting is entirely `lib/` — the same `tr-TR` helpers the screen uses. This
 * module must never format a figure itself; `reportGuards.test.ts` enforces it.
 *
 * DOM-free on purpose: `tsconfig.json` compiles it without the DOM lib, which is
 * also what lets it be tested in the `node` environment Vitest already runs.
 */

export type ReportInputRow = { label: string; value: string }
export type ReportInputTable = { columns: readonly string[]; rows: readonly (readonly string[])[] }

/**
 * A discriminated union rather than optional fields: `exactOptionalPropertyTypes`
 * is on, and a group is always exactly one of the two shapes.
 */
export type ReportInputContent =
  | { kind: 'rows'; rows: readonly ReportInputRow[] }
  | { kind: 'table'; table: ReportInputTable }

export type ReportInputGroup = {
  section: SectionId
  index: number
  title: string
  content: ReportInputContent
  /** An engine-published total, or `null` where the engine publishes none. */
  total: ReportInputRow | null
}

/** Monthly and total amounts follow the results: whole lira. */
function money(value: number): string {
  return `${formatTry(value)} TL`
}

/** Per-unit and per-order amounts keep their kuruş — `95,00 TL`, `1.500.000,50 TL`. */
function unitMoney(value: number): string {
  return `${formatTryExact(value, 2)} TL`
}

function productTable(products: readonly ResolvedProduct[], hasDelivery: boolean): ReportInputTable {
  const columns = hasDelivery
    ? [
        PRODUCT_LABELS.name,
        PRODUCT_LABELS.normalPrice,
        PRODUCT_LABELS.onlinePrice,
        PRODUCT_LABELS.dailyQuantity,
        PRODUCT_LABELS.unitProductCost,
      ]
    : [
        PRODUCT_LABELS.name,
        PRODUCT_LABELS.normalPrice,
        PRODUCT_LABELS.dailyQuantity,
        PRODUCT_LABELS.unitProductCost,
      ]

  const rows = products.map((product) =>
    hasDelivery
      ? [
          product.name,
          unitMoney(product.normalPrice),
          unitMoney(product.onlinePrice),
          formatCount(product.dailyQuantity),
          unitMoney(product.unitProductCost),
        ]
      : [
          product.name,
          unitMoney(product.normalPrice),
          formatCount(product.dailyQuantity),
          unitMoney(product.unitProductCost),
        ],
  )

  return { columns, rows }
}

function positionTable(positions: readonly ResolvedPosition[]): ReportInputTable {
  return {
    columns: [
      POSITION_LABELS.name,
      POSITION_LABELS.headcount,
      POSITION_LABELS.employerCostPerPerson,
      POSITION_LABELS.mealCostPerPerson,
      POSITION_LABELS.transportCostPerPerson,
      POSITION_LABELS.averageBonusPerPerson,
    ],
    rows: positions.map((position) => [
      position.name,
      formatCount(position.headcount),
      money(position.employerCostPerPerson),
      money(position.mealCostPerPerson),
      money(position.transportCostPerPerson),
      money(position.averageBonusPerPerson),
    ]),
  }
}

function lineTable(
  nameColumn: string,
  amountColumn: string,
  lines: readonly (ResolvedOpexLine | ResolvedCapexItem)[],
): ReportInputTable {
  return {
    columns: [nameColumn, amountColumn],
    rows: lines.map((line) => [
      line.name,
      money('monthlyAmount' in line ? line.monthlyAmount : line.amount),
    ]),
  }
}

/**
 * The appendix, in the order of the locked ten-section input IA
 * (DETAILED_FRONTEND_IMPLEMENTATION_SPEC.md §2), so it can be read beside the
 * form that produced it.
 *
 * Section 10 is deliberately absent: every assumption is already rendered, in
 * full and unconditionally, by the mandatory assumptions block (§4.7). Repeating
 * it here would invite two versions of the same fact.
 */
export function buildReportInputGroups(
  input: DetailedResolvedInput,
  result: DetailedResult,
): ReportInputGroup[] {
  const base = result.scenarios.base.stabilizedMonth
  const hasDelivery = input.channelMix.delivery > 0
  const groups: ReportInputGroup[] = []

  const push = (
    section: SectionId,
    content: ReportInputContent,
    total: ReportInputRow | null = null,
  ) => {
    groups.push({
      section,
      index: groups.length + 1,
      title: SECTION_LABELS[section],
      content,
      total,
    })
  }

  if (input.products.length > 0) {
    push('products', { kind: 'table', table: productTable(input.products, hasDelivery) })
  }

  push('channels', {
    kind: 'table',
    table: {
      columns: [COPY.channelColumn, COPY.mixShare, COPY.packagingPerOrder],
      rows: CHANNEL_ORDER.map((channel) => [
        CHANNEL_LABELS[channel],
        formatPercent(input.channelMix[channel]),
        channel === 'salon'
          ? COPY.none
          : unitMoney(
              channel === 'takeaway'
                ? input.packaging.takeawayPerOrder
                : input.packaging.deliveryPerOrder,
            ),
      ]),
    },
  })

  push('payments', {
    kind: 'table',
    table: {
      columns: [COPY.paymentColumn, COPY.mixShare, COPY.commission],
      rows: PAYMENT_ORDER.map((method) => [
        PAYMENT_LABELS[method],
        formatPercent(input.paymentMix[method]),
        method === 'cash'
          ? COPY.none
          : formatPercent(
              method === 'card' ? input.posCommissionRate : input.mealCardCommissionRate,
            ),
      ]),
    },
  })

  if (hasDelivery) {
    push('delivery', {
      kind: 'rows',
      rows: [
        { label: COPY.deliveryModeLabel, value: DELIVERY_MODE_LABELS[input.delivery.mode] },
        { label: COPY.platformFeeRate, value: formatPercent(input.delivery.platformFeeRate) },
        {
          label: COPY.ownCourierCost,
          value: unitMoney(input.delivery.ownCourierCostPerDeliveryOrder),
        },
      ],
    })
  }

  if (input.positions.length > 0) {
    push('positions', { kind: 'table', table: positionTable(input.positions) }, {
      label: SECTION_ECHO_LABELS.positions ?? SECTION_LABELS.positions,
      value: money(base.monthlyPayroll),
    })
  }

  push(
    'owner',
    {
      kind: 'rows',
      rows: [
        { label: COPY.ownerMonthlyAmount, value: money(input.owner.monthlyAmount) },
        { label: COPY.ownerBagKur, value: money(input.owner.bagKurMonthlyCost) },
      ],
    },
    {
      label: SECTION_ECHO_LABELS.owner ?? SECTION_LABELS.owner,
      value: money(base.monthlyOwnerCost),
    },
  )

  push(
    'occupancy',
    {
      kind: 'rows',
      rows: [
        { label: COPY.monthlyRent, value: money(input.occupancy.monthlyRent) },
        {
          label: COPY.rentBasisGroup,
          value: RENT_BASIS_LABELS[input.occupancy.rentInputBasis],
        },
        { label: COPY.monthlyAidat, value: money(input.occupancy.monthlyAidat) },
        { label: COPY.rentWithholdingRate, value: formatPercent(input.rentWithholdingRate) },
      ],
    },
    {
      label: SECTION_ECHO_LABELS.occupancy ?? SECTION_LABELS.occupancy,
      value: money(base.monthlyOccupancyCost),
    },
  )

  if (input.opexLines.length > 0) {
    push(
      'opex',
      { kind: 'table', table: lineTable(COPY.lineName, COPY.monthlyAmount, input.opexLines) },
      {
        label: SECTION_ECHO_LABELS.opex ?? SECTION_LABELS.opex,
        value: money(base.monthlyOpex),
      },
    )
  }

  if (input.capexItems.length > 0) {
    push(
      'capex',
      { kind: 'table', table: lineTable(COPY.capexName, COPY.capexAmount, input.capexItems) },
      {
        label: SECTION_ECHO_LABELS.capex ?? SECTION_LABELS.capex,
        value: money(result.totalInitialInvestment),
      },
    )
  }

  return groups
}

/** `5 Eylül 2026` — the date on the cover. */
export function formatReportDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/** `05.09.2026` — the date inside the filename, where a long month would be noise. */
export function formatReportFileDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR').format(date)
}

/**
 * Turkish characters are kept — every platform this report is saved on accepts
 * them. Only the characters a file system refuses are removed.
 */
export function sanitizeBusinessName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
}

/**
 * The browser takes its suggested "Save as PDF" filename from `document.title`,
 * which is the whole of the filename mechanism — no dependency, no download
 * shim (plan T-14).
 */
export function reportDocumentTitle(businessName: string, date: Date): string {
  const name = sanitizeBusinessName(businessName)
  const stamp = formatReportFileDate(date)
  return name === ''
    ? `${REPORT_COPY.documentTitle} — ${stamp}`
    : `${REPORT_COPY.documentTitle} — ${name} — ${stamp}`
}

/** The dialog's gate: a name of only whitespace is not a name. */
export function isValidBusinessName(name: string): boolean {
  return name.trim().length > 0
}
