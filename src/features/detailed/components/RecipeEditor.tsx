import { useEffect, useId, useRef, useState } from 'react'
import { NumberField } from '../../../components/NumberField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { cn } from '../../../lib/cn.ts'
import { formatTryExact } from '../../../lib/money.ts'
import type { PurchaseUnit } from '../../../core/detailed/index.ts'
import type { DetailedFormState, IngredientRow, ProductRow } from '../formState.ts'
import { RECIPE_COPY } from '../labels.ts'
import {
  findIngredientByName,
  matchingIngredients,
  productDisplayName,
  recipeAmountText,
  recipeLineCost,
  usageUnitOf,
} from '../recipeForm.ts'
import { purchaseWithPrice, unitPriceCaption } from '../recipePreview.ts'
import { UnitPicker } from './UnitPicker.tsx'

type RecipeEditorProps = {
  form: DetailedFormState
  productIndex: number
  errorFor: (path: string) => string | null
  onBlur: (path: string) => void
  onClose: () => void
  onBackToManual: () => void
  onAttach: (ingredientId: string) => void
  onCreateAndAttach: (fields: {
    name: string
    purchaseQuantity: string
    purchaseUnit: PurchaseUnit | ''
    purchasePrice: string
  }) => void
  onRemoveLine: (lineIndex: number) => void
  onUsage: (lineIndex: number, value: string) => void
  onEditPriceInList: (ingredientId: string) => void
}

type NewDraft = {
  name: string
  purchaseQuantity: string
  purchaseUnit: PurchaseUnit | ''
  purchasePrice: string
}

function emptyDraft(name: string): NewDraft {
  return { name, purchaseQuantity: '', purchaseUnit: '', purchasePrice: '' }
}

function draftRow(draft: NewDraft): IngredientRow {
  return {
    id: 'draft',
    name: draft.name,
    purchaseQuantity: draft.purchaseQuantity,
    purchaseUnit: draft.purchaseUnit,
    purchasePrice: draft.purchasePrice,
  }
}

function lineCostText(
  form: DetailedFormState,
  product: ProductRow,
  lineIndex: number,
): string {
  const cost = recipeLineCost(form, product, lineIndex)
  return cost === undefined ? '—' : formatTryExact(cost, 2)
}

function incompleteNote(form: DetailedFormState, product: ProductRow): string | null {
  if (product.recipeLines.length === 0) return RECIPE_COPY.recipeEmpty
  if (recipeAmountText(form, product) !== null) return null
  for (const line of product.recipeLines) {
    if (line.usageQuantity.trim() !== '') continue
    const ingredient = form.ingredients.find((item) => item.id === line.ingredientId)
    return RECIPE_COPY.usageEmpty(ingredient?.name.trim() || RECIPE_COPY.ingredientName)
  }
  return null
}

function SuggestionList({
  form,
  query,
  onAttach,
  onStartNew,
}: {
  form: DetailedFormState
  query: string
  onAttach: (ingredientId: string) => void
  onStartNew: (name: string) => void
}) {
  const matches = matchingIngredients(form.ingredients, query)
  const exact = findIngredientByName(form.ingredients, query)
  const trimmed = query.trim()
  const showNew = trimmed !== '' && exact === undefined

  if (matches.length === 0 && !showNew) return null

  return (
    <ul
      className="mt-1 border border-qc-rule-mid"
      onMouseDown={(event) => event.preventDefault()}
    >
      {matches.map((ingredient) => (
        <li
          key={ingredient.id}
          className="flex items-center justify-between gap-3 border-t border-qc-rule-row px-2.5 py-2 first:border-t-0"
        >
          <span className="min-w-0">
            <span className="block truncate text-[13px] text-qc-ink">{ingredient.name}</span>
            <span className="block text-xs text-qc-secondary">
              {RECIPE_COPY.suggestExisting(
                ingredient.purchaseQuantity.trim() || '—',
                ingredient.purchaseUnit || '—',
                ingredient.purchasePrice.trim() || '—',
              )}
            </span>
          </span>
          <button
            type="button"
            className="qc-text-btn shrink-0"
            onClick={() => onAttach(ingredient.id)}
          >
            {RECIPE_COPY.suggestAdd}
          </button>
        </li>
      ))}
      {showNew ? (
        <li className="flex items-center justify-between gap-3 border-t border-qc-rule-row px-2.5 py-2">
          <span className="text-[13px] text-qc-ink">{RECIPE_COPY.suggestNew(trimmed)}</span>
          <button type="button" className="qc-text-btn shrink-0" onClick={() => onStartNew(trimmed)}>
            {RECIPE_COPY.suggestNewAction}
          </button>
        </li>
      ) : null}
    </ul>
  )
}

function NewIngredientBlock({
  form,
  draft,
  onChange,
  onConfirm,
  onCancel,
}: {
  form: DetailedFormState
  draft: NewDraft
  onChange: (draft: NewDraft) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  const ingredient = draftRow(draft)
  const draftForm: DetailedFormState = {
    ...form,
    ingredients: [...form.ingredients, ingredient],
  }
  return (
    <div className="mt-3 border-t border-qc-rule-row pt-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] text-qc-ink">{draft.name}</span>
        <span className="text-xs text-qc-secondary">{RECIPE_COPY.newIngredientTag}</span>
      </div>
      <p className="qc-hint mt-1 lg:hidden">{RECIPE_COPY.newIngredientAsk}</p>
      <p className="qc-hint mt-1 hidden lg:block">{RECIPE_COPY.newIngredientAskDesktop}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-[130px_150px_120px] lg:items-start">
        <NumberField
          id="recipe-new-quantity"
          label={RECIPE_COPY.purchaseQuantity}
          value={draft.purchaseQuantity}
          onChange={(value) => onChange({ ...draft, purchaseQuantity: value })}
          unit={draft.purchaseUnit}
          grouped
        />
        <NumberField
          id="recipe-new-price"
          label={RECIPE_COPY.purchasePrice}
          value={draft.purchasePrice}
          onChange={(value) => onChange({ ...draft, purchasePrice: value })}
          unit="TL"
          grouped
        />
        <div className="col-span-2 lg:col-span-1">
          <UnitPicker
            id="recipe-new-unit"
            form={draftForm}
            ingredient={ingredient}
            onChange={(unit) => onChange({ ...draft, purchaseUnit: unit })}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-4">
        <button type="button" className="qc-text-btn" onClick={onCancel}>
          {RECIPE_COPY.cancel}
        </button>
        <button
          type="button"
          className="qc-text-btn"
          onClick={onConfirm}
          disabled={draft.name.trim() === ''}
        >
          {RECIPE_COPY.addToList}
        </button>
      </div>
    </div>
  )
}

function RecipeLineRow({
  form,
  product,
  productIndex,
  lineIndex,
  focused,
  errorFor,
  onBlur,
  onUsage,
  onRemove,
  onEditPrice,
  onFocus,
}: {
  form: DetailedFormState
  product: ProductRow
  productIndex: number
  lineIndex: number
  focused: boolean
  errorFor: (path: string) => string | null
  onBlur: (path: string) => void
  onUsage: (value: string) => void
  onRemove: () => void
  onEditPrice: () => void
  onFocus: () => void
}) {
  const line = product.recipeLines[lineIndex]
  if (!line) return null
  const ingredient = form.ingredients.find((item) => item.id === line.ingredientId)
  const usageUnit = ingredient ? usageUnitOf(ingredient) : null
  const usagePath = `products.${productIndex}.recipeLines.${lineIndex}.usageQuantity`
  const numberError = errorFor(usagePath)
  const emptyCopy = RECIPE_COPY.usageEmpty(ingredient?.name.trim() || RECIPE_COPY.ingredientName)
  const cost = lineCostText(form, product, lineIndex)
  const purchase = ingredient ? purchaseWithPrice(ingredient) : ''
  const caption = ingredient ? unitPriceCaption(ingredient) : ''

  return (
    <div
      className={cn('border-t border-qc-rule-row py-3', focused && 'bg-qc-surface-result')}
      onFocus={onFocus}
    >
      <div className="grid grid-cols-2 items-start gap-3 lg:grid-cols-[minmax(7rem,1fr)_minmax(7rem,168px)_minmax(0,200px)_96px_52px] lg:items-center">
        <div className="col-span-2 flex items-baseline justify-between gap-3 lg:col-span-1 lg:block">
          <span className="truncate text-[15px] text-qc-ink lg:text-[13px]">
            {ingredient?.name.trim() || RECIPE_COPY.ingredientName}
          </span>
          <span className="font-mono text-xs tabular-nums text-qc-ink lg:hidden">
            {cost === '—' ? '—' : `${cost} TL`}
          </span>
        </div>
        {usageUnit ? (
          <div className="w-[148px] lg:w-auto">
            <NumberField
              id={usagePath}
              label={RECIPE_COPY.usageLabel[usageUnit]}
              labelHidden="from-lg"
              value={line.usageQuantity}
              onChange={onUsage}
              onBlur={() => onBlur(usagePath)}
              unit={usageUnit}
              grouped
              error={numberError === emptyCopy ? null : numberError}
            />
          </div>
        ) : (
          <span className="text-xs text-qc-secondary">—</span>
        )}
        <span className="pt-6 text-right text-xs leading-relaxed text-qc-secondary lg:pt-0 lg:text-left">
          {purchase ? <span className="block lg:inline">{purchase}</span> : null}
          {caption ? (
            <span className="block lg:inline">{purchase ? <span className="hidden lg:inline"> · </span> : null}{caption}</span>
          ) : null}
        </span>
        <span className="hidden text-right font-mono text-xs tabular-nums text-qc-ink lg:block">
          {cost}
        </span>
        <button
          type="button"
          className="qc-text-btn hidden lg:inline"
          onClick={onRemove}
        >
          {RECIPE_COPY.removeLine}
        </button>
      </div>
      {focused ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 lg:hidden">
          <button type="button" className="qc-text-btn" onClick={onRemove}>
            {RECIPE_COPY.removeLine}
          </button>
          <button type="button" className="qc-text-btn" onClick={onEditPrice}>
            {RECIPE_COPY.editPriceInList}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function RecipeEditor({
  form,
  productIndex,
  errorFor,
  onBlur,
  onClose,
  onBackToManual,
  onAttach,
  onCreateAndAttach,
  onRemoveLine,
  onUsage,
  onEditPriceInList,
}: RecipeEditorProps) {
  const product = form.products[productIndex]
  const rootRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<NewDraft | null>(null)
  const [focusedLine, setFocusedLine] = useState<number | null>(0)
  const [searchFocused, setSearchFocused] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!isMobile) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isMobile])

  useEffect(() => {
    const node = rootRef.current
    if (!node || !isMobile) return
    node.querySelector<HTMLElement>('input, button')?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !node) return
      const items = [
        ...node.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
          'button, input, select, textarea',
        ),
      ].filter((item) => !item.disabled)
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    node.addEventListener('keydown', onKey)
    return () => node.removeEventListener('keydown', onKey)
  }, [isMobile, onClose])

  if (!product) return null

  const total = recipeAmountText(form, product)
  const note = incompleteNote(form, product)
  const title = productDisplayName(product, productIndex)
  const showSuggestions = draft === null && (searchFocused || query.trim() !== '')

  return (
    <div
      ref={rootRef}
      role={isMobile ? 'dialog' : undefined}
      aria-modal={isMobile ? true : undefined}
      aria-labelledby={titleId}
      className="fixed inset-0 z-30 overflow-y-auto bg-qc-surface px-[18px] py-3 lg:static lg:z-auto lg:mt-3 lg:border-y lg:border-qc-rule-mid lg:bg-qc-surface-result lg:px-3 lg:py-4"
    >
      <div className="sticky top-0 z-10 -mx-[18px] bg-qc-surface px-[18px] py-3 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0">
        <div className="flex items-center justify-between gap-3">
          <button type="button" className="qc-text-btn lg:hidden" onClick={onClose}>
            {RECIPE_COPY.backToMenu}
          </button>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
            {RECIPE_COPY.recipeEyebrow}
          </span>
          <button type="button" className="qc-text-btn" onClick={onClose}>
            <span className="font-semibold text-qc-ink lg:hidden">{RECIPE_COPY.finish}</span>
            <span className="hidden lg:inline">{RECIPE_COPY.closeBlock}</span>
          </button>
        </div>
      </div>

      <h3 id={titleId} className="mt-3 text-[22px] font-medium text-qc-ink">
        {title}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-qc-secondary">{RECIPE_COPY.recipeIntro}</p>

      {product.recipeLines.length === 0 && draft === null ? (
        <p className="mt-4 text-[13px] text-qc-secondary">{RECIPE_COPY.recipeEmpty}</p>
      ) : null}

      <div className="mt-3 hidden gap-2 pb-2 lg:grid lg:grid-cols-[minmax(7rem,1fr)_minmax(7rem,168px)_minmax(0,200px)_96px_52px]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
          {RECIPE_COPY.ingredientName}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
          {RECIPE_COPY.usageColumn}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
          {RECIPE_COPY.purchaseColumn}
        </span>
        <span className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
          {RECIPE_COPY.lineCostColumn}
        </span>
        <span />
      </div>

      {product.recipeLines.map((line, lineIndex) => (
        <RecipeLineRow
          key={line.id}
          form={form}
          product={product}
          productIndex={productIndex}
          lineIndex={lineIndex}
          focused={focusedLine === lineIndex}
          errorFor={errorFor}
          onBlur={onBlur}
          onUsage={(value) => onUsage(lineIndex, value)}
          onRemove={() => onRemoveLine(lineIndex)}
          onEditPrice={() => onEditPriceInList(line.ingredientId)}
          onFocus={() => setFocusedLine(lineIndex)}
        />
      ))}

      {draft ? (
        <NewIngredientBlock
          form={form}
          draft={draft}
          onChange={setDraft}
          onCancel={() => setDraft(null)}
          onConfirm={() => {
            onCreateAndAttach(draft)
            setDraft(null)
          }}
        />
      ) : (
        <div
          className="mt-3"
          onFocus={() => setSearchFocused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setSearchFocused(false)
            }
          }}
        >
          <TextField
            id={`recipe-search-${productIndex}`}
            label={RECIPE_COPY.searchLabel}
            value={query}
            onChange={setQuery}
            onBlur={() => onBlur(`products.${productIndex}.recipeLines`)}
          />
          {showSuggestions ? (
            <SuggestionList
              form={form}
              query={query}
              onAttach={(ingredientId) => {
                onAttach(ingredientId)
                setQuery('')
                setSearchFocused(false)
              }}
              onStartNew={(name) => {
                setDraft(emptyDraft(name))
                setQuery('')
                setSearchFocused(false)
              }}
            />
          ) : null}
        </div>
      )}

      {note && product.recipeLines.length > 0 ? (
        <p className="mt-3 text-xs leading-relaxed text-qc-secondary">{note}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-qc-rule-row pt-3">
        <div>
          <button type="button" className="qc-text-btn" onClick={onBackToManual}>
            {RECIPE_COPY.backToManual}
          </button>
          <p className="qc-hint mt-1">{RECIPE_COPY.backToManualNote}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-qc-secondary">{RECIPE_COPY.recipeTotal}</p>
          <p className="font-mono text-[22px] tabular-nums text-qc-ink">
            {total === null ? '—' : `${total} TL`}
          </p>
        </div>
      </div>
    </div>
  )
}
