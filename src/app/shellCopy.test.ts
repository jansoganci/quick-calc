import { describe, expect, it } from 'vitest'
import { DOCUMENT_TITLE, MODES, MODE_ANCHORS, MODE_LABELS, SHELL_COPY } from './shellCopy.ts'

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

  it('keeps the slogan short enough to sit beside the mode switch', () => {
    expect(SHELL_COPY.slogan).toBe('Bir satıştan geriye ne kalıyor?')
    // The bound guards the `sm`-and-up masthead, where the slogan shares a row
    // with the product name and both mode tabs. Below `sm` it has its own row,
    // so the row is no longer what constrains the length.
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

  it('gives each mode a distinct anchor so the entries stay real links', () => {
    expect(MODE_ANCHORS.quick).toBe('quick-calculation')
    expect(MODE_ANCHORS.detailed).toBe('detailed-feasibility')
    expect(new Set(Object.values(MODE_ANCHORS)).size).toBe(MODES.length)
  })
})
