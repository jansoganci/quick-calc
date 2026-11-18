import { NumberField } from '../../../components/NumberField.tsx'
import { TextField } from '../../../components/TextField.tsx'
import { cn } from '../../../lib/cn.ts'
import type { PositionRow } from '../formState.ts'
import { COPY, POSITION_LABELS } from '../labels.ts'
import { useNewestRowOpen } from '../hooks/useNewestRowOpen.ts'

const PER_PERSON_FIELDS = [
  { field: 'employerCostPerPerson', label: POSITION_LABELS.employerCostPerPerson },
  { field: 'mealCostPerPerson', label: POSITION_LABELS.mealCostPerPerson },
  { field: 'transportCostPerPerson', label: POSITION_LABELS.transportCostPerPerson },
  { field: 'averageBonusPerPerson', label: POSITION_LABELS.averageBonusPerPerson },
] as const

type PositionRowsProps = {
  positions: PositionRow[]
  guardrailFor: (positionId: string) => string | null
  errorFor: (path: string) => string | null
  onBlur: (path: string) => void
  onChange: (index: number, field: keyof Omit<PositionRow, 'id'>, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

/** Desktop: one row per position, one header per column. */
const GRID = 'lg:grid-cols-[minmax(0,1fr)_80px_112px_92px_92px_92px_52px]'
const HINT_ID = 'positions.employerCostHint'

/**
 * A position is one table row: who, how many, and what one of them costs a
 * month. The per-person figures are employer cost, not gross salary — v1 has
 * no payroll engine (DF-15/16).
 */
export function PositionRows({
  positions,
  guardrailFor,
  errorFor,
  onBlur,
  onChange,
  onAdd,
  onRemove,
}: PositionRowsProps) {
  const rows = useNewestRowOpen(positions.map((position) => position.id))
  const header = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary'

  return (
    <div>
      {positions.length > 0 ? (
        <div className={cn('hidden items-end gap-2 pb-2 lg:grid', GRID)}>
          <span className={header}>{COPY.positionName}</span>
          <span className={cn(header, 'text-right')}>{POSITION_LABELS.headcount}</span>
          {PER_PERSON_FIELDS.map((column) => (
            <span key={column.field} className={cn(header, 'text-right')}>
              {column.label}
            </span>
          ))}
          <span />
        </div>
      ) : null}

      {positions.map((position, index) => {
        const open = rows.isOpen(position.id)
        const guardrail = guardrailFor(position.id)

        return (
          <div
            key={position.id}
            ref={rows.rowRef(position.id)}
            className="border-t border-qc-rule-row lg:py-[9px]"
          >
            <button
              type="button"
              onClick={() => rows.toggle(position.id)}
              aria-expanded={open}
              className="flex min-h-[44px] w-full items-center justify-between gap-3 text-left lg:hidden"
            >
              <span className="text-[15px] text-qc-ink">
                {position.name.trim() === ''
                  ? `${POSITION_LABELS.name} ${index + 1}`
                  : position.name}
              </span>
              <span className="flex items-center gap-2.5">
                <span className="font-mono text-xs tabular-nums text-qc-secondary">
                  {position.headcount === '' ? '' : `${position.headcount} kişi`}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-block h-[7px] w-[7px] border-b-[1.5px] border-r-[1.5px] border-qc-muted',
                    open ? '-translate-y-1 rotate-[-135deg]' : '-translate-y-0.5 rotate-45',
                  )}
                />
              </span>
            </button>

            <div
              className={cn(
                'grid grid-cols-2 gap-2.5 pb-3 lg:items-center lg:gap-2 lg:pb-0',
                GRID,
                open ? 'grid' : 'hidden lg:grid',
              )}
            >
              <div className="col-span-2 lg:col-span-1">
                <TextField
                  id={`positions.${index}.name`}
                  label={COPY.positionName}
                  labelHidden="from-lg"
                  value={position.name}
                  onChange={(value) => onChange(index, 'name', value)}
                  onBlur={() => onBlur(`positions.${index}.name`)}
                  error={errorFor(`positions.${index}.name`)}
                />
              </div>
              <NumberField
                id={`positions.${index}.headcount`}
                label={POSITION_LABELS.headcount}
                labelHidden="from-lg"
                value={position.headcount}
                onChange={(value) => onChange(index, 'headcount', value)}
                onBlur={() => onBlur(`positions.${index}.headcount`)}
                unit="kişi"
                error={errorFor(`positions.${index}.headcount`)}
              />
              {PER_PERSON_FIELDS.map((column) => (
                <NumberField
                  key={column.field}
                  id={`positions.${index}.${column.field}`}
                  label={column.label}
                  labelHidden="from-lg"
                  value={position[column.field]}
                  onChange={(value) => onChange(index, column.field, value)}
                  onBlur={() => onBlur(`positions.${index}.${column.field}`)}
                  unit="TL"
                  error={errorFor(`positions.${index}.${column.field}`)}
                  grouped
                  describedBy={column.field === 'employerCostPerPerson' ? HINT_ID : undefined}
                />
              ))}
              <button
                type="button"
                className="qc-text-btn col-span-2 text-left lg:col-span-1 lg:text-right"
                onClick={() => onRemove(index)}
              >
                {COPY.remove}
              </button>
              {guardrail ? (
                <p className="col-span-2 max-w-[600px] text-xs leading-relaxed text-qc-secondary lg:col-span-full">
                  {guardrail}
                </p>
              ) : null}
            </div>
          </div>
        )
      })}

      {positions.length > 0 ? (
        // A sentence, not an ⓘ: the difference between employer cost and net
        // salary is the one thing to read here.
        <p id={HINT_ID} className="border-t border-qc-rule-row pt-2.5 text-xs leading-relaxed text-qc-secondary">
          {COPY.employerCostInfo}
        </p>
      ) : null}

      <div className="pt-3">
        <button type="button" className="qc-text-btn is-accent" onClick={onAdd}>
          {COPY.addPosition}
        </button>
      </div>
    </div>
  )
}
