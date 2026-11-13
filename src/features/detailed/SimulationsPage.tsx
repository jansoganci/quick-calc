import { useState } from 'react'
import { FixedCostDaysList } from './components/FixedCostDaysList.tsx'
import { JanuaryTest } from './components/JanuaryTest.tsx'
import { COPY } from './labels.ts'
import { pathForScreen } from './screens.ts'
import { previewJanuary, type DetailedView } from './viewModel.ts'

/**
 * Top-level Simülasyonlar area. It is not a third calculator: it reads the
 * Detaylı draft already in memory (same `localStorage` key) and only the Ocak
 * testi % fields are editable. Zam geldi stays on Malzemeler — there is no
 * stored previous price, so a restore list here is not a simple read.
 */
export function SimulationsPage({
  view,
  onGoToDetailed,
}: {
  view: DetailedView | null
  onGoToDetailed: () => void
}) {
  const [wageIncrease, setWageIncrease] = useState('')
  const [rentIncrease, setRentIncrease] = useState('')
  const january = view ? previewJanuary(view.januaryBasis, wageIncrease, rentIncrease) : null
  const breakEvenBefore = view
    ? view.breakEvenPerDay.available
      ? view.breakEvenPerDay.value
      : view.breakEvenPerDay.message
    : null

  return (
    <main id="simulations" className="px-[18px] py-[26px] lg:px-[30px] lg:py-[30px]">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
        {COPY.simulationsTitle}
      </span>
      <p className="mt-2 max-w-[720px] text-xs leading-relaxed text-qc-secondary">
        {COPY.simulationsNote}
      </p>

      {view === null || january === null || breakEvenBefore === null ? (
        <p className="mt-6 text-[13px] leading-relaxed text-qc-ink">
          {COPY.simulationsEmptyBefore}
          <a
            href={pathForScreen('results')}
            className="inline-flex min-h-[44px] items-center font-medium underline decoration-qc-rule underline-offset-2"
            onClick={(event) => {
              event.preventDefault()
              onGoToDetailed()
            }}
          >
            {COPY.simulationsEmptyLink}
          </a>
          {COPY.simulationsEmptyAfter}
        </p>
      ) : (
        <div className="mt-8 max-w-[720px]">
          <section className="border-t border-qc-rule pt-[26px]">
            <h2 className="m-0 text-[15px] font-semibold text-qc-ink">{COPY.januaryTitle}</h2>
            <p className="mb-[18px] mt-1.5 text-xs leading-relaxed text-qc-secondary">
              {COPY.januaryNote}
            </p>
            <JanuaryTest
              wageIncrease={wageIncrease}
              rentIncrease={rentIncrease}
              onWageIncrease={setWageIncrease}
              onRentIncrease={setRentIncrease}
              beforeResult={view.monthlyOperatingResult}
              beforeBreakEven={breakEvenBefore}
              preview={january}
            />
          </section>

          <section className="mt-[30px] border-t border-qc-rule pt-[26px]">
            <h2 className="m-0 text-[15px] font-semibold text-qc-ink">{COPY.fixedCostDaysTitle}</h2>
            <p className="mb-[18px] mt-1.5 text-xs leading-relaxed text-qc-secondary">
              {january.days.note}
            </p>
            <FixedCostDaysList days={january.days} />
          </section>
        </div>
      )}
    </main>
  )
}
