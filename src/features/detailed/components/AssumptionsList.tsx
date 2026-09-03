import { COPY } from '../labels.ts'
import type { AssumptionRow } from '../resultView.ts'

/**
 * Mandatory (spec §16.4): every assumption that shaped the result, including the
 * three annual rates when they are 0%. A hidden 0% would mislead.
 */
export function AssumptionsList({ rows }: { rows: AssumptionRow[] }) {
  return (
    <div className="max-w-[900px] lg:grid lg:grid-cols-2 lg:gap-x-10">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex justify-between gap-3 border-t border-qc-rule-row py-2 last:border-b"
        >
          <span className="text-[13px] text-qc-secondary">{row.label}</span>
          <span className="font-mono text-[13px] tabular-nums text-qc-ink">{row.value}</span>
        </div>
      ))}
      <p className="col-span-2 mt-3 text-xs leading-relaxed text-qc-muted">{COPY.resultLimitation}</p>
    </div>
  )
}
