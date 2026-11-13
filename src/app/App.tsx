import { useEffect, useState } from 'react'
import { DetailedFeasibilityPage } from '../features/detailed/DetailedFeasibilityPage.tsx'
import {
  DETAILED_HASH_ROOT,
  detailedScreenFromHash,
  hashForScreen,
  type DetailedScreen,
} from '../features/detailed/screens.ts'
import { QuickCalcPage } from '../features/quick-calc/QuickCalcPage.tsx'
import { AppShell } from './AppShell.tsx'
import { MODE_ANCHORS, modeFromLocationHash, type CalculationMode } from './shellCopy.ts'
import { ErrorBoundary } from './ErrorBoundary.tsx'

/**
 * Mode is in-page state, not a route. Quick R6 still forbids encoding the
 * calculator in the URL. The hash names which calculator is showing, and — once
 * Detaylı is open — which of its five screens. `#detailed-feasibility` is Menü.
 *
 * Both modes stay mounted so switching away and back preserves what the user typed.
 * Across a reload only Detailed restores, from its own `localStorage` draft
 * (`features/detailed/storage.ts`); Quick is deliberately stateless per
 * TECH_STACK §4.1. The mode itself is not written to storage.
 */

function readLocation(): { mode: CalculationMode; screen: DetailedScreen } {
  const hash = window.location.hash
  return {
    mode: modeFromLocationHash(hash),
    screen: detailedScreenFromHash(hash) ?? 'menu',
  }
}

export function App() {
  const [mode, setMode] = useState<CalculationMode>(() => readLocation().mode)
  const [screen, setScreen] = useState<DetailedScreen>(() => readLocation().screen)

  useEffect(() => {
    function syncFromHistory() {
      const next = readLocation()
      setMode(next.mode)
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
   * Switching modes is the same act however it was asked for — the mode row, or
   * the handoff at the foot of a Quick result — so it lives here rather than in
   * each caller: stamp the mode in the URL, and start the new mode at its top.
   * Without the scroll, a reader who switches from the foot of one page lands in
   * the middle of the other one's form.
   *
   * Clicking Detaylı while already there does not reset the screen: Back/hash
   * own that. Entering Detaylı from Hızlı Hesap always lands on Menü.
   */
  function goToMode(next: CalculationMode) {
    if (next === mode) return
    setMode(next)
    if (next === 'detailed') {
      setScreen('menu')
      window.history.replaceState(null, '', `#${hashForScreen('menu')}`)
    } else {
      window.history.replaceState(null, '', `#${MODE_ANCHORS.quick}`)
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
      <AppShell mode={mode} onModeChange={goToMode}>
        <div hidden={mode !== 'quick'}>
          <QuickCalcPage onGoToDetailed={() => goToMode('detailed')} />
        </div>
        <div hidden={mode !== 'detailed'}>
          <DetailedFeasibilityPage screen={screen} onGoToScreen={goToDetailedScreen} />
        </div>
      </AppShell>
    </ErrorBoundary>
  )
}
