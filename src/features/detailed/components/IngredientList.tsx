import { useEffect, useState } from 'react'
import { NumberField } from '../../../components/NumberField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { cn } from '../../../lib/cn.ts'
import { formatCount } from '../../../lib/number.ts'
import type { DetailedFormState, IngredientRow } from '../formState.ts'
import { RECIPE_COPY } from '../labels.ts'
import {
  isIngredientUsedInRecipe,
  listedIngredients,
  productDisplayName,
  productsUsingIngredient,
  productsUsingIngredientList,
  sameIngredientName,
  usageUnitOf,
} from '../recipeForm.ts'
import {
  buildPricePreview,
  compactPurchase,
  compactPurchasePrice,
  snapshotOf,
  unitPriceDisplay,
  type PurchaseSnapshot,
} from '../recipePreview.ts'
import { PricePreview, PricePreviewDesktop } from './PricePreview.tsx'
import { UnitPicker } from './UnitPicker.tsx'

type IngredientField = 'purchaseQuantity' | 'purchasePrice' | 'purchaseUnit'

type IngredientListProps = {
  form: DetailedFormState
  errorFor: (path: string) => string | null
  onBlur: (path: string) => void
  onCommitName: (ingredientId: string, name: string) => 'empty' | 'duplicate' | null
  onIngredientField: (ingredientId: string, field: IngredientField, value: string) => void
  onAddBlank: () => string
  onDiscardBlank: (ingredientId: string) => void
  onDelete: (ingredientId: string) => void
  requestedOpenId: string | null
  onConsumedOpen: () => void
}

function fieldPath(ingredientId: string, field: string): string {
  return `ingredients.${ingredientId}.${field}`
}

function usedLabel(form: DetailedFormState, ingredientId: string): string {
  const count = productsUsingIngredient(form.products, ingredientId)
  return count === 0 ? RECIPE_COPY.usedInNone : RECIPE_COPY.usedIn(formatCount(count))
}

function usedNames(form: DetailedFormState, ingredientId: string): string {
  return productsUsingIngredientList(form, ingredientId)
    .map((product) => productDisplayName(product, form.products.indexOf(product)))
    .join(', ')
}

function openNote(form: DetailedFormState, ingredient: IngredientRow): string {
  if (!isIngredientUsedInRecipe(form, ingredient.id)) return RECIPE_COPY.invoiceHint
  const usage = usageUnitOf(ingredient)
  const unitPrice = unitPriceDisplay(ingredient)
  if (usage === null || unitPrice === null) return RECIPE_COPY.invoiceHint
  const word = RECIPE_COPY.unitPriceWord[usage]
  const names = usedNames(form, ingredient.id)
  const count = formatCount(productsUsingIngredient(form.products, ingredient.id))
  return RECIPE_COPY.unitPriceLine(word, unitPrice, count, names)
}

function unitLockNote(form: DetailedFormState, ingredient: IngredientRow): string | null {
  const usage = usageUnitOf(ingredient)
  if (usage === null || !isIngredientUsedInRecipe(form, ingredient.id)) return null
  return RECIPE_COPY.unitFamilyLock(
    ingredient.name.trim() || RECIPE_COPY.ingredientName,
    RECIPE_COPY.unitFamilyUsed[usage],
    RECIPE_COPY.unitFamilyBlocked[usage],
  )
}

function DeleteConfirm({
  ingredient,
  form,
  onDelete,
  onCancel,
}: {
  ingredient: IngredientRow
  form: DetailedFormState
  onDelete: () => void
  onCancel: () => void
}) {
  const used = productsUsingIngredientList(form, ingredient.id)
  const name = ingredient.name.trim() || RECIPE_COPY.ingredientName
  const message =
    used.length === 0
      ? RECIPE_COPY.deleteConfirmUnused(name)
      : RECIPE_COPY.deleteConfirm(
          name,
          formatCount(used.length),
          used.map((product) => productDisplayName(product, form.products.indexOf(product))).join(', '),
        )
  return (
    <div className="border-t border-qc-rule-row pt-3">
      <p className="text-xs leading-relaxed text-qc-secondary">{message}</p>
      <div className="mt-2 flex items-center justify-end gap-4">
        <button type="button" className="qc-text-btn is-muted" onClick={onCancel}>
          {RECIPE_COPY.cancel}
        </button>
        <button type="button" className="qc-text-btn" onClick={onDelete}>
          {RECIPE_COPY.deleteShort}
        </button>
      </div>
    </div>
  )
}

function IngredientNameField({
  ingredient,
  onCommitName,
  onBlur,
}: {
  ingredient: IngredientRow
  onCommitName: (ingredientId: string, name: string) => 'empty' | 'duplicate' | null
  onBlur: (path: string) => void
}) {
  const [name, setName] = useState(ingredient.name)
  const [nameError, setNameError] = useState<string | null>(null)
  const path = fieldPath(ingredient.id, 'name')

  useEffect(() => {
    setName(ingredient.name)
    setNameError(null)
  }, [ingredient.id, ingredient.name])

  return (
    <TextField
      id={path}
      label={RECIPE_COPY.ingredientName}
      labelHidden="from-lg"
      value={name}
      onChange={(value) => {
        setName(value)
        setNameError(null)
      }}
      onBlur={() => {
        const reason = onCommitName(ingredient.id, name)
        if (reason === 'empty') setNameError(RECIPE_COPY.ingredientMissing)
        else setNameError(null)
        onBlur(path)
      }}
      error={nameError}
    />
  )
}

function IngredientFields({
  form,
  ingredient,
  errorFor,
  onBlur,
  onCommitName,
  onIngredientField,
  onPurchaseFocus,
}: {
  form: DetailedFormState
  ingredient: IngredientRow
  errorFor: (path: string) => string | null
  onBlur: (path: string) => void
  onCommitName: (ingredientId: string, name: string) => 'empty' | 'duplicate' | null
  onIngredientField: (ingredientId: string, field: IngredientField, value: string) => void
  onPurchaseFocus: () => void
}) {
  const quantityPath = fieldPath(ingredient.id, 'purchaseQuantity')
  const unitPath = fieldPath(ingredient.id, 'purchaseUnit')
  const pricePath = fieldPath(ingredient.id, 'purchasePrice')

  return (
    <>
      <div className="col-span-2 lg:col-span-1">
        <IngredientNameField ingredient={ingredient} onCommitName={onCommitName} onBlur={onBlur} />
      </div>
      <div className="lg:col-start-2 lg:row-start-1">
        <NumberField
          id={quantityPath}
          label={RECIPE_COPY.purchaseQuantity}
          labelHidden="from-lg"
          value={ingredient.purchaseQuantity}
          onChange={(value) => onIngredientField(ingredient.id, 'purchaseQuantity', value)}
          onBlur={() => onBlur(quantityPath)}
          unit={ingredient.purchaseUnit}
          grouped
          error={errorFor(quantityPath)}
        />
      </div>
      <div className="lg:col-start-4 lg:row-start-1">
        <NumberField
          id={pricePath}
          label={RECIPE_COPY.purchasePrice}
          labelHidden="from-lg"
          value={ingredient.purchasePrice}
          onChange={(value) => onIngredientField(ingredient.id, 'purchasePrice', value)}
          onBlur={() => onBlur(pricePath)}
          unit="TL"
          grouped
          error={errorFor(pricePath)}
        />
      </div>
      <div className="col-span-2 lg:col-span-1 lg:col-start-3 lg:row-start-1" onFocus={onPurchaseFocus}>
        <UnitPicker
          id={unitPath}
          form={form}
          ingredient={ingredient}
          labelHidden="from-lg"
          onChange={(unit) => onIngredientField(ingredient.id, 'purchaseUnit', unit)}
          onBlur={() => onBlur(unitPath)}
        />
      </div>
    </>
  )
}

function ClosedMobileRow({
  ingredient,
  form,
  onOpen,
}: {
  ingredient: IngredientRow
  form: DetailedFormState
  onOpen: () => void
}) {
  const purchase = compactPurchase(ingredient)
  const used = usedLabel(form, ingredient.id)
  const detail = [purchase, used].filter(Boolean).join(' · ')
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={false}
      className="flex min-h-[60px] w-full items-center justify-between gap-3 py-2 text-left lg:hidden"
    >
      <span className="min-w-0">
        <span className="block truncate text-[15px] text-qc-ink">
          {ingredient.name.trim() || RECIPE_COPY.ingredientName}
        </span>
        <span className="mt-0.5 block text-xs text-qc-muted">{detail}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="font-mono text-xs tabular-nums text-qc-ink">
          {compactPurchasePrice(ingredient)}
        </span>
        <span
          aria-hidden="true"
          className="inline-block h-[7px] w-[7px] -translate-y-0.5 rotate-45 border-b-[1.5px] border-r-[1.5px] border-qc-muted"
        />
      </span>
    </button>
  )
}

/** Shared purchase list. Empty state stays visible (A1). */
export function IngredientList({
  form,
  errorFor,
  onBlur,
  onCommitName,
  onIngredientField,
  onAddBlank,
  onDiscardBlank,
  onDelete,
  requestedOpenId,
  onConsumedOpen,
}: IngredientListProps) {
  const ingredients = listedIngredients(form)
  const blanks = form.ingredients.filter((ingredient) => ingredient.name.trim() === '')
  const rows = [...ingredients, ...blanks]
  const [openId, setOpenId] = useState<string | null>(blanks[0]?.id ?? null)
  const [addingId, setAddingId] = useState<string | null>(blanks[0]?.id ?? null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [snapshots, setSnapshots] = useState<Record<string, PurchaseSnapshot>>({})

  useEffect(() => {
    if (requestedOpenId === null) return
    const id = requestedOpenId
    const ingredient = form.ingredients.find((item) => item.id === id)
    setOpenId(id)
    setDeletingId(null)
    if (ingredient) {
      setSnapshots((current) => ({ ...current, [id]: current[id] ?? snapshotOf(ingredient) }))
    }
    onConsumedOpen()
    window.requestAnimationFrame(() => {
      document.getElementById(`ingredient-row-${id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      document.getElementById(fieldPath(id, 'purchasePrice'))?.focus()
    })
  }, [form.ingredients, onConsumedOpen, requestedOpenId])

  function remember(ingredient: IngredientRow) {
    setSnapshots((current) =>
      current[ingredient.id] ? current : { ...current, [ingredient.id]: snapshotOf(ingredient) },
    )
  }

  function commitName(ingredientId: string, name: string) {
    const reason = onCommitName(ingredientId, name)
    if (reason !== 'duplicate') return reason
    const existing = form.ingredients.find(
      (item) =>
        item.id !== ingredientId &&
        item.name.trim() !== '' &&
        sameIngredientName(item.name, name),
    )
    const current = form.ingredients.find((item) => item.id === ingredientId)
    if (existing) {
      if (current && current.name.trim() === '') onDiscardBlank(ingredientId)
      setOpenId(existing.id)
      setAddingId(null)
      remember(existing)
    }
    return null
  }

  function closeRow(ingredient: IngredientRow) {
    if (addingId === ingredient.id && ingredient.name.trim() === '') {
      onDiscardBlank(ingredient.id)
    }
    setAddingId((current) => (current === ingredient.id ? null : current))
    setOpenId((current) => (current === ingredient.id ? null : current))
    setDeletingId((current) => (current === ingredient.id ? null : current))
    setSnapshots((current) => ({ ...current, [ingredient.id]: snapshotOf(ingredient) }))
  }

  const previewSource = rows.find((ingredient) => {
    const opened = snapshots[ingredient.id]
    if (!opened) return false
    return buildPricePreview(form, ingredient, opened) !== null
  })
  const desktopPreview =
    previewSource && snapshots[previewSource.id]
      ? buildPricePreview(form, previewSource, snapshots[previewSource.id]!)
      : null
  const desktopNoted =
    form.ingredients.find((item) => item.id === (previewSource?.id ?? focusedId)) ?? null
  const desktopLock = desktopNoted ? unitLockNote(form, desktopNoted) : null

  return (
    <div className="mt-8 lg:mt-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
          {RECIPE_COPY.listHeading}
        </p>
        <span className="font-mono text-xs tabular-nums text-qc-muted">
          {RECIPE_COPY.ingredientCount(ingredients.length)}
        </span>
      </div>
      <p className="qc-hint mt-1">{RECIPE_COPY.listHint}</p>

      {rows.length === 0 ? (
        <div className="mt-3">
          <p className="text-[15px] text-qc-ink">{RECIPE_COPY.listEmpty}</p>
          <p className="qc-hint mt-1 lg:hidden">{RECIPE_COPY.listEmptyHint}</p>
          <p className="qc-hint mt-1 hidden lg:block">{RECIPE_COPY.listEmptyHintDesktop}</p>
        </div>
      ) : (
        <>
          <div
            className={cn(
              'mt-3 hidden gap-2 pb-2 lg:grid',
              'lg:grid-cols-[minmax(0,1fr)_84px_84px_116px_112px_84px_32px]',
            )}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
              {RECIPE_COPY.ingredientName}
            </span>
            <span className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
              {RECIPE_COPY.purchaseQuantity}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
              {RECIPE_COPY.purchaseUnit}
            </span>
            <span className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
              {RECIPE_COPY.purchasePrice}
            </span>
            <span className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
              {RECIPE_COPY.unitPriceColumn}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
              {RECIPE_COPY.usedInColumn}
            </span>
            <span />
          </div>

          {rows.map((ingredient) => {
            const open = openId === ingredient.id
            const adding = addingId === ingredient.id
            const confirming = deletingId === ingredient.id
            const opened = snapshots[ingredient.id]
            const preview = opened ? buildPricePreview(form, ingredient, opened) : null
            const unitPrice = unitPriceDisplay(ingredient)

            return (
              <div
                key={ingredient.id}
                id={`ingredient-row-${ingredient.id}`}
                className="border-t border-qc-rule-row"
              >
                {open ? null : (
                  <ClosedMobileRow
                    ingredient={ingredient}
                    form={form}
                    onOpen={() => {
                      remember(ingredient)
                      setOpenId(ingredient.id)
                      setDeletingId(null)
                    }}
                  />
                )}

                <div
                  className={cn(
                    'bg-qc-surface-result pb-3 pt-2 lg:bg-transparent lg:py-[9px]',
                    open ? 'block' : 'hidden lg:block',
                  )}
                >
                  {open ? (
                    <div className="mb-2 flex items-center justify-between lg:hidden">
                      <span className="text-[15px] text-qc-ink">
                        {ingredient.name.trim() || RECIPE_COPY.ingredientName}
                      </span>
                      <span
                        aria-hidden="true"
                        className="inline-block h-[7px] w-[7px] -translate-y-1 rotate-[-135deg] border-b-[1.5px] border-r-[1.5px] border-qc-muted"
                      />
                    </div>
                  ) : null}

                  <div
                    className={cn(
                      'grid grid-cols-2 gap-3 lg:grid lg:items-start lg:gap-2',
                      'lg:grid-cols-[minmax(0,1fr)_84px_84px_116px_112px_84px_32px]',
                    )}
                    onFocus={() => {
                      remember(ingredient)
                      setFocusedId(ingredient.id)
                    }}
                  >
                    <IngredientFields
                      form={form}
                      ingredient={ingredient}
                      errorFor={errorFor}
                      onBlur={onBlur}
                      onCommitName={commitName}
                      onIngredientField={onIngredientField}
                      onPurchaseFocus={() => {
                        remember(ingredient)
                        setFocusedId(ingredient.id)
                      }}
                    />
                    <p className="hidden self-center text-right font-mono text-xs tabular-nums text-qc-secondary lg:col-start-5 lg:row-start-1 lg:block">
                      {unitPrice ?? '—'}
                    </p>
                    <p className="hidden self-center text-xs text-qc-muted lg:col-start-6 lg:row-start-1 lg:block">
                      {usedLabel(form, ingredient.id)}
                    </p>
                    <div className="hidden lg:col-start-7 lg:row-start-1 lg:block">
                      {confirming ? null : (
                        <button
                          type="button"
                          className="qc-text-btn is-muted"
                          onClick={() => setDeletingId(ingredient.id)}
                        >
                          {RECIPE_COPY.deleteShort}
                        </button>
                      )}
                    </div>
                  </div>

                  {open ? (
                    <div className="mt-2 lg:hidden">
                      {unitLockNote(form, ingredient) ? (
                        <p id={`${ingredient.id}-unit-lock`} className="qc-hint">
                          {unitLockNote(form, ingredient)}
                        </p>
                      ) : null}
                      <p className="qc-hint mt-1">{openNote(form, ingredient)}</p>
                    </div>
                  ) : null}

                  {preview && open ? (
                    <div className="mt-3 lg:hidden">
                      <PricePreview preview={preview} />
                    </div>
                  ) : null}

                  {confirming ? (
                    <div className="lg:hidden">
                      <DeleteConfirm
                        ingredient={ingredient}
                        form={form}
                        onCancel={() => setDeletingId(null)}
                        onDelete={() => {
                          onDelete(ingredient.id)
                          setDeletingId(null)
                          setOpenId((current) => (current === ingredient.id ? null : current))
                          setAddingId((current) => (current === ingredient.id ? null : current))
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="mt-3 flex items-center justify-between gap-3 lg:hidden">
                        {adding ? (
                          <button
                            type="button"
                            className="qc-text-btn is-muted"
                            onClick={() => {
                              if (ingredient.name.trim() === '') onDiscardBlank(ingredient.id)
                              else onDelete(ingredient.id)
                              setAddingId(null)
                              setOpenId(null)
                            }}
                          >
                            {RECIPE_COPY.cancel}
                          </button>
                        ) : (
                          <span />
                        )}
                        <button
                          type="button"
                          className="qc-text-btn"
                          onClick={() => closeRow(ingredient)}
                        >
                          {RECIPE_COPY.done}
                        </button>
                      </div>
                      {adding ? (
                        <div className="mt-3 hidden lg:flex lg:justify-end">
                          <button
                            type="button"
                            className="qc-text-btn is-muted"
                            onClick={() => {
                              if (ingredient.name.trim() === '') onDiscardBlank(ingredient.id)
                              else onDelete(ingredient.id)
                              setAddingId(null)
                            }}
                          >
                            {RECIPE_COPY.cancel}
                          </button>
                        </div>
                      ) : null}
                      {adding ? null : (
                        <div className="mt-3 flex justify-end border-t border-qc-rule-row pt-2 lg:hidden">
                          <button
                            type="button"
                            className="qc-text-btn is-muted"
                            onClick={() => setDeletingId(ingredient.id)}
                          >
                            {RECIPE_COPY.deleteIngredient}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}

      {desktopPreview && previewSource ? (
        <PricePreviewDesktop
          preview={desktopPreview}
          onDone={() =>
            setSnapshots((current) => ({
              ...current,
              [previewSource.id]: snapshotOf(previewSource),
            }))
          }
        />
      ) : null}

      {desktopNoted ? (
        <div className="mt-2 hidden lg:block">
          {desktopLock ? <p className="qc-hint">{desktopLock}</p> : null}
          <p className="qc-hint mt-1">{openNote(form, desktopNoted)}</p>
        </div>
      ) : null}

      {deletingId && rows.some((ingredient) => ingredient.id === deletingId) ? (
        <div className="mt-3 hidden lg:block">
          {rows
            .filter((ingredient) => ingredient.id === deletingId)
            .map((ingredient) => (
              <DeleteConfirm
                key={ingredient.id}
                ingredient={ingredient}
                form={form}
                onCancel={() => setDeletingId(null)}
                onDelete={() => {
                  onDelete(ingredient.id)
                  setDeletingId(null)
                }}
              />
            ))}
        </div>
      ) : null}

      <div className="mt-3 border-t border-qc-rule-row pt-3">
        <button
          type="button"
          className="qc-text-btn is-accent"
          onClick={() => {
            const id = onAddBlank()
            setAddingId(id)
            setOpenId(id)
            setDeletingId(null)
          }}
        >
          {RECIPE_COPY.addIngredient}
        </button>
      </div>
    </div>
  )
}
