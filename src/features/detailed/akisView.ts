import type { MonthResult } from '../../core/detailed/index.ts'
import { formatTry } from '../../lib/money.ts'
import { AKIS_COPY, AKIS_ROW_LABELS, type AkisRowKey } from './labels.ts'

/**
 * Akış (DF-85 D1): the base-scenario stabilized month as a top-to-bottom
 * waterfall. Pure mapping — every amount is a `MonthResult` field the engine
 * already computed; this module adds, subtracts and recomputes nothing.
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
  /** Soft note: no personnel cost entered. */
  isPayrollMissing: boolean
}

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
      }
    }),
    isPayrollMissing: month.monthlyPayroll === 0,
  }
}
