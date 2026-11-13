import { describe, expect, it } from 'vitest'
import {
  AREA_ANCHORS,
  AREA_LABELS,
  AREA_PATHS,
  AREAS,
  DOCUMENT_TITLE,
  SHELL_COPY,
  areaFromLocationHash,
  areaFromPathname,
} from './shellCopy.ts'

/**
 * The shell owns the product's name, slogan and domain. `main.tsx` applies
 * `DOCUMENT_TITLE` at startup, so the static title in `index.html` is only a
 * first-paint fallback and this module stays the source of truth.
 */

describe('brand', () => {
  it('names the product Maliyet', () => {
    expect(SHELL_COPY.productName).toBe('Maliyet')
    expect(SHELL_COPY.domain).toBe('maliyet.lol')
  })

  it('keeps the slogan short enough to sit beside the product name', () => {
    expect(SHELL_COPY.slogan).toBe('Bir satıştan geriye ne kalıyor?')
    expect(SHELL_COPY.slogan.length).toBeLessThanOrEqual(32)
  })

  it('promises nothing the model cannot deliver', () => {
    const brandCopy = [SHELL_COPY.slogan, SHELL_COPY.metaDescription].join(' ').toLocaleLowerCase('tr-TR')
    for (const banned of ['garanti', 'kesin', 'yapay zeka', ' ai ', 'kâr garanti']) {
      expect(brandCopy, `brand copy contains "${banned}"`).not.toContain(banned)
    }
  })
})

describe('document title', () => {
  it('is built from the product name and slogan', () => {
    expect(DOCUMENT_TITLE).toBe(`${SHELL_COPY.productName} — ${SHELL_COPY.slogan}`)
    expect(DOCUMENT_TITLE).toBe('Maliyet — Bir satıştan geriye ne kalıyor?')
  })
})

describe('area navigation', () => {
  it('offers exactly the three top-level areas, in order', () => {
    expect(AREAS).toEqual(['quick', 'detailed', 'simulations'])
    expect(AREA_LABELS.quick).toBe('Hızlı Hesap')
    expect(AREA_LABELS.detailed).toBe('Detaylı Hesap')
    expect(AREA_LABELS.simulations).toBe('Simülasyonlar')
  })

  it('keeps Detaylı Fizibilite as the calculator name in the Quick handoff', () => {
    expect(SHELL_COPY.detailedMode).toBe('Detaylı Fizibilite')
    expect(SHELL_COPY.quickHandoff).toContain('Detaylı Fizibilite')
    expect(SHELL_COPY.quickHandoffLink).toContain('Detaylı Fizibilite')
  })

  it('gives each area a distinct English path so the entries stay real links', () => {
    expect(AREA_PATHS.quick).toBe('/')
    expect(AREA_PATHS.detailed).toBe('/detailed')
    expect(AREA_PATHS.simulations).toBe('/simulations')
    expect(new Set(Object.values(AREA_PATHS)).size).toBe(AREAS.length)
  })

  it('still recognises the legacy hash tokens', () => {
    expect(AREA_ANCHORS.quick).toBe('quick')
    expect(AREA_ANCHORS.detailed).toBe('detailed-feasibility')
    expect(AREA_ANCHORS.simulations).toBe('simulations')
  })

  it('opens Detaylı on load for #detailed-feasibility and its screen suffixes', () => {
    expect(areaFromLocationHash('#detailed-feasibility')).toBe('detailed')
    expect(areaFromLocationHash('detailed-feasibility')).toBe('detailed')
    expect(areaFromLocationHash('#detailed-feasibility/satis')).toBe('detailed')
    expect(areaFromLocationHash('#detailed-feasibility/sonuc')).toBe('detailed')
  })

  it('opens Simülasyonlar for #simulations and the Turkish alias', () => {
    expect(areaFromLocationHash('#simulations')).toBe('simulations')
    expect(areaFromLocationHash('simulations')).toBe('simulations')
    expect(areaFromLocationHash('#simulasyonlar')).toBe('simulations')
  })

  it('keeps existing Hızlı deep links and treats an unknown hash as Hızlı', () => {
    expect(areaFromLocationHash('')).toBe('quick')
    expect(areaFromLocationHash('#quick')).toBe('quick')
    expect(areaFromLocationHash('#quick-calculation')).toBe('quick')
    expect(areaFromLocationHash('#')).toBe('quick')
    expect(areaFromLocationHash('#something-else')).toBe('quick')
  })

  it('opens the same three areas from the English pathname', () => {
    expect(areaFromPathname('/')).toBe('quick')
    expect(areaFromPathname('/quick')).toBe('quick')
    expect(areaFromPathname('/detailed')).toBe('detailed')
    expect(areaFromPathname('/detailed/result')).toBe('detailed')
    expect(areaFromPathname('/simulations')).toBe('simulations')
    expect(areaFromPathname('/asdf')).toBe('quick')
  })
})
