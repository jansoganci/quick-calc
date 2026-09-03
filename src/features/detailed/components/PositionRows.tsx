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

/**
 * A position is two lines: who and how many, then what one of them costs a month.
 * The per-person figures are employer cost, not gross salary — v1 has no payroll
 * engine (DF-15/16).
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

  return (
    <div>
      {positions.map((position, index) => {
        const open = rows.isOpen(position.id)
        const guardrail = guardrailFor(position.id)

        return (
          <div
            key={position.id}
            ref={rows.rowRef(position.id)}
            className="border-t border-qc-rule-row lg:py-3.5"
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
                <span className="font-mono text-xs tabular-nums text-qc-muted">
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

            <div className={cn('pb-3 lg:block lg:pb-0', open ? 'block' : 'hidden lg:block')}>
              <div className="grid grid-cols-2 items-center gap-2.5 lg:grid-cols-[1fr_104px_56px]">
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
                <button
                  type="button"
                  className="qc-text-btn is-muted text-right"
                  onClick={() => onRemove(index)}
                >
                  {COPY.remove}
                </button>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:pr-[66px]">
                {PER_PERSON_FIELDS.map((column) => (
                  <div key={column.field} className="flex flex-col gap-[5px]">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
                      {column.label}
                    </span>
                    <NumberField
                      id={`positions.${index}.${column.field}`}
                      label={column.label}
                      labelHidden
                      value={position[column.field]}
                      onChange={(value) => onChange(index, column.field, value)}
                      onBlur={() => onBlur(`positions.${index}.${column.field}`)}
                      unit="TL"
                      error={errorFor(`positions.${index}.${column.field}`)}
                      grouped
                    />
                  </div>
                ))}
              </div>

              {guardrail ? (
                <p className="mt-2.5 max-w-[600px] text-xs leading-relaxed text-qc-muted">
                  {guardrail}
                </p>
              ) : null}
            </div>
          </div>
        )
      })}

      <div className={cn('pt-3', positions.length > 0 && 'border-t border-qc-rule-row')}>
        <button type="button" className="qc-text-btn is-accent" onClick={onAdd}>
          {COPY.addPosition}
        </button>
      </div>
    </div>
  )
}
