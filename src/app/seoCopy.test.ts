import { describe, expect, it } from 'vitest'
import { pathForScreen } from '../features/detailed/screens.ts'
import { seoForPath, SEO_PATHS } from './seoCopy.ts'
import { AREA_PATHS, CANONICAL_URL, DOCUMENT_TITLE, SHELL_COPY } from './shellCopy.ts'

const BANNED = ['marj', 'amortisman', 'net kâr', 'net kar', 'garanti', 'yapay zeka', 'depreciation', 'netProfit']

describe('seoForPath', () => {
  it('keeps the home title and description as today’s share tags', () => {
    const home = seoForPath('/')
    expect(home.path).toBe('/')
    expect(home.title).toBe(DOCUMENT_TITLE)
    expect(home.description).toBe(SHELL_COPY.metaDescription)
    expect(home.canonicalUrl).toBe(CANONICAL_URL)
    expect(home.noindex).toBe(false)
    expect(home.ogType).toBe('website')
    expect(home.jsonLd).toBeUndefined()
  })

  it('uses the plan’s Turkish titles on English calculator paths', () => {
    expect(seoForPath('/detailed').title).toBe('Detaylı Hesap — Maliyet')
    expect(seoForPath('/detailed/ingredients').title).toBe('Malzemeler — Detaylı Hesap — Maliyet')
    expect(seoForPath('/detailed/sales').title).toBe('Satış — Detaylı Hesap — Maliyet')
    expect(seoForPath('/detailed/expenses').title).toBe('Giderler — Detaylı Hesap — Maliyet')
    expect(seoForPath('/detailed/result').title).toBe('Sonuç — Detaylı Hesap — Maliyet')
    expect(seoForPath('/simulations').title).toBe('Simülasyonlar — Maliyet')
  })

  it('collapses /quick and /detailed/menu to their parents', () => {
    expect(seoForPath('/quick')).toEqual(seoForPath('/'))
    expect(seoForPath('/detailed/menu')).toEqual(seoForPath('/detailed'))
  })

  it('marks Sonuç and the placeholder guides as noindex', () => {
    const noindex = SEO_PATHS.filter((path) => seoForPath(path).noindex)
    expect(noindex).toEqual([
      pathForScreen('results'),
      '/guides/slug-tbd-1',
      '/guides/slug-tbd-2',
    ])
    expect(seoForPath('/detailed/result').canonicalUrl).toBe('https://maliyet.lol/detailed/result')
  })

  it('gives placeholder guides article og:type, noindex, and matching JSON-LD', () => {
    const first = seoForPath('/guides/slug-tbd-1')
    expect(first.title).toBe('Bir satıştan işletmede ne kalıyor? — Maliyet')
    expect(first.noindex).toBe(true)
    expect(first.ogType).toBe('article')
    expect(first.canonicalUrl).toBe('https://maliyet.lol/guides/slug-tbd-1')
    expect(JSON.stringify(first.jsonLd)).toContain('BreadcrumbList')
    expect(JSON.stringify(first.jsonLd)).toContain('FAQPage')
    expect(JSON.stringify(first.jsonLd)).not.toContain('WebApplication')

    const unknownGuide = seoForPath('/guides/not-a-page')
    expect(unknownGuide.path).toBe('/')
    expect(unknownGuide.ogType).toBe('website')
    expect(unknownGuide.noindex).toBe(false)
  })

  it('writes English canonical URLs with no hash, query, or Turkish public path', () => {
    for (const path of SEO_PATHS) {
      const seo = seoForPath(path)
      expect(seo.canonicalUrl.startsWith(`https://${SHELL_COPY.domain}`)).toBe(true)
      expect(seo.canonicalUrl).not.toMatch(/#|\?|hizli-hesap|detayli-hesap|simulasyonlar|\/rehber/)
      expect(seo.title).toContain(SHELL_COPY.productName)
    }
    expect(seoForPath(pathForScreen('menu')).canonicalUrl).toBe('https://maliyet.lol/detailed')
    expect(seoForPath(AREA_PATHS.simulations).canonicalUrl).toBe('https://maliyet.lol/simulations')
  })

  it('gives every calculator path its own title and description, in sen Turkish', () => {
    const titles = SEO_PATHS.map((path) => seoForPath(path).title)
    const descriptions = SEO_PATHS.map((path) => seoForPath(path).description)
    expect(new Set(titles).size).toBe(SEO_PATHS.length)
    expect(new Set(descriptions).size).toBe(SEO_PATHS.length)
    for (const description of descriptions) {
      expect(description.length).toBeGreaterThan(40)
      expect(description.length).toBeLessThanOrEqual(160)
      const lower = description.toLocaleLowerCase('tr-TR')
      for (const banned of BANNED) {
        expect(lower, description).not.toContain(banned)
      }
    }
  })

  it('does not invent a result figure on Sonuç', () => {
    const result = seoForPath('/detailed/result')
    expect(result.description).not.toMatch(/\d/)
    expect(result.noindex).toBe(true)
  })

  it('treats an unknown path as home copy (SPA fallback paints Hızlı)', () => {
    const unknown = seoForPath('/asdf')
    expect(unknown.title).toBe(DOCUMENT_TITLE)
    expect(unknown.path).toBe('/')
    expect(unknown.canonicalUrl).toBe(CANONICAL_URL)
    expect(unknown.noindex).toBe(false)
  })
})
