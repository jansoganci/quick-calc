import { describe, expect, it } from 'vitest'
import { initialForm, sampleCafeForm } from './formState.ts'
import {
  DETAILED_HASH_ROOT,
  DETAILED_SCREENS,
  DETAILED_SCREEN_LABELS,
  detailedScreenFromHash,
  hashForScreen,
  neighbourScreens,
  screenForSection,
  screenSummary,
  sectionsOnScreen,
} from './screens.ts'
import { visibleSections } from './sectionSummary.ts'

describe('Detailed screens (V2 step 5)', () => {
  it('names the five roadmap screens in order', () => {
    expect(DETAILED_SCREENS).toEqual(['menu', 'ingredients', 'sales', 'costs', 'results'])
    expect(DETAILED_SCREEN_LABELS.menu).toBe('Menü')
    expect(DETAILED_SCREEN_LABELS.ingredients).toBe('Malzemeler')
    expect(DETAILED_SCREEN_LABELS.sales).toBe('Satış')
    expect(DETAILED_SCREEN_LABELS.costs).toBe('Giderler')
    expect(DETAILED_SCREEN_LABELS.results).toBe('Sonuç')
  })

  it('keeps #detailed-feasibility as Menü so the existing deep link still opens the first screen', () => {
    expect(hashForScreen('menu')).toBe(DETAILED_HASH_ROOT)
    expect(detailedScreenFromHash('#detailed-feasibility')).toBe('menu')
    expect(detailedScreenFromHash('detailed-feasibility')).toBe('menu')
    expect(detailedScreenFromHash('#detailed-feasibility/')).toBe('menu')
  })

  it('reads ASCII suffixes and treats an unknown suffix as Menü', () => {
    expect(detailedScreenFromHash('#detailed-feasibility/malzemeler')).toBe('ingredients')
    expect(detailedScreenFromHash('#detailed-feasibility/satis')).toBe('sales')
    expect(detailedScreenFromHash('#detailed-feasibility/giderler')).toBe('costs')
    expect(detailedScreenFromHash('#detailed-feasibility/sonuc')).toBe('results')
    expect(detailedScreenFromHash('#detailed-feasibility/fiyat')).toBe('menu')
    expect(detailedScreenFromHash('#quick-calculation')).toBeNull()
    expect(detailedScreenFromHash('')).toBeNull()
  })

  it('does not put daily quantity or ingredients on Menü', () => {
    expect(screenForSection('products')).toBe('menu')
    expect(screenForSection('sales')).toBe('sales')
    expect(sectionsOnScreen('menu', visibleSections(initialForm()))).toEqual(['products'])
    expect(sectionsOnScreen('sales', visibleSections(initialForm()))).toEqual([
      'sales',
      'channels',
      'payments',
      'delivery',
    ])
  })

  it('walks Geri / Sonraki without wrapping', () => {
    expect(neighbourScreens('menu')).toEqual({ prev: null, next: 'ingredients' })
    expect(neighbourScreens('results')).toEqual({ prev: 'costs', next: null })
    expect(neighbourScreens('sales')).toEqual({ prev: 'ingredients', next: 'costs' })
  })

  it('summarises a screen from the form, never from a result figure', () => {
    const sample = sampleCafeForm()
    expect(screenSummary(sample, 'menu')).toBe('3 ürün')
    expect(screenSummary(sample, 'sales')).toBe('günde 170 adet')
    expect(screenSummary(sample, 'costs')).toBe('girildi')
    expect(screenSummary(initialForm(), 'ingredients')).toBe('—')
    expect(screenSummary(initialForm(), 'results')).toBe('—')
  })
})
