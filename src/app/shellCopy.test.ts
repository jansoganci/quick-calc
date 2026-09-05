import { describe, expect, it } from 'vitest'
import {
  DOCUMENT_TITLE,
  MODES,
  MODE_ANCHORS,
  MODE_DESCRIPTIONS,
  MODE_LABELS,
  SHELL_COPY,
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
    // The bound guards the masthead at phone width, where the slogan now shares
    // the row with the product name alone — the mode switch moved to its own row.
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

describe('mode navigation', () => {
  it('offers exactly the two calculation modes, in order', () => {
    expect(MODES).toEqual(['quick', 'detailed'])
    expect(MODE_LABELS.quick).toBe('Hızlı Hesap')
    expect(MODE_LABELS.detailed).toBe('Detaylı Fizibilite')
  })

  it('says what each mode is for, because the labels alone did not', () => {
    // The switch was invisible partly because two names cannot explain two
    // products. Every mode carries a line; it stays short enough for the row.
    for (const mode of MODES) {
      expect(MODE_DESCRIPTIONS[mode].length).toBeGreaterThan(0)
      expect(MODE_DESCRIPTIONS[mode].length).toBeLessThanOrEqual(40)
    }
    expect(MODE_DESCRIPTIONS.detailed).toContain('PDF')
  })

  it('offers the deeper mode from the foot of a finished Quick result', () => {
    expect(SHELL_COPY.quickHandoff).toContain('Detaylı Fizibilite')
    expect(SHELL_COPY.quickHandoffLink).toContain('Detaylı Fizibilite')
  })

  it('gives each mode a distinct anchor so the entries stay real links', () => {
    expect(MODE_ANCHORS.quick).toBe('quick-calculation')
    expect(MODE_ANCHORS.detailed).toBe('detailed-feasibility')
    expect(new Set(Object.values(MODE_ANCHORS)).size).toBe(MODES.length)
  })
})
