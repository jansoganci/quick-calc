import { useEffect, useState } from 'react'
import { DetailedFeasibilityPage } from '../features/detailed/DetailedFeasibilityPage.tsx'
import { useDetailedCalc } from '../features/detailed/hooks/useDetailedCalc.ts'
import {
  DETAILED_HASH_ROOT,
  detailedScreenFromHash,
  hashForScreen,
  type DetailedScreen,
} from '../features/detailed/screens.ts'
import { SimulationsPage } from '../features/detailed/SimulationsPage.tsx'
import { QuickCalcPage } from '../features/quick-calc/QuickCalcPage.tsx'
import { AppShell } from './AppShell.tsx'
import { AREA_ANCHORS, areaFromLocationHash, type AppArea } from './shellCopy.ts'
import { ErrorBoundary } from './ErrorBoundary.tsx'

/**
 * Area is in-page state, not a route. Quick R6 still forbids encoding the
 * calculator in the URL. The hash names which area is showing, and — once
 * Detaylı is open — which of its five screens. `#detailed-feasibility` is Menü.
 *
 * All three areas stay mounted so switching away and back preserves what the
 * user typed, including the Ocak testi % fields. Across a reload only Detailed
 * restores, from its own `localStorage` draft (`features/detailed/storage.ts`);
 * Quick is deliberately stateless per TECH_STACK §4.1. The area itself is not
 * written to storage. Simülasyonlar reads the same in-memory Detailed draft.
 */

function readLocation(): { area: AppArea; screen: DetailedScreen } {
  const hash = window.location.hash
  return {
    area: areaFromLocationHash(hash),
    screen: detailedScreenFromHash(hash) ?? 'menu',
  }
}

export function App() {
  const [area, setArea] = useState<AppArea>(() => readLocation().area)
  const [screen, setScreen] = useState<DetailedScreen>(() => readLocation().screen)
  const detailed = useDetailedCalc()

  useEffect(() => {
    function syncFromHistory() {
      const next = readLocation()
      setArea(next.area)
      setScreen(next.screen)
    }

    const raw = window.location.hash.replace(/^#/, '')
    if (
      raw.startsWith(`${DETAILED_HASH_ROOT}/`) &&
      hashForScreen(readLocation().screen) !== raw
    ) {
      window.history.replaceState(null, '', `#${hashForScreen(readLocation().screen)}`)
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
   * lives here: push the area hash so Back returns to the previous area, and
   * start the new area at its top. Entering Detaylı from another area always
   * lands on Menü; clicking Detaylı Hesap while already there does not reset
   * the screen.
   */
  function goToArea(next: AppArea) {
    if (next === area) return
    setArea(next)
    if (next === 'detailed') {
      setScreen('menu')
      window.history.pushState(null, '', `#${hashForScreen('menu')}`)
    } else {
      window.history.pushState(null, '', `#${AREA_ANCHORS[next]}`)
    }
    window.scrollTo({ top: 0 })
  }

  function goToDetailedScreen(next: DetailedScreen) {
    if (next === screen) {
      window.scrollTo({ top: 0 })
      return
    }
    window.history.pushState(null, '', `#${hashForScreen(next)}`)
    setScreen(next)
    window.scrollTo({ top: 0 })
  }

  return (
    <ErrorBoundary>
      <AppShell area={area} onAreaChange={goToArea}>
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
      </AppShell>
    </ErrorBoundary>
  )
}
