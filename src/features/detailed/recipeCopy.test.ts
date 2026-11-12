import { describe, expect, it } from 'vitest'
import { ERROR_COPY, RECIPE_COPY, SECTION_NOTES } from './labels.ts'

describe('recipe copy (RECIPE_REDESIGN_SPEC §8)', () => {
  it('never writes Gramaj, marj, katkı or amortisman', () => {
    const blob = JSON.stringify({ RECIPE_COPY, SECTION_NOTES, ERROR_COPY })
    for (const banned of ['Gramaj', 'gramaj', 'marj', 'katkı', 'amortisman']) {
      expect(blob).not.toContain(banned)
    }
  })

  it('labels usage by unit', () => {
    expect(RECIPE_COPY.usageLabel.adet).toBe('Kaç adet?')
    expect(RECIPE_COPY.usageLabel.g).toBe('Kaç gram?')
    expect(RECIPE_COPY.usageLabel.ml).toBe('Kaç ml?')
  })

  it('does not attach a suffix to a typed name in interpolated copy', () => {
    expect(RECIPE_COPY.hesaplaRecipeIncomplete('Hamburger')).toBe('Reçeteyi tamamla: Hamburger')
    expect(RECIPE_COPY.priceRiseHeading('Kıyma')).toBe('Kıyma zamlandı')
    expect(RECIPE_COPY.deleteConfirm('Kıyma', '2', 'Hamburger, Köfte ekmek')).toBe(
      'Kıyma silinsin mi? 2 üründe kullanılıyor: Hamburger, Köfte ekmek.',
    )
    expect(RECIPE_COPY.usageEmpty('Domates')).toBe(
      'Domates için miktar yaz. Bütün satırlar dolunca maliyet çıkar.',
    )
  })
})
