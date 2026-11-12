import type { FixedCostDaysView } from '../insightsView.ts'

export function FixedCostDaysList({ days }: { days: FixedCostDaysView }) {
  if (!days.available) {
    return <p className="text-[13px] leading-relaxed text-qc-ink">{days.unavailableMessage}</p>
  }

  return (
    <ol className="m-0 max-w-[720px] list-none p-0">
      {days.lines.map((line, index) => (
        <li
          key={`${index}-${line}`}
          className="border-t border-qc-rule-row py-2.5 text-[13px] leading-relaxed text-qc-ink last:border-b last:border-qc-rule"
        >
          {line}
        </li>
      ))}
    </ol>
  )
}
