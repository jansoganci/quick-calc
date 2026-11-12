import { NumberField } from '../../../components/NumberField.tsx'
import { COPY } from '../labels.ts'
import type { JanuaryPreview } from '../insightsView.ts'

type JanuaryTestProps = {
  wageIncrease: string
  rentIncrease: string
  onWageIncrease: (value: string) => void
  onRentIncrease: (value: string) => void
  beforeResult: string
  beforeBreakEven: string
  preview: JanuaryPreview
}

export function JanuaryTest({
  wageIncrease,
  rentIncrease,
  onWageIncrease,
  onRentIncrease,
  beforeResult,
  beforeBreakEven,
  preview,
}: JanuaryTestProps) {
  return (
    <div>
      <div className="qc-screen-only grid grid-cols-1 gap-x-[13px] gap-y-[15px] lg:max-w-[520px] lg:grid-cols-2">
        <NumberField
          id="january-wage-increase"
          label={COPY.januaryWage}
          value={wageIncrease}
          onChange={onWageIncrease}
          unit="%"
          placeholder="0"
          hint={preview.wageInvalid ? COPY.januaryInvalid : null}
        />
        <NumberField
          id="january-rent-increase"
          label={COPY.januaryRent}
          value={rentIncrease}
          onChange={onRentIncrease}
          unit="%"
          placeholder="0"
          hint={preview.rentInvalid ? COPY.januaryInvalid : null}
        />
      </div>

      <div className="qc-print-only mt-1 text-[13px] text-qc-secondary">
        {`${COPY.januaryWage} %${wageIncrease.trim() === '' ? '0' : wageIncrease} · ${COPY.januaryRent} %${rentIncrease.trim() === '' ? '0' : rentIncrease}`}
      </div>

      <div className="mt-4 max-w-[720px]">
        <JanuaryCompare
          label={COPY.januaryResult}
          before={beforeResult}
          after={preview.monthlyOperatingResult}
        />
        <JanuaryCompare
          label={COPY.januaryBreakEven}
          before={beforeBreakEven}
          after={preview.breakEvenValue ?? preview.breakEvenMessage ?? COPY.none}
        />
      </div>
    </div>
  )
}

function JanuaryCompare({
  label,
  before,
  after,
}: {
  label: string
  before: string
  after: string
}) {
  return (
    <div className="border-t border-qc-rule-row py-2.5 last:border-b last:border-qc-rule">
      <div className="text-[13px] text-qc-secondary">{label}</div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-[11px] text-qc-secondary">{COPY.januaryBefore}</span>
        <span className="font-mono text-sm tabular-nums text-qc-secondary">{before}</span>
        <span className="text-[13px] text-qc-secondary" aria-hidden="true">
          →
        </span>
        <span className="text-[11px] text-qc-secondary">{COPY.januaryAfter}</span>
        <span className="font-mono text-sm tabular-nums text-qc-ink">{after}</span>
      </div>
    </div>
  )
}
