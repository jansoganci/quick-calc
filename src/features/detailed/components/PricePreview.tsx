import { cn } from '../../../lib/cn.ts'
import { RECIPE_COPY } from '../labels.ts'
import type {
  PricePreview as PricePreviewModel,
  PricePreviewLine,
  PriceSuggestion,
  PriceSuggestionField,
} from '../recipePreview.ts'

type PricePreviewProps = {
  preview: PricePreviewModel
  onApply?: (productIndex: number, field: PriceSuggestionField, value: string) => void
}

function SuggestionRow({
  suggestion,
  onApply,
}: {
  suggestion: PriceSuggestion
  onApply?: () => void
}) {
  return (
    <div className="mt-1 flex items-center justify-between gap-3">
      <p className="font-mono text-xs tabular-nums text-qc-ink">
        {RECIPE_COPY.priceRiseSuggest(suggestion.suggestedText)}
      </p>
      {suggestion.canApply && onApply ? (
        <button type="button" className="qc-text-btn is-accent min-h-[44px] lg:min-h-0" onClick={onApply}>
          {RECIPE_COPY.priceRiseApply}
        </button>
      ) : (
        <span />
      )}
    </div>
  )
}

function ProductRestore({
  line,
  onApply,
}: {
  line: PricePreviewLine
  onApply?: PricePreviewProps['onApply']
}) {
  return (
    <>
      {line.restoreText ? (
        <p className="mt-0.5 text-xs text-qc-secondary">{line.restoreText}</p>
      ) : null}
      {line.suggestions
        .filter((item) => item.field === 'normalPrice')
        .map((item) => (
          <SuggestionRow
            key={item.field}
            suggestion={item}
            onApply={
              onApply ? () => onApply(line.productIndex, item.field, item.applyValue) : undefined
            }
          />
        ))}
      {line.restoreOnlineText ? (
        <p className="mt-1 text-xs text-qc-secondary">{line.restoreOnlineText}</p>
      ) : null}
      {line.suggestions
        .filter((item) => item.field === 'onlinePrice')
        .map((item) => (
          <SuggestionRow
            key={item.field}
            suggestion={item}
            onApply={
              onApply ? () => onApply(line.productIndex, item.field, item.applyValue) : undefined
            }
          />
        ))}
    </>
  )
}

export function PricePreview({ preview, onApply }: PricePreviewProps) {
  return (
    <div className="border-t border-qc-ink pt-3">
      <p className="text-[15px] font-medium text-qc-ink">{preview.heading}</p>
      <p className="mt-1 text-xs leading-relaxed text-qc-secondary">{preview.summary}</p>

      <div className="mt-3 space-y-3 lg:hidden">
        {preview.lines.map((line) => (
          <div key={`${line.productIndex}-${line.productName}`}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-qc-ink">{line.productName}</span>
              <span className="text-xs text-qc-secondary">{line.usage}</span>
            </div>
            <p className="mt-1 font-mono text-xs tabular-nums text-qc-ink">
              {RECIPE_COPY.priceRiseCost(line.costFrom, line.costTo)}
            </p>
            <p className="mt-0.5 text-xs text-qc-secondary">{line.remainingText}</p>
            <ProductRestore line={line} onApply={onApply} />
          </div>
        ))}
      </div>

      <div className="mt-3 hidden lg:block">
        <div className="grid grid-cols-[minmax(0,1fr)_120px_1fr_1fr] gap-2 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
            {RECIPE_COPY.priceRiseColumns.product}
          </span>
          <span className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
            {RECIPE_COPY.priceRiseColumns.cost}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
            {RECIPE_COPY.priceRiseColumns.remaining}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
            {RECIPE_COPY.priceRiseColumns.restore}
          </span>
        </div>
        {preview.lines.map((line) => (
          <div
            key={`${line.productIndex}-${line.productName}`}
            className="grid grid-cols-[minmax(0,1fr)_120px_1fr_1fr] gap-2 border-t border-qc-rule-row py-2"
          >
            <div>
              <p className="text-[13px] text-qc-ink">{line.productName}</p>
              <p className="text-xs text-qc-secondary">{line.usage}</p>
            </div>
            <p className="text-right font-mono text-xs tabular-nums text-qc-ink">
              {line.costFrom} → {line.costTo}
            </p>
            <p className="text-xs text-qc-secondary">{line.remainingText}</p>
            <div>
              <ProductRestore line={line} onApply={onApply} />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-qc-secondary">{preview.footnote}</p>
    </div>
  )
}

export function PricePreviewDesktop({
  preview,
  onDone,
  onApply,
}: PricePreviewProps & { onDone: () => void }) {
  return (
    <div className={cn('mt-4 hidden border-y border-qc-rule-mid bg-qc-surface-result px-3 py-3 lg:block')}>
      <PricePreview preview={preview} onApply={onApply} />
      <button type="button" className="qc-text-btn mt-3" onClick={onDone}>
        {RECIPE_COPY.done}
      </button>
    </div>
  )
}
