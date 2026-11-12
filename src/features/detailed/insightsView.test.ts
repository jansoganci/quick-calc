import { describe, expect, it } from 'vitest'
import { sampleCafeForm } from './formState.ts'
import {
  buildFixedCostDaysView,
  buildSalonMenuView,
  formatFixedCostDays,
  previewJanuary,
} from './insightsView.ts'
import { COPY } from './labels.ts'
import { toDetailedInput } from './toInput.ts'
import { evaluateDetailed } from './viewModel.ts'
import type { FixedCostDays } from '../../core/detailed/index.ts'
import { validateDetailedInput } from '../../core/detailed/index.ts'

function sampleInput() {
  const validation = validateDetailedInput(toDetailedInput(sampleCafeForm()))
  if (!validation.ok) {
    throw new Error(`sample cafe must be valid: ${JSON.stringify(validation.errors)}`)
  }
  return validation.input
}

describe('salon menu view (Appendix B.1)', () => {
  it('names Poğaça as the weakest sample-café product without a suffix', () => {
    const menu = buildSalonMenuView(sampleInput())
    const pogaca = menu.products.find((row) => row.name === 'Poğaça')
    expect(pogaca?.isWeakest).toBe(true)
    expect(menu.weakestNote).toBe(COPY.weakestProductNote('Poğaça'))
    expect(menu.weakestNote).not.toMatch(/Poğaça(?:['’]?(?:ın|in|un|ün)|(?:nın|nin|nun|nün))/)
  })

  it('shows food-cost as a percent and remaining as a rounded TL amount', () => {
    const menu = buildSalonMenuView(sampleInput())
    const americano = menu.products.find((row) => row.name === 'Amerikano')
    expect(americano?.sellingPrice).toBe('120')
    expect(americano?.unitProductCost).toBe('25')
    expect(americano?.foodCostRate).toBe('%22,9')
    expect(americano?.remainingPerUnit).toMatch(/^\d+$/)
  })
})

describe('fixed-cost day lines (Appendix B.2)', () => {
  it('rounds each bucket and makes the remainder add up to the working days', () => {
    const days: Extract<FixedCostDays, { available: true }> = {
      available: true,
      operatingDaysPerMonth: 30,
      dailyContribution: 10_000,
      buckets: [
        { key: 'rent', cost: 74_000, days: 7.4 },
        { key: 'payroll', cost: 44_000, days: 4.4 },
        { key: 'other', cost: 24_000, days: 2.4 },
      ],
      remainderDays: 15.8,
      coversMonth: true,
    }
    const view = formatFixedCostDays(days, 30)
    expect(view.lines).toEqual([
      'Ayın ilk 7 günü kira için çalışıyorsun',
      'Sonraki 4 günü personel için',
      'Sonraki 2 günü diğer sabit giderler için',
      'Geri kalan 17 gün senin',
    ])
  })

  it('writes a plain uncovered note when the rounded remainder is negative', () => {
    const days: Extract<FixedCostDays, { available: true }> = {
      available: true,
      operatingDaysPerMonth: 30,
      dailyContribution: 1_000,
      buckets: [
        { key: 'rent', cost: 20_000, days: 20 },
        { key: 'payroll', cost: 20_000, days: 20 },
      ],
      remainderDays: -10,
      coversMonth: false,
    }
    const view = formatFixedCostDays(days, 30)
    expect(view.lines.at(-1)).toBe(COPY.fixedCostDaysUncovered)
    expect(view.coversMonth).toBe(false)
  })

  it('uses the sample café’s operatingDaysPerMonth in the note', () => {
    const evaluation = evaluateDetailed(sampleCafeForm(), toDetailedInput(sampleCafeForm()))
    expect(evaluation.ok).toBe(true)
    if (!evaluation.ok) return
    expect(evaluation.view.fixedCostDays.note).toContain('30')
    expect(evaluation.view.fixedCostDays.available).toBe(true)
    expect(evaluation.view.fixedCostDays.lines[0]).toMatch(/^Ayın ilk \d+ günü kira için çalışıyorsun$/)
    expect(evaluation.view.fixedCostDays.lines.some((line) => line.includes('personel'))).toBe(true)
    expect(evaluation.view.fixedCostDays.lines.at(-1)).toMatch(/senin|Geri kalan gün yok/)
  })
})

describe('January preview (Appendix B.3)', () => {
  it('treats empty inputs as 0% and leaves the base figures', () => {
    const evaluation = evaluateDetailed(sampleCafeForm(), toDetailedInput(sampleCafeForm()))
    expect(evaluation.ok).toBe(true)
    if (!evaluation.ok) return
    const preview = previewJanuary(evaluation.view.januaryBasis, '', '')
    expect(preview.monthlyOperatingResult).toBe(evaluation.view.monthlyOperatingResult)
    expect(preview.wageInvalid).toBe(false)
    expect(preview.rentInvalid).toBe(false)
    expect(preview.days.lines).toEqual(evaluation.view.fixedCostDays.lines)
  })

  it('lowers the monthly leftover when wages and rent rise', () => {
    const evaluation = evaluateDetailed(sampleCafeForm(), toDetailedInput(sampleCafeForm()))
    expect(evaluation.ok).toBe(true)
    if (!evaluation.ok) return
    const preview = previewJanuary(evaluation.view.januaryBasis, '30', '50')
    const before = evaluation.view.januaryBasis.month.monthlyOperatingResult
    const after = evaluation.view.januaryBasis.month.totalContribution -
      (evaluation.view.januaryBasis.month.monthlyPayroll * 1.3 +
        evaluation.view.januaryBasis.month.monthlyOwnerCost +
        evaluation.view.januaryBasis.month.rentCost * 1.5 +
        (evaluation.view.januaryBasis.month.monthlyOccupancyCost -
          evaluation.view.januaryBasis.month.rentCost) +
        evaluation.view.januaryBasis.month.monthlyOpex)
    expect(after).toBeLessThan(before)
    expect(preview.monthlyOperatingResult).toMatch(/TL$/)
    expect(preview.breakEvenValue).not.toBeNull()
    expect(preview.days.lines[0]).not.toBe(evaluation.view.fixedCostDays.lines[0])
    expect(preview.days.lines[0]).toMatch(/^Ayın ilk \d+ günü kira için çalışıyorsun$/)
  })

  it('counts an unreadable percent as 0 and sets the quiet hint flag', () => {
    const evaluation = evaluateDetailed(sampleCafeForm(), toDetailedInput(sampleCafeForm()))
    expect(evaluation.ok).toBe(true)
    if (!evaluation.ok) return
    const preview = previewJanuary(evaluation.view.januaryBasis, 'abc', '')
    expect(preview.wageInvalid).toBe(true)
    expect(preview.monthlyOperatingResult).toBe(evaluation.view.monthlyOperatingResult)
  })
})

describe('buildFixedCostDaysView on a non-positive contribution', () => {
  it('is unavailable', () => {
    const evaluation = evaluateDetailed(sampleCafeForm(), toDetailedInput(sampleCafeForm()))
    expect(evaluation.ok).toBe(true)
    if (!evaluation.ok) return
    const month = {
      ...evaluation.view.januaryBasis.month,
      totalContribution: 0,
    }
    const view = buildFixedCostDaysView(month, 30)
    expect(view.available).toBe(false)
    expect(view.unavailableMessage).toBe(COPY.fixedCostDaysUnavailable)
  })
})
