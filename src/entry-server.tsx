import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { App } from './app/App.tsx'
import { auditPrerenderedJsonLd } from './app/jsonLd.ts'
import { applySeoToHtml, injectRoot } from './app/prerenderHtml.ts'
import { SEO_PATHS, seoForPath } from './app/seoCopy.ts'
import { buildSitemapXml, indexableCanonicalUrls } from './app/sitemap.ts'
import { resetIdCounter } from './features/detailed/formState.ts'

export {
  applySeoToHtml,
  injectRoot,
  SEO_PATHS,
  seoForPath,
  buildSitemapXml,
  indexableCanonicalUrls,
  auditPrerenderedJsonLd,
}

/** Build-time HTML for one English calculator path. Not used at request time. */
export function render(url: string): string {
  resetIdCounter()
  return renderToString(
    <StrictMode>
      <App initialPath={url} />
    </StrictMode>,
  )
}
