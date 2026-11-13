import { describe, expect, it } from 'vitest'
import {
  HAKKINDA_FAQ,
  auditPrerenderedJsonLd,
  calculatorJsonLd,
  parseJsonLdBlocks,
} from './jsonLd.ts'
import { applySeoToHtml } from './prerenderHtml.ts'
import { SEO_PATHS, seoForPath } from './seoCopy.ts'
import { CANONICAL_URL, DOCUMENT_TITLE, SHELL_COPY } from './shellCopy.ts'
import { REHBER_PAGES, pathForRehberPage } from '../features/rehber/pages.ts'

const TEMPLATE = `<!DOCTYPE html>
<html lang="tr">
  <head>
    <title>${DOCUMENT_TITLE}</title>
    <meta name="description" content="${SHELL_COPY.metaDescription}" />
    <link rel="canonical" href="${CANONICAL_URL}" />
    <meta property="og:url" content="${CANONICAL_URL}" />
    <meta property="og:type" content="website" />
    <script type="application/ld+json">{"@type":"WebApplication","url":"${CANONICAL_URL}"}</script>
  </head>
  <body>
    <div id="root"></div>
    <footer>
      ${HAKKINDA_FAQ.map((item) => `<div>${item.question}</div><div>${item.answer}</div>`).join('\n')}
    </footer>
  </body>
</html>
`

function asType(block: unknown): string {
  if (block !== null && typeof block === 'object' && '@type' in block) {
    const type = (block as { '@type': unknown })['@type']
    return typeof type === 'string' ? type : ''
  }
  return ''
}

describe('calculatorJsonLd', () => {
  it('emits WebApplication + Hakkında FAQ with a free Offer and no ratings', () => {
    const blocks = calculatorJsonLd({
      canonicalUrl: 'https://maliyet.lol/detailed',
      description: seoForPath('/detailed').description,
    })
    expect(blocks.map(asType)).toEqual(['WebApplication', 'FAQPage'])
    const dumped = JSON.stringify(blocks)
    expect(dumped).toContain('"@context":"https://schema.org"')
    expect(dumped).toContain('"price":"0"')
    expect(dumped).toContain('"priceCurrency":"TRY"')
    expect(dumped).not.toMatch(/aggregateRating|ratingValue|Review|SearchAction|HowTo/)
    expect(dumped).toContain(HAKKINDA_FAQ[0]!.question)
  })
})

describe('parseJsonLdBlocks', () => {
  it('rejects a block that is not JSON', () => {
    expect(() => parseJsonLdBlocks('<script type="application/ld+json">{nope}</script>')).toThrow(
      /does not parse/,
    )
  })

  it('rejects a root node without @context or @type', () => {
    const html = applySeoToHtml(TEMPLATE, seoForPath('/'))
    const blocks = parseJsonLdBlocks(html)
    expect(blocks.length).toBeGreaterThan(0)
    expect(() =>
      auditPrerenderedJsonLd(
        '<script type="application/ld+json">{"@type":"FAQPage"}</script>',
        { kind: 'calculator', canonicalUrl: CANONICAL_URL, description: SHELL_COPY.metaDescription },
      ),
    ).toThrow(/@context/)
    expect(() =>
      auditPrerenderedJsonLd(
        '<script type="application/ld+json">{"@context":"https://schema.org"}</script>',
        { kind: 'calculator', canonicalUrl: CANONICAL_URL, description: SHELL_COPY.metaDescription },
      ),
    ).toThrow(/@type/)
  })
})

describe('auditPrerenderedJsonLd', () => {
  it('accepts every prerendered path when JSON-LD matches visible copy', () => {
    for (const path of SEO_PATHS) {
      const seo = seoForPath(path)
      let html = applySeoToHtml(TEMPLATE, seo)
      if (seo.ogType === 'article') {
        const page = REHBER_PAGES.find((entry) => pathForRehberPage(entry) === path)
        if (page === undefined) throw new Error(`missing guide ${path}`)
        const visible = [
          page.h1,
          ...page.faq.flatMap((item) => [item.question, item.answer]),
          SHELL_COPY.productName,
          'Rehber',
        ]
          .map((text) => `<p>${text}</p>`)
          .join('')
        html = html.replace('<div id="root"></div>', `<div id="root">${visible}</div>`)
      }
      expect(
        () =>
          auditPrerenderedJsonLd(html, {
            kind: seo.ogType === 'article' ? 'guide' : 'calculator',
            canonicalUrl: seo.canonicalUrl,
            description: seo.description,
          }),
        path,
      ).not.toThrow()
    }
  })

  it('rejects fake ratings and a paid Offer', () => {
    const rated = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '5' },
    })}</script>`
    expect(() =>
      auditPrerenderedJsonLd(rated, {
        kind: 'calculator',
        canonicalUrl: CANONICAL_URL,
        description: SHELL_COPY.metaDescription,
      }),
    ).toThrow(/forbidden/)

    const paid = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      offers: { '@type': 'Offer', price: '99', priceCurrency: 'TRY' },
    })}</script>`
    expect(() =>
      auditPrerenderedJsonLd(paid, {
        kind: 'calculator',
        canonicalUrl: CANONICAL_URL,
        description: SHELL_COPY.metaDescription,
      }),
    ).toThrow(/free offer/)
  })
})

describe('Hakkında FAQ copy', () => {
  it('is the three questions JSON-LD and the static footer both use', () => {
    expect(HAKKINDA_FAQ.map((item) => item.question)).toEqual([
      'Maliyet ücretsiz mi?',
      'Bir satışın maliyeti nasıl hesaplanır?',
      'İşyeri kira stopajı hesaba dahil mi?',
    ])
    const home = calculatorJsonLd({
      canonicalUrl: CANONICAL_URL,
      description: SHELL_COPY.metaDescription,
    })
    expect(JSON.stringify(home)).toContain('Maliyet ücretsiz mi?')
    expect(JSON.stringify(home)).toContain(HAKKINDA_FAQ[2]!.answer)
  })
})
