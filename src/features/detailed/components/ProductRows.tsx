import { NumberField } from '../../../components/NumberField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { cn } from '../../../lib/cn.ts'
import type { ProductRow } from '../formState.ts'
import { COPY, GUARDRAIL_COPY, PRODUCT_LABELS } from '../labels.ts'
import { useNewestRowOpen } from '../hooks/useNewestRowOpen.ts'

const GRID = 'lg:grid-cols-[1fr_104px_104px_92px_104px_56px]'

const NUMERIC_FIELDS = [
  { field: 'normalPrice', label: PRODUCT_LABELS.normalPrice, unit: 'TL', grouped: true },
  { field: 'onlinePrice', label: PRODUCT_LABELS.onlinePrice, unit: 'TL', grouped: true },
  { field: 'dailyQuantity', label: PRODUCT_LABELS.dailyQuantity, unit: '', grouped: false },
  { field: 'unitProductCost', label: PRODUCT_LABELS.unitProductCost, unit: 'TL', grouped: true },
] as const

type ProductRowsProps = {
  products: ProductRow[]
  dailyUnits: string
  errorFor: (path: string) => string | null
  onBlur: (path: string) => void
  onChange: (index: number, field: keyof Omit<ProductRow, 'id'>, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

export function ProductRows({
  products,
  dailyUnits,
  errorFor,
  onBlur,
  onChange,
  onAdd,
  onRemove,
}: ProductRowsProps) {
  const rows = useNewestRowOpen(products.map((product) => product.id))

  return (
    <div>
      <div className={cn('hidden gap-2.5 pb-2 lg:grid', GRID)}>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
          {PRODUCT_LABELS.name}
        </span>
        {NUMERIC_FIELDS.map((column) => (
          <span
            key={column.field}
            className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted"
          >
            {column.label}
          </span>
        ))}
        <span />
      </div>

      {products.map((product, index) => {
        const open = rows.isOpen(product.id)
        const summary = [product.normalPrice ? `${product.normalPrice} TL` : null,
          product.dailyQuantity ? `${product.dailyQuantity} adet` : null]
          .filter(Boolean)
          .join(' · ')

        return (
          <div
            key={product.id}
            ref={rows.rowRef(product.id)}
            className="border-t border-qc-rule-row lg:py-[9px]"
          >
            <button
              type="button"
              onClick={() => rows.toggle(product.id)}
              aria-expanded={open}
              className="flex min-h-[44px] w-full items-center justify-between gap-3 text-left lg:hidden"
            >
              <span className="text-[15px] text-qc-ink">
                {product.name.trim() === '' ? `${PRODUCT_LABELS.name} ${index + 1}` : product.name}
              </span>
              <span className="flex items-center gap-2.5">
                <span className="font-mono text-xs tabular-nums text-qc-muted">{summary}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-block h-[7px] w-[7px] border-b-[1.5px] border-r-[1.5px] border-qc-muted',
                    open ? '-translate-y-1 rotate-[-135deg]' : '-translate-y-0.5 rotate-45',
                  )}
                />
              </span>
            </button>

            <div
              className={cn(
                'grid grid-cols-2 gap-3 pb-3 lg:grid lg:gap-2.5 lg:pb-0',
                GRID,
                'lg:items-center',
                open ? 'grid' : 'hidden lg:grid',
              )}
            >
              <div className="col-span-2 lg:col-span-1">
                <TextField
                  id={`products.${index}.name`}
                  label={COPY.productName}
                  labelHidden="from-lg"
                  value={product.name}
                  onChange={(value) => onChange(index, 'name', value)}
                  onBlur={() => onBlur(`products.${index}.name`)}
                  error={errorFor(`products.${index}.name`)}
                />
              </div>
              {NUMERIC_FIELDS.map((column) => (
                <NumberField
                  key={column.field}
                  id={`products.${index}.${column.field}`}
                  label={column.label}
                  labelHidden="from-lg"
                  value={product[column.field]}
                  onChange={(value) => onChange(index, column.field, value)}
                  onBlur={() => onBlur(`products.${index}.${column.field}`)}
                  unit={column.unit}
                  error={errorFor(`products.${index}.${column.field}`)}
                  grouped={column.grouped}
                />
              ))}
              <button
                type="button"
                className="qc-text-btn is-muted col-span-2 text-left lg:col-span-1 lg:text-right"
                onClick={() => onRemove(index)}
                disabled={products.length === 1}
              >
                {COPY.remove}
              </button>
            </div>
          </div>
        )
      })}

      <div className="flex items-center justify-between gap-3 border-t border-qc-rule-row pt-3">
        <button type="button" className="qc-text-btn is-accent" onClick={onAdd}>
          {COPY.addProduct}
        </button>
        <span className="font-mono text-xs tabular-nums text-qc-muted">
          {COPY.productCount(products.length)} · {COPY.dailyUnits(dailyUnits)}
        </span>
      </div>

      <p className="mt-3.5 max-w-[600px] text-xs leading-relaxed text-qc-muted">
        {GUARDRAIL_COPY.productCostScope}
      </p>
    </div>
  )
}
