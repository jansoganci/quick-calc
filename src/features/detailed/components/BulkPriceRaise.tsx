import { useState } from 'react'
import { NumberField } from '../../../components/NumberField.tsx'
import { BULK_PRICE_COPY } from '../labels.ts'
import { buildBulkPriceRows, bulkRate, type BulkPriceChannel, type ProductPriceWrite } from '../bulkPriceView.ts'
import type { ProductRow } from '../formState.ts'

export function BulkPriceRaise({
  products,
  onApply,
  status,
  onUndo,
}: {
  products: readonly ProductRow[]
  onApply: (writes: ProductPriceWrite[], kind: 'menu', count: number) => void
  status: number | null
  onUndo: () => void
}) {
  const [open, setOpen] = useState(false)
  const [rateText, setRateText] = useState('')
  const [channel, setChannel] = useState<BulkPriceChannel>('both')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const rate = bulkRate(rateText)
  const view = buildBulkPriceRows(products, selectedIds, channel, rate)

  function openPanel() {
    setSelectedIds(new Set(products.map((product) => product.id)))
    setRateText('')
    setChannel('both')
    setOpen(true)
  }

  return (
    <div className="mb-3 text-[13px]">
      <button
        type="button"
        className="qc-text-btn is-accent min-h-[44px] lg:min-h-0"
        aria-expanded={open}
        aria-controls={open ? 'bulk-price-panel' : undefined}
        onClick={() => open ? setOpen(false) : openPanel()}
      >
        {BULK_PRICE_COPY.open}
      </button>
      {status !== null ? (
        <p className="mt-1 text-xs text-qc-secondary" role="status">
          {BULK_PRICE_COPY.menuStatus(status)}{' '}
          <button type="button" className="qc-text-btn is-accent min-h-[44px] lg:min-h-0" onClick={onUndo}>
            {BULK_PRICE_COPY.undo}
          </button>
        </p>
      ) : null}
      {open ? (
        <div id="bulk-price-panel" className="mt-2 border-t border-qc-rule-row pt-3">
          <div className="grid gap-3 lg:grid-cols-[160px_minmax(0,1fr)] lg:items-end">
            <NumberField id="bulk-price-rate" label={BULK_PRICE_COPY.rate} value={rateText} onChange={setRateText} unit="%" />
            <div>
              <p className="text-xs text-qc-secondary">{BULK_PRICE_COPY.channel}</p>
              <div className="qc-segment" role="group" aria-label={BULK_PRICE_COPY.channel}>
                {(['both', 'normalPrice', 'onlinePrice'] as const).map((option) => (
                  <button key={option} type="button" className="qc-segment-btn" aria-pressed={channel === option} onClick={() => setChannel(option)}>
                    {BULK_PRICE_COPY[option]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4">
            <button type="button" className="qc-text-btn min-h-[44px] lg:min-h-0" onClick={() => setSelectedIds(new Set(products.map((product) => product.id)))}>{BULK_PRICE_COPY.selectAll}</button>
            <button type="button" className="qc-text-btn min-h-[44px] lg:min-h-0" onClick={() => setSelectedIds(new Set())}>{BULK_PRICE_COPY.selectNone}</button>
          </div>
          <div className="border-t border-qc-rule-row">
            {view.rows.map((row) => (
              <label key={row.id} className="grid min-h-[44px] min-w-0 grid-cols-[24px_minmax(0,1fr)] items-center gap-x-2 border-b border-qc-rule-row py-2 lg:grid-cols-[24px_minmax(0,1fr)_minmax(0,2fr)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-qc-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-qc-accent"
                  checked={row.selected}
                  aria-label={BULK_PRICE_COPY.productSelection(row.name)}
                  onChange={(event) => setSelectedIds((current) => {
                    const next = new Set(current)
                    if (event.target.checked) next.add(row.id)
                    else next.delete(row.id)
                    return next
                  })}
                />
                <span className="min-w-0 text-[13px] text-qc-ink">{row.name}</span>
                <span className="col-start-2 min-w-0 break-words font-mono text-xs tabular-nums text-qc-secondary lg:col-start-3">
                  {row.previews.map((preview) => <span key={preview.field} className="block">{preview.text}</span>)}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-qc-secondary">{BULK_PRICE_COPY.note}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4">
            <button
              type="button"
              className="min-h-[44px] rounded bg-qc-accent px-4 text-sm font-medium text-qc-on-accent hover:bg-qc-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-qc-accent disabled:bg-qc-disabled disabled:text-qc-subtle lg:min-h-[36px]"
              disabled={rate === null || view.productCount === 0}
              onClick={() => {
                onApply(view.writes, 'menu', view.productCount)
                setOpen(false)
              }}
            >
              {BULK_PRICE_COPY.apply(view.productCount)}
            </button>
            <button type="button" className="qc-text-btn min-h-[44px] lg:min-h-0" onClick={() => setOpen(false)}>{BULK_PRICE_COPY.cancel}</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
