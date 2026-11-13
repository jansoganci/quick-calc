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

/**
 * Swap the home share tags baked into `index.html` for this path's copy.
 * Does not touch `og.jpg` URLs — those contain the home origin as a prefix.
 */
export function applySeoToHtml(html: string, seo: SeoDocument): string {
  let out = html.replaceAll(DOCUMENT_TITLE, seo.title)
  out = out.replaceAll(SHELL_COPY.metaDescription, seo.description)
  out = out.replace(HOME_CANONICAL_TAG, `<link rel="canonical" href="${seo.canonicalUrl}" />`)
  out = out.replace(HOME_OG_URL_TAG, `<meta property="og:url" content="${seo.canonicalUrl}" />`)
  out = out.replace(HOME_JSON_LD_URL, `"url": "${seo.canonicalUrl}"`)

  if (seo.noindex && !/meta\s+[^>]*name="robots"/.test(out)) {
    out = out.replace(
      `<link rel="canonical" href="${seo.canonicalUrl}" />`,
      `<link rel="canonical" href="${seo.canonicalUrl}" />\n    <meta name="robots" content="noindex" />`,
    )
  }

  return out
}
