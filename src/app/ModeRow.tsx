import { cn } from '../lib/cn.ts'
import {
  MODES,
  MODE_ANCHORS,
  MODE_DESCRIPTIONS,
  MODE_LABELS,
  SHELL_COPY,
  type CalculationMode,
} from './shellCopy.ts'

/**
 * The choice between the two calculators, given a row of its own under the
 * masthead.
 *
 * It used to be two text links in the masthead's top-right corner, where the only
 * difference between "the mode you are in" and "the other product" was font weight
 * and a 2px underline — no border, no background, nothing that reads as a control,
 * and 11px on a phone. Visitors did not see it, and the labels alone never said
 * what the second mode was for, so people who landed in Quick (the default) never
 * learned Detailed existed.
 *
 * Two changes fix that, and both matter: the switch is now a full-width row where
 * the eye lands after the product name, and **each mode carries a line saying what
 * it gives you**. A label cannot explain a product; a label plus five words can.
 *
 * Still the locked visual language: hairline rule, no card, no pill, no icon, and
 * the active mark is an ink underline — never the accent, which V2 reserves for the
 * headline figure and focus states.
 */
export function ModeRow({
  mode,
  onModeChange,
}: {
  mode: CalculationMode
  onModeChange: (mode: CalculationMode) => void
}) {
  return (
    <nav
      aria-label={SHELL_COPY.modeNavigation}
      className="qc-screen-only border-b border-qc-rule bg-qc-surface px-[18px] pb-3.5 pt-3 lg:px-[30px]"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-muted">
        {SHELL_COPY.modeNavigation}
      </span>

      <div className="mt-2 grid grid-cols-2 gap-x-5 lg:max-w-[620px] lg:gap-x-10">
        {MODES.map((candidate) => {
          const isActive = candidate === mode
          return (
            <a
              key={candidate}
              href={`#${MODE_ANCHORS[candidate]}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={(event) => {
                // The href keeps each entry a real link; following it would jump
                // the page, so the shell's own mode change handles it instead.
                event.preventDefault()
                onModeChange(candidate)
              }}
              className="group flex min-h-[44px] flex-col items-start pt-1"
            >
              <span
                className={cn(
                  'border-b-2 pb-1 text-sm',
                  isActive
                    ? 'border-b-qc-ink font-semibold text-qc-ink'
                    : 'border-b-transparent text-qc-secondary group-hover:border-b-qc-rule-strong group-hover:text-qc-ink',
                )}
              >
                {MODE_LABELS[candidate]}
              </span>
              <span className="mt-1.5 text-xs leading-relaxed text-qc-muted">
                {MODE_DESCRIPTIONS[candidate]}
              </span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
