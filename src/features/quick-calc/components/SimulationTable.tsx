import type { QuickView } from '../viewModel.ts'

type SimulationTableProps = {
  rows: QuickView['simulation']
}

export function SimulationTable({ rows }: SimulationTableProps) {
  return (
    <div>
      <div className="mb-[13px] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A9199]">
        Satış hacmi simülasyonu
      </div>
      <div className="hidden grid-cols-[1fr_auto_auto_auto] items-center gap-x-6 text-sm lg:grid">
        <div className="text-xs text-[#8A9199]">Senaryo</div>
        <div className="text-right text-xs text-[#8A9199]">Günlük satış</div>
        <div className="text-right text-xs text-[#8A9199]">Satış başına maliyet</div>
        <div className="text-right text-xs text-[#8A9199]">Aylık kazanç</div>
        <div className="col-span-full mt-2 h-px bg-[#16181C]" />
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <div className={`py-2.5 ${row.isCurrent ? 'font-semibold text-[#16181C]' : 'text-[#5B6169]'}`}>
              {row.scenario}
            </div>
            <div className={`py-2.5 text-right font-mono tabular-nums ${row.isCurrent ? 'font-semibold text-[#16181C]' : 'text-[#5B6169]'}`}>
              {row.volume}
            </div>
            <div className={`py-2.5 text-right font-mono tabular-nums ${row.isCurrent ? 'font-semibold text-[#16181C]' : 'text-[#5B6169]'}`}>
              {row.cost}
            </div>
            <div className={`py-2.5 text-right font-mono tabular-nums ${row.isCurrent ? 'font-semibold text-[#16181C]' : 'text-[#5B6169]'}`}>
              {row.earnings}
            </div>
            <div className="col-span-full h-px" style={{ background: row.rule }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-x-3 text-[13px] lg:hidden">
        <div className="text-[11px] text-[#8A9199]">Günlük</div>
        <div className="text-right text-[11px] text-[#8A9199]">Birim maliyet</div>
        <div className="text-right text-[11px] text-[#8A9199]">Aylık kazanç</div>
        <div className="col-span-full mt-1.5 h-px bg-[#16181C]" />
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <div className={`py-[11px] font-mono tabular-nums ${row.isCurrent ? 'font-semibold text-[#16181C]' : 'text-[#5B6169]'}`}>
              {row.volume}
            </div>
            <div className={`py-[11px] text-right font-mono tabular-nums ${row.isCurrent ? 'font-semibold text-[#16181C]' : 'text-[#5B6169]'}`}>
              {row.cost}
            </div>
            <div className={`py-[11px] text-right font-mono tabular-nums ${row.isCurrent ? 'font-semibold text-[#16181C]' : 'text-[#5B6169]'}`}>
              {row.earnings}
            </div>
            <div className="col-span-full h-px" style={{ background: row.rule }} />
          </div>
        ))}
      </div>
    </div>
  )
}
