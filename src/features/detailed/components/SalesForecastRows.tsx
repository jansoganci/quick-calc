import { NumberField } from '../../../components/NumberField.tsx'
import { COPY, PRODUCT_LABELS, RECIPE_COPY } from '../labels.ts'
import { DETAILED_SCREEN_LABELS } from '../screens.ts'
import type { ProductRow } from '../formState.ts'

type SalesForecastRowsProps = {
  products: ProductRow[]
  dailyUnits: string
  workingDays: string
  errorFor: (path: string) => string | null
  onBlur: (path: string) => void
  onQuantityChange: (index: number, value: string) => void
  onGoToProducts: () => void
}

export function SalesForecastRows({
  products,
  dailyUnits,
  workingDays,
  errorFor,
  onBlur,
  onQuantityChange,
  onGoToProducts,
}: SalesForecastRowsProps) {
  if (products.length === 0) {
    return (
      <div>
        <p className="text-[13px] leading-relaxed text-qc-ink">{COPY.salesNoProducts}</p>
        <button type="button" className="qc-text-btn is-accent mt-3 min-h-[44px]" onClick={onGoToProducts}>
          {COPY.goToSection(DETAILED_SCREEN_LABELS.menu)}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="hidden gap-2 pb-2 lg:grid lg:grid-cols-[minmax(0,1fr)_140px]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
          {PRODUCT_LABELS.name}
        </span>
        <span className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
          {PRODUCT_LABELS.dailyQuantity}
        </span>
      </div>

      {products.map((product, index) => {
        const name = product.name.trim() === '' ? RECIPE_COPY.unnamedProduct(index + 1) : product.name
        return (
          <div
            key={product.id}
            className="grid grid-cols-1 gap-2 border-t border-qc-rule-row py-2.5 lg:grid-cols-[minmax(0,1fr)_140px] lg:items-center lg:gap-2"
          >
            <span className="truncate text-[15px] text-qc-ink">{name}</span>
            <NumberField
              id={`products.${index}.dailyQuantity`}
              label={PRODUCT_LABELS.dailyQuantity}
              labelHidden="from-lg"
              value={product.dailyQuantity}
              onChange={(value) => onQuantityChange(index, value)}
              onBlur={() => onBlur(`products.${index}.dailyQuantity`)}
              unit=""
              error={errorFor(`products.${index}.dailyQuantity`)}
            />
          </div>
        )
      })}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-qc-rule-row pt-3">
        <button type="button" className="qc-text-btn min-h-[44px]" onClick={onGoToProducts}>
          {COPY.goToSection(DETAILED_SCREEN_LABELS.menu)}
        </button>
        <span className="font-mono text-xs tabular-nums text-qc-secondary">
          {COPY.dailyUnits(dailyUnits)}
        </span>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-qc-secondary">
        {COPY.salesWorkingDaysNote(workingDays)}
      </p>
    </div>
  )
}
