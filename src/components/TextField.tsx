import { cn } from '../lib/cn.ts'

type TextFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string | null
  hint?: string | null
  placeholder?: string
  /**
   * `true` hides the label at every width; `'from-lg'` keeps it on mobile and hides
   * it from `lg` up, where a column header takes over.
   */
  labelHidden?: boolean | 'from-lg'
}

/**
 * A name field. Same control anatomy as `NumberField` — same border, height, focus
 * and error treatment — but Plex Sans and left aligned, because a name is text and
 * only figures are set in Mono.
 */
export function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  placeholder,
  labelHidden = false,
}: TextFieldProps) {
  return (
    <label className={cn('qc-field', labelHidden === true && 'gap-0')} htmlFor={id}>
      <span className={labelHidden === true ? 'sr-only' : labelHidden === 'from-lg' ? 'lg:sr-only' : undefined}>
        {label}
      </span>
      <span className={cn('qc-input-wrap', error && 'is-error')}>
        <input
          id={id}
          className="qc-input is-text"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        />
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
