import { describe, expect, it } from 'vitest'
import { pathForScreen } from '../features/detailed/screens.ts'
import { CANONICAL_URL } from './shellCopy.ts'
import { seoForPath } from './seoCopy.ts'
import { buildSitemapXml, indexableCanonicalUrls, SITEMAP_EXCLUDED_ALIASES } from './sitemap.ts'

const BANNED = ['marj', 'amortisman', 'net kâr', 'net kar', 'garanti', 'yapay zeka', 'depreciation', 'netProfit']

describe('indexableCanonicalUrls', () => {
  it('lists only indexable no-slash calculator URLs', () => {
    const urls = indexableCanonicalUrls()
    expect(urls[0]).toBe(CANONICAL_URL)
    expect(urls).toEqual([
      'https://maliyet.lol/',
      'https://maliyet.lol/detailed',
      'https://maliyet.lol/detailed/ingredients',
      'https://maliyet.lol/detailed/sales',
      'https://maliyet.lol/detailed/expenses',
      'https://maliyet.lol/simulations',
    ])
  })

  it('omits noindex, redirects, hashes, guides and Turkish public paths', () => {
    const xml = indexableCanonicalUrls().join('\n')
    expect(xml).not.toContain(seoForPath(pathForScreen('results')).canonicalUrl)
    expect(xml).not.toContain('/detailed/result')
    for (const alias of SITEMAP_EXCLUDED_ALIASES) {
      expect(xml).not.toContain(`https://maliyet.lol${alias}`)
    }
    expect(xml).not.toMatch(/#|\?|hizli-hesap|detayli-hesap|simulasyonlar|\/rehber|\/guides/)
    for (const url of indexableCanonicalUrls()) {
      if (url === CANONICAL_URL) continue
      expect(url.endsWith('/'), url).toBe(false)
    }
  })
})

describe('buildSitemapXml', () => {
  it('emits loc and lastmod only', () => {
    const xml = buildSitemapXml('2026-11-13')
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('<loc>https://maliyet.lol/detailed</loc>')
    expect(xml).toContain('<lastmod>2026-11-13</lastmod>')
    expect(xml).not.toContain('changefreq')
    expect(xml).not.toContain('priority')
    expect(xml).not.toContain('/detailed/result')
    expect(xml).not.toContain('https://maliyet.lol/quick')
    expect(xml).not.toContain('https://maliyet.lol/detailed/menu')
    for (const banned of BANNED) {
      expect(xml.toLocaleLowerCase('tr-TR')).not.toContain(banned)
    }
  })

  it('rejects a lastmod that is not a calendar day', () => {
    expect(() => buildSitemapXml('2026-11-13T00:00:00.000Z')).toThrow(/YYYY-MM-DD/)
  })
})
