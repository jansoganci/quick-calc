import type { ReactNode } from 'react'
import {
  DETAILED_SCREENS,
  DETAILED_SCREEN_LABELS,
  neighbourScreens,
  type DetailedScreen,
} from '../screens.ts'
import { COPY } from '../labels.ts'

type DetailedScreenChromeProps = {
  screen: DetailedScreen
  onGoToScreen: (screen: DetailedScreen) => void
  children: ReactNode
}

export function DetailedScreenChrome({ screen, onGoToScreen, children }: DetailedScreenChromeProps) {
  const index = DETAILED_SCREENS.indexOf(screen)
  const { prev, next } = neighbourScreens(screen)

  return (
    <div className="px-[18px] py-5 lg:px-[30px] lg:py-[26px] lg:pb-[34px]">
      {/* Phone wayfinding: every screen one tap away. Desktop has the same
          index in the özet pane, so this row stops at lg. */}
      <nav aria-label={COPY.screenNavigation} className="-mt-2 mb-3 border-b border-qc-rule lg:hidden">
        <ol className="m-0 flex list-none justify-between p-0">
          {DETAILED_SCREENS.map((candidate) => {
            const isCurrent = candidate === screen
            return (
              <li key={candidate}>
                <button
                  type="button"
                  aria-current={isCurrent ? 'step' : undefined}
                  onClick={() => onGoToScreen(candidate)}
                  className="flex min-h-[44px] items-center"
                >
                  <span
                    className={
                      isCurrent
                        ? 'border-b-2 border-b-qc-ink pb-0.5 text-[13px] font-semibold text-qc-ink'
                        : 'border-b-2 border-b-transparent pb-0.5 text-[13px] text-qc-secondary'
                    }
                  >
                    {DETAILED_SCREEN_LABELS[candidate]}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <div className="flex items-baseline justify-between gap-3 pb-4">
        <p className="m-0 flex items-baseline gap-[10px]">
          <span className="font-mono text-[11px] tabular-nums text-qc-muted">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-[15px] font-semibold text-qc-ink">{DETAILED_SCREEN_LABELS[screen]}</span>
        </p>
        <span className="font-mono text-xs tabular-nums text-qc-secondary">
          {COPY.screenProgress(index + 1, DETAILED_SCREENS.length)}
        </span>
      </div>

      {children}

      <div className="mt-6 mb-[180px] flex scroll-mb-[180px] items-center justify-between gap-3 border-t border-qc-rule pt-4 lg:mb-0 lg:scroll-mb-0">
        {prev ? (
          <button
            type="button"
            className="qc-text-btn min-h-[44px]"
            onClick={() => onGoToScreen(prev)}
          >
            {COPY.backScreen(DETAILED_SCREEN_LABELS[prev])}
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button
            type="button"
            className="qc-text-btn is-accent min-h-[44px]"
            onClick={() => onGoToScreen(next)}
          >
            {COPY.nextScreen(DETAILED_SCREEN_LABELS[next])}
          </button>
        ) : (
          <span />
        )}
      </div>
    </div>
  )
}
