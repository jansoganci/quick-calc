import type { Channel, MonthResult } from '../../core/detailed/index.ts'
import { formatTry } from '../../lib/money.ts'
import { formatPercent } from '../../lib/percent.ts'
import { AKIS_COPY, AKIS_ROW_LABELS, type AkisRowKey } from './labels.ts'

/**
 * Akış (DF-85 D1): the base-scenario stabilized month as a top-to-bottom
 * waterfall. Every row amount is a `MonthResult` field. Two display-only
 * extras sit beside that mapping and are not engine formulas: the operating
 * share (Appendix E.7) and the reference delta (current amount − snapshot).
 *
 * - `subtotal`: a running figure (brüt ciro, net satış, brüt kâr).
 * - `deduction`: taken off the running figure on the way down.
 * - `detail`: a component of the deduction above it, shown for reading only.
 * - `result`: the engine's `monthlyOperatingResult`.
 */
export type AkisRowKind = 'subtotal' | 'deduction' | 'detail' | 'result'

export type AkisRow = {
  key: AkisRowKey
  kind: AkisRowKind
  /** Indented under the row above it (kanal sub-lines, aidat under kira). */
  nested: boolean
  label: string
  /** Raw engine value, positive for costs. */
  amount: number
  amountFormatted: string
  hint: string | null
  /** Current amount minus the reference snapshot. Null when there is no snapshot or the shown TL does not move. */
  delta: number | null
  deltaFormatted: string | null
}

export type AkisChannelChip = {
  channel: Channel
  label: string
  grossFormatted: string
}

export type AkisProduct = {
  productId: string
  name: string
  amountFormatted: string
}

export type AkisView = {
  /** Brüt ciro per product (`byProduct[].grossCustomerSales`), in input order. */
  products: AkisProduct[]
  rows: AkisRow[]
  /** Brüt ciro per channel (`byChannel[channel].grossCustomerSales`). */
  channels: AkisChannelChip[]
  /** `monthlyOperatingResult / netRevenue`. Null when net satış is not positive. Display only (E.7). */
  operatingShare: number | null
  operatingShareFormatted: string | null
  /** Soft note: no personnel cost entered. */
  isPayrollMissing: boolean
}

export type AkisSnapshot = Record<AkisRowKey, number>

const CHANNELS = ['salon', 'takeaway', 'delivery'] as const satisfies readonly Channel[]

type RowSpec = {
  key: AkisRowKey
  kind: AkisRowKind
  nested?: boolean
  pick: (month: MonthResult) => number
  hint?: string
}

const ROWS: readonly RowSpec[] = [
  { key: 'grossSales', kind: 'subtotal', pick: (m) => m.grossCustomerSales, hint: AKIS_COPY.hints.grossSales },
  { key: 'vat', kind: 'deduction', pick: (m) => m.vatAmount },
  { key: 'netSales', kind: 'subtotal', pick: (m) => m.netRevenue },
  { key: 'productCogs', kind: 'deduction', pick: (m) => m.productCogs },
  { key: 'grossProfit', kind: 'subtotal', pick: (m) => m.grossProfitBeforeChannel },
  { key: 'channelCost', kind: 'deduction', pick: (m) => m.channelCost, hint: AKIS_COPY.hints.channelCost },
  { key: 'channelVariableCost', kind: 'detail', nested: true, pick: (m) => m.channelVariableCost },
  { key: 'paymentPlatformFee', kind: 'detail', nested: true, pick: (m) => m.paymentPlatformFee },
  { key: 'payroll', kind: 'deduction', pick: (m) => m.monthlyPayroll },
  { key: 'rent', kind: 'deduction', pick: (m) => m.rentCost },
  { key: 'aidat', kind: 'deduction', nested: true, pick: (m) => m.monthlyAidat },
  { key: 'opex', kind: 'deduction', pick: (m) => m.monthlyOpex },
  { key: 'ownerDraw', kind: 'deduction', pick: (m) => m.monthlyOwnerDraw },
  { key: 'bagKur', kind: 'deduction', pick: (m) => m.monthlyBagKur },
  { key: 'operatingResult', kind: 'result', pick: (m) => m.monthlyOperatingResult },
]

function formatAmount(kind: AkisRowKind, amount: number): string {
  const text = `${formatTry(amount)} TL`
  return kind === 'deduction' ? `− ${text}` : text
}

export function buildAkisView(month: MonthResult): AkisView {
  const share = operatingShareOf(month)
  return {
    products: month.byProduct.map((line) => ({
      productId: line.productId,
      name: line.name,
      amountFormatted: `${formatTry(line.grossCustomerSales)} TL`,
    })),
    rows: ROWS.map((spec) => {
      const amount = spec.pick(month)
      return {
        key: spec.key,
        kind: spec.kind,
        nested: spec.nested ?? false,
        label: AKIS_ROW_LABELS[spec.key],
        amount,
        amountFormatted: formatAmount(spec.kind, amount),
        hint: spec.hint ?? null,
        delta: null,
        deltaFormatted: null,
      }
    }),
    channels: CHANNELS.map((channel) => ({
      channel,
      label: AKIS_COPY.channels[channel],
      grossFormatted: `${formatTry(month.byChannel[channel].grossCustomerSales)} TL`,
    })),
    operatingShare: share,
    operatingShareFormatted: share === null ? null : AKIS_COPY.shareOfNet(formatPercent(share)),
    isPayrollMissing: month.monthlyPayroll === 0,
  }
}

function operatingShareOf(month: MonthResult): number | null {
  if (month.netRevenue <= 0) return null
  return month.monthlyOperatingResult / month.netRevenue
}

/** Row amounts at one moment. Display state only — never written into the draft. */
export function snapshotAkis(akis: AkisView): AkisSnapshot {
  const snapshot = {} as AkisSnapshot
  for (const row of akis.rows) snapshot[row.key] = row.amount
  return snapshot
}

/**
 * Delta is the current engine amount minus the snapshot amount.
 * Null when there is no snapshot, or when formatting both to whole TL
 * shows the same figure (|delta| under 0.5 TL after that rounding).
 */
export function withDeltas(akis: AkisView, snapshot: AkisSnapshot | null): AkisView {
  if (snapshot === null) return akis
  return {
    ...akis,
    rows: akis.rows.map((row) => {
      const delta = row.amount - snapshot[row.key]
      if (formatTry(row.amount) === formatTry(snapshot[row.key])) {
        return { ...row, delta: null, deltaFormatted: null }
      }
      const arrow = delta > 0 ? '▲' : '▼'
      return {
        ...row,
        delta,
        deltaFormatted: `${arrow} ${formatTry(Math.abs(delta))} TL`,
      }
    }),
  }
}

/** Keys whose raw amounts moved. Used to flash those rows. */
export function changedRowKeys(prevAmounts: AkisSnapshot, nextAmounts: AkisSnapshot): AkisRowKey[] {
  return (Object.keys(nextAmounts) as AkisRowKey[]).filter(
    (key) => prevAmounts[key] !== nextAmounts[key],
  )
}
