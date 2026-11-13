import type { SeoDocument } from './seoCopy.ts'
import { CANONICAL_URL, DOCUMENT_TITLE, SHELL_COPY } from './shellCopy.ts'

const EMPTY_ROOT = '<div id="root"></div>'
const HOME_CANONICAL_TAG = `<link rel="canonical" href="${CANONICAL_URL}" />`
const HOME_OG_URL_TAG = `<meta property="og:url" content="${CANONICAL_URL}" />`
const HOME_JSON_LD_URL = `"url": "${CANONICAL_URL}"`

/** Put `renderToString` markup into Vite's empty `#root`. One occurrence only. */
export function injectRoot(html: string, markup: string): string {
  const index = html.indexOf(EMPTY_ROOT)
  if (index === -1) {
    throw new Error('Vite template is missing an empty #root')
  }
  return `${html.slice(0, index)}<div id="root">${markup}</div>${html.slice(index + EMPTY_ROOT.length)}`
}

const HOME_OG_TYPE_TAG = '<meta property="og:type" content="website" />'

function replaceJsonLd(html: string, blocks: readonly unknown[]): string {
  const stripped = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
  const scripts = blocks
    .map((block) => `    <script type="application/ld+json">\n${JSON.stringify(block, null, 2)}\n    </script>`)
    .join('\n')
  if (!stripped.includes('</head>')) {
    throw new Error('HTML is missing </head>')
  }
  return stripped.replace('</head>', `\n${scripts}\n  </head>`)
}

/**
 * Q8: Hakkında lives on calculator pages only. The static footer sits outside
 * `#root` (after the article), so a last-`</body>` match leaves the colophon.
 * Match from the Hakkında comment itself — not the first `<!--` in `<head>`.
 */
function stripHakkindaFooter(html: string): string {
  const marker = 'Static "Hakkında" content.'
  const markerAt = html.indexOf(marker)
  if (markerAt !== -1) {
    const commentStart = html.lastIndexOf('<!--', markerAt)
    const footerEnd = html.indexOf('</footer>', markerAt)
    if (commentStart !== -1 && footerEnd !== -1) {
      return `${html.slice(0, commentStart)}${html.slice(footerEnd + '</footer>'.length)}`
    }
  }
  return html.replace(/<footer\b[\s\S]*?<\/footer>\s*(<\/body>)/, '$1')
}

/**
 * Swap the home share tags baked into `index.html` for this path's copy.
 * Does not touch `og.jpg` URLs — those contain the home origin as a prefix.
 * Every path replaces the template JSON-LD. Guide files use BreadcrumbList +
 * FAQPage and drop the Hakkında footer.
 */
export function applySeoToHtml(html: string, seo: SeoDocument): string {
  let out = html.replaceAll(DOCUMENT_TITLE, seo.title)
  out = out.replaceAll(SHELL_COPY.metaDescription, seo.description)
  out = out.replace(HOME_CANONICAL_TAG, `<link rel="canonical" href="${seo.canonicalUrl}" />`)
  out = out.replace(HOME_OG_URL_TAG, `<meta property="og:url" content="${seo.canonicalUrl}" />`)
  out = out.replace(HOME_OG_TYPE_TAG, `<meta property="og:type" content="${seo.ogType}" />`)
  out = out.replace(HOME_JSON_LD_URL, `"url": "${seo.canonicalUrl}"`)

  if (seo.noindex && !/meta\s+[^>]*name="robots"/.test(out)) {
    out = out.replace(
      `<link rel="canonical" href="${seo.canonicalUrl}" />`,
      `<link rel="canonical" href="${seo.canonicalUrl}" />\n    <meta name="robots" content="noindex" />`,
    )
  }

  out = replaceJsonLd(out, seo.jsonLd)
  if (!seo.hakkindaFooter) {
    out = stripHakkindaFooter(out)
  }

  return out
}
