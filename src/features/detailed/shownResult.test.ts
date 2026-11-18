import { describe, expect, it } from 'vitest'
import { initialForm, sampleCafeForm, type DetailedFormState } from './formState.ts'
import { toDetailedInput } from './toInput.ts'
import { evaluateDetailed } from './viewModel.ts'
import { selectShownResult } from './shownResult.ts'

function evaluate(form: DetailedFormState) {
  return evaluateDetailed(form, toDetailedInput(form))
}

function withMix(form: DetailedFormState, salon: string, takeaway: string, delivery: string) {
  return { ...form, channelMix: { salon, takeaway, delivery } }
}

describe('selectShownResult', () => {
  it('shows nothing before the first Hesapla, even for a valid draft', () => {
    const valid = evaluate(sampleCafeForm())
    expect(valid.ok).toBe(true)
    expect(selectShownResult(false, valid)).toBeNull()
  })

  it('hides the result while the draft is invalid and restores it once valid (valid -> invalid -> valid)', () => {
    const form = withMix(sampleCafeForm(), '60', '20', '20')
    const valid = evaluate(form)
    expect(valid.ok).toBe(true)
    if (!valid.ok) return
    expect(selectShownResult(true, valid)).toBe(valid.view)

    // Channel mix off 100% → mix_not_100: no figures, not even the previous ones.
    const invalid = evaluate(withMix(form, '50', '20', '20'))
    expect(invalid.ok).toBe(false)
    if (invalid.ok) return
    expect(invalid.errorSections).toContain('channels')
    expect(selectShownResult(true, invalid)).toBeNull()

    const validAgain = evaluate(form)
    expect(validAgain.ok).toBe(true)
    if (!validAgain.ok) return
    expect(selectShownResult(true, validAgain)).toEqual(valid.view)
  })

  it('hides the result for any other invalid draft too', () => {
    expect(selectShownResult(true, evaluate(initialForm()))).toBeNull()
  })
})
