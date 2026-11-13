import { describe, expect, it } from 'vitest'
import { applySeoToHtml, injectRoot } from './prerenderHtml.ts'
import { seoForPath } from './seoCopy.ts'
import { CANONICAL_URL, DOCUMENT_TITLE, SHELL_COPY } from './shellCopy.ts'

const TEMPLATE = `<!DOCTYPE html>
<html lang="tr">
  <head>
    <title>${DOCUMENT_TITLE}</title>
    <meta
      name="description"
      content="${SHELL_COPY.metaDescription}"
    />
    <link rel="canonical" href="${CANONICAL_URL}" />
    <meta property="og:url" content="${CANONICAL_URL}" />
    <meta property="og:title" content="${DOCUMENT_TITLE}" />
    <meta
      property="og:description"
      content="${SHELL_COPY.metaDescription}"
    />
    <meta property="og:image" content="https://maliyet.lol/og.jpg" />
    <meta name="twitter:title" content="${DOCUMENT_TITLE}" />
    <script type="application/ld+json">
      {
        "@type": "WebApplication",
        "url": "${CANONICAL_URL}",
        "description": "${SHELL_COPY.metaDescription}"
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <footer>Sık sorulanlar</footer>
  </body>
</html>
`

describe('injectRoot', () => {
  it('places markup inside #root once', () => {
    const html = injectRoot(TEMPLATE, '<main id="quick-calculation">Hızlı</main>')
    expect(html).toContain('<div id="root"><main id="quick-calculation">Hızlı</main></div>')
    expect(html).toContain('Sık sorulanlar')
  })
})

describe('applySeoToHtml', () => {
  it('keeps home tags when the path is /', () => {
    const html = applySeoToHtml(TEMPLATE, seoForPath('/'))
    expect(html).toContain(`<title>${DOCUMENT_TITLE}</title>`)
    expect(html).toContain(`href="${CANONICAL_URL}"`)
    expect(html).not.toMatch(/name="robots"/)
    expect(html).toContain('https://maliyet.lol/og.jpg')
  })

  it('rewrites title, description, canonical and JSON-LD url on /detailed', () => {
    const seo = seoForPath('/detailed')
    const html = applySeoToHtml(TEMPLATE, seo)
    expect(html).toContain(`<title>${seo.title}</title>`)
    expect(html).toContain(`content="${seo.description}"`)
    expect(html).toContain(`href="${seo.canonicalUrl}"`)
    expect(html).toContain(`"url": "${seo.canonicalUrl}"`)
    expect(html).toContain('https://maliyet.lol/og.jpg')
    expect(html).not.toContain('https://maliyet.lol/detailedog.jpg')
    expect(html).not.toMatch(/name="robots"/)
  })

  it('adds noindex only on /detailed/result', () => {
    const result = applySeoToHtml(TEMPLATE, seoForPath('/detailed/result'))
    expect(result).toContain('<meta name="robots" content="noindex" />')
    expect(result).toContain('https://maliyet.lol/detailed/result')

    for (const path of ['/', '/detailed', '/detailed/ingredients', '/detailed/sales', '/detailed/expenses', '/simulations']) {
      expect(applySeoToHtml(TEMPLATE, seoForPath(path)), path).not.toMatch(/name="robots"/)
    }
  })
})
