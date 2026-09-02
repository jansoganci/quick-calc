import { NumberField } from '../../../components/NumberField.tsx'
import {
  FIELD_LAYOUT,
  fieldHint,
  fieldLabel,
  fieldNumberFormat,
  fieldUnit,
  rentCostHint,
  type QuickField,
  type QuickFormState,
  type RentInputBasis,
} from '../viewModel.ts'
import { COPY, RENT_BASIS_LABELS } from '../labels.ts'
import { AssumptionsStrip } from './AssumptionsStrip.tsx'

type QuickCalcFormProps = {
  form: QuickFormState
  errors: Partial<Record<QuickField, string>>
  dirty: Partial<Record<QuickField, boolean>>
  canSubmit: boolean
  submitHint: string | null
  onChange: (field: QuickField, value: string) => void
  onBlur: (field: QuickField) => void
  onRentBasisChange: (value: RentInputBasis) => void
  onSubmit: () => void
}

export function QuickCalcForm({
  form,
  errors,
  dirty,
  canSubmit,
  submitHint,
  onChange,
  onBlur,
  onRentBasisChange,
  onSubmit,
}: QuickCalcFormProps) {
  const rentHint = rentCostHint(form)

  return (
    <form
      className="bg-qc-surface px-[18px] py-5 lg:px-[30px] lg:py-[30px] lg:pb-[34px]"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className="mb-[14px] text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted lg:mb-[18px]">
        {COPY.formSection}
      </div>
      <div className="grid grid-cols-2 gap-x-[13px] gap-y-[15px]">
        {FIELD_LAYOUT.map(({ field, span }) => {
          const format = fieldNumberFormat(field)
          if (field === 'monthlyRent') {
            return (
              <div key={field}>
                <NumberField
                  id={field}
                  label={fieldLabel(field)}
                  value={form[field]}
                  onChange={(value) => onChange(field, value)}
                  onBlur={() => onBlur(field)}
                  unit={fieldUnit(field)}
                  error={dirty[field] ? errors[field] ?? null : null}
                  hint={rentHint}
                  span="full"
                  grouped={format.grouped}
                  maxFractionDigits={format.maxFractionDigits}
                />
                <div className="qc-segment" role="group" aria-label={COPY.rentBasisGroup}>
                  {(['net', 'gross'] as const).map((basis) => (
                    <button
                      key={basis}
                      type="button"
                      className="qc-segment-btn"
                      aria-pressed={form.rentInputBasis === basis}
                      onClick={() => onRentBasisChange(basis)}
                    >
                      {RENT_BASIS_LABELS[basis]}
                    </button>
                  ))}
                </div>
              </div>
            )
          }

          return (
            <NumberField
              key={field}
              id={field}
              label={fieldLabel(field)}
              value={form[field]}
              onChange={(value) => onChange(field, value)}
              onBlur={() => onBlur(field)}
              unit={fieldUnit(field)}
              error={dirty[field] ? errors[field] ?? null : null}
              hint={fieldHint(field) ?? null}
              span={span}
              grouped={format.grouped}
              maxFractionDigits={format.maxFractionDigits}
            />
          )
        })}
      </div>

      <div className="my-[22px] h-px bg-qc-rule" />
      <AssumptionsStrip
        form={form}
        errors={errors}
        dirty={dirty}
        onChange={onChange}
        onBlur={onBlur}
      />
      <div className="mb-[22px] h-px bg-qc-rule" />

      <button
        type="submit"
        disabled={!canSubmit}
        className={
          canSubmit
            ? 'h-[46px] w-full rounded border border-qc-accent bg-qc-accent text-[15px] font-medium text-qc-on-accent hover:border-qc-accent-hover hover:bg-qc-accent-hover'
            : 'h-[46px] w-full cursor-not-allowed rounded border border-qc-disabled-border bg-qc-disabled text-[15px] font-medium text-qc-subtle'
        }
      >
        {COPY.calculate}
      </button>
      {submitHint ? (
        <p className="mt-2.5 text-center text-xs text-qc-muted">{submitHint}</p>
      ) : null}
    </form>
  )
}
