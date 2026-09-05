import { useState } from 'react'
import { DetailedFeasibilityPage } from '../features/detailed/DetailedFeasibilityPage.tsx'
import { QuickCalcPage } from '../features/quick-calc/QuickCalcPage.tsx'
import { AppShell } from './AppShell.tsx'
import type { CalculationMode } from './shellCopy.ts'
import { ErrorBoundary } from './ErrorBoundary.tsx'

/**
 * Mode is in-page state, not a route. There is nothing to address — URL sharing is
 * out of scope (Quick R6) — so architecture D4's "a router only when a second real
 * screen requires it" is not yet met.
 *
 * Both modes stay mounted so switching away and back preserves what the user typed.
 * Across a reload only Detailed restores, from its own `localStorage` draft
 * (`features/detailed/storage.ts`); Quick is deliberately stateless per
 * TECH_STACK §4.1. Which mode is showing is never persisted.
 */
export function App() {
  const [mode, setMode] = useState<CalculationMode>('quick')

  return (
    <ErrorBoundary>
      <AppShell mode={mode} onModeChange={setMode}>
        <div hidden={mode !== 'quick'}>
          <QuickCalcPage />
        </div>
        <div hidden={mode !== 'detailed'}>
          <DetailedFeasibilityPage />
        </div>
      </AppShell>
    </ErrorBoundary>
  )
}
