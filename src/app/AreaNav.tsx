import { cn } from '../lib/cn.ts'
import {
  AREAS,
  AREA_LABELS,
  AREA_PATHS,
  SHELL_COPY,
  type AppArea,
} from './shellCopy.ts'

/**
 * The three top-level areas. One landmark: a horizontal text row under the
 * masthead below `lg`, and a vertical list in the sheet's left column from
 * `lg`. No eyebrow, no descriptions, no icons, no cards.
 */
export function AreaNav({
  area,
  onAreaChange,
}: {
  area: AppArea | null
  onAreaChange: (area: AppArea) => void
}) {
  return (
    <nav
      aria-label={SHELL_COPY.areaNavigation}
      className="qc-screen-only border-b border-qc-rule bg-qc-surface px-[18px] xl:sticky xl:top-14 xl:self-start xl:border-b-0 xl:border-r xl:border-qc-rule xl:px-3 xl:pt-5"
    >
      <div className="grid grid-cols-3 gap-x-2 xl:flex xl:flex-col">
        {AREAS.map((candidate) => {
          const isActive = area !== null && candidate === area
          return (
            <a
              key={candidate}
              href={AREA_PATHS[candidate]}
              aria-current={isActive ? 'page' : undefined}
              onClick={(event) => {
                if (area === null) return
                event.preventDefault()
                onAreaChange(candidate)
              }}
              className={cn(
                'flex min-h-[44px]',
                'items-center justify-center xl:items-start xl:justify-start xl:pt-1',
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
