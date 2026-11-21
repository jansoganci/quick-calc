import { useState } from 'react'
import { NumberField } from '../../../components/NumberField.tsx'
import type { ProductPriceWrite } from '../bulkPriceView.ts'
import { buildIngredientPriceRows, type IngredientMonthlyEffect, type IngredientPriceWrite } from '../bulkIngredientView.ts'
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
  hasCalculated,
  isMonthlyValid,
  monthlyEffect,
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
  hasCalculated: boolean
  isMonthlyValid: boolean
  monthlyEffect: IngredientMonthlyEffect | null
}) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState<Record<string, string>>({})
  const view = buildIngredientPriceRows(ingredients, typed)

  function closePanel() {
    setOpen(false)
    setTyped({})
  }

  const monthlyLine = !hasCalculated && isMonthlyValid ? (
    <p className="mb-3 text-xs text-qc-secondary">{BULK_INGREDIENT_COPY.monthlyBeforeCalculate}</p>
  ) : monthlyEffect ? (
    <div className="mb-3 border-b border-qc-rule-row pb-3">
      <p className="text-xs text-qc-secondary">{BULK_INGREDIENT_COPY.monthlyHeading}</p>
      <p className="font-mono text-sm tabular-nums text-qc-ink">
        {BULK_INGREDIENT_COPY.monthlyValues(monthlyEffect.before, monthlyEffect.after)}{' '}
        <span className="text-qc-secondary">{BULK_INGREDIENT_COPY.monthlyChange(monthlyEffect.change)}</span>
      </p>
      <p className="mt-1 text-xs text-qc-secondary">{BULK_INGREDIENT_COPY.monthlyCaption}</p>
    </div>
  ) : null

  return (
    <div className="mb-3 mt-2 text-[13px]">
      <button
        type="button"
        className="qc-text-btn is-accent min-h-[44px] lg:min-h-0"
        aria-expanded={open}
        aria-controls={open ? 'bulk-ingredient-panel' : undefined}
        onClick={() => {
          if (open) closePanel()
          else { setTyped({}); setOpen(true) }
        }}
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
              topContent={monthlyLine}
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
            topContent={monthlyLine}
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
          <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)] gap-3 border-b border-qc-rule-row pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary lg:grid">
            <span>{BULK_INGREDIENT_COPY.nameHeader}</span>
            <span>{BULK_INGREDIENT_COPY.currentHeader}</span>
            <span>{BULK_INGREDIENT_COPY.newPriceHeader}</span>
          </div>
          <div>
            {view.rows.map((row, index) => (
              <div key={row.id} className="min-w-0 border-b border-qc-rule-row py-2 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)] lg:items-center lg:gap-3">
                <div className="flex min-w-0 items-baseline justify-between gap-3 lg:block">
                  <span className="min-w-0 break-words text-[13px] text-qc-ink">{row.name}</span>
                  <span className="min-w-0 break-words text-right font-mono text-xs tabular-nums text-qc-secondary lg:hidden">{row.currentText}</span>
                </div>
                <span className="hidden min-w-0 break-words font-mono text-xs tabular-nums text-qc-secondary lg:block">{row.currentText}</span>
                <div className="mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 lg:mt-0">
                  <NumberField
                    id={`bulk-ingredient-${row.id}`}
                    label={BULK_INGREDIENT_COPY.newPriceLabel(row.name)}
                    labelHidden
                    value={row.typed}
                    onChange={(value) => setTyped((current) => ({ ...current, [row.id]: value }))}
                    unit="TL"
                    error={row.error}
                    enterKeyHint="next"
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return
                      event.preventDefault()
                      const next = view.rows[index + 1]
                      document.getElementById(next ? `bulk-ingredient-${next.id}` : 'bulk-ingredient-apply')?.focus()
                    }}
                  />
                  <span className={`min-w-[40px] font-mono text-xs tabular-nums text-qc-ink ${row.isLargeChange ? 'font-semibold' : ''}`}>{row.changeText}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-qc-secondary">{BULK_INGREDIENT_COPY.note}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4">
            <button
              id="bulk-ingredient-apply"
              type="button"
              className="min-h-[44px] rounded bg-qc-accent px-4 text-sm font-medium text-qc-on-accent hover:bg-qc-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-qc-accent disabled:bg-qc-disabled disabled:text-qc-subtle lg:min-h-[36px]"
              disabled={view.changedCount === 0}
              onClick={() => {
                onApply(view.writes, view.changedCount)
                closePanel()
              }}
            >
              {BULK_INGREDIENT_COPY.apply(view.changedCount)}
            </button>
            <button type="button" className="qc-text-btn min-h-[44px] lg:min-h-0" onClick={closePanel}>{BULK_INGREDIENT_COPY.cancel}</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
