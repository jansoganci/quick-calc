import { describe, expect, it } from 'vitest'
import type { MonthResult } from '../../core/detailed/index.ts'
// Test fixture only (not on the engine barrel by design).
import { goldenRawInput } from '../../core/detailed/goldenVector.ts'
import { formatTry } from '../../lib/money.ts'
import { initialForm } from './formState.ts'
import { COPY } from './labels.ts'
import { evaluateDetailed } from './viewModel.ts'

// DF-85 D1: each Akış line is one engine field, in this order.
const LINES: ReadonlyArray<[string, keyof MonthResult, 'start' | 'minus' | 'subtotal' | 'result']> = [
  [COPY.akisGross, 'grossCustomerSales', 'start'],
  [COPY.akisVat, 'vatAmount', 'minus'],
  [COPY.akisNet, 'netRevenue', 'subtotal'],
  [COPY.akisProductCost, 'productCogs', 'minus'],
  [COPY.akisGrossProfit, 'grossProfitBeforeChannel', 'subtotal'],
  [COPY.akisChannel, 'channelCost', 'minus'],
  [COPY.akisPayroll, 'monthlyPayroll', 'minus'],
  [COPY.akisRent, 'rentCost', 'minus'],
  [COPY.akisAidat, 'monthlyAidat', 'minus'],
  [COPY.akisOpex, 'monthlyOpex', 'minus'],
  [COPY.akisOwner, 'monthlyOwnerDraw', 'minus'],
  [COPY.akisBagKur, 'monthlyBagKur', 'minus'],
  [COPY.akisResult, 'monthlyOperatingResult', 'result'],
]

function goldenView() {
  // The form is only read for error mapping; the golden input is valid.
  const evaluation = evaluateDetailed(initialForm(), goldenRawInput())
  if (!evaluation.ok) throw new Error('golden input must be valid')
  return evaluation.view
}

describe('Akış flow lines', () => {
  const view = goldenView()
  const month = view.januaryBasis.month

  it('prints the thirteen engine fields in order, each formatted once', () => {
    expect(view.flow.map((line) => line.label)).toEqual(LINES.map(([label]) => label))
    view.flow.forEach((line, index) => {
      const field = LINES[index]![1]
      expect(line.amount).toBe(`${formatTry(month[field] as number)} TL`)
    })
    expect(view.flow.filter((line) => line.emphasis).map((line) => line.label)).toEqual([
      COPY.akisResult,
    ])
  })

  it('reconciles top to bottom to the golden operating result', () => {
    let running = 0
    for (const [, field, kind] of LINES) {
      const value = month[field] as number
      if (kind === 'start') running = value
      if (kind === 'minus') running -= value
      if (kind === 'subtotal' || kind === 'result') {
        expect(Math.abs(running - value)).toBeLessThanOrEqual(1e-6)
        running = value
      }
    }
    expect(running).toBeCloseTo(261_145.6495, 4)
  })
})
