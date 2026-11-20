import { useState } from 'react'
import { NumberField } from '../../../components/NumberField.tsx'
import { bulkRate, type ProductPriceWrite } from '../bulkPriceView.ts'
import { buildBulkIngredientRows, type IngredientPriceWrite } from '../bulkIngredientView.ts'
import type { IngredientRow } from '../formState.ts'
import { BULK_INGREDIENT_COPY, BULK_PRICE_COPY, RECIPE_COPY } from '../labels.ts'
import type { PricePreview as PricePreviewModel, PriceSuggestionField } from '../recipePreview.ts'
import { PricePreview, PricePreviewDesktop } from './PricePreview.tsx'

export function BulkIngredientRaise({
  ingredients,
  onApply,
  ingredientStatus,
  onUndoIngredient,
  preview,
  onApplyPrice,
  onApplyPrices,
  suggestionStatus,
  onUndoPrices,
  onDone,
}: {
  ingredients: readonly IngredientRow[]
  onApply: (writes: IngredientPriceWrite[], count: number) => void
  ingredientStatus: number | null
  onUndoIngredient: () => void
  preview: PricePreviewModel | null
  onApplyPrice: (index: number, field: PriceSuggestionField, value: string) => void
  onApplyPrices: (writes: ProductPriceWrite[], kind: 'bulkCostSuggestions', count: number) => void
  suggestionStatus: number | null
  onUndoPrices: () => void
  onDone: () => void
}) {
  const [open, setOpen] = useState(false)
  const [rateText, setRateText] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const rate = bulkRate(rateText)
  const view = buildBulkIngredientRows(ingredients, selectedIds, rate)

  function openPanel() {
    setSelectedIds(new Set(ingredients.map((ingredient) => ingredient.id)))
    setRateText('')
    setOpen(true)
  }

  return (
    <div className="mb-3 mt-2 text-[13px]">
      <button
        type="button"
        className="qc-text-btn is-accent min-h-[44px] lg:min-h-0"
        aria-expanded={open}
        aria-controls={open ? 'bulk-ingredient-panel' : undefined}
        onClick={() => open ? setOpen(false) : openPanel()}
      >
        {BULK_INGREDIENT_COPY.open}
      </button>
      {ingredientStatus !== null ? (
        <p className="mt-1 text-xs text-qc-secondary" role="status">
          {BULK_INGREDIENT_COPY.status(ingredientStatus)}{' '}
          <button type="button" className="qc-text-btn is-accent min-h-[44px] lg:min-h-0" onClick={onUndoIngredient}>
            {BULK_PRICE_COPY.undo}
          </button>
        </p>
      ) : null}
      {preview ? (
        <div className="mt-3">
          <div className="lg:hidden">
            <PricePreview
              preview={preview}
              onApply={onApplyPrice}
              onApplyAll={(writes) => onApplyPrices(writes, 'bulkCostSuggestions', writes.length)}
              bulkStatus={suggestionStatus}
              onUndo={onUndoPrices}
              showApplyAll
            />
            <button type="button" className="qc-text-btn mt-3 min-h-[44px]" onClick={onDone}>
              {RECIPE_COPY.done}
            </button>
          </div>
          <PricePreviewDesktop
            preview={preview}
            onApply={onApplyPrice}
            onApplyAll={(writes) => onApplyPrices(writes, 'bulkCostSuggestions', writes.length)}
            bulkStatus={suggestionStatus}
            onUndo={onUndoPrices}
            onDone={onDone}
            showApplyAll
          />
        </div>
      ) : null}
      {open ? (
        <div id="bulk-ingredient-panel" className="mt-2 border-t border-qc-rule-row pt-3">
          <div className="max-w-[160px]">
            <NumberField id="bulk-ingredient-rate" label={BULK_INGREDIENT_COPY.rate} value={rateText} onChange={setRateText} unit="%" />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4">
            <button type="button" className="qc-text-btn min-h-[44px] lg:min-h-0" onClick={() => setSelectedIds(new Set(ingredients.map((ingredient) => ingredient.id)))}>{BULK_INGREDIENT_COPY.selectAll}</button>
            <button type="button" className="qc-text-btn min-h-[44px] lg:min-h-0" onClick={() => setSelectedIds(new Set())}>{BULK_INGREDIENT_COPY.selectNone}</button>
          </div>
          <div className="border-t border-qc-rule-row">
            {view.rows.map((row) => (
              <label key={row.id} className="grid min-h-[44px] min-w-0 grid-cols-[24px_minmax(0,1fr)] items-center gap-x-2 border-b border-qc-rule-row py-2 lg:grid-cols-[24px_minmax(0,1fr)_minmax(0,2fr)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-qc-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-qc-accent"
                  checked={row.selected}
                  aria-label={BULK_INGREDIENT_COPY.selection(row.name)}
                  onChange={(event) => setSelectedIds((current) => {
                    const next = new Set(current)
                    if (event.target.checked) next.add(row.id)
                    else next.delete(row.id)
                    return next
                  })}
                />
                <span className="min-w-0 break-words text-[13px] text-qc-ink">{row.name}</span>
                <span className="col-start-2 min-w-0 break-words font-mono text-xs tabular-nums text-qc-secondary lg:col-start-3">{row.preview}</span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-qc-secondary">{BULK_INGREDIENT_COPY.note}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4">
            <button
              type="button"
              className="min-h-[44px] rounded bg-qc-accent px-4 text-sm font-medium text-qc-on-accent hover:bg-qc-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-qc-accent disabled:bg-qc-disabled disabled:text-qc-subtle lg:min-h-[36px]"
              disabled={rate === null || view.ingredientCount === 0}
              onClick={() => {
                onApply(view.writes, view.ingredientCount)
                setOpen(false)
              }}
            >
              {BULK_INGREDIENT_COPY.apply(view.ingredientCount)}
            </button>
            <button type="button" className="qc-text-btn min-h-[44px] lg:min-h-0" onClick={() => setOpen(false)}>{BULK_INGREDIENT_COPY.cancel}</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
