import { useEffect, useState } from 'react'
import { PURCHASE_UNITS } from '../../../core/detailed/index.ts'
import { NumberField } from '../../../components/NumberField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { formatCount } from '../../../lib/number.ts'
import type { IngredientRow, ProductRow, RecipeLine } from '../formState.ts'
import { COPY, RECIPE_COPY } from '../labels.ts'
import { productsUsingIngredient, usageUnitLabel } from '../recipeForm.ts'

type IngredientField = 'purchaseQuantity' | 'purchasePrice' | 'purchaseUnit'

type RecipePanelProps = {
  productIndex: number
  product: ProductRow
  products: ProductRow[]
  ingredients: IngredientRow[]
  errorFor: (path: string) => string | null
  onBlur: (path: string) => void
  onCommitName: (lineIndex: number, name: string) => void
  onIngredientField: (ingredientId: string, field: IngredientField, value: string) => void
  onUsage: (lineIndex: number, value: string) => void
  onAddLine: () => void
  onRemoveLine: (lineIndex: number) => void
  amountText: string | null
}

function linePath(productIndex: number, lineIndex: number, field: string): string {
  return `products.${productIndex}.recipeLines.${lineIndex}.${field}`
}

function IngredientName({
  productIndex,
  lineIndex,
  ingredient,
  names,
  errorFor,
  onBlur,
  onCommitName,
}: {
  productIndex: number
  lineIndex: number
  ingredient: IngredientRow | undefined
  names: readonly string[]
  errorFor: (path: string) => string | null
  onBlur: (path: string) => void
  onCommitName: (lineIndex: number, name: string) => void
}) {
  const linkedId = ingredient?.id ?? ''
  const linkedName = ingredient?.name ?? ''
  const [name, setName] = useState(linkedName)
  const path = linePath(productIndex, lineIndex, 'ingredient')
  const listId = `recipe-ingredients-${productIndex}-${lineIndex}`

  useEffect(() => {
    setName(linkedName)
  }, [linkedId, linkedName])

  return (
    <>
      <TextField
        id={path}
        label={RECIPE_COPY.ingredientName}
        value={name}
        list={listId}
        onChange={setName}
        onBlur={() => {
          onCommitName(lineIndex, name)
          onBlur(path)
        }}
        error={errorFor(path)}
      />
      <datalist id={listId}>
        {names.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  )
}

function RecipeLineFields({
  productIndex,
  lineIndex,
  line,
  ingredient,
  products,
  names,
  errorFor,
  onBlur,
  onCommitName,
  onIngredientField,
  onUsage,
  onRemoveLine,
}: {
  productIndex: number
  lineIndex: number
  line: RecipeLine
  ingredient: IngredientRow | undefined
  products: ProductRow[]
  names: readonly string[]
  errorFor: (path: string) => string | null
  onBlur: (path: string) => void
  onCommitName: (lineIndex: number, name: string) => void
  onIngredientField: (ingredientId: string, field: IngredientField, value: string) => void
  onUsage: (lineIndex: number, value: string) => void
  onRemoveLine: (lineIndex: number) => void
}) {
  const usageUnit = usageUnitLabel(ingredient?.purchaseUnit ?? 'kg')
  const sharedCount = productsUsingIngredient(products, line.ingredientId)
  const quantityPath = linePath(productIndex, lineIndex, 'purchaseQuantity')
  const unitPath = linePath(productIndex, lineIndex, 'purchaseUnit')
  const pricePath = linePath(productIndex, lineIndex, 'purchasePrice')
  const usagePath = linePath(productIndex, lineIndex, 'usageQuantity')

  return (
    <div className="grid grid-cols-2 gap-3 border-t border-qc-rule-row py-3 first:border-t-0 first:pt-0 xl:grid-cols-[minmax(0,1.5fr)_130px_120px_150px_140px] xl:items-start">
      <div className="col-span-2 xl:col-span-1">
        <IngredientName
          productIndex={productIndex}
          lineIndex={lineIndex}
          ingredient={ingredient}
          names={names}
          errorFor={errorFor}
          onBlur={onBlur}
          onCommitName={onCommitName}
        />
      </div>
      <NumberField
        id={quantityPath}
        label={RECIPE_COPY.purchaseQuantity}
        value={ingredient?.purchaseQuantity ?? ''}
        onChange={(value) => {
          if (ingredient) onIngredientField(ingredient.id, 'purchaseQuantity', value)
        }}
        onBlur={() => onBlur(quantityPath)}
        unit=""
        grouped
        error={errorFor(quantityPath)}
      />
      <label className="qc-field" htmlFor={unitPath}>
        <span>{RECIPE_COPY.purchaseUnit}</span>
        <span className="qc-input-wrap">
          <select
            id={unitPath}
            className="qc-input is-text bg-transparent"
            value={ingredient?.purchaseUnit ?? 'kg'}
            onChange={(event) => {
              if (ingredient) onIngredientField(ingredient.id, 'purchaseUnit', event.target.value)
            }}
            onBlur={() => onBlur(unitPath)}
          >
            {PURCHASE_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </span>
      </label>
      <NumberField
        id={pricePath}
        label={RECIPE_COPY.purchasePrice}
        value={ingredient?.purchasePrice ?? ''}
        onChange={(value) => {
          if (ingredient) onIngredientField(ingredient.id, 'purchasePrice', value)
        }}
        onBlur={() => onBlur(pricePath)}
        unit="TL"
        grouped
        error={errorFor(pricePath)}
      />
      <NumberField
        id={usagePath}
        label={RECIPE_COPY.usageQuantity}
        value={line.usageQuantity}
        onChange={(value) => onUsage(lineIndex, value)}
        onBlur={() => onBlur(usagePath)}
        unit={usageUnit}
        grouped
        error={errorFor(usagePath)}
      />
      {sharedCount > 1 ? (
        <p className="qc-hint col-span-2 xl:col-span-full">{RECIPE_COPY.usedBy(formatCount(sharedCount))}</p>
      ) : null}
      <button
        type="button"
        className="qc-text-btn is-muted col-span-2 text-left xl:col-span-full"
        onClick={() => onRemoveLine(lineIndex)}
      >
        {COPY.remove}
      </button>
    </div>
  )
}

export function RecipePanel({
  productIndex,
  product,
  products,
  ingredients,
  errorFor,
  onBlur,
  onCommitName,
  onIngredientField,
  onUsage,
  onAddLine,
  onRemoveLine,
  amountText,
}: RecipePanelProps) {
  const names = ingredients
    .map((ingredient) => ingredient.name.trim())
    .filter((name, index, all) => name !== '' && all.indexOf(name) === index)

  return (
    <div className="mt-1">
      {product.recipeLines.map((line, lineIndex) => (
        <RecipeLineFields
          key={line.id}
          productIndex={productIndex}
          lineIndex={lineIndex}
          line={line}
          ingredient={ingredients.find((item) => item.id === line.ingredientId)}
          products={products}
          names={names}
          errorFor={errorFor}
          onBlur={onBlur}
          onCommitName={onCommitName}
          onIngredientField={onIngredientField}
          onUsage={onUsage}
          onRemoveLine={onRemoveLine}
        />
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-qc-rule-row pt-3">
        <button type="button" className="qc-text-btn is-accent" onClick={onAddLine}>
          {RECIPE_COPY.addLine}
        </button>
        {amountText !== null ? (
          <p className="text-xs text-qc-secondary">
            {RECIPE_COPY.recipeCostLabel}:{' '}
            <span className="font-mono tabular-nums">
              {amountText} TL
            </span>
          </p>
        ) : null}
      </div>
    </div>
  )
}
