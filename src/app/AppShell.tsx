import type { ReactNode } from 'react'
import { BrandMark } from './BrandMark.tsx'
import { ModeRow } from './ModeRow.tsx'
import { SHELL_COPY, type CalculationMode } from './shellCopy.ts'

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
      <div className="qc-sheet mx-auto max-w-[1152px] overflow-x-clip border-x border-qc-rule bg-qc-surface">
        <AppHeader />
        <ModeRow mode={mode} onModeChange={onModeChange} />
        {children}
        <AppFooter />
      </div>
    </div>
  )
}

/**
 * Masthead: the mark, the product name and the slogan.
 *
 * The mode switch used to live here, in the top-right corner, where visitors did
 * not find it — see `ModeRow.tsx`. With it gone the slogan fits beside the name at
 * every width, so the phone-only slogan row it used to displace is gone too.
 *
 * Still sticky from `lg`: the result panes in both modes offset by its height
 * (`lg:top-14`), and it keeps the product name in view on a long page.
 */
function AppHeader() {
  return (
    <header className="qc-screen-only flex h-[52px] items-center gap-2.5 border-b border-qc-rule bg-qc-surface px-[18px] lg:sticky lg:top-0 lg:z-10 lg:h-14 lg:px-[30px]">
      {/* The mark sits tight to the name — 8px, one lockup, not two elements. */}
      <span className="flex shrink-0 items-center gap-2">
        <BrandMark size={18} />
        <span className="text-sm font-semibold tracking-[-0.005em] text-qc-ink lg:text-[15px]">
          {SHELL_COPY.productName}
        </span>
      </span>
      <span className="truncate text-xs text-qc-muted">{SHELL_COPY.slogan}</span>
    </header>
  )
}

function AppFooter() {
  return (
    <footer className="qc-screen-only border-t border-qc-rule px-[18px] py-[18px] text-xs text-qc-muted lg:px-[30px]">
      <div className="flex flex-col gap-[5px] lg:flex-row lg:items-baseline lg:justify-between lg:gap-6">
        <span>{SHELL_COPY.footerNature}</span>
        <span className="font-mono text-[11px] text-qc-subtle">
          {SHELL_COPY.domain} · {SHELL_COPY.footerScope}
          {/* Attribution is opt-in: `shellCopy.ts` ships it as null so an
              unconfigured build renders the three specified items and nothing
              more, rather than a placeholder handle pointing at a stranger. */}
          {SHELL_COPY.authorHandle && SHELL_COPY.authorUrl ? (
            <>
              {' · '}
              <a
                href={SHELL_COPY.authorUrl}
                target="_blank"
                rel="me noopener noreferrer"
                className="underline decoration-qc-rule underline-offset-2 hover:text-qc-muted"
              >
                {SHELL_COPY.authorHandle}
              </a>
            </>
          ) : null}
        </span>
      </div>
    </footer>
  )
}
