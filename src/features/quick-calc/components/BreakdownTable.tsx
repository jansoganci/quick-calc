import type { QuickView } from '../viewModel.ts'

type BreakdownTableProps = {
  rows: QuickView['breakdown']
}

export function BreakdownTable({ rows }: BreakdownTableProps) {
  if (rows.length === 0) return null

  return (
    <div className="mt-5 grid grid-cols-[9px_1fr_auto_48px] items-center gap-x-[11px] text-sm lg:mt-6 lg:grid-cols-[10px_1fr_auto_58px] lg:gap-x-[13px]">
      <div className="col-span-full h-px bg-[#16181C]" />
      {rows.map((row) => (
        <div key={row.key} className="contents">
          <div className="h-10 lg:h-[35px]" style={{ background: row.color }} />
          <div className={row.emphasis ? 'font-semibold text-[#16181C]' : 'text-[#16181C]'}>
            {row.label}
          </div>
          <div
            className={`text-right font-mono tabular-nums ${row.emphasis ? 'font-semibold text-[#16181C]' : 'text-[#16181C]'}`}
          >
            {row.amountFormatted}
          </div>
          <div className="text-right font-mono tabular-nums text-[#8A9199]">{row.shareFormatted}</div>
          <div className="col-span-full h-px" style={{ background: row.rule }} />
        </div>
      ))}
    </div>
  )
}
