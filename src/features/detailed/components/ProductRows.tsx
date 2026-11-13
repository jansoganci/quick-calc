import { NumberField } from '../../../components/NumberField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { cn } from '../../../lib/cn.ts'
import { formatCount } from '../../../lib/number.ts'
import type { DetailedFormState, ProductRow } from '../formState.ts'
import { COPY, GUARDRAIL_COPY, PRODUCT_LABELS, RECIPE_COPY } from '../labels.ts'
import { useNewestRowOpen } from '../hooks/useNewestRowOpen.ts'
import { recipeAmountText } from '../recipeForm.ts'

const GRID = 'lg:grid-cols-[minmax(8rem,1fr)_minmax(5.5rem,120px)_minmax(5.5rem,120px)_minmax(5.5rem,112px)_88px_48px]'

const NUMERIC_FIELDS = [
  { field: 'normalPrice', label: PRODUCT_LABELS.normalPrice, unit: 'TL', grouped: true },
  { field: 'onlinePrice', label: PRODUCT_LABELS.onlinePrice, unit: 'TL', grouped: true },
] as const

type ProductRowsProps = {
  form: DetailedFormState
  errorFor: (path: string) => string | null
  onBlur: (path: string) => void
  onChange: (index: number, field: keyof Omit<ProductRow, 'id' | 'costSource' | 'recipeLines'>, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
  recipeProductIndex: number | null
  onOpenRecipe: (index: number) => void
}

function costDisplay(form: DetailedFormState, product: ProductRow): { value: string; locked: boolean } {
  if (product.costSource !== 'recipe') {
    return { value: product.unitProductCost, locked: false }
  }
  return { value: recipeAmountText(form, product) ?? '—', locked: true }
}

function collapsedCost(form: DetailedFormState, product: ProductRow): string {
  const cost = costDisplay(form, product)
  const source = product.costSource === 'recipe' ? RECIPE_COPY.sourceRecipe : RECIPE_COPY.sourceManual
  if (cost.value === '' || cost.value === '—') {
    return product.costSource === 'recipe' ? RECIPE_COPY.menuRowCost('—', source) : ''
  }
  return RECIPE_COPY.menuRowCost(cost.value, source)
}

export function ProductRows({
  form,
  errorFor,
  onBlur,
  onChange,
  onAdd,
  onRemove,
  recipeProductIndex,
  onOpenRecipe,
}: ProductRowsProps) {
  const products = form.products
  const rows = useNewestRowOpen(products.map((product) => product.id))

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 pb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
          {RECIPE_COPY.menuHeading}
        </p>
        <span className="font-mono text-xs tabular-nums text-qc-secondary">
          {COPY.productCount(products.length)}
        </span>
      </div>

      <div className={cn('hidden gap-2 pb-2 lg:grid', GRID)}>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
          {PRODUCT_LABELS.name}
        </span>
        {NUMERIC_FIELDS.map((column) => (
          <span
            key={column.field}
            className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary"
          >
            {column.label}
          </span>
        ))}
        <span className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
          {PRODUCT_LABELS.unitProductCost}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
          {RECIPE_COPY.recipeEyebrow}
        </span>
        <span />
      </div>

      {products.map((product, index) => {
        const open = rows.isOpen(product.id)
        const cost = costDisplay(form, product)
        const recipeOpen = recipeProductIndex === index
        const hasRecipe = product.costSource === 'recipe'

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
              className="flex min-h-[44px] w-full items-center justify-between gap-3 py-1.5 text-left lg:hidden"
            >
              <span className="truncate text-[15px] text-qc-ink">
                {product.name.trim() === '' ? RECIPE_COPY.unnamedProduct(index + 1) : product.name}
              </span>
              <span className="flex items-center gap-2.5">
                {open ? null : (
                  <span className="text-right font-mono text-xs tabular-nums text-qc-secondary">
                    {collapsedCost(form, product)}
                  </span>
                )}
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
                'grid grid-cols-2 gap-3 pb-3 lg:grid lg:gap-2 lg:pb-0',
                GRID,
                'lg:items-center',
                open ? 'grid' : 'hidden lg:grid',
              )}
            >
              <div className="col-span-2 lg:col-span-1">
                <TextField
                  id={`products.${index}.name`}
                  label={PRODUCT_LABELS.name}
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
              <NumberField
                id={`products.${index}.unitProductCost`}
                label={PRODUCT_LABELS.unitProductCost}
                labelHidden="from-lg"
                value={cost.value}
                onChange={(value) => onChange(index, 'unitProductCost', value)}
                onBlur={() => onBlur(`products.${index}.unitProductCost`)}
                unit="TL"
                error={errorFor(`products.${index}.unitProductCost`)}
                grouped
                readOnly={cost.locked}
              />
              <div className="hidden lg:block">
                <button
                  type="button"
                  className={cn(
                    'qc-text-btn',
                    recipeOpen && 'font-medium text-qc-ink underline decoration-2 underline-offset-4',
                  )}
                  onClick={() => onOpenRecipe(index)}
                >
                  {hasRecipe ? RECIPE_COPY.openRecipe : RECIPE_COPY.openRecipeNewDesktop}
                </button>
              </div>
              <button
                type="button"
                className="qc-text-btn is-muted col-span-2 text-left lg:col-span-1 lg:text-right"
                onClick={() => onRemove(index)}
                disabled={products.length === 1}
              >
                {COPY.remove}
              </button>
              <div className="col-span-2 border-t border-qc-rule-row pt-3 lg:hidden">
                {hasRecipe ? (
                  <>
                    <p className="text-xs text-qc-secondary">
                      {RECIPE_COPY.costFromRecipeNote(formatCount(product.recipeLines.length))}
                    </p>
                    <button
                      type="button"
                      className="qc-text-btn mt-1"
                      onClick={() => {
                        if (!rows.isOpen(product.id)) rows.toggle(product.id)
                        onOpenRecipe(index)
                      }}
                    >
                      {RECIPE_COPY.openRecipe}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-qc-secondary">{RECIPE_COPY.costTypedNote}</p>
                    <button
                      type="button"
                      className="qc-text-btn mt-1"
                      onClick={() => {
                        if (!rows.isOpen(product.id)) rows.toggle(product.id)
                        onOpenRecipe(index)
                      }}
                    >
                      {RECIPE_COPY.openRecipeNew}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}

      <div className="flex items-center justify-between gap-3 border-t border-qc-rule-row pt-3">
        <button type="button" className="qc-text-btn is-accent" onClick={onAdd}>
          {COPY.addProduct}
        </button>
        <span className="font-mono text-xs tabular-nums text-qc-secondary">
          {COPY.productCount(products.length)}
        </span>
      </div>

      <p className="mt-3.5 max-w-[600px] text-xs leading-relaxed text-qc-secondary">
        {GUARDRAIL_COPY.productCostScope}
      </p>
    </div>
  )
}
