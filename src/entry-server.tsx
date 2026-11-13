import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { App } from './app/App.tsx'
import { applySeoToHtml, injectRoot } from './app/prerenderHtml.ts'
import { SEO_PATHS, seoForPath } from './app/seoCopy.ts'
import { resetIdCounter } from './features/detailed/formState.ts'

export { applySeoToHtml, injectRoot, SEO_PATHS, seoForPath }

/** Build-time HTML for one English calculator path. Not used at request time. */
export function render(url: string): string {
  resetIdCounter()
  return renderToString(
    <StrictMode>
      <App initialPath={url} />
    </StrictMode>,
  )
}
