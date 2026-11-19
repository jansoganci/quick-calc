import { cn } from '../../../lib/cn.ts'
import type {
  MonthsChartView,
  PaybackBoxState,
  PaybackCalendarView,
  ScenarioBar,
} from '../chartsView.ts'
import { CHART_COPY } from '../labels.ts'

/**
 * The three Sonuç charts (DF-87, UI spec §4.5): plain HTML boxes, no SVG, no
 * axis. Every figure arrives formatted from `chartsView.ts`; the only arithmetic
 * here is turning its percentages into CSS. `qc-print-ink` keeps the fills in
 * the PDF, where browsers drop backgrounds by default.
 */

/** "−70.368 TL" → "−70.368" with " TL" only on wide screens, so five columns fit at 390px. */
function Amount({ value }: { value: string }) {
  const bare = value.replace(/ TL$/, '')
  return (
    <>
      {bare}
      <span className="hidden lg:inline"> TL</span>
    </>
  )
}

export function MonthsChart({ view }: { view: MonthsChartView }) {
  const columns = { gridTemplateColumns: `repeat(${view.bars.length}, minmax(0, 1fr))` }
  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-6">
        <div className="grid gap-2 lg:gap-3.5" style={columns}>
          {view.bars.map((bar) => (
            <div key={bar.month} className="flex min-w-0 flex-col items-center">
              <span className="h-[18px] whitespace-nowrap font-mono text-[10px] font-medium tabular-nums text-qc-ink lg:h-5 lg:text-xs">
                {bar.isLoss ? null : <Amount value={bar.amount} />}
              </span>
              <div className="flex h-[110px] w-full flex-col lg:h-[140px]">
                <div
                  className="flex w-full items-end justify-center border-b border-qc-ink"
                  style={{ height: `${view.upPercent}%` }}
                >
                  {bar.isLoss ? null : (
                    <div
                      className="qc-print-ink w-[68%] bg-qc-accent"
                      style={{ height: `${bar.heightPercent}%`, minHeight: bar.heightPercent > 0 ? 2 : 0 }}
                    />
                  )}
                </div>
                <div className="flex w-full flex-1 items-start justify-center">
                  {bar.isLoss ? (
                    <div
                      className="box-border w-[68%] border-[1.5px] border-t-0 border-qc-secondary"
                      style={{ height: `${bar.heightPercent}%`, minHeight: 2 }}
                    />
                  ) : null}
                </div>
              </div>
              {view.hasLoss ? (
                <span className="h-[18px] whitespace-nowrap font-mono text-[10px] font-medium tabular-nums text-qc-ink lg:text-xs">
                  {bar.isLoss ? <Amount value={bar.amount} /> : null}
                </span>
              ) : null}
              <span className="mt-1 text-[11px] text-qc-secondary lg:text-xs">{bar.label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-center border-y border-qc-rule-mid bg-qc-surface-result px-3.5 py-3 lg:border-y-0 lg:border-l lg:border-l-qc-rule lg:bg-transparent lg:py-0 lg:pl-5">
          <span className="text-xs text-qc-secondary">{view.steadyLabel}</span>
          <span className="mt-1 whitespace-nowrap font-mono text-[20px] font-medium tabular-nums text-qc-accent lg:text-[22px]">
            {view.steadyAmount}
          </span>
          <span className="mt-1 text-xs text-qc-secondary">{view.steadyCaption}</span>
        </div>
      </div>
      <p className="mb-0 mt-3.5 max-w-[720px] text-[13px] leading-relaxed text-qc-ink">{view.sentence}</p>
    </div>
  )
}

export function ScenarioBars({ bars }: { bars: ScenarioBar[] }) {
  return (
    <div className="flex max-w-[820px] flex-col gap-4 lg:gap-3.5">
      {bars.map((bar) => (
        <div
          key={bar.key}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1.5 lg:grid-cols-[180px_minmax(0,1fr)_140px] lg:items-center lg:gap-x-3.5"
        >
          <div className="min-w-0">
            <span className={cn('block text-sm text-qc-ink', bar.isBase && 'font-semibold')}>{bar.label}</span>
            <span className="hidden text-xs text-qc-secondary lg:block">{bar.payback}</span>
          </div>
          <span
            className={cn(
              'whitespace-nowrap text-right font-mono text-[15px] tabular-nums lg:order-last',
              bar.isBase ? 'font-semibold text-qc-accent' : 'text-qc-ink',
            )}
          >
            {bar.amount}
          </span>
          <div className="qc-print-ink col-span-2 flex h-[22px] items-center bg-qc-rule-row lg:col-span-1 lg:h-[26px]">
            {bar.isLoss ? (
              <span className="px-2.5 text-xs text-qc-ink">{CHART_COPY.scenarioLossBar}</span>
            ) : (
              <div
                className={cn('qc-print-ink h-full', bar.isBase ? 'bg-qc-accent' : 'bg-qc-muted')}
                style={{ width: `${bar.widthPercent}%` }}
              />
            )}
          </div>
          <span className="col-span-2 text-xs text-qc-secondary lg:hidden">{bar.payback}</span>
        </div>
      ))}
    </div>
  )
}

const BOX_CLASSES: Record<PaybackBoxState, string> = {
  loss: 'border-[1.5px] border-qc-secondary bg-qc-surface text-qc-ink',
  paying: 'bg-qc-accent text-qc-on-accent',
  payback: 'border-[3px] border-qc-ink bg-qc-accent text-qc-on-accent',
  free: 'bg-qc-rule-mid text-qc-ink',
}

const SWATCH_CLASSES: Record<Exclude<PaybackBoxState, 'payback'>, string> = {
  loss: 'border-[1.5px] border-qc-secondary',
  paying: 'bg-qc-accent',
  free: 'bg-qc-rule-mid',
}

export function PaybackCalendar({ view }: { view: PaybackCalendarView }) {
  return (
    <div className="max-w-[820px]">
      <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-12" role="img" aria-label={view.sentence}>
        {view.boxes.map((box) => (
          <div
            key={box.month}
            className={cn(
              'qc-print-ink box-border flex h-[50px] flex-col items-center justify-center lg:h-12',
              BOX_CLASSES[box.state],
            )}
          >
            <span className="font-mono text-[13px] font-medium tabular-nums">{box.month}</span>
            <span className="text-[10px] leading-3">{box.tag}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-qc-secondary">
        {view.legend.map((entry) => (
          <span key={entry.state} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn('qc-print-ink box-border inline-block h-3 w-3', SWATCH_CLASSES[entry.state])}
            />
            {entry.label}
          </span>
        ))}
      </div>

      {view.progress ? (
        <div className="mt-[18px]">
          <div className="flex flex-wrap justify-between gap-x-4 text-xs text-qc-secondary">
            <span>{view.progress.label}</span>
            <span className="font-mono tabular-nums">{view.progress.target}</span>
          </div>
          <div className="qc-print-ink mt-1.5 h-[22px] bg-qc-rule-row">
            <div
              className="qc-print-ink h-full bg-qc-accent"
              style={{ width: `${view.progress.widthPercent}%` }}
            />
          </div>
          <div className="mt-1 font-mono text-[13px] tabular-nums text-qc-ink">
            {view.progress.amount} · {view.progress.share}
          </div>
        </div>
      ) : null}

      <p className="mb-0 mt-4 border-y border-qc-rule-mid bg-qc-surface-result px-4 py-3 text-[15px] leading-[22px] text-qc-ink">
        {view.sentence}
      </p>
    </div>
  )
}
