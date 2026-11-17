import { InfoTooltip } from '../../../components/InfoTooltip.tsx'
import { cn } from '../../../lib/cn.ts'
import type { AkisRow } from '../akisView.ts'
import { AKIS_COPY } from '../labels.ts'
import type { DetailedView } from '../viewModel.ts'

/**
 * Akış (DF-85): the base month as a waterfall for readers who do not think in
 * P&L tables. Presentational only — every figure and string arrives formatted
 * from `view.akis` and `view.payback`; nothing is computed here (D1). Payback
 * is the engine's message only; no yatırım payı, kalan or ratio (D2).
 */
export function AkisResults({ view }: { view: DetailedView }) {
  const { akis, payback } = view

  return (
    <div className="qc-report-body border-t border-qc-rule px-[18px] pb-[34px] pt-[26px] lg:px-[30px] lg:pt-[30px]">
      <h2 className="m-0 text-[15px] font-semibold text-qc-ink">{AKIS_COPY.title}</h2>
      <p className="mb-[18px] mt-1.5 max-w-[720px] text-xs leading-relaxed text-qc-secondary">
        {AKIS_COPY.note}
      </p>

      {akis.products.length > 0 ? (
        <div className="mb-5 max-w-[600px]">
          <h3 className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
            {AKIS_COPY.productsTitle}
          </h3>
          <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
            {akis.products.map((product) => (
              <li
                key={product.productId}
                className="flex items-baseline gap-2 rounded border border-qc-rule bg-qc-surface px-2.5 py-1.5 text-xs"
              >
                <span className="text-qc-secondary">{product.name}</span>
                <span className="font-mono tabular-nums text-qc-ink">{product.amountFormatted}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <dl className="m-0 max-w-[600px]">
        {akis.rows.map((row) => (
          <AkisLine
            key={row.key}
            row={row}
            note={row.key === 'payroll' && akis.isPayrollMissing ? AKIS_COPY.payrollMissing : null}
          />
        ))}
      </dl>

      <div className="mt-5 flex max-w-[600px] items-baseline justify-between gap-4 border-t border-qc-rule pt-3.5">
        <span className="text-[13px] text-qc-ink">{AKIS_COPY.payback}</span>
        {payback.available ? (
          <span className="font-mono text-[15px] tabular-nums text-qc-ink">{payback.value}</span>
        ) : (
          <span className="text-right text-xs leading-relaxed text-qc-secondary">{payback.message}</span>
        )}
      </div>
    </div>
  )
}

function AkisLine({ row, note }: { row: AkisRow; note: string | null }) {
  const isTotal = row.kind === 'subtotal' || row.kind === 'result'
  const isResult = row.kind === 'result'
  const isDetail = row.kind === 'detail'

  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-4',
        isDetail ? 'py-1' : 'py-2',
        row.nested && 'pl-4',
        row.kind === 'subtotal' && 'border-t border-qc-rule-mid',
        isResult && 'mt-1 border-t-2 border-qc-ink',
      )}
    >
      <dt
        className={cn(
          'flex min-w-0 flex-wrap items-center',
          isDetail ? 'text-xs text-qc-secondary' : 'text-[13px] text-qc-ink',
          isTotal && 'font-semibold',
        )}
      >
        <span>{row.label}</span>
        {row.hint ? <InfoTooltip text={row.hint} /> : null}
        {note ? <span className="ml-2 text-xs font-normal text-qc-secondary">{note}</span> : null}
      </dt>
      <dd
        className={cn(
          'm-0 shrink-0 font-mono tabular-nums',
          isDetail && 'text-xs text-qc-secondary',
          isResult && 'text-[15px] font-semibold text-qc-accent',
          !isDetail && !isResult && 'text-[13px] text-qc-ink',
          row.kind === 'subtotal' && 'font-semibold',
        )}
      >
        {row.amountFormatted}
      </dd>
    </div>
  )
}
