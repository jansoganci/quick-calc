import { useEffect, useState } from 'react'
import { PURCHASE_UNITS } from '../../../core/detailed/index.ts'
import { NumberField } from '../../../components/NumberField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { formatCount } from '../../../lib/number.ts'
import type { DetailedFormState, IngredientRow } from '../formState.ts'
import { RECIPE_COPY } from '../labels.ts'
import { listedIngredients, productsUsingIngredient } from '../recipeForm.ts'

type IngredientField = 'purchaseQuantity' | 'purchasePrice' | 'purchaseUnit'
type NameFailure = 'empty' | 'duplicate' | null

type IngredientListProps = {
  form: DetailedFormState
  errorFor: (path: string) => string | null
  onBlur: (path: string) => void
  onCommitName: (ingredientId: string, name: string) => NameFailure
  onIngredientField: (ingredientId: string, field: IngredientField, value: string) => void
}

function fieldPath(ingredientId: string, field: string): string {
  return `ingredients.${ingredientId}.${field}`
}

function IngredientName({
  ingredient,
  onCommitName,
  onBlur,
}: {
  ingredient: IngredientRow
  onCommitName: (ingredientId: string, name: string) => NameFailure
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
      value={name}
      onChange={(value) => {
        setName(value)
        setNameError(null)
      }}
      onBlur={() => {
        const reason = onCommitName(ingredient.id, name)
        if (reason === 'empty') setNameError(RECIPE_COPY.ingredientMissing)
        else if (reason === 'duplicate') setNameError(RECIPE_COPY.duplicateName)
        else setNameError(null)
        onBlur(path)
      }}
      error={nameError}
    />
  )
}

function IngredientListRow({
  ingredient,
  products,
  errorFor,
  onBlur,
  onCommitName,
  onIngredientField,
}: {
  ingredient: IngredientRow
  products: DetailedFormState['products']
  errorFor: (path: string) => string | null
  onBlur: (path: string) => void
  onCommitName: (ingredientId: string, name: string) => NameFailure
  onIngredientField: (ingredientId: string, field: IngredientField, value: string) => void
}) {
  const sharedCount = productsUsingIngredient(products, ingredient.id)
  const quantityPath = fieldPath(ingredient.id, 'purchaseQuantity')
  const unitPath = fieldPath(ingredient.id, 'purchaseUnit')
  const pricePath = fieldPath(ingredient.id, 'purchasePrice')

  return (
    <div className="grid grid-cols-2 gap-3 border-t border-qc-rule-row py-3 first:border-t-0 first:pt-0 xl:grid-cols-[minmax(0,1.5fr)_130px_120px_150px] xl:items-start">
      <div className="col-span-2 xl:col-span-1">
        <IngredientName ingredient={ingredient} onCommitName={onCommitName} onBlur={onBlur} />
      </div>
      <NumberField
        id={quantityPath}
        label={RECIPE_COPY.purchaseQuantity}
        value={ingredient.purchaseQuantity}
        onChange={(value) => onIngredientField(ingredient.id, 'purchaseQuantity', value)}
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
            value={ingredient.purchaseUnit}
            onChange={(event) => onIngredientField(ingredient.id, 'purchaseUnit', event.target.value)}
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
        value={ingredient.purchasePrice}
        onChange={(value) => onIngredientField(ingredient.id, 'purchasePrice', value)}
        onBlur={() => onBlur(pricePath)}
        unit="TL"
        grouped
        error={errorFor(pricePath)}
      />
      {sharedCount > 1 ? (
        <p className="qc-hint col-span-2 xl:col-span-full">{RECIPE_COPY.usedBy(formatCount(sharedCount))}</p>
      ) : null}
    </div>
  )
}

/** The shared purchase list. Hidden until a recipe has named an ingredient. */
export function IngredientList({
  form,
  errorFor,
  onBlur,
  onCommitName,
  onIngredientField,
}: IngredientListProps) {
  const ingredients = listedIngredients(form)
  if (ingredients.length === 0) return null

  return (
    <div className="mb-5 border-b border-qc-rule pb-4">
      <p className="text-[15px] font-medium text-qc-ink">{RECIPE_COPY.listHeading}</p>
      <p className="qc-hint mt-1">{RECIPE_COPY.listHint}</p>
      <div className="mt-3">
        {ingredients.map((ingredient) => (
          <IngredientListRow
            key={ingredient.id}
            ingredient={ingredient}
            products={form.products}
            errorFor={errorFor}
            onBlur={onBlur}
            onCommitName={onCommitName}
            onIngredientField={onIngredientField}
          />
        ))}
      </div>
    </div>
  )
}
