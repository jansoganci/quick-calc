import { describe, expect, it } from 'vitest'
import {
  EMPTY_FORM,
  assumptionRows,
  buildQuickView,
  errorMessage,
  evaluateForm,
  rentCostHint,
  type QuickFormState,
} from './viewModel.ts'
import { BREAKDOWN_LABELS, COPY, ERROR_COPY, FIELD_LABELS } from './labels.ts'
import {
  calculateQuick,
  validateQuickInput,
  simulateQuick,
  type ValidationError,
} from '../../core/quick/index.ts'

const GOLDEN: QuickFormState = {
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
    expect(result.errors.averageTicket).toBe('Bu alan gerekli.')
    expect(result.errors.dailySalesVolume).toBe('Bu alan gerekli.')
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
    const expected = buildQuickView(calc, sim, validated.input.capexRecoveryPeriodMonths)

    expect(result.view.headline).toBe(expected.headline)
    expect(result.view.bar).toHaveLength(8)
    expect(result.view.bar.reduce((sum, segment) => sum + segment.width, 0)).toBeCloseTo(100, 5)
    expect(result.view.simulation).toHaveLength(5)
    expect(result.view.outputs).toHaveLength(4)
    expect(result.view.copyText).toContain('Ortalama satış:')
    expect(result.view.copyText).toContain('Yatırımın geri dönüşü:')
  })

  it('accepts a Turkish-grouped rent amount as the same number', () => {
    const plain = evaluateForm(GOLDEN)
    const grouped = evaluateForm({ ...GOLDEN, monthlyRent: '450.000' })
    expect(plain.ok && grouped.ok).toBe(true)
    if (!plain.ok || !grouped.ok) return
    expect(grouped.view.headline).toBe(plain.view.headline)
  })

  it('raises the rent line when the entered amount is net kira', () => {
    const gross = evaluateForm(GOLDEN)
    const net = evaluateForm({ ...GOLDEN, rentInputBasis: 'net' })
    expect(gross.ok && net.ok).toBe(true)
    if (!gross.ok || !net.ok) return
    const grossRent = gross.view.breakdown.find((row) => row.key === 'rent')
    const netRent = net.view.breakdown.find((row) => row.key === 'rent')
    expect(grossRent?.amountFormatted).toBe('15,00 TL')
    expect(netRent?.amountFormatted).toBe('18,75 TL')
    expect(netRent?.note).toContain('stopaj')
    expect(net.view.outputs[0]?.value).not.toBe(gross.view.outputs[0]?.value)
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
    const view = buildQuickView(
      calculateQuick(validated.input),
      simulateQuick(validated.input),
      validated.input.capexRecoveryPeriodMonths,
    )
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

describe('editable secondary assumptions (§6.3)', () => {
  it('defaults every assumption when the fields are blank', () => {
    const rows = assumptionRows(GOLDEN)
    expect(rows.map((row) => row.source)).toEqual(['default', 'default', 'default', 'default'])
    expect(rows.map((row) => row.valueFormatted)).toEqual(['30 gün', '60 ay', '%90,0', '%3,6'])
  })

  it('marks an edited assumption as user-sourced (§7.1)', () => {
    const rows = assumptionRows({ ...GOLDEN, posCommissionRate: '5' })
    const pos = rows.find((row) => row.field === 'posCommissionRate')
    expect(pos?.source).toBe('user')
    expect(pos?.valueFormatted).toBe('%5,0')
    expect(rows.find((row) => row.field === 'cardPaymentShare')?.source).toBe('default')
  })

  it('reads the two rate assumptions as percentages, not ratios', () => {
    const result = evaluateForm({ ...GOLDEN, posCommissionRate: '5' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // 140 × 0,90 card share × 5% = 6,30 TL per sale
    const pos = result.view.breakdown.find((row) => row.key === 'pos')
    expect(pos?.amountFormatted).toBe('6,30 TL')
  })

  it('feeds an edited operating-days assumption into the monthly figures', () => {
    const base = evaluateForm(GOLDEN)
    const edited = evaluateForm({ ...GOLDEN, operatingDaysPerMonth: '25' })
    expect(base.ok && edited.ok).toBe(true)
    if (!base.ok || !edited.ok) return
    expect(edited.view.outputs[0]?.value).not.toBe(base.view.outputs[0]?.value)
  })

  it('rejects an out-of-range assumption instead of silently defaulting', () => {
    const result = evaluateForm({ ...GOLDEN, capexRecoveryPeriodMonths: '0' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.capexRecoveryPeriodMonths).toBeDefined()
  })
})

describe('terminology (§6.5, §15)', () => {
  const FORBIDDEN = ['amortisman', 'amortism', 'net kâr marjı', 'net kar marjı', 'sahibinin geliri']

  it('never uses a forbidden term in any label or copy string', () => {
    const textValues = (source: Record<string, unknown>): string[] =>
      Object.values(source).flatMap((value) => (typeof value === 'string' ? [value] : []))
    const strings = [
      ...textValues(FIELD_LABELS),
      ...textValues(BREAKDOWN_LABELS),
      ...textValues(COPY),
      ...textValues(ERROR_COPY),
    ]
    for (const term of FORBIDDEN) {
      expect(strings.filter((text) => text.toLowerCase().includes(term))).toEqual([])
    }
  })

  it('states all five §10.1 exclusions in the earnings caveat', () => {
    const caveat = COPY.earningsFootnote.toLowerCase()
    expect(caveat).toContain('kurumlar vergisi')
    expect(caveat).toContain('gelir vergisi')
    expect(caveat).toContain('finansman')
    expect(caveat).toContain('maaşı')
    expect(caveat).toContain('mali yükümlülükler')
  })
})

describe('payback messaging (§11.2)', () => {
  it('explains the unavailable case instead of showing a dash alone', () => {
    // ticket below variable cost: earnings before the allocation stay negative
    const result = evaluateForm({ ...GOLDEN, averageTicket: '20' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const payback = result.view.outputs.find((output) => output.key === 'payback')
    expect(payback?.value).toBe('—')
    expect(result.view.paybackNote).toBe('Bu satış hızında yatırım geri dönüşü hesaplanamıyor.')
  })

  it('notes when payback runs past the chosen recovery period', () => {
    const result = evaluateForm({
      ...GOLDEN,
      initialCapex: '10000000',
      capexRecoveryPeriodMonths: '3',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.paybackNote).toBe(
      'Yatırımın geri dönüşü öngörülen 3 aylık süreyi aşıyor.',
    )
  })

  it('stays silent when payback lands inside the recovery period', () => {
    const result = evaluateForm(GOLDEN)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.paybackNote).toBeNull()
  })
})

describe('summary sentence (frontend spec §6)', () => {
  it('uses the profit wording when the sale leaves money in the business', () => {
    const result = evaluateForm(GOLDEN)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.headline).toBe(
      '140,00 TL’lik ortalama satışın 75,14 TL’si maliyete gidiyor, 64,86 TL’si işletmede kalıyor.',
    )
  })

  it('switches to the loss wording when every sale runs a deficit', () => {
    const result = evaluateForm({ ...GOLDEN, averageTicket: '20' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.headline).toContain('tamamı maliyete gidiyor')
    expect(result.view.headline).toContain('açık oluşuyor')
    expect(result.view.headline).not.toContain('işletmede kalıyor')
  })
})

describe('summary sentence typography (spec §3.1)', () => {
  it('splits the sentence into runs that rejoin to the plain string', () => {
    const result = evaluateForm(GOLDEN)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const joined = result.view.headlineSegments.map((segment) => segment.text).join('')
    expect(joined).toBe(result.view.headline)
  })

  it('marks the amounts as Mono runs and the remaining amount as the accent run', () => {
    const result = evaluateForm(GOLDEN)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const accent = result.view.headlineSegments.filter((segment) => segment.tone === 'accent')
    const amounts = result.view.headlineSegments.filter((segment) => segment.tone === 'amount')
    expect(accent.map((segment) => segment.text)).toEqual(['64,86 TL'])
    expect(amounts.map((segment) => segment.text)).toEqual(['140,00 TL', '75,14 TL'])
  })

  it('gives a loss no accent run, since V3 keeps negatives free of colour', () => {
    const result = evaluateForm({ ...GOLDEN, averageTicket: '20' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.headlineSegments.some((segment) => segment.tone === 'accent')).toBe(false)
    expect(result.view.headlineSegments.some((segment) => segment.tone === 'amount')).toBe(true)
  })
})

describe('rentCostHint', () => {
  it('explains the 20% gross-up for net kira without using × 1.20', () => {
    expect(rentCostHint({ ...GOLDEN, rentInputBasis: 'net' })).toBe(
      'Mülk sahibine 450.000 TL · stopaj 112.500 TL · toplam 562.500 TL',
    )
    expect(rentCostHint({ ...GOLDEN, rentInputBasis: 'gross' })).toBe(
      'Mülk sahibine 360.000 TL · stopaj 90.000 TL · toplam 450.000 TL',
    )
  })
})
