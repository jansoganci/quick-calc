import { cn } from '../lib/cn.ts'
import {
  AREAS,
  AREA_ANCHORS,
  AREA_LABELS,
  SHELL_COPY,
  type AppArea,
} from './shellCopy.ts'

/**
 * The three top-level areas. Desktop: a vertical text list in the empty column
 * to the left of the sheet. Mobile: a simple horizontal text row under the
 * masthead, the same idea as the old two-mode tabs, without the eyebrow, the
 * descriptions, icons or cards.
 */
export function AreaNav({
  area,
  onAreaChange,
  layout,
}: {
  area: AppArea
  onAreaChange: (area: AppArea) => void
  layout: 'mobile' | 'desktop'
}) {
  const isDesktop = layout === 'desktop'

  return (
    <nav
      aria-label={SHELL_COPY.areaNavigation}
      className={
        isDesktop
          ? 'qc-screen-only hidden w-[148px] shrink-0 self-start lg:sticky lg:top-0 lg:block lg:px-3 lg:pt-5'
          : 'qc-screen-only border-b border-qc-rule bg-qc-surface px-[18px] lg:hidden'
      }
    >
      <div className={isDesktop ? 'flex flex-col' : 'grid grid-cols-3 gap-x-2'}>
        {AREAS.map((candidate) => {
          const isActive = candidate === area
          return (
            <a
              key={candidate}
              href={`#${AREA_ANCHORS[candidate]}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault()
                onAreaChange(candidate)
              }}
              className={cn(
                'flex min-h-[44px]',
                isDesktop ? 'items-start pt-1' : 'items-center justify-center',
              )}
            >
              <span
                className={cn(
                  'border-b-2 pb-1 text-left text-sm leading-snug',
                  isActive
                    ? 'border-b-qc-ink font-semibold text-qc-ink'
                    : 'border-b-transparent text-qc-secondary hover:border-b-qc-rule-strong hover:text-qc-ink',
                )}
              >
                {AREA_LABELS[candidate]}
              </span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
