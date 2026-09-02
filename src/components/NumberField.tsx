import { useLayoutEffect, useRef } from 'react'
import { cn } from '../lib/cn.ts'
import { caretAfterFormat, formatTypedTurkishNumber } from '../lib/number.ts'

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
  placeholder?: string
  grouped?: boolean
  maxFractionDigits?: number
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
  placeholder,
  grouped = false,
  maxFractionDigits = 2,
}: NumberFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const caretRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const node = inputRef.current
    const caret = caretRef.current
    if (node === null || caret === null) return
    node.setSelectionRange(caret, caret)
    caretRef.current = null
  }, [value])

  function applyGrouped(nextRaw: string, caret: number | null) {
    const formatted = formatTypedTurkishNumber(nextRaw, { maxFractionDigits })
    if (caret !== null) {
      caretRef.current = caretAfterFormat(nextRaw, caret, formatted)
    }
    onChange(formatted)
  }

  return (
    <label className={cn('qc-field', span === 'full' && 'col-span-full')} htmlFor={id}>
      <span>{label}</span>
      <span className={cn('qc-input-wrap', error && 'is-error')}>
        <input
          ref={inputRef}
          id={id}
          className="qc-input"
          value={value}
          onChange={(event) => {
            const next = event.target.value
            if (!grouped) {
              onChange(next)
              return
            }
            applyGrouped(next, event.target.selectionStart)
          }}
          onBlur={() => {
            if (grouped && value.trim() !== '') {
              applyGrouped(value, null)
            }
            onBlur?.()
          }}
          onPaste={(event) => {
            if (!grouped) return
            const pasted = event.clipboardData.getData('text')
            if (pasted === '') return
            event.preventDefault()
            const node = event.currentTarget
            const start = node.selectionStart ?? value.length
            const end = node.selectionEnd ?? value.length
            const next = `${value.slice(0, start)}${pasted}${value.slice(end)}`
            applyGrouped(next, start + pasted.length)
          }}
          placeholder={placeholder}
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
