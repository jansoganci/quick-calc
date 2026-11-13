import { useEffect, useState } from 'react'
import { DetailedFeasibilityPage } from '../features/detailed/DetailedFeasibilityPage.tsx'
import { useDetailedCalc } from '../features/detailed/hooks/useDetailedCalc.ts'
import { pathForScreen, type DetailedScreen } from '../features/detailed/screens.ts'
import { SimulationsPage } from '../features/detailed/SimulationsPage.tsx'
import { QuickCalcPage } from '../features/quick-calc/QuickCalcPage.tsx'
import { RehberPage } from '../features/rehber/RehberPage.tsx'
import { rehberPageBySlug, rehberPageFromPath } from '../features/rehber/pages.ts'
import { AppShell } from './AppShell.tsx'
import { NotFoundPage } from './NotFoundPage.tsx'
import { areaFromLocation, canonicalPathFromLocation, screenFromLocation } from './location.ts'
import { hasSeoPage, seoForPath } from './seoCopy.ts'
import { AREA_PATHS, type AppArea } from './shellCopy.ts'
import { ErrorBoundary } from './ErrorBoundary.tsx'

/**
 * Browser-only. Lives here (tsx, DOM lib) rather than `location.ts` (node
 * `tsconfig.json` has no DOM — same split as Detailed `storage.ts` / `draftStorage.ts`).
 */
export function applyCanonicalLocation(): void {
  const { pathname, hash, search } = window.location
  const useHash = pathname === '/' || pathname === ''
  const next = `${canonicalPathFromLocation(pathname, useHash ? hash : '')}${search}`
  const current = `${pathname}${search}`
  if (next === current && !(useHash && hash)) return
  window.history.replaceState(null, '', next)
}

function setNamedMeta(name: string, content: string) {
  document.querySelector(`meta[name="${name}"]`)?.setAttribute('content', content)
}

function setPropertyMeta(property: string, content: string) {
  document.querySelector(`meta[property="${property}"]`)?.setAttribute('content', content)
}

/**
 * Tab title, canonical and OG/Twitter tags for the current English path.
 * Prerender writes the same strings into each path's HTML file; this keeps
 * the tab in sync after `pushState`. `/detailed/result` gets `noindex`; leaving
 * that screen removes the tag.
 */
export function applyDocumentSeo(): void {
  const seo = seoForPath(window.location.pathname)
  document.title = seo.title
  setNamedMeta('description', seo.description)
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', seo.canonicalUrl)
  setPropertyMeta('og:title', seo.title)
  setPropertyMeta('og:description', seo.description)
  setPropertyMeta('og:url', seo.canonicalUrl)
  setPropertyMeta('og:type', seo.ogType)
  setNamedMeta('twitter:title', seo.title)
  setNamedMeta('twitter:description', seo.description)

  const robots = document.querySelector('meta[name="robots"]')
  if (seo.noindex) {
    if (robots) {
      robots.setAttribute('content', 'noindex')
    } else {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'robots')
      meta.setAttribute('content', 'noindex')
      document.head.appendChild(meta)
    }
  } else {
    robots?.remove()
  }
}

/**
 * Area is in-page state, not a route. Quick R6 still forbids encoding the
 * calculator in the URL. The pathname names which area is showing, and — once
 * Detaylı is open — which of its five screens. `/detailed` is Menü. Known
 * `/guides/<slug>` paths swap the three calculators for a Rehber article;
 * Rehber is not a fourth nav area. Unknown pathnames render `NotFoundPage`.
 *
 * Incoming hash bookmarks (`#detailed-feasibility/satis`, …) are rewritten to
 * those paths before React paints (`index.html` inline script + `applyCanonicalLocation`).
 *
 * All three areas stay mounted so switching away and back preserves what the
 * user typed, including the Ocak testi % fields. Across a reload only Detailed
 * restores, from its own `localStorage` draft (`features/detailed/storage.ts`);
 * Quick is deliberately stateless per TECH_STACK §4.1. The area itself is not
 * written to storage. Simülasyonlar reads the same in-memory Detailed draft.
 */

function readLocation(): {
  area: AppArea
  screen: DetailedScreen
  guideSlug: string | null
  notFound: boolean
} {
  applyCanonicalLocation()
  const { pathname, hash } = window.location
  return {
    area: areaFromLocation(pathname, hash),
    screen: screenFromLocation(pathname, hash),
    guideSlug: rehberPageFromPath(pathname)?.slug ?? null,
    notFound: !hasSeoPage(pathname),
  }
}

type AppProps = {
  /**
   * SSR only. The client hydrates from `window.location` so the first paint at
   * `/detailed` matches the file prerender wrote for that path. Passing the URL
   * in from `main.tsx` would be a second source of truth.
   */
  initialPath?: string
}

export function App({ initialPath }: AppProps) {
  const [area, setArea] = useState<AppArea>(() =>
    initialPath !== undefined ? areaFromLocation(initialPath, '') : readLocation().area,
  )
  const [screen, setScreen] = useState<DetailedScreen>(() =>
    initialPath !== undefined ? screenFromLocation(initialPath, '') : readLocation().screen,
  )
  const [guideSlug, setGuideSlug] = useState<string | null>(() =>
    initialPath !== undefined
      ? (rehberPageFromPath(initialPath)?.slug ?? null)
      : readLocation().guideSlug,
  )
  const [notFound, setNotFound] = useState(() =>
    initialPath !== undefined ? !hasSeoPage(initialPath) : readLocation().notFound,
  )
  const detailed = useDetailedCalc()
  const guidePage = guideSlug === null ? undefined : rehberPageBySlug(guideSlug)

  useEffect(() => {
    applyDocumentSeo()
  }, [area, screen, guideSlug, notFound])

  useEffect(() => {
    function syncFromHistory() {
      const next = readLocation()
      setArea(next.area)
      setScreen(next.screen)
      setGuideSlug(next.guideSlug)
      setNotFound(next.notFound)
    }

    window.addEventListener('popstate', syncFromHistory)
    window.addEventListener('hashchange', syncFromHistory)
    return () => {
      window.removeEventListener('popstate', syncFromHistory)
      window.removeEventListener('hashchange', syncFromHistory)
    }
  }, [])

  /**
   * Switching areas is the same act however it was asked for — the left / top
   * nav, the Quick handoff, or the empty-state link on Simülasyonlar — so it
   * lives here: push the area path so Back returns to the previous area, and
   * start the new area at its top. Entering Detaylı from another area always
   * lands on Menü; clicking Detaylı Hesap while already there does not reset
   * the screen.
   */
  function goToArea(next: AppArea) {
    if (notFound) {
      setNotFound(false)
    } else if (guideSlug !== null) {
      setGuideSlug(null)
    } else if (next === area) {
      return
    }
    setArea(next)
    if (next === 'detailed') {
      setScreen('menu')
      window.history.pushState(null, '', pathForScreen('menu'))
    } else {
      window.history.pushState(null, '', AREA_PATHS[next])
    }
    window.scrollTo({ top: 0 })
  }

  function goToDetailedScreen(next: DetailedScreen) {
    if (next === screen) {
      window.scrollTo({ top: 0 })
      return
    }
    window.history.pushState(null, '', pathForScreen(next))
    setScreen(next)
    window.scrollTo({ top: 0 })
  }

  return (
    <ErrorBoundary>
      <AppShell area={notFound || guidePage ? null : area} onAreaChange={goToArea}>
        {notFound ? (
          <NotFoundPage />
        ) : guidePage ? (
          <RehberPage page={guidePage} />
        ) : (
          <>
            <div hidden={area !== 'quick'}>
              <QuickCalcPage onGoToDetailed={() => goToArea('detailed')} />
            </div>
            <div hidden={area !== 'detailed'}>
              <DetailedFeasibilityPage
                calc={detailed}
                screen={screen}
                onGoToScreen={goToDetailedScreen}
              />
            </div>
            <div hidden={area !== 'simulations'}>
              <SimulationsPage view={detailed.view} onGoToDetailed={() => goToArea('detailed')} />
            </div>
          </>
        )}
      </AppShell>
    </ErrorBoundary>
  )
}
