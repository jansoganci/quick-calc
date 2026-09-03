import { describe, expect, it } from 'vitest'
import { initialForm, type DetailedFormState } from './formState.ts'
import { COPY, SECTION_ECHO_LABELS } from './labels.ts'
import { sectionSummary, visibleSections } from './sectionSummary.ts'
import { toDetailedInput } from './toInput.ts'
import { evaluateDetailed } from './viewModel.ts'

function formWith(mutate: (draft: DetailedFormState) => void): DetailedFormState {
  const form = initialForm()
  mutate(form)
  return form
}

/** One product, priced so the base scenario is comfortably profitable. */
function viableForm(mutate: (draft: DetailedFormState) => void = () => {}): DetailedFormState {
  return formWith((draft) => {
    draft.products = [
      {
        id: 'p1',
        name: 'Filtre kahve',
        normalPrice: '65',
        onlinePrice: '70',
        dailyQuantity: '150',
        unitProductCost: '18',
      },
    ]
    draft.delivery.mode = 'platformOnly'
    draft.occupancy.monthlyRent = '60.000'
    draft.capexItems = [{ id: 'c1', name: 'Ekipman', amount: '500.000' }]
    mutate(draft)
  })
}

function evaluate(form: DetailedFormState) {
  return evaluateDetailed(form, toDetailedInput(form))
}

describe('evaluateDetailed', () => {
  it('produces a view for a complete form', () => {
    const result = evaluate(viableForm())
    expect(result.ok).toBe(true)
  })

  it('refuses the empty starting form, because products are required', () => {
    const result = evaluate(initialForm())
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errorSections).toContain('products')
  })
})

describe('percentage inputs reach the engine as fractions', () => {
  it('converts a typed POS commission of 3,59 to 0.0359', () => {
    const result = evaluate(viableForm((draft) => (draft.posCommissionRate = '3,59')))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const posRow = result.view.assumptions.find((row) => row.label === COPY.posCommission)
    expect(posRow?.value).toBe('%3,6')
  })

  it('keeps the three annual rates in the result even when they are 0%', () => {
    const result = evaluate(viableForm())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    for (const label of [
      COPY.salesPriceAnnualIncrease,
      COPY.productCogsAnnualIncrease,
      COPY.fixedCostAnnualIncrease,
    ]) {
      const row = result.view.assumptions.find((entry) => entry.label === label)
      expect(row, `${label} missing from the assumptions block`).toBeDefined()
      expect(row?.value).toBe('%0,0')
    }
  })
})

describe('the reconciliation bar closes exactly', () => {
  it('sums its segment widths to 100%', () => {
    const result = evaluate(viableForm())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const total = result.view.breakdown.rows.reduce((sum, row) => sum + row.widthPercent, 0)
    expect(total).toBeCloseTo(100, 8)
  })

  it('drops the closing segment and captions the overrun when the result is negative', () => {
    const result = evaluate(
      viableForm((draft) => {
        draft.products[0]!.dailyQuantity = '2'
        draft.occupancy.monthlyRent = '500.000'
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.breakdown.isDeficit).toBe(true)
    expect(result.view.breakdown.deficitCaption).toContain('Toplam maliyet')
    const resultRow = result.view.breakdown.rows.find((row) => row.key === 'operatingResult')
    expect(resultRow?.widthPercent).toBe(0)
    expect(resultRow?.amount.startsWith('-')).toBe(true)
  })
})

describe('section echo', () => {
  it('echoes only engine figures, and only for the sections that map onto one', () => {
    const result = evaluate(viableForm((draft) => (draft.owner.monthlyAmount = '45.000')))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(Object.keys(result.view.sectionEcho).sort()).toEqual(
      Object.keys(SECTION_ECHO_LABELS).sort(),
    )
    expect(result.view.sectionEcho.owner).toBe('45.000 TL')
    expect(result.view.sectionEcho.occupancy).toBe('60.000 TL')
    expect(result.view.sectionEcho.capex).toBe('500.000 TL')
  })
})

describe('mix validation', () => {
  it('names the shortfall in Turkish when a channel mix is under 100%', () => {
    const result = evaluate(viableForm((draft) => (draft.channelMix.delivery = '28')))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.channelMix).toBe('Kanal dağılımı %100 olmalı. %2 eksik.')
    expect(result.errorSections).toContain('channels')
  })

  it('names the excess when a payment mix is over 100%', () => {
    const result = evaluate(viableForm((draft) => (draft.paymentMix.cash = '45')))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.paymentMix).toBe('Ödeme dağılımı %100 olmalı. %5 fazla.')
  })
})

describe('delivery mode', () => {
  it('is required as soon as there is a delivery share', () => {
    const result = evaluate(viableForm((draft) => (draft.delivery.mode = null)))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors['delivery.mode']).toBe(
      'Paket servis satışınız olduğu için bu seçim zorunlu.',
    )
  })

  it('is not required, and its section is hidden, with no delivery share', () => {
    const form = viableForm((draft) => {
      draft.delivery.mode = null
      draft.channelMix.salon = '80'
      draft.channelMix.delivery = '0'
    })
    expect(visibleSections(form)).not.toContain('delivery')
    expect(evaluate(form).ok).toBe(true)
  })

  it('suppresses the delivery assumption rows when there is no delivery', () => {
    const result = evaluate(
      viableForm((draft) => {
        draft.channelMix.salon = '80'
        draft.channelMix.delivery = '0'
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const labels = result.view.assumptions.map((row) => row.label)
    expect(labels).not.toContain(COPY.deliveryModeLabel)
    expect(labels).not.toContain(COPY.platformFeeRate)
  })
})

describe('guardrails', () => {
  it('warns when a staffed position has no employer cost, and never blocks the calculation', () => {
    const result = evaluate(
      viableForm((draft) => {
        draft.positions = [
          {
            id: 'pos1',
            name: 'Servis',
            headcount: '2',
            employerCostPerPerson: '',
            mealCostPerPerson: '',
            transportCostPerPerson: '',
            averageBonusPerPerson: '',
          },
        ]
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const guardrail = result.view.guardrails.find((entry) => entry.id === 'employer-cost-pos1')
    expect(guardrail?.message).toContain('Servis')
    expect(guardrail?.section).toBe('positions')
  })

  it('stays silent for a position with no headcount yet', () => {
    const result = evaluate(
      viableForm((draft) => {
        draft.positions = [
          {
            id: 'pos1',
            name: 'Servis',
            headcount: '0',
            employerCostPerPerson: '',
            mealCostPerPerson: '',
            transportCostPerPerson: '',
            averageBonusPerPerson: '',
          },
        ]
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.guardrails).toEqual([])
  })

  it('reminds the user not to count the owner twice', () => {
    const result = evaluate(
      viableForm((draft) => {
        draft.owner.monthlyAmount = '45.000'
        draft.positions = [
          {
            id: 'pos1',
            name: 'Barista',
            headcount: '1',
            employerCostPerPerson: '32.000',
            mealCostPerPerson: '',
            transportCostPerPerson: '',
            averageBonusPerPerson: '',
          },
        ]
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.guardrails.map((entry) => entry.id)).toContain('owner-not-an-employee')
  })
})

describe('unavailable states get a sentence, never a blank', () => {
  it('explains a break-even that cannot be reached', () => {
    const result = evaluate(viableForm((draft) => (draft.products[0]!.unitProductCost = '90')))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.breakEvenPerDay.available).toBe(false)
    if (result.view.breakEvenPerDay.available) return
    expect(result.view.breakEvenPerDay.message).toContain('başa baş')
  })

  it('explains a payback the horizon never reaches', () => {
    const result = evaluate(
      viableForm((draft) => {
        draft.capexItems = [{ id: 'c1', name: 'Ekipman', amount: '400.000.000' }]
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.view.payback.available).toBe(false)
    if (result.view.payback.available) return
    expect(result.view.payback.message).toBe('Yatırım 24 ay içinde geri dönmüyor.')
  })
})

describe('section summaries before the first calculation', () => {
  it('never shows a money figure', () => {
    const form = viableForm()
    for (const section of visibleSections(form)) {
      expect(sectionSummary(form, section)).not.toContain('TL')
    }
  })

  it('reports the mix totals', () => {
    const form = viableForm()
    expect(sectionSummary(form, 'channels')).toBe('%100')
    expect(sectionSummary(form, 'payments')).toBe('%100')
  })
})

describe('terminology the product spec rejects', () => {
  it('appears nowhere in the Detailed copy', async () => {
    const labels = await import('./labels.ts')
    const serialized = JSON.stringify(labels, (_key, value: unknown) =>
      typeof value === 'function' ? String(value) : value,
    ).toLocaleLowerCase('tr-TR')

    for (const banned of ['amortisman', 'net kâr', 'netprofit', 'depreciation']) {
      expect(serialized, `Detailed copy contains "${banned}"`).not.toContain(banned)
    }
  })
})
