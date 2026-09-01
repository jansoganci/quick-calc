import type { BreakdownRow } from '../viewModel.ts'

const RULE_COLOR: Record<BreakdownRow['rule'], string> = {
  hair: '#EEF0F2',
  mid: '#D6D9DD',
  ink: '#16181C',
}

type BreakdownTableProps = {
  rows: BreakdownRow[]
}

export function BreakdownTable({ rows }: BreakdownTableProps) {
  if (rows.length === 0) return null

  return (
    <div className="mt-5 grid grid-cols-[9px_1fr_auto_48px] items-center gap-x-[11px] text-sm lg:mt-6 lg:grid-cols-[10px_1fr_auto_58px] lg:gap-x-[13px]">
      <div className="col-span-full h-px bg-[#16181C]" />
      {rows.map((row) => {
        const emphasis = row.weight === '600'
        return (
          <div key={row.key} className="contents">
            <div className="h-10 lg:h-[35px]" style={{ background: row.swatch }} />
            <div className={emphasis ? 'font-semibold text-[#16181C]' : 'text-[#16181C]'}>
              {row.label}
            </div>
            <div
              className={`text-right font-mono tabular-nums ${emphasis ? 'font-semibold text-[#16181C]' : 'text-[#16181C]'}`}
            >
              {row.amount}
            </div>
            <div className="text-right font-mono tabular-nums text-[#8A9199]">{row.share}</div>
            <div className="col-span-full h-px" style={{ background: RULE_COLOR[row.rule] }} />
          </div>
        )
      })}
    </div>
  )
}
