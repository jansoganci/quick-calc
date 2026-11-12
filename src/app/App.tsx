import { useState } from 'react'
import { DetailedFeasibilityPage } from '../features/detailed/DetailedFeasibilityPage.tsx'
import { QuickCalcPage } from '../features/quick-calc/QuickCalcPage.tsx'
import { AppShell } from './AppShell.tsx'
import { MODE_ANCHORS, modeFromLocationHash, type CalculationMode } from './shellCopy.ts'
import { ErrorBoundary } from './ErrorBoundary.tsx'

/**
 * Mode is in-page state, not a route. Quick R6 still forbids encoding the
 * calculator in the URL; the hash only names which of the two screens is showing.
 * `#detailed-feasibility` opens Detaylı on load; anything else opens Hızlı Hesap.
 *
 * Both modes stay mounted so switching away and back preserves what the user typed.
 * Across a reload only Detailed restores, from its own `localStorage` draft
 * (`features/detailed/storage.ts`); Quick is deliberately stateless per
 * TECH_STACK §4.1. The mode itself is not written to storage.
 */
export function App() {
  const [mode, setMode] = useState<CalculationMode>(() =>
    modeFromLocationHash(window.location.hash),
  )

  /**
   * Switching modes is the same act however it was asked for — the mode row, or
   * the handoff at the foot of a Quick result — so it lives here rather than in
   * each caller: stamp the mode in the URL, and start the new mode at its top.
   * Without the scroll, a reader who switches from the foot of one page lands in
   * the middle of the other one's form.
   */
  function goToMode(next: CalculationMode) {
    setMode(next)
    window.history.replaceState(null, '', `#${MODE_ANCHORS[next]}`)
    window.scrollTo({ top: 0 })
  }

  return (
    <ErrorBoundary>
      <AppShell mode={mode} onModeChange={goToMode}>
        <div hidden={mode !== 'quick'}>
          <QuickCalcPage onGoToDetailed={() => goToMode('detailed')} />
        </div>
        <div hidden={mode !== 'detailed'}>
          <DetailedFeasibilityPage />
        </div>
      </AppShell>
    </ErrorBoundary>
  )
}
