import { describe, expect, it } from 'vitest'
import {
  calculateDetailed,
  validateDetailedInput,
  type DetailedInput,
  type MonthResult,
} from '../../core/detailed/index.ts'
// Test fixture only (not on the engine barrel by design).
import { goldenRawInput } from '../../core/detailed/goldenVector.ts'
import { buildAkisView, type AkisStep } from './akisView.ts'
import { AKIS_COPY, AKIS_STEP_LABELS, type AkisStepKey } from './labels.ts'

const TOLERANCE = 1e-6
const DAYS = 30

function baseMonth(raw: DetailedInput): MonthResult {
  const validated = validateDetailedInput(raw)
  if (!validated.ok) throw new Error(`fixture must be valid: ${JSON.stringify(validated.errors)}`)
  return calculateDetailed(validated.input).scenarios.base.stabilizedMonth
}

/** The engine field that leaves the funnel at each step, in order. */
const OUT_FIELD: Record<AkisStepKey, keyof MonthResult> = {
  vat: 'vatAmount',
  productCogs: 'productCogs',
  channelCost: 'channelCost',
  payroll: 'monthlyPayroll',
  occupancy: 'monthlyOccupancyCost',
  opex: 'monthlyOpex',
  owner: 'monthlyOwnerCost',
}

function stepOf(steps: AkisStep[], key: AkisStepKey): AkisStep {
  const step = steps.find((candidate) => candidate.key === key)
  if (!step) throw new Error(`missing step ${key}`)
  return step
}

describe('buildAkisView (funnel)', () => {
  const month = baseMonth(goldenRawInput())
  const view = buildAkisView(month, DAYS)

  it('lists the seven steps in funnel order with their labels', () => {
    expect(view.steps.map((step) => step.key)).toEqual(Object.keys(OUT_FIELD))
    for (const step of view.steps) expect(step.label).toBe(AKIS_STEP_LABELS[step.key].label)
    expect(view.steps.filter((step) => step.isLast).map((step) => step.key)).toEqual(['owner'])
  })

  it('takes every outflow straight from its MonthResult field', () => {
    for (const step of view.steps) expect(step.out).toBe(month[OUT_FIELD[step.key]])
  })

  it('uses the engine remainder wherever the engine has one', () => {
    expect(view.grossSales).toBe(month.grossCustomerSales)
    expect(stepOf(view.steps, 'vat').remaining).toBe(month.netRevenue)
    expect(stepOf(view.steps, 'productCogs').remaining).toBe(month.grossProfitBeforeChannel)
    expect(stepOf(view.steps, 'channelCost').remaining).toBe(month.totalContribution)
    expect(stepOf(view.steps, 'owner').remaining).toBe(month.monthlyOperatingResult)
    expect(view.result).toBe(month.monthlyOperatingResult)
  })

  it('reconciles top to bottom: each remainder is the one above minus its outflow (E.8)', () => {
    let before = view.grossSales
    for (const step of view.steps) {
      expect(Math.abs(before - step.out - step.remaining)).toBeLessThanOrEqual(TOLERANCE)
      before = step.remaining
    }
    expect(Math.abs(before - month.monthlyOperatingResult)).toBeLessThanOrEqual(TOLERANCE)
    // The golden vector does not move (DF-85).
    expect(view.result).toBeCloseTo(261_145.6495, 4)
  })

  it('narrows the funnel: each band starts where the one above ended', () => {
    const edges = view.steps.map((step) => step.clipPath.match(/[\d.]+%/g) ?? [])
    expect(edges[0]?.[0]).toBe('0.00%')
    for (let index = 1; index < edges.length; index += 1) {
      // Top-left inset of this band equals bottom-left inset of the previous band.
      expect(edges[index]?.[0]).toBe(edges[index - 1]?.[4])
    }
  })

  it('lists products with their monthly units and brüt, in input order', () => {
    expect(view.products.map((product) => product.productId)).toEqual(
      month.byProduct.map((line) => line.productId),
    )
    const total = view.products.reduce((sum, product) => sum + product.widthPercent, 0)
    expect(total).toBeCloseTo(100, 6)
    expect(view.operatingDaysFormatted).toBe('30')
  })

  it('names where each amount comes from using engine parts only', () => {
    expect(stepOf(view.steps, 'occupancy').detail).toContain('aidat')
    expect(stepOf(view.steps, 'owner').detail).toContain('Bağ-Kur')
    expect(stepOf(view.steps, 'payroll').detail).toBe(month.monthlyPayroll === 0 ? AKIS_COPY.details.payrollMissing : null)
  })

  it('flags a loss and keeps every width inside 0–100', () => {
    const loss: MonthResult = {
      ...month,
      monthlyOpex: month.monthlyOpex + month.monthlyOperatingResult + 50_000,
      monthlyOperatingResult: -50_000,
    }
    const lossView = buildAkisView(loss, DAYS)
    expect(lossView.isLoss).toBe(true)
    expect(stepOf(lossView.steps, 'owner').isNarrow).toBe(true)
    for (const step of lossView.steps) {
      for (const edge of step.clipPath.match(/[\d.]+%/g) ?? []) {
        expect(Number.parseFloat(edge)).toBeGreaterThanOrEqual(0)
        expect(Number.parseFloat(edge)).toBeLessThanOrEqual(100)
      }
    }
  })

  it('reports no sales without dividing by zero', () => {
    const empty: MonthResult = { ...month, grossCustomerSales: 0 }
    const emptyView = buildAkisView(empty, DAYS)
    expect(emptyView.hasSales).toBe(false)
    for (const product of emptyView.products) expect(product.widthPercent).toBe(0)
  })
})
