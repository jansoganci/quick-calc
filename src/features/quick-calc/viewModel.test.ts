import { describe, expect, it } from 'vitest'
import {
  EMPTY_FORM,
  buildQuickView,
  errorMessage,
  evaluateForm,
  type FormValues,
} from './viewModel.ts'
import {
  calculateQuick,
  validateQuickInput,
  simulateQuick,
  type ValidationError,
} from '../../core/quick/index.ts'

const GOLDEN: FormValues = {
  ...EMPTY_FORM,
  monthlyRent: '450000',
  employeeCount: '12',
  averageEmployeeMonthlyCost: '48000',
  otherMonthlyOpex: '110000',
  initialCapex: '10000000',
  averageTicket: '140',
  dailySalesVolume: '1000',
  variableCostPerSale: '14,50',
}

describe('evaluateForm', () => {
  it('returns field errors for an empty form', () => {
    const result = evaluateForm(EMPTY_FORM)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.averageTicket).toBe('Bu alanı doldurun.')
    expect(result.errors.dailySalesVolume).toBe('Bu alanı doldurun.')
  })

  it('builds a view from the golden cafe vector', () => {
    const result = evaluateForm(GOLDEN)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const validated = validateQuickInput({
      monthlyRent: 450_000,
      employeeCount: 12,
      averageEmployeeMonthlyCost: 48_000,
      otherMonthlyOpex: 110_000,
      initialCapex: 10_000_000,
      averageTicket: 140,
      dailySalesVolume: 1_000,
      variableCostPerSale: 14.5,
    })
    expect(validated.ok).toBe(true)
    if (!validated.ok) return
    const calc = calculateQuick(validated.input)
    const sim = simulateQuick(validated.input)
    const expected = buildQuickView(calc, sim)

    expect(result.view.headline).toBe(expected.headline)
    expect(result.view.bar).toHaveLength(8)
    expect(result.view.bar.reduce((sum, segment) => sum + segment.width, 0)).toBeCloseTo(100, 5)
    expect(result.view.simulation).toHaveLength(5)
    expect(result.view.outputs).toHaveLength(4)
    expect(result.view.copyText).toContain('Ortalama satış:')
    expect(result.view.copyText).toContain('Yatırımın geri dönüşü:')
  })

  it('keeps bar widths at 100% when remaining profit is negative', () => {
    const validated = validateQuickInput({
      monthlyRent: 450_000,
      employeeCount: 12,
      averageEmployeeMonthlyCost: 48_000,
      otherMonthlyOpex: 110_000,
      initialCapex: 10_000_000,
      averageTicket: 20,
      dailySalesVolume: 1_000,
      variableCostPerSale: 14.5,
    })
    expect(validated.ok).toBe(true)
    if (!validated.ok) return
    const view = buildQuickView(calculateQuick(validated.input), simulateQuick(validated.input))
    const remaining = view.bar.find((segment) => segment.key === 'remaining')
    expect(remaining?.width).toBe(0)
    expect(view.bar.reduce((sum, segment) => sum + segment.width, 0)).toBeCloseTo(100, 5)
  })
})

describe('errorMessage', () => {
  it('uses the exclusive-zero copy for below_min at 0', () => {
    const error: ValidationError = { field: 'averageTicket', code: 'below_min', limit: 0 }
    expect(errorMessage(error)).toBe('0’dan büyük bir değer girin.')
  })

  it('formats above_max with the engine limit', () => {
    const error: ValidationError = { field: 'averageTicket', code: 'above_max', limit: 100_000 }
    expect(errorMessage(error)).toBe('En fazla 100.000 TL girilebilir.')
  })
})
