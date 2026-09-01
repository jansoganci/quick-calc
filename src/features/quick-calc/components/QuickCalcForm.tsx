import { NumberField } from '../../../components/NumberField.tsx'
import { FIELD_LAYOUT, fieldHint, fieldLabel, fieldUnit, type QuickField, type QuickFormState } from '../viewModel.ts'
import { AssumptionsStrip } from './AssumptionsStrip.tsx'

type QuickCalcFormProps = {
  form: QuickFormState
  errors: Partial<Record<QuickField, string>>
  dirty: Partial<Record<QuickField, boolean>>
  canSubmit: boolean
  submitHint: string | null
  onChange: (field: QuickField, value: string) => void
  onBlur: (field: QuickField) => void
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
  onSubmit,
}: QuickCalcFormProps) {
  return (
    <form
      className="bg-white px-[18px] py-5 lg:px-[30px] lg:py-[30px] lg:pb-[34px]"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <div className="mb-[14px] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A9199] lg:mb-[18px]">
        İşletme bilgileri
      </div>
      <div className="grid grid-cols-2 gap-x-[13px] gap-y-[15px]">
        {FIELD_LAYOUT.map(({ field, span }) => (
          <NumberField
            key={field}
            id={field}
            label={fieldLabel(field)}
            value={form[field]}
            onChange={(value) => onChange(field, value)}
            onBlur={() => onBlur(field)}
            unit={fieldUnit(field)}
            error={dirty[field] ? errors[field] ?? null : null}
            hint={fieldHint(field)}
            span={span}
          />
        ))}
      </div>

      <div className="my-[22px] h-px bg-[#E3E5E8]" />
      <AssumptionsStrip />
      <div className="mb-[22px] h-px bg-[#E3E5E8]" />

      <button
        type="submit"
        disabled={!canSubmit}
        className={
          canSubmit
            ? 'h-[46px] w-full rounded border border-[#1D3A5F] bg-[#1D3A5F] text-[15px] font-medium text-white hover:border-[#16304F] hover:bg-[#16304F]'
            : 'h-[46px] w-full cursor-not-allowed rounded border border-[#DDE0E4] bg-[#F1F2F4] text-[15px] font-medium text-[#A8AEB6]'
        }
      >
        Hesapla
      </button>
      {submitHint ? (
        <p className="mt-2.5 text-center text-xs text-[#8A9199]">{submitHint}</p>
      ) : null}
    </form>
  )
}
