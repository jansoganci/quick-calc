import { QUICK_DEFAULTS } from '../viewModel.ts'
import { assumptionsSummary } from '../viewModel.ts'
import { formatPercent } from '../../../lib/percent.ts'

export function AssumptionsStrip() {
  return (
    <div className="collapse qc-assumptions">
      <input type="checkbox" aria-label="Varsayımları göster" />
      <div className="collapse-title">
        <span>Varsayımlar</span>
        <span className="inline-flex items-center gap-[9px]">
          <span className="font-mono text-xs text-[#8A9199]">{assumptionsSummary()}</span>
          <span className="text-[10px] text-[#8A9199]" aria-hidden="true">▾</span>
        </span>
      </div>
      <div className="collapse-content text-[13px] leading-relaxed text-[#5B6169]">
        <p>Aylık çalışma günü: {QUICK_DEFAULTS.operatingDaysPerMonth} gün</p>
        <p>Yatırım geri kazanım süresi: {QUICK_DEFAULTS.capexRecoveryPeriodMonths} ay</p>
        <p>Kartlı ödeme payı: {formatPercent(QUICK_DEFAULTS.cardPaymentShare)}</p>
        <p>POS komisyonu: {formatPercent(QUICK_DEFAULTS.posCommissionRate)}</p>
        <p>KDV oranı: {formatPercent(QUICK_DEFAULTS.vatRate)}</p>
      </div>
    </div>
  )
}
