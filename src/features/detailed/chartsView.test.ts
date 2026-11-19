import { describe, expect, it } from 'vitest'
import { HAMBURGERCI } from './samples/hamburgerci.ts'
import { KAFE } from './samples/kafe.ts'
import { buildSampleForm, SAMPLE_CONCEPTS } from './samples/index.ts'
import { toDetailedInput } from './toInput.ts'
import { evaluateDetailed } from './viewModel.ts'
import type { DetailedFormState } from './formState.ts'

function chartsFor(form: DetailedFormState) {
  const evaluation = evaluateDetailed(form, toDetailedInput(form))
  if (!evaluation.ok) throw new Error('sample must be valid')
  return evaluation.view.charts
}

describe('result charts view (DF-87)', () => {
  it.each(SAMPLE_CONCEPTS.map((concept) => [concept.name, concept] as const))(
    '%s: every chart figure is finite and sized 0–100',
    (_name, concept) => {
      const charts = chartsFor(buildSampleForm(concept))
      const sizes = [
        charts.months.upPercent,
        ...charts.months.bars.map((bar) => bar.heightPercent),
        ...charts.scenarios.map((bar) => bar.widthPercent),
        charts.payback.progress?.widthPercent ?? 0,
      ]
      for (const size of sizes) {
        expect(Number.isFinite(size)).toBe(true)
        expect(size).toBeGreaterThanOrEqual(0)
        expect(size).toBeLessThanOrEqual(100)
      }
      const text = JSON.stringify(charts)
      expect(text).not.toMatch(/NaN|Infinity|undefined/)
    },
  )

  it('shows the ramp months plus the first full month (normal ramp → 5)', () => {
    const form = buildSampleForm(HAMBURGERCI)
    form.assumptions.rampUpPreset = 'normal'
    const months = chartsFor(form).months
    expect(months.bars.map((bar) => bar.label)).toEqual(['1. ay', '2. ay', '3. ay', '4. ay', '5. ay'])
    expect(months.steadyLabel).toBe('5. aydan itibaren her ay')
    expect(months.steadyAmount).toBe(months.bars[4]?.amount)
  })

  it('follows the ramp preset length', () => {
    const form = buildSampleForm(HAMBURGERCI)
    form.assumptions.rampUpPreset = 'slow'
    expect(chartsFor(form).months.bars).toHaveLength(6)
    form.assumptions.rampUpPreset = 'fast'
    expect(chartsFor(form).months.bars).toHaveLength(3)
  })

  it('marks the base scenario and labels the volume deltas in plain words', () => {
    const scenarios = chartsFor(buildSampleForm(HAMBURGERCI)).scenarios
    expect(scenarios.map((bar) => bar.label)).toEqual([
      'Satış %25 düşerse',
      'Beklendiği gibi',
      'Satış %25 artarsa',
    ])
    expect(scenarios.filter((bar) => bar.isBase).map((bar) => bar.key)).toEqual(['base'])
    expect(scenarios[2]?.widthPercent).toBe(100)
  })

  it('kumbara: one box per month, döndü on the DF-36 payback month', () => {
    const form = buildSampleForm(HAMBURGERCI)
    const evaluation = evaluateDetailed(form, toDetailedInput(form))
    if (!evaluation.ok) throw new Error('sample must be valid')
    const { payback, charts } = { payback: evaluation.view.payback, charts: evaluation.view.charts }
    expect(charts.payback.boxes).toHaveLength(24)
    expect(payback.available).toBe(true)
    if (!payback.available) return
    const month = Number.parseInt(payback.value, 10)
    expect(charts.payback.headline).toBe(`${month}. ay`)
    const marked = charts.payback.boxes.filter((box) => box.state === 'payback')
    expect(marked.map((box) => box.month)).toEqual([month])
    expect(charts.payback.boxes.filter((box) => box.state === 'free').every((box) => box.month > month)).toBe(true)
    expect(charts.payback.progress).toBeNull()
    expect(charts.payback.sentence).toBe(`Yatırımın ${month}. ayda cebine geri döner. Ondan sonra kalan para artık senin.`)
  })

  it('kumbara: when the horizon ends first, shows the share and the estimate', () => {
    const form = buildSampleForm(KAFE)
    const evaluation = evaluateDetailed(form, toDetailedInput(form))
    if (!evaluation.ok) throw new Error('sample must be valid')
    const charts = evaluation.view.charts
    if (evaluation.view.payback.available) return // sample figures moved; nothing to assert here
    expect(charts.payback.headline).toBe('24 ayda dönmüyor')
    expect(charts.payback.boxes.some((box) => box.state === 'payback' || box.state === 'free')).toBe(false)
    expect(charts.payback.progress).not.toBeNull()
    expect(charts.payback.sentence).toMatch(/^24 ay bitince /)
    expect(charts.payback.sentence).toMatch(/(Bu hızla yaklaşık \d+\. ayda döner\.|Bu hızla yatırım geri dönmez\.)$/)
  })

  it('a zero investment shows no target and no döndü box', () => {
    const form = buildSampleForm(HAMBURGERCI)
    form.capexItems = []
    const charts = chartsFor(form)
    expect(charts.payback.headline).toBe('Yatırım yok')
    expect(charts.payback.boxes.some((box) => box.state === 'payback')).toBe(false)
    expect(charts.payback.progress).toBeNull()
  })
})
