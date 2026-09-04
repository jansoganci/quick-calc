import { Fragment } from 'react'
import { NumberField } from '../../../components/NumberField.tsx'
import {
  FIELD_GROUPS,
  fieldHint,
  fieldLabel,
  fieldNumberFormat,
  fieldUnit,
  groupHeading,
  groupSummary,
  payrollHint,
  rentCostHint,
  type FieldGroup,
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

type FieldProps = Pick<QuickCalcFormProps, 'form' | 'errors' | 'dirty' | 'onChange' | 'onBlur'>

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
  const fieldProps: FieldProps = { form, errors, dirty, onChange, onBlur }

  return (
    <form
      // Below `lg` the page is one column at any width. Without a cap, a tablet
      // stretches each field to ~450px and puts a right-aligned value ~400px from
      // its label, which is hard to read as a pair. The desktop column is 392px and
      // already narrower than this, so `lg` clears the cap.
      className="mx-auto w-full max-w-[600px] bg-qc-surface px-[18px] py-5 lg:max-w-none lg:px-[30px] lg:py-[30px] lg:pb-[34px]"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      {FIELD_GROUPS.map((group, index) => (
        <FieldGroupSection
          key={group.id}
          group={group}
          first={index === 0}
          fieldProps={fieldProps}
          onRentBasisChange={onRentBasisChange}
        />
      ))}

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

/**
 * One input group: an eyebrow heading, optionally with a Mono subtotal opposite
 * it, over the same 2-column grid the form has always used. The heading row
 * repeats the `AssumptionsStrip` pattern — label left, derived figure right.
 */
function FieldGroupSection({
  group,
  first,
  fieldProps,
  onRentBasisChange,
}: {
  group: FieldGroup
  first: boolean
  fieldProps: FieldProps
  onRentBasisChange: (value: RentInputBasis) => void
}) {
  const headingId = `group-${group.id}`
  const summary = groupSummary(fieldProps.form, group.id)

  return (
    <section aria-labelledby={headingId} className={first ? undefined : 'mt-[22px]'}>
      <div className="mb-[14px] flex items-baseline justify-between gap-3 lg:mb-[18px]">
        <h2
          id={headingId}
          className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted"
        >
          {groupHeading(group.id)}
        </h2>
        {summary ? <span className="font-mono text-[11px] text-qc-ink">{summary}</span> : null}
      </div>
      <div className="grid grid-cols-2 gap-x-[13px] gap-y-[15px]">
        {group.rows.map((row) =>
          row.kind === 'payroll' ? (
            <PayrollRow key="payroll" {...fieldProps} />
          ) : row.field === 'monthlyRent' ? (
            <RentField key={row.field} {...fieldProps} onRentBasisChange={onRentBasisChange} />
          ) : (
            <PlainField key={row.field} field={row.field} span={row.span} {...fieldProps} />
          ),
        )}
      </div>
    </section>
  )
}

function PlainField({
  field,
  span,
  form,
  errors,
  dirty,
  onChange,
  onBlur,
}: FieldProps & { field: QuickField; span: 'half' | 'full' }) {
  const format = fieldNumberFormat(field)
  return (
    <NumberField
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
}

/**
 * Headcount and per-employee cost keep their own labels — "Personel" alone would
 * not say which box is which — and share a derived line beneath them, so the
 * form states the payroll figure the result table shows as one row.
 */
function PayrollRow({ form, errors, dirty, onChange, onBlur }: FieldProps) {
  const hint = payrollHint(form)
  const fields: readonly QuickField[] = ['employeeCount', 'averageEmployeeMonthlyCost']

  return (
    <Fragment>
      {fields.map((field) => {
        const format = fieldNumberFormat(field)
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
            hint={null}
            span="half"
            grouped={format.grouped}
            maxFractionDigits={format.maxFractionDigits}
          />
        )
      })}
      {hint ? <p className="qc-hint col-span-full -mt-[7px]">{hint}</p> : null}
    </Fragment>
  )
}

/** §6.1 order: field → `Net kira` / `Brüt kira` control → the stopaj hint. */
function RentField({
  form,
  errors,
  dirty,
  onChange,
  onBlur,
  onRentBasisChange,
}: FieldProps & { onRentBasisChange: (value: RentInputBasis) => void }) {
  const field: QuickField = 'monthlyRent'
  const format = fieldNumberFormat(field)
  const rentHint = rentCostHint(form)

  return (
    <div className="col-span-full">
      <NumberField
        id={field}
        label={fieldLabel(field)}
        value={form[field]}
        onChange={(value) => onChange(field, value)}
        onBlur={() => onBlur(field)}
        unit={fieldUnit(field)}
        error={dirty[field] ? errors[field] ?? null : null}
        hint={null}
        describedBy={rentHint ? `${field}-basis-hint` : undefined}
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
      {rentHint ? (
        <p id={`${field}-basis-hint`} className="qc-hint mt-1.5">
          {rentHint}
        </p>
      ) : null}
    </div>
  )
}
