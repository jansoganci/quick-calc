import { QuickCalcForm } from './components/QuickCalcForm.tsx'
import { QuickCalcResults } from './components/QuickCalcResults.tsx'
import { useQuickCalc } from './hooks/useQuickCalc.ts'

export function QuickCalcPage() {
  const calc = useQuickCalc()

  return (
    <div className="min-h-screen bg-[#EDEEF0]">
      <div className="mx-auto max-w-[1152px] overflow-hidden border-x border-[#E3E5E8] bg-white lg:grid lg:grid-cols-[392px_1px_1fr]">
        <QuickCalcForm
          form={calc.form}
          errors={calc.evaluation.ok ? {} : calc.evaluation.errors}
          dirty={calc.dirty}
          canSubmit={calc.canSubmit}
          submitHint={calc.submitHint}
          onChange={calc.setField}
          onBlur={calc.markBlurred}
          onSubmit={calc.calculate}
        />
        <div className="hidden bg-[#E3E5E8] lg:block" aria-hidden="true" />
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
      </div>
    </div>
  )
}
