import { cn } from '../../../lib/cn.ts'
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
        'bg-[#FCFCFD] px-[18px] py-5 lg:sticky lg:top-0 lg:max-h-screen lg:self-start lg:overflow-y-auto lg:px-[34px] lg:py-[30px] lg:pb-[34px]',
        hasCalculated && view && 'qc-enter',
        liveFlash && 'qc-live',
      )}
    >
      {!view ? (
        <EmptyResult />
      ) : (
        <>
          <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A9199] lg:hidden">
            Sonuç
          </div>
          <p className="max-w-[610px] text-lg leading-normal tracking-tight text-[#16181C] text-pretty lg:text-[21px] lg:leading-normal">
            {view.headline}
          </p>
          {view.zeroVolumeNote ? (
            <p className="mt-3 text-[13px] leading-relaxed text-[#5B6169]">{view.zeroVolumeNote}</p>
          ) : null}
          <div className="mt-3.5 lg:mt-3.5">
            <button
              type="button"
              onClick={onCopy}
              className="bg-transparent p-0 py-[11px] text-[13px] text-[#5B6169] hover:text-[#16181C] hover:underline lg:py-0"
            >
              {copied ? 'Kopyalandı' : 'Özeti Kopyala'}
            </button>
          </div>

          <div className="my-5 h-px bg-[#E3E5E8] lg:my-[26px]" />

          {view.headlineCost ? (
            <div className="flex items-end justify-between gap-[30px]">
              <div>
                <div className="mb-1.5 text-[13px] text-[#5B6169] lg:mb-[7px]">
                  Satış başına tahmini toplam maliyet
                </div>
                <div className="font-mono text-4xl font-medium leading-none tracking-tight text-[#1D3A5F] tabular-nums lg:text-[44px]">
                  {view.headlineCost.replace(' TL', '')}{' '}
                  <span className="text-lg font-normal text-[#5B6169] lg:text-[21px]">TL</span>
                </div>
              </div>
              <div className="hidden pb-[3px] text-right lg:block">
                <div className="mb-1.5 text-[13px] text-[#5B6169]">Ortalama satış</div>
                <div className="font-mono text-[19px] tabular-nums text-[#16181C]">{view.ticketFormatted}</div>
              </div>
            </div>
          ) : null}

          <StackedBar bar={view.bar} ticketFormatted={view.ticketFormatted} />
          <BreakdownTable rows={view.breakdown} />

          <div className="mb-[18px] mt-6 h-px bg-[#E3E5E8] lg:mb-6 lg:mt-[30px]" />
          <OutputStrip outputs={view.outputs} />
          <p className="mt-[14px] max-w-[620px] text-xs leading-relaxed text-[#8A9199] text-pretty lg:mt-[15px]">
            Aylık işletme kazancı vergi öncesi bir tutardır. Kurumlar vergisi, finansman giderleri ve amortisman hesaba katılmamıştır.
          </p>

          <div className="mb-[18px] mt-6 h-px bg-[#E3E5E8] lg:mb-5 lg:mt-[30px]" />
          <SimulationTable rows={view.simulation} />
          <p className="mt-3 max-w-[620px] text-xs leading-relaxed text-[#8A9199] text-pretty lg:mt-[13px]">
            Simülasyonda kira, personel ve diğer sabit giderlerin değişmediği varsayılmıştır. Satış hacmi arttıkça satış başına maliyetin düşmesinin nedeni budur.
          </p>
        </>
      )}
    </div>
  )
}

function EmptyResult() {
  return (
    <>
      <p className="text-[13px] leading-relaxed text-[#5B6169] text-pretty">
        Hesapla’dan önce sonuç alanında hiçbir sayı gösterilmez. Tüm alanları doldurup Hesapla’ya bastığınızda satış başına maliyet, işletmede kalan tutar ve aylık kazanç burada görünür.
      </p>
      <StackedBar bar={[]} ticketFormatted="—" />
    </>
  )
}
