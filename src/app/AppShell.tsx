import type { ReactNode } from 'react'
import { AreaNav } from './AreaNav.tsx'
import { BrandMark } from './BrandMark.tsx'
import { SHELL_COPY, type AppArea } from './shellCopy.ts'

type AppShellProps = {
  /** `null` on a Rehber page so the three area links stay inactive. */
  area: AppArea | null
  onAreaChange: (area: AppArea) => void
  children: ReactNode
}

/**
 * The page frame every area renders inside: the 1152px sheet, a simplified
 * masthead, the three-area switch (desktop left column of this same sheet /
 * mobile top row) and the colophon. Keeping it here rather than in a feature
 * is what lets the areas share a shell without importing each other
 * (architecture R5).
 */
export function AppShell({ area, onAreaChange, children }: AppShellProps) {
  return (
    <div className="qc-sheet mx-auto min-w-0 w-full max-w-[1152px] overflow-x-clip border-x border-qc-rule bg-qc-surface">
      <AppHeader />
      <div className="qc-area-frame lg:grid lg:grid-cols-[148px_minmax(0,1fr)]">
        <AreaNav area={area} onAreaChange={onAreaChange} />
        <div className="min-w-0">{children}</div>
      </div>
      <AppFooter />
    </div>
  )
}

/**
 * Masthead: the mark, the product name and the slogan. Area switching lives
 * in `AreaNav`, not here, so the slogan stays beside the name at every width.
 *
 * Still sticky from `lg`: the result panes offset by its height (`lg:top-14`),
 * and it keeps the product name in view on a long page.
 */
function AppHeader() {
  return (
    <header className="qc-screen-only flex h-[52px] items-center gap-2.5 border-b border-qc-rule bg-qc-surface px-[18px] lg:sticky lg:top-0 lg:z-10 lg:h-14 lg:px-[30px]">
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
