import { COPY } from '../labels.ts'
import type { DetailedView } from '../viewModel.ts'

/**
 * Stabilized base month, one line per figure the engine already returned.
 * No arithmetic lives here.
 */
export function AkisFlow({ view }: { view: DetailedView }) {
  const payback = view.payback.available ? view.payback.value : view.payback.message

  return (
    <section aria-label={COPY.presentationAkis} className="max-w-[600px] px-[18px] lg:px-[30px]">
      <h2 className="text-[15px] font-medium text-qc-ink">{COPY.akisTitle}</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-qc-secondary">{COPY.akisNote}</p>
      <ol className="mt-4 divide-y divide-qc-rule border-y border-qc-rule">
        {view.flow.map((line) => (
          <li key={line.label} className="flex items-baseline justify-between gap-4 py-2.5">
            <span
              className={
                line.emphasis ? 'text-[15px] font-medium text-qc-ink' : 'text-[14px] text-qc-ink'
              }
            >
              {line.label}
            </span>
            <span className="font-mono text-[14px] tabular-nums text-qc-ink">{line.amount}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[13px] text-qc-secondary">
        {COPY.payback}: <span className="font-mono tabular-nums text-qc-ink">{payback}</span>
      </p>
    </section>
  )
}
