import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import {
  MODES,
  MODE_ANCHORS,
  MODE_LABELS,
  SHELL_COPY,
  type CalculationMode,
} from './shellCopy.ts'

type AppShellProps = {
  mode: CalculationMode
  onModeChange: (mode: CalculationMode) => void
  children: ReactNode
}

/**
 * The page frame both calculation modes render inside: one 1152px sheet, the
 * masthead with the mode switch, and the colophon. Keeping it here rather than in
 * either feature is what lets the two modes share a shell without importing each
 * other (architecture R5).
 */
export function AppShell({ mode, onModeChange, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-qc-page">
      <div className="mx-auto max-w-[1152px] overflow-x-clip border-x border-qc-rule bg-qc-surface">
        <AppHeader mode={mode} onModeChange={onModeChange} />
        {children}
        <AppFooter />
      </div>
    </div>
  )
}

/**
 * Masthead: product name and the mode switch, nothing else. The active mode is
 * marked by weight and a 2px ink underline seated on the masthead rule — never by
 * the accent, which DESIGN_DIRECTION V2 reserves for the headline figure and focus.
 */
function AppHeader({
  mode,
  onModeChange,
}: {
  mode: CalculationMode
  onModeChange: (mode: CalculationMode) => void
}) {
  return (
    <header className="flex h-[52px] items-center justify-between gap-3 border-b border-qc-rule bg-qc-surface px-[18px] lg:sticky lg:top-0 lg:z-10 lg:h-14 lg:gap-6 lg:px-[30px]">
      <span className="flex min-w-0 shrink items-baseline gap-2.5">
        <span className="shrink-0 text-sm font-semibold tracking-[-0.005em] text-qc-ink lg:text-[15px]">
          {SHELL_COPY.productName}
        </span>
        {/* Orientation for a first-time visitor, not a headline: it never competes
            with the result. Phones have no room beside two mode tabs, and the
            document title carries it there instead. */}
        <span className="hidden truncate text-xs text-qc-muted sm:inline">
          {SHELL_COPY.slogan}
        </span>
      </span>
      <nav
        className="flex h-full items-center gap-3 lg:gap-6"
        aria-label={SHELL_COPY.modeNavigation}
      >
        {MODES.map((candidate) => {
          const isActive = candidate === mode
          return (
            <a
              key={candidate}
              href={`#${MODE_ANCHORS[candidate]}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={(event) => {
                // The href keeps each entry a real link and stamps the mode in the
                // URL. Following it, though, lands just below the masthead — which
                // below `lg`, where the masthead is not sticky, scrolls the mode
                // switch itself out of view. Set the hash without the jump instead.
                event.preventDefault()
                onModeChange(candidate)
                window.history.replaceState(null, '', `#${MODE_ANCHORS[candidate]}`)
                window.scrollTo({ top: 0 })
              }}
              className={cn(
                'relative flex h-full items-center whitespace-nowrap text-[11px] lg:text-[13px]',
                isActive
                  ? 'font-semibold text-qc-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-qc-ink hover:text-qc-ink'
                  : 'font-normal text-qc-secondary hover:text-qc-secondary',
              )}
            >
              {MODE_LABELS[candidate]}
            </a>
          )
        })}
      </nav>
    </header>
  )
}

function AppFooter() {
  return (
    <footer className="border-t border-qc-rule px-[18px] py-[18px] text-xs text-qc-muted lg:px-[30px]">
      <div className="flex flex-col gap-[5px] lg:flex-row lg:items-baseline lg:justify-between lg:gap-6">
        <span>{SHELL_COPY.footerNature}</span>
        <span className="font-mono text-[11px] text-qc-subtle">
          {SHELL_COPY.domain} · {SHELL_COPY.footerScope}
        </span>
      </div>
    </footer>
  )
}
