import { describe, expect, it } from 'vitest'
import {
  calculateDetailed,
  validateDetailedInput,
  type DetailedInput,
  type MonthResult,
} from '../../core/detailed/index.ts'
// Test fixture only (not on the engine barrel by design).
import { goldenRawInput } from '../../core/detailed/goldenVector.ts'
import { formatTry } from '../../lib/money.ts'
import { buildAkisView, changedRowKeys, snapshotAkis, withDeltas, type AkisRow } from './akisView.ts'
import { AKIS_COPY, AKIS_ROW_LABELS, type AkisRowKey } from './labels.ts'

const TOLERANCE = 1e-6

function baseMonth(raw: DetailedInput): MonthResult {
  const validated = validateDetailedInput(raw)
  if (!validated.ok) throw new Error(`fixture must be valid: ${JSON.stringify(validated.errors)}`)
  return calculateDetailed(validated.input).scenarios.base.stabilizedMonth
}

const FIELD_OF: Record<AkisRowKey, keyof MonthResult> = {
  grossSales: 'grossCustomerSales',
  vat: 'vatAmount',
  netSales: 'netRevenue',
  productCogs: 'productCogs',
  grossProfit: 'grossProfitBeforeChannel',
  channelCost: 'channelCost',
  channelVariableCost: 'channelVariableCost',
  paymentPlatformFee: 'paymentPlatformFee',
  payroll: 'monthlyPayroll',
  rent: 'rentCost',
  aidat: 'monthlyAidat',
  opex: 'monthlyOpex',
  ownerDraw: 'monthlyOwnerDraw',
  bagKur: 'monthlyBagKur',
  operatingResult: 'monthlyOperatingResult',
}

function rowOf(rows: AkisRow[], key: AkisRowKey): AkisRow {
  const row = rows.find((candidate) => candidate.key === key)
  if (!row) throw new Error(`missing row ${key}`)
  return row
}

describe('buildAkisView', () => {
  const month = baseMonth(goldenRawInput())
  const view = buildAkisView(month)

  it('lists the DF-85 steps in order, each with its label', () => {
    expect(view.rows.map((row) => row.key)).toEqual(Object.keys(FIELD_OF))
    for (const row of view.rows) expect(row.label).toBe(AKIS_ROW_LABELS[row.key])
  })

  it('shows each row as exactly its MonthResult field (no arithmetic of its own)', () => {
    for (const row of view.rows) expect(row.amount).toBe(month[FIELD_OF[row.key]])
  })

  it('reconciles top to bottom to monthlyOperatingResult on the golden input', () => {
    // Walk the waterfall: each subtotal and the result must equal the running figure.
    let running = 0
    for (const row of view.rows) {
      if (row.kind === 'deduction') running -= row.amount
      if (row.kind === 'subtotal' || row.kind === 'result') {
        if (row.key !== 'grossSales') {
          expect(Math.abs(running - row.amount)).toBeLessThanOrEqual(TOLERANCE)
        }
        running = row.amount
      }
    }
    expect(Math.abs(running - month.monthlyOperatingResult)).toBeLessThanOrEqual(TOLERANCE)
    // The golden vector does not move (DF-85).
    expect(rowOf(view.rows, 'operatingResult').amount).toBeCloseTo(261_145.6495, 4)
  })

  it('channel detail lines add up to the channel deduction', () => {
    const detail =
      rowOf(view.rows, 'channelVariableCost').amount + rowOf(view.rows, 'paymentPlatformFee').amount
    expect(Math.abs(detail - rowOf(view.rows, 'channelCost').amount)).toBeLessThanOrEqual(TOLERANCE)
  })

  it('lists brüt ciro per product in input order', () => {
    expect(view.products.map((product) => product.productId)).toEqual(
      month.byProduct.map((line) => line.productId),
    )
  })

  it('carries the two hints and flags missing payroll only when it is 0', () => {
    expect(rowOf(view.rows, 'grossSales').hint).toBe(AKIS_COPY.hints.grossSales)
    expect(rowOf(view.rows, 'channelCost').hint).toBe(AKIS_COPY.hints.channelCost)
    expect(view.isPayrollMissing).toBe(month.monthlyPayroll === 0)
    expect(buildAkisView({ ...month, monthlyPayroll: 0 }).isPayrollMissing).toBe(true)
  })

  it('shows each channel chip as that channel’s brüt ciro', () => {
    for (const chip of view.channels) {
      expect(chip.grossFormatted).toBe(`${formatTry(month.byChannel[chip.channel].grossCustomerSales)} TL`)
    }
  })

  it('shows the operating share as result ÷ net, and blank when net satış is not positive', () => {
    expect(view.operatingShare).toBeCloseTo(month.monthlyOperatingResult / month.netRevenue, 10)
    const none = buildAkisView({ ...month, netRevenue: 0 })
    expect(none.operatingShare).toBeNull()
    expect(none.operatingShareFormatted).toBeNull()
  })
})

function monthAmount(month: MonthResult, key: AkisRowKey): number {
  const value = month[FIELD_OF[key]]
  if (typeof value !== 'number') throw new Error(`expected a number for ${key}`)
  return value
}

function withFirstPriceRaised(raw: DetailedInput): DetailedInput {
  const products = Array.isArray(raw.products) ? raw.products : []
  const first = products[0]
  if (!first || typeof first !== 'object' || !('normalPrice' in first) || typeof first.normalPrice !== 'number') {
    throw new Error('golden fixture has a priced product')
  }
  return {
    ...raw,
    products: [{ ...first, normalPrice: first.normalPrice + 10 }, ...products.slice(1)],
  }
}

describe('withDeltas', () => {
  const before = baseMonth(goldenRawInput())
  const after = baseMonth(withFirstPriceRaised(goldenRawInput()))

  it('leaves every delta null when there is no snapshot', () => {
    for (const row of withDeltas(buildAkisView(after), null).rows) {
      expect(row.delta).toBeNull()
      expect(row.deltaFormatted).toBeNull()
    }
  })

  it('sets each row delta to the change in its MonthResult field', () => {
    const next = withDeltas(buildAkisView(after), snapshotAkis(buildAkisView(before)))
    for (const row of next.rows) {
      const change = monthAmount(after, row.key) - monthAmount(before, row.key)
      if (formatTry(monthAmount(after, row.key)) === formatTry(monthAmount(before, row.key))) {
        expect(row.delta).toBeNull()
      } else {
        expect(row.delta).toBeCloseTo(change, 6)
        expect(row.deltaFormatted).toBe(`${change > 0 ? '▲' : '▼'} ${formatTry(Math.abs(change))} TL`)
      }
    }
  })

  it('reports only the keys whose amounts moved', () => {
    const prev = snapshotAkis(buildAkisView(before))
    const next = snapshotAkis(buildAkisView(after))
    const keys = changedRowKeys(prev, next)
    for (const key of Object.keys(FIELD_OF) as AkisRowKey[]) {
      const moved = monthAmount(before, key) !== monthAmount(after, key)
      expect(keys.includes(key)).toBe(moved)
    }
  })
})

describe('Akış product summary line', () => {
  it('leaves out blank parts and is empty when both are blank', () => {
    expect(AKIS_COPY.productSummary('80', '140')).toBe('80 adet/gün · 140 TL')
    expect(AKIS_COPY.productSummary('', '140')).toBe('140 TL')
    expect(AKIS_COPY.productSummary('80', ' ')).toBe('80 adet/gün')
    expect(AKIS_COPY.productSummary('', '')).toBe('')
  })
})
