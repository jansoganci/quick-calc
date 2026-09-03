import type { ReactNode } from 'react'
import { cn } from '../../../lib/cn.ts'
import { COPY, SECTION_LABELS, SECTION_NOTES, type SectionId } from '../labels.ts'

type SectionFrameProps = {
  section: SectionId
  index: number
  echoLabel: string | null
  echoValue: string | null
  /** Collapsed-state stand-in shown before the first calculation: `4 ürün`, `%100`, `—`. */
  summary: string
  isOpen: boolean
  onToggle: () => void
  nextSection: SectionId | null
  onGoToNext: () => void
  children: ReactNode
}

/**
 * One input section. Below `md` it is an accordion; from `md` up the content is
 * always visible and the header is inert. The header carries at most one engine
 * figure, and only after the first calculation.
 */
export function SectionFrame({
  section,
  index,
  echoLabel,
  echoValue,
  summary,
  isOpen,
  onToggle,
  nextSection,
  onGoToNext,
  children,
}: SectionFrameProps) {
  const note = SECTION_NOTES[section]
  const headingId = `${section}-heading`

  return (
    <section
      id={`detailed-${section}`}
      aria-labelledby={headingId}
      className="border-t border-qc-rule first:border-t-0 md:py-[26px] md:first:pt-0"
    >
      <h2 id={headingId} className="m-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`${section}-content`}
          className="flex w-full min-h-[52px] items-center justify-between gap-3 text-left md:min-h-0 md:cursor-default md:items-baseline"
        >
          <span className="flex items-baseline gap-[10px]">
            <span className="font-mono text-[11px] tabular-nums text-qc-subtle">
              {String(index).padStart(2, '0')}
            </span>
            <span className="text-[15px] font-semibold text-qc-ink">
              {SECTION_LABELS[section]}
            </span>
          </span>
          <span className="flex items-center gap-[10px] md:items-baseline">
            {echoValue !== null && echoLabel !== null ? (
              <span className="flex items-baseline gap-2">
                <span className="hidden text-xs text-qc-muted lg:inline">{echoLabel}</span>
                <span className="font-mono text-sm tabular-nums text-qc-ink">{echoValue}</span>
              </span>
            ) : (
              <span className="font-mono text-xs tabular-nums text-qc-secondary md:hidden">
                {summary}
              </span>
            )}
            <span
              aria-hidden="true"
              className={cn(
                'inline-block h-[7px] w-[7px] border-b-[1.5px] border-r-[1.5px] border-qc-muted md:hidden',
                isOpen ? '-translate-y-1 rotate-[-135deg]' : '-translate-y-0.5 rotate-45',
              )}
            />
          </span>
        </button>
      </h2>

      <div
        id={`${section}-content`}
        className={cn('pb-[22px] md:block md:pb-0', isOpen ? 'block' : 'hidden')}
      >
        {note ? (
          <p className="mb-4 mt-1.5 max-w-[600px] text-xs leading-relaxed text-qc-muted">{note}</p>
        ) : null}
        {children}
        {nextSection ? (
          <div className="mt-[18px] border-t border-qc-rule-row pt-[14px] md:hidden">
            <button type="button" className="qc-text-btn is-accent" onClick={onGoToNext}>
              {COPY.nextSection(SECTION_LABELS[nextSection])}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
