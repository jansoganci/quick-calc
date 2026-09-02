import { COPY } from '../labels.ts'

/**
 * Masthead: product name and the current calculation mode, nothing else.
 * Not sticky, so it leaves the result column's own sticky offsets alone.
 */
export function AppHeader() {
  return (
    <header className="flex h-[52px] items-center justify-between gap-4 border-b border-qc-rule px-[18px] lg:h-14 lg:px-[30px]">
      <span className="text-sm font-semibold tracking-[-0.005em] text-qc-ink lg:text-[15px]">
        {COPY.productName}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
        {COPY.modeName}
      </span>
    </header>
  )
}
