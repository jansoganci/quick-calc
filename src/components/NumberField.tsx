import { cn } from '../lib/cn.ts'

type NumberFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  unit: string
  error?: string | null
  hint?: string | null
  span?: 'half' | 'full'
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  onBlur,
  unit,
  error,
  hint,
  span = 'half',
}: NumberFieldProps) {
  return (
    <label className={cn('qc-field', span === 'full' && 'col-span-full')} htmlFor={id}>
      <span>{label}</span>
      <span className={cn('qc-input-wrap', error && 'is-error')}>
        <input
          id={id}
          className="qc-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        />
        <span className="qc-unit">{unit}</span>
      </span>
      {error ? (
        <span id={`${id}-error`} className="qc-error" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-hint`} className="qc-hint">
          {hint}
        </span>
      ) : null}
    </label>
  )
}
