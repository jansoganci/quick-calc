import { useEffect } from 'react'
import { cn } from '../../lib/cn.ts'
import { DetailedForm } from './components/DetailedForm.tsx'
import { DetailedResults } from './components/DetailedResults.tsx'
import { DetailedScreenChrome } from './components/DetailedScreenChrome.tsx'
import { DraftNotice } from './components/DraftNotice.tsx'
import { MobileSummaryBar } from './components/MobileSummaryBar.tsx'
import { ReportActionButton } from './components/ReportActionButton.tsx'
import { ReportAppendix } from './components/ReportAppendix.tsx'
import { ReportCover } from './components/ReportCover.tsx'
import { ReportNameDialog } from './components/ReportNameDialog.tsx'
import { CalculateButton, SummaryPane } from './components/SummaryPane.tsx'
import { useDetailedCalc } from './hooks/useDetailedCalc.ts'
import { useReportPrint } from './hooks/useReportPrint.ts'
import { COPY, RECIPE_COPY, SECTION_LABELS } from './labels.ts'
import {
  DETAILED_SCREENS,
  screenForSection,
  screenSummary,
  sectionsOnScreen,
  type DetailedScreen,
} from './screens.ts'
import { visibleSections } from './sectionSummary.ts'

/**
 * Five screens, one visible. Inputs stay in one form state so switching does not
 * drop a typed value. `#detailed-feasibility` is Menü; the other screens are
 * suffixes of that hash. No third mode.
 */
export function DetailedFeasibilityPage({
  screen,
  onGoToScreen,
}: {
  screen: DetailedScreen
  onGoToScreen: (screen: DetailedScreen) => void
}) {
  const calc = useDetailedCalc()
  const report = useReportPrint(calc.businessName, calc.setBusinessName)
  const sections = visibleSections(calc.form)

  useEffect(() => {
    const onThisScreen = sectionsOnScreen(screen, sections)
    if (onThisScreen.length === 0) return
    if (calc.openSection === null || !onThisScreen.includes(calc.openSection)) {
      calc.setOpenSection(onThisScreen[0] ?? null)
    }
    // Only when the screen changes — not on every form keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  const screenIndex = DETAILED_SCREENS.map((id, index) => ({
    screen: id,
    index: index + 1,
    summary: screenSummary(calc.form, id),
  }))

  const submitHint = buildSubmitHint()

  function buildSubmitHint(): string | null {
    if (calc.canSubmit) return calc.hasCalculated ? null : COPY.calculateLive
    const incomplete = calc.incompleteRecipeNames()
    if (incomplete.length > 0) return RECIPE_COPY.hesaplaRecipeIncomplete(incomplete.join(', '))
    if (calc.errorSections.length === 1 && calc.errorSections[0] === 'products') {
      return COPY.calculateNoProducts
    }
    return COPY.calculateInvalid(
      calc.errorSections.length,
      calc.errorSections.map((section) => SECTION_LABELS[section]).join(', '),
    )
  }

  function goToSection(section: (typeof sections)[number]) {
    onGoToScreen(screenForSection(section))
    calc.setOpenSection(section)
  }

  function calculate() {
    const ok = calc.canSubmit
    calc.calculate()
    if (ok) onGoToScreen('results')
  }

  return (
    <div className="qc-detailed pb-[180px] lg:pb-0">
      {calc.view ? <ReportCover view={calc.view} businessName={calc.businessName} /> : null}

      <main
        id="detailed-feasibility"
        className="qc-screen-only lg:grid lg:grid-cols-[1fr_1px_372px]"
      >
        <DetailedScreenChrome screen={screen} onGoToScreen={onGoToScreen}>
          <div hidden={screen === 'results'}>
            <DetailedForm calc={calc} screen={screen} onGoToScreen={onGoToScreen} />
            <DraftNotice saved={calc.draftSaved} onReset={calc.resetForm} />
          </div>
          {screen === 'results' && calc.view === null ? (
            <div className="max-w-[600px]">
              <p className="text-[13px] leading-relaxed text-qc-ink">{COPY.emptyResult}</p>
              <div className="mt-5">
                <CalculateButton
                  canSubmit={calc.canSubmit}
                  submitHint={submitHint}
                  onCalculate={calculate}
                />
              </div>
            </div>
          ) : null}
          {calc.view ? (
            <div
              className={
                screen === 'results' ? 'qc-enter -mx-[18px] lg:-mx-[30px]' : 'qc-print-only'
              }
            >
              <div ref={calc.resultsRef} className={cn(calc.liveFlash && 'qc-live')}>
                <DetailedResults
                  view={calc.view}
                  showMonthTable={calc.showMonthTable}
                  onToggleMonthTable={calc.toggleMonthTable}
                />
                <div className="px-0 pb-4 lg:hidden">
                  <ReportActionButton
                    variant="results"
                    canPrint={report.canPrint}
                    onOpen={report.open}
                  />
                </div>
                <ReportAppendix view={calc.view} />
              </div>
            </div>
          ) : null}
        </DetailedScreenChrome>
        <div className="hidden bg-qc-rule lg:block" aria-hidden="true" />
        <div className="border-t border-qc-rule lg:border-t-0 lg:bg-qc-surface-result">
          <div className="lg:sticky lg:top-14 lg:max-h-[calc(100vh-3.5rem)] lg:overflow-y-auto">
            <SummaryPane
              view={calc.view}
              screens={screenIndex}
              canSubmit={calc.canSubmit}
              submitHint={submitHint}
              copied={calc.copied}
              onCopy={() => {
                void calc.copySummary()
              }}
              onCalculate={calculate}
              onGoToScreen={onGoToScreen}
              onGoToSection={goToSection}
              onGoToResults={() => onGoToScreen('results')}
              canPrintReport={report.canPrint}
              onOpenReport={report.open}
            />
          </div>
        </div>
      </main>

      <ReportNameDialog
        open={report.isOpen}
        name={report.name}
        canGenerate={report.canGenerate}
        onNameChange={report.setName}
        onCancel={report.cancel}
        onGenerate={report.generate}
      />

      <MobileSummaryBar
        view={calc.view}
        canSubmit={calc.canSubmit}
        submitHint={submitHint}
        onCalculate={calculate}
        onGoToInputs={() => onGoToScreen('costs')}
        onGoToResults={() => onGoToScreen('results')}
      />
    </div>
  )
}
