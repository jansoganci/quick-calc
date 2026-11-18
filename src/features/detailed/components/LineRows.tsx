import { NumberField } from '../../../components/NumberField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { cn } from '../../../lib/cn.ts'
import type { LineRow } from '../formState.ts'
import { COPY } from '../labels.ts'
import { useNewestRowOpen } from '../hooks/useNewestRowOpen.ts'

type LineRowsProps = {
  lines: LineRow[]
  pathPrefix: 'opexLines' | 'capexItems'
  amountField: 'monthlyAmount' | 'amount'
  nameLabel: string
  amountLabel: string
  addLabel: string
  starterLabel: string
  starters: readonly string[]
  errorFor: (path: string) => string | null
  onBlur: (path: string) => void
  onChange: (index: number, field: keyof Omit<LineRow, 'id'>, value: string) => void
  onAdd: (name?: string) => void
  onRemove: (index: number) => void
}

/**
 * A flat name-and-amount list plus a starter palette. DF-18/19/20 forbids a blank
 * expense sheet, and twelve empty rows would be worse than none — so the standard
 * lines sit as quiet text controls until one is chosen, and a chosen one reads as added.
 */
export function LineRows({
  lines,
  pathPrefix,
  amountField,
  nameLabel,
  amountLabel,
  addLabel,
  starterLabel,
  starters,
  errorFor,
  onBlur,
  onChange,
  onAdd,
  onRemove,
}: LineRowsProps) {
  const used = new Set(lines.map((line) => line.name.trim()))
  const rows = useNewestRowOpen(lines.map((line) => line.id))
  // One item per row, top to bottom (never two side by side): name · amount · Kaldır.
  const gridCols = 'grid-cols-[minmax(0,1fr)_124px_52px] lg:grid-cols-[minmax(0,1fr)_160px_52px]'

  return (
    <div>
      {lines.length > 0 ? (
        <div className={cn('hidden items-end gap-2.5 pb-2 lg:grid', gridCols)}>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
            {nameLabel}
          </span>
          <span className="text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
            {amountLabel}
          </span>
          <span />
        </div>
      ) : null}

      <div>
        {lines.map((line, index) => (
          <div
            key={line.id}
            ref={rows.rowRef(line.id)}
            className={cn('grid items-center gap-2.5 border-t border-qc-rule-row py-2', gridCols)}
          >
            <TextField
              id={`${pathPrefix}.${index}.name`}
              label={nameLabel}
              labelHidden="from-lg"
              value={line.name}
              onChange={(value) => onChange(index, 'name', value)}
              onBlur={() => onBlur(`${pathPrefix}.${index}.name`)}
              error={errorFor(`${pathPrefix}.${index}.name`)}
            />
            <NumberField
              id={`${pathPrefix}.${index}.${amountField}`}
              label={amountLabel}
              labelHidden="from-lg"
              value={line.amount}
              onChange={(value) => onChange(index, 'amount', value)}
              onBlur={() => onBlur(`${pathPrefix}.${index}.${amountField}`)}
              unit="TL"
              error={errorFor(`${pathPrefix}.${index}.${amountField}`)}
              grouped
            />
            <button
              type="button"
              className="qc-text-btn text-right"
              onClick={() => onRemove(index)}
            >
              {COPY.remove}
            </button>
          </div>
        ))}
      </div>

      <div className={cn('mt-4', lines.length > 0 && 'border-t border-qc-rule-row pt-4')}>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
          {starterLabel}
        </span>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
          {starters.map((starter) =>
            used.has(starter) ? (
              <span key={starter} className="text-[13px] text-qc-secondary">
                {COPY.starterAdded(starter)}
              </span>
            ) : (
              <button
                key={starter}
                type="button"
                className="qc-text-btn is-accent"
                onClick={() => onAdd(starter)}
              >
                + {starter}
              </button>
            ),
          )}
          <button type="button" className="qc-text-btn is-accent" onClick={() => onAdd()}>
            {addLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
