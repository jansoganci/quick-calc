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

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-qc-rule pt-4">
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
