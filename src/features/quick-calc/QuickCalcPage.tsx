import { AppFooter } from './components/AppFooter.tsx'
import { AppHeader } from './components/AppHeader.tsx'
import { QuickCalcForm } from './components/QuickCalcForm.tsx'
import { QuickCalcResults } from './components/QuickCalcResults.tsx'
import { useQuickCalc } from './hooks/useQuickCalc.ts'

export function QuickCalcPage() {
  const calc = useQuickCalc()

  return (
    <div className="min-h-screen bg-qc-page">
      <div className="mx-auto max-w-[1152px] overflow-x-clip border-x border-qc-rule bg-qc-surface">
        <AppHeader />
        <main className="lg:grid lg:grid-cols-[392px_1px_1fr]">
          <QuickCalcForm
            form={calc.form}
            errors={calc.evaluation.ok ? {} : calc.evaluation.errors}
            dirty={calc.dirty}
            canSubmit={calc.canSubmit}
            submitHint={calc.submitHint}
            onChange={calc.setField}
            onBlur={calc.markBlurred}
            onRentBasisChange={calc.setRentInputBasis}
            onSubmit={calc.calculate}
          />
          <div className="hidden bg-qc-rule lg:block" aria-hidden="true" />
          <div ref={calc.resultsRef}>
            <QuickCalcResults
              view={calc.view}
              hasCalculated={calc.hasCalculated}
              liveFlash={calc.liveFlash}
              copied={calc.copied}
              onCopy={() => {
                void calc.copySummary()
              }}
            />
          </div>
        </main>
        <AppFooter />
      </div>
    </div>
  )
}
