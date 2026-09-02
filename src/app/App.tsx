import { QuickCalcPage } from '../features/quick-calc/QuickCalcPage.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'

export function App() {
  return (
    <ErrorBoundary>
      <QuickCalcPage />
    </ErrorBoundary>
  )
}
