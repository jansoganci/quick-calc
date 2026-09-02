import { cn } from '../../../lib/cn.ts'
import { COPY } from '../labels.ts'
import type { QuickView } from '../viewModel.ts'
import { BreakdownTable } from './BreakdownTable.tsx'
import { OutputStrip } from './OutputStrip.tsx'
import { SimulationTable } from './SimulationTable.tsx'
import { StackedBar } from './StackedBar.tsx'

type QuickCalcResultsProps = {
  view: QuickView | null
  hasCalculated: boolean
  liveFlash: boolean
  copied: boolean
  onCopy: () => void
}

export function QuickCalcResults({
  view,
  hasCalculated,
  liveFlash,
  copied,
  onCopy,
}: QuickCalcResultsProps) {
  return (
    <div
      className={cn(
        'bg-qc-surface-result px-[18px] py-5 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto lg:px-[34px] lg:py-[30px] lg:pb-[34px]',
        hasCalculated && view && 'qc-enter',
        liveFlash && 'qc-live',
      )}
    >
      {!view ? (
        <EmptyResult />
      ) : (
        <>
          <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted lg:hidden">
            {COPY.resultSection}
          </div>
          <p className="max-w-[610px] text-lg leading-normal tracking-tight text-qc-ink text-pretty lg:text-[21px] lg:leading-normal">
            {view.headlineSegments.map((segment, index) =>
              segment.tone === 'text' ? (
                <span key={index}>{segment.text}</span>
              ) : (
                <span
                  key={index}
                  className={cn(
                    'font-mono font-medium tabular-nums',
                    segment.tone === 'accent' && 'text-qc-accent',
                  )}
                >
                  {segment.text}
                </span>
              ),
            )}
          </p>
          <div className="mt-3.5 lg:mt-3.5">
            <button
              type="button"
              onClick={onCopy}
              className="min-h-[44px] bg-transparent p-0 py-[11px] text-[13px] text-qc-secondary hover:text-qc-ink hover:underline lg:min-h-0 lg:py-0"
            >
              {copied ? COPY.copied : COPY.copySummary}
            </button>
          </div>

          <div className="my-5 h-px bg-qc-rule lg:my-[26px]" />

          {view.headlineCost ? (
            <div className="flex items-end justify-between gap-[30px]">
              <div>
                <div className="mb-1.5 text-[13px] text-qc-secondary lg:mb-[7px]">
                  {COPY.headlineCost}
                </div>
                <div className="font-mono text-4xl font-medium leading-none tracking-tight text-qc-accent tabular-nums lg:text-[44px]">
                  {view.headlineCost.replace(' TL', '')}{' '}
                  <span className="text-lg font-normal text-qc-secondary lg:text-[21px]">TL</span>
                </div>
              </div>
              <div className="hidden pb-[3px] text-right lg:block">
                <div className="mb-1.5 text-[13px] text-qc-secondary">{COPY.headlineTicket}</div>
                <div className="font-mono text-[19px] tabular-nums text-qc-ink">{view.ticketFormatted}</div>
              </div>
            </div>
          ) : null}

          <StackedBar bar={view.bar} ticketFormatted={view.ticketFormatted} />
          <BreakdownTable rows={view.breakdown} totalFormatted={view.ticketFormatted} />

          <div className="mb-[18px] mt-6 h-px bg-qc-rule lg:mb-6 lg:mt-[30px]" />
          <OutputStrip outputs={view.outputs} />
          <p className="mt-[14px] max-w-[620px] text-xs leading-relaxed text-qc-muted text-pretty lg:mt-[15px]">
            {COPY.earningsFootnote}
          </p>
          {view.paybackNote ? (
            <p className="mt-2 max-w-[620px] text-xs leading-relaxed text-qc-muted text-pretty">
              {view.paybackNote}
            </p>
          ) : null}

          <div className="mb-[18px] mt-6 h-px bg-qc-rule lg:mb-5 lg:mt-[30px]" />
          <SimulationTable rows={view.simulation} />
          <p className="mt-3 max-w-[620px] text-xs leading-relaxed text-qc-muted text-pretty lg:mt-[13px]">
            {COPY.simFootnote}
          </p>
        </>
      )}
    </div>
  )
}

function EmptyResult() {
  return (
    <>
      <p className="text-[13px] leading-relaxed text-qc-secondary text-pretty">
        {COPY.emptyResult}
      </p>
      <StackedBar bar={[]} ticketFormatted="—" />
    </>
  )
}
