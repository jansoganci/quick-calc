import { PURCHASE_UNITS, type PurchaseUnit } from '../../../core/detailed/index.ts'
import { cn } from '../../../lib/cn.ts'
import type { DetailedFormState, IngredientRow } from '../formState.ts'
import { RECIPE_COPY } from '../labels.ts'
import { isPurchaseUnitAllowed } from '../recipeForm.ts'

type UnitPickerProps = {
  id: string
  form: DetailedFormState
  ingredient: IngredientRow
  onChange: (unit: PurchaseUnit) => void
  onBlur?: () => void
  describedBy?: string
  labelHidden?: boolean | 'from-lg'
}

export function UnitPicker({
  id,
  form,
  ingredient,
  onChange,
  onBlur,
  describedBy,
  labelHidden = false,
}: UnitPickerProps) {
  return (
    <div>
      <span
        className={cn(
          'qc-field-label',
          labelHidden === true && 'sr-only',
          labelHidden === 'from-lg' && 'lg:sr-only',
        )}
        id={`${id}-label`}
      >
        {RECIPE_COPY.purchaseUnit}
      </span>
      <div
        className="qc-segment mt-1.5 lg:hidden"
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
      >
        {PURCHASE_UNITS.map((unit) => {
          const allowed = isPurchaseUnitAllowed(form, ingredient, unit)
          const pressed = ingredient.purchaseUnit === unit
          return (
            <button
              key={unit}
              type="button"
              role="radio"
              aria-checked={pressed}
              aria-pressed={pressed}
              aria-disabled={!allowed || undefined}
              disabled={!allowed}
              className={cn(
                'qc-segment-btn',
                !allowed && 'cursor-not-allowed bg-qc-disabled text-qc-subtle',
              )}
              onClick={() => {
                if (!allowed) return
                onChange(unit)
              }}
            >
              {unit}
            </button>
          )
        })}
      </div>
      <span className="qc-input-wrap mt-1.5 hidden lg:flex">
        <select
          id={id}
          className="qc-input is-text bg-transparent"
          value={ingredient.purchaseUnit}
          aria-labelledby={`${id}-label`}
          aria-describedby={describedBy}
          onChange={(event) => {
            const value = event.target.value
            if (value === '') return
            if (!PURCHASE_UNITS.includes(value as PurchaseUnit)) return
            if (!isPurchaseUnitAllowed(form, ingredient, value as PurchaseUnit)) return
            onChange(value as PurchaseUnit)
          }}
          onBlur={onBlur}
        >
          {ingredient.purchaseUnit === '' ? (
            <option value="">{RECIPE_COPY.purchaseUnit}</option>
          ) : null}
          {PURCHASE_UNITS.map((unit) => (
            <option
              key={unit}
              value={unit}
              disabled={!isPurchaseUnitAllowed(form, ingredient, unit)}
            >
              {unit}
            </option>
          ))}
        </select>
      </span>
    </div>
  )
}
