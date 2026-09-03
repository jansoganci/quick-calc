import { COPY } from '../labels.ts'
import type { MonthRow } from '../resultView.ts'

/**
 * Opt-in, and deliberately so: 24–36 rows is exactly where a feasibility tool starts
 * feeling like accounting software. The charts carry the story; this answers "show
 * me the numbers" for the user who asks.
 */
export function MonthTable({ rows }: { rows: MonthRow[] }) {
  return (
    <div className="mt-4">
      <div className="grid grid-cols-[56px_1fr_1fr] gap-3 border-b border-qc-ink pb-2 lg:grid-cols-[72px_repeat(5,minmax(0,1fr))]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
          {COPY.monthColumn}
        </span>
        <span className="hidden text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted lg:block">
          {COPY.unitsColumn}
        </span>
        <span className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
          {COPY.netRevenue}
        </span>
        <span className="hidden text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted lg:block">
          {COPY.contribution}
        </span>
        <span className="hidden text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted lg:block">
          {COPY.fixedCostColumn}
        </span>
        <span className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
          {COPY.monthlyOperatingResult}
        </span>
      </div>

      {rows.map((row) => (
        <div
          key={row.month}
          className="grid grid-cols-[56px_1fr_1fr] gap-3 border-b border-qc-rule-row py-2 lg:grid-cols-[72px_repeat(5,minmax(0,1fr))]"
        >
          <span className="font-mono text-[13px] tabular-nums text-qc-secondary">{row.month}</span>
          <span className="hidden text-right font-mono text-[13px] tabular-nums text-qc-secondary lg:block">
            {row.units}
          </span>
          <span className="text-right font-mono text-[13px] tabular-nums text-qc-secondary">
            {row.netRevenue}
          </span>
          <span className="hidden text-right font-mono text-[13px] tabular-nums text-qc-secondary lg:block">
            {row.contribution}
          </span>
          <span className="hidden text-right font-mono text-[13px] tabular-nums text-qc-secondary lg:block">
            {row.fixedCost}
          </span>
          <span className="text-right font-mono text-[13px] font-medium tabular-nums text-qc-ink">
            {row.operatingResult}
          </span>
        </div>
      ))}
    </div>
  )
}
