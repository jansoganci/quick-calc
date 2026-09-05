import { describe, expect, it } from 'vitest'
import {
  emptyLine,
  emptyPosition,
  emptyProduct,
  initialForm,
  type DetailedFormState,
} from './formState.ts'
import { decodeDraft, encodeDraft, type Draft } from './storage.ts'

/** A form with every optional collection populated, so nothing is exercised empty. */
function filledForm(): DetailedFormState {
  const form = initialForm()
  form.products = [
    { ...emptyProduct(), name: 'Filtre kahve', normalPrice: '95', dailyQuantity: '140' },
    { ...emptyProduct(), name: 'Latte', normalPrice: '130', dailyQuantity: '90' },
  ]
  form.positions = [{ ...emptyPosition(), name: 'Barista', headcount: '2' }]
  form.opexLines = [{ ...emptyLine('opex', 'Elektrik'), amount: '45.000' }]
  form.capexItems = [{ ...emptyLine('capex', 'Tadilat'), amount: '600.000' }]
  form.occupancy = { monthlyRent: '300.000', rentInputBasis: 'net', monthlyAidat: '15.000' }
  form.delivery = {
    mode: 'platformCourier',
    platformFeeRate: '28',
    ownCourierCostPerDeliveryOrder: '',
  }
  form.owner = { monthlyAmount: '90.000', bagKurMonthlyCost: '12.500' }
  form.assumptions.projectionHorizonMonths = 24
  form.assumptions.rampUpPreset = 'fast'
  return form
}

/** A stored payload built from a valid form with one field replaced. */
function draftWith(mutate: (form: Record<string, unknown>) => void): string {
  const form = JSON.parse(JSON.stringify(filledForm())) as Record<string, unknown>
  mutate(form)
  return JSON.stringify({ version: 1, form })
}

/** The stored shape is a form plus report metadata; the form is what is validated. */
function draft(form: DetailedFormState, businessName = ''): Draft {
  return { form, businessName }
}

describe('encodeDraft / decodeDraft', () => {
  it('round-trips the starting form unchanged', () => {
    const form = initialForm()
    expect(decodeDraft(encodeDraft(draft(form)))).toEqual(draft(form))
  })

  it('round-trips a fully populated form unchanged', () => {
    const form = filledForm()
    expect(decodeDraft(encodeDraft(draft(form)))).toEqual(draft(form))
  })

  it('preserves the exact strings the user typed', () => {
    const form = filledForm()
    const restored = decodeDraft(encodeDraft(draft(form)))
    expect(restored?.form.occupancy.monthlyRent).toBe('300.000')
    expect(restored?.form.occupancy.rentInputBasis).toBe('net')
    expect(restored?.form.assumptions.projectionHorizonMonths).toBe(24)
  })

  it('round-trips the business name, diacritics included', () => {
    const restored = decodeDraft(encodeDraft(draft(initialForm(), 'Şişli Çiğköfte Ağır İşletme')))
    expect(restored?.businessName).toBe('Şişli Çiğköfte Ağır İşletme')
  })
})

describe('decodeDraft rejects anything it did not write', () => {
  it('returns null when there is no draft', () => {
    expect(decodeDraft(null)).toBeNull()
  })

  it('returns null for unparseable text', () => {
    expect(decodeDraft('{oops')).toBeNull()
    expect(decodeDraft('')).toBeNull()
  })

  it('returns null for a payload that is not an object', () => {
    expect(decodeDraft('42')).toBeNull()
    expect(decodeDraft('null')).toBeNull()
    expect(decodeDraft('[]')).toBeNull()
  })

  it('returns null for another version', () => {
    const raw = JSON.stringify({ version: 2, form: filledForm() })
    expect(decodeDraft(raw)).toBeNull()
  })

  it('reads a pre-report draft, which has no business name, as an empty name', () => {
    const raw = JSON.stringify({ version: 1, form: filledForm() })
    expect(decodeDraft(raw)?.businessName).toBe('')
  })

  it('drops a corrupt business name rather than the financial inputs', () => {
    const raw = JSON.stringify({ version: 1, form: filledForm(), businessName: 42 })
    const restored = decodeDraft(raw)
    expect(restored?.businessName).toBe('')
    expect(restored?.form.products).toHaveLength(2)
  })

  it('returns null when the form is missing entirely', () => {
    expect(decodeDraft(JSON.stringify({ version: 1 }))).toBeNull()
  })

  it('returns null when a row collection is not an array', () => {
    expect(decodeDraft(draftWith((form) => void (form.products = {})))).toBeNull()
    expect(decodeDraft(draftWith((form) => void (form.capexItems = null)))).toBeNull()
  })

  it('returns null when a row is missing a field', () => {
    const raw = draftWith((form) => {
      form.products = [{ id: 'product-1', name: 'Kahve' }]
    })
    expect(decodeDraft(raw)).toBeNull()
  })

  it('returns null when a numeric field arrives as a number instead of a string', () => {
    const raw = draftWith((form) => {
      form.products = [{ ...emptyProduct(), normalPrice: 95 }]
    })
    expect(decodeDraft(raw)).toBeNull()
  })

  it('returns null for an invalid rent basis', () => {
    const raw = draftWith((form) => {
      ;(form.occupancy as Record<string, unknown>).rentInputBasis = 'brut'
    })
    expect(decodeDraft(raw)).toBeNull()
  })

  it('returns null for an invalid projection horizon', () => {
    const raw = draftWith((form) => {
      ;(form.assumptions as Record<string, unknown>).projectionHorizonMonths = 18
    })
    expect(decodeDraft(raw)).toBeNull()
  })

  it('returns null for an invalid ramp-up preset', () => {
    const raw = draftWith((form) => {
      ;(form.assumptions as Record<string, unknown>).rampUpPreset = 'turbo'
    })
    expect(decodeDraft(raw)).toBeNull()
  })

  it('returns null for an invalid delivery mode but accepts null', () => {
    const invalid = draftWith((form) => {
      ;(form.delivery as Record<string, unknown>).mode = 'kurye'
    })
    expect(decodeDraft(invalid)).toBeNull()

    const unset = draftWith((form) => {
      ;(form.delivery as Record<string, unknown>).mode = null
    })
    expect(decodeDraft(unset)?.form.delivery.mode).toBeNull()
  })

  it('returns null when a nested rate group loses a key', () => {
    const raw = draftWith((form) => {
      ;(form.assumptions as Record<string, unknown>).scenarioVolumeDeltas = { bad: '-30' }
    })
    expect(decodeDraft(raw)).toBeNull()
  })
})
