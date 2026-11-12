import { cn } from '../../../lib/cn.ts'
import { COPY, PRODUCT_LABELS } from '../labels.ts'
import type { SalonMenuRow } from '../insightsView.ts'

const COLUMNS = [
  { key: 'sellingPrice', label: COPY.salonSellingPrice },
  { key: 'unitProductCost', label: COPY.salonCost },
  { key: 'foodCostRate', label: COPY.salonFoodCost },
  { key: 'remainingPerUnit', label: COPY.salonRemaining },
] as const

type SalonMenuTableProps = {
  products: SalonMenuRow[]
  weakestNote: string | null
}

export function SalonMenuTable({ products, weakestNote }: SalonMenuTableProps) {
  return (
    <div>
      <div className="hidden lg:block">
        <div className="grid grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
          <span className="pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
            {PRODUCT_LABELS.name}
          </span>
          {COLUMNS.map((column) => (
            <span
              key={column.key}
              className="pb-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary"
            >
              {column.label}
            </span>
          ))}

          {products.map((row, index) => (
            <SalonCells
              key={row.productId}
              row={row}
              isFirst={index === 0}
              isLast={index === products.length - 1}
            />
          ))}
        </div>
      </div>

      <div className="lg:hidden">
        {products.map((row, index) => (
          <div
            key={row.productId}
            className={cn(
              'py-2.5',
              index === 0 ? 'border-t border-qc-rule-mid' : 'border-t border-qc-rule-row',
              index === products.length - 1 && 'border-b border-qc-rule',
            )}
          >
            <div className="flex items-baseline justify-between gap-2.5">
              <span className="text-sm font-semibold text-qc-ink">{row.name}</span>
              <span className="font-mono text-xs tabular-nums text-qc-secondary">
                {row.sellingPrice} TL
              </span>
            </div>
            {COLUMNS.filter((column) => column.key !== 'sellingPrice' && column.key !== 'remainingPerUnit').map(
              (column) => (
                <div key={column.key} className="flex justify-between gap-2.5 py-[5px]">
                  <span className="text-[13px] text-qc-secondary">{column.label}</span>
                  <span className="font-mono text-[13px] tabular-nums text-qc-ink">
                    {row[column.key]}
                  </span>
                </div>
              ),
            )}
            <div className="mt-1 flex justify-between gap-2.5 border-t border-qc-rule-row pt-1.5">
              <span className="text-[13px] font-semibold text-qc-ink">{COPY.salonRemaining}</span>
              <span className="font-mono text-[13px] font-semibold tabular-nums text-qc-ink">
                {row.remainingPerUnit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {weakestNote ? (
        <p className="mt-2.5 text-[13px] leading-relaxed text-qc-ink">{weakestNote}</p>
      ) : null}
      <p className="mt-2.5 text-[11px] leading-relaxed text-qc-secondary">{COPY.salonMenuCaption}</p>
    </div>
  )
}

function SalonCells({
  row,
  isFirst,
  isLast,
}: {
  row: SalonMenuRow
  isFirst: boolean
  isLast: boolean
}) {
  const border = isFirst
    ? 'border-t border-qc-ink border-b border-qc-rule-row'
    : isLast
      ? 'border-b border-qc-rule-mid'
      : 'border-b border-qc-rule-row'

  return (
    <>
      <span className={cn('py-2.5 text-sm text-qc-ink', border)}>{row.name}</span>
      {COLUMNS.map((column) => (
        <span
          key={column.key}
          className={cn(
            'py-2.5 text-right font-mono text-sm tabular-nums',
            column.key === 'remainingPerUnit' && row.isWeakest
              ? 'font-medium text-qc-ink'
              : column.key === 'remainingPerUnit'
                ? 'text-qc-ink'
                : 'text-qc-secondary',
            border,
          )}
        >
          {row[column.key]}
        </span>
      ))}
    </>
  )
}
