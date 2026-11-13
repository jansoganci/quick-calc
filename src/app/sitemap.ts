import { PATH_ALIASES } from './location.ts'
import { SEO_PATHS, seoForPath } from './seoCopy.ts'

const LASTMOD_DAY = /^\d{4}-\d{2}-\d{2}$/

/** Indexable canonical URLs. Same list as prerender, minus `noindex` (Sonuç and TBD guides). */
export function indexableCanonicalUrls(): string[] {
  return SEO_PATHS.filter((path) => !seoForPath(path).noindex).map(
    (path) => seoForPath(path).canonicalUrl,
  )
}

/**
 * `sitemap.xml` for `dist/`. `lastmod` is the build day (UTC). No `changefreq`
 * or `priority` — Google ignores them and the plan says not to invent them.
 */
export function buildSitemapXml(lastmod: string): string {
  if (!LASTMOD_DAY.test(lastmod)) {
    throw new Error(`sitemap lastmod must be YYYY-MM-DD, got ${lastmod}`)
  }
  const urls = indexableCanonicalUrls()
  if (urls.length === 0) throw new Error('sitemap would be empty')
  const body = urls
    .map((loc) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

export const SITEMAP_EXCLUDED_ALIASES = PATH_ALIASES.map((alias) => alias.from)
