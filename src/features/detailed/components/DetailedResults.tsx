import { COPY } from '../labels.ts'
import type { DetailedView } from '../viewModel.ts'
import { AssumptionsList } from './AssumptionsList.tsx'
import { ChannelTable } from './ChannelTable.tsx'
import { MonthTable } from './MonthTable.tsx'
import { PaybackChart } from './PaybackChart.tsx'
import { ProjectionChart } from './ProjectionChart.tsx'
import { ResultBar } from './ResultBar.tsx'
import { ScenarioTable } from './ScenarioTable.tsx'

type DetailedResultsProps = {
  view: DetailedView
  showMonthTable: boolean
  onToggleMonthTable: () => void
}

/**
 * Tier 2: the reasoning behind the answer, full width, below the inputs. The
 * decision itself already sits in the summary pane; nothing here repeats it as a KPI.
 */
export function DetailedResults({
  view,
  showMonthTable,
  onToggleMonthTable,
}: DetailedResultsProps) {
  return (
    <div className="border-t border-qc-rule px-[18px] pb-[34px] lg:px-[30px]">
      <div className="py-[26px] lg:pb-[26px] lg:pt-[30px]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
          {COPY.detailedResults}
        </span>
      </div>

      <ResultSection title={COPY.moneyFlowTitle} note={COPY.moneyFlowNote} figure={view.breakdown.total} figureLabel={COPY.grossCustomerSales}>
        <ResultBar breakdown={view.breakdown} gross={view.breakdown.total} />
      </ResultSection>

      <ResultSection title={COPY.scenariosTitle} note={COPY.scenariosNote}>
        <ScenarioTable scenarios={view.scenarios} />
      </ResultSection>

      <ResultSection
        title={`${COPY.monthlyOperatingResult} · ${view.horizonMonths} ay`}
        note={COPY.projectionNote}
      >
        <div className="hidden lg:block">
          <ProjectionChart data={view.projection} size="lg" />
        </div>
        <div className="lg:hidden">
          <ProjectionChart data={view.projection} size="sm" />
        </div>
        <div className="mt-3.5 border-t border-qc-rule-row pt-3.5">
          <button type="button" className="qc-text-btn is-accent" onClick={onToggleMonthTable}>
            {showMonthTable ? COPY.hideMonthTable : COPY.showMonthTable}
          </button>
        </div>
        {showMonthTable ? <MonthTable rows={view.monthRows} /> : null}
      </ResultSection>

      <ResultSection
        title={COPY.payback}
        note={COPY.paybackNote}
        figure={view.payback.available ? view.payback.value : null}
        figureLabel={COPY.baseScenario}
      >
        <div className="hidden lg:block">
          <PaybackChart data={view.paybackChart} size="lg" />
        </div>
        <div className="lg:hidden">
          <PaybackChart data={view.paybackChart} size="sm" />
        </div>
        {view.payback.available ? null : (
          <p className="mt-2.5 text-xs leading-relaxed text-qc-muted">{view.payback.message}</p>
        )}
      </ResultSection>

      <ResultSection title={COPY.channelTitle} note={COPY.channelNote}>
        <ChannelTable channels={view.channels} totals={view.channelTotals} />
      </ResultSection>

      <ResultSection title={COPY.breakEvenTitle} note={COPY.breakEvenNote}>
        {view.breakEvenUnitsPerDay !== null && view.breakEvenUnitsPerMonth !== null ? (
          <div className="max-w-[820px] lg:grid lg:grid-cols-3">
            <BreakEvenCell label={COPY.breakEvenPerDay} value={view.breakEvenUnitsPerDay} />
            <BreakEvenCell label={COPY.breakEvenPerMonth} value={view.breakEvenUnitsPerMonth} />
            <BreakEvenCell label={COPY.plannedVolume} value={view.plannedUnitsPerDay} isLast />
          </div>
        ) : (
          <p className="text-[13px] text-qc-ink">
            {view.breakEvenPerDay.available ? null : view.breakEvenPerDay.message}
          </p>
        )}
      </ResultSection>

      <ResultSection title={COPY.assumptionsTitle} note={COPY.assumptionsNote} isLast>
        <AssumptionsList rows={view.assumptions} />
      </ResultSection>
    </div>
  )
}

function ResultSection({
  title,
  note,
  figure,
  figureLabel,
  isLast = false,
  children,
}: {
  title: string
  note: string
  figure?: string | null
  figureLabel?: string
  isLast?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={`border-t border-qc-rule pt-[26px] ${isLast ? 'pb-0' : 'pb-[30px]'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="m-0 text-[15px] font-semibold text-qc-ink">{title}</h2>
        {figure ? (
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-qc-muted">{figureLabel}</span>
            <span className="font-mono text-[19px] tabular-nums text-qc-ink">{figure}</span>
          </div>
        ) : null}
      </div>
      <p className="mb-[18px] mt-1.5 max-w-[720px] text-xs leading-relaxed text-qc-muted">{note}</p>
      {children}
    </section>
  )
}

function BreakEvenCell({
  label,
  value,
  isLast = false,
}: {
  label: string
  value: string
  isLast?: boolean
}) {
  return (
    <div
      className={`border-t border-qc-rule py-3 lg:px-5 lg:first:pl-0 ${
        isLast ? '' : 'lg:border-r lg:border-r-qc-rule'
      }`}
    >
      <div className="text-xs text-qc-muted">{label}</div>
      <div className="mt-1 font-mono text-[22px] tabular-nums text-qc-ink">{value}</div>
    </div>
  )
}
