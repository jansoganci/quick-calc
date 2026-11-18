import type { ReactNode } from 'react'
import { cn } from '../../../lib/cn.ts'
import type { AkisStep } from '../akisView.ts'
import { AKIS_COPY } from '../labels.ts'
import type { DetailedView } from '../viewModel.ts'

/** Fixed bar tones for the product strip; `AkisProduct.tone` indexes this list. */
const PRODUCT_TONES = [
  'bg-qc-bar-variable',
  'bg-qc-bar-rent',
  'bg-qc-bar-payroll',
  'bg-qc-bar-other-opex',
] as const

/**
 * Akış: the month as a funnel (DF-85). Read-only — no inputs here; the owner
 * changes a figure on the input screens. Every amount, width and clip path
 * arrives from `view.akis`; payback is the engine's message (D2).
 */
export function AkisResults({ view, onGoToInputs }: { view: DetailedView; onGoToInputs: () => void }) {
  const { akis, payback } = view

  return (
    <div className="qc-report-body border-t border-qc-rule px-[18px] pb-[34px] pt-[22px] lg:px-[30px] lg:pt-[28px]">
      <h2 className="sr-only">{AKIS_COPY.title}</h2>
      <p className="m-0 max-w-[860px] text-[18px] leading-relaxed text-qc-ink lg:text-[21px]">
        {AKIS_COPY.summaryLead}{' '}
        <span className="font-mono font-medium tabular-nums">{akis.grossSalesFormatted}</span>{' '}
        {AKIS_COPY.summaryMiddle}{' '}
        <span className="font-mono font-medium tabular-nums text-qc-accent">{akis.resultFormatted}</span>{' '}
        {akis.isLoss ? AKIS_COPY.summaryEndLoss : AKIS_COPY.summaryEnd}
      </p>

      {akis.hasSales ? (
        <>
          <section className="mt-6" aria-labelledby="akis-products-title">
            <h3
              id="akis-products-title"
              className="m-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary"
            >
              {AKIS_COPY.productsTitle}
            </h3>
            <ul className="m-0 mt-2 grid list-none grid-cols-1 gap-x-8 p-0 sm:grid-cols-2">
              {akis.products.map((product) => (
                <li
                  key={product.productId}
                  className="flex min-h-[48px] items-center gap-2.5 border-b border-qc-rule-row py-1.5"
                >
                  <span aria-hidden="true" className={cn('h-7 w-2.5 shrink-0', PRODUCT_TONES[product.tone])} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-qc-ink">{product.name}</span>
                    <span className="block text-xs text-qc-secondary">
                      {AKIS_COPY.productUnits(product.unitsFormatted)}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-sm tabular-nums text-qc-ink">{product.grossFormatted}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-5">
            <FunnelRow>
              <div aria-hidden="true" className="flex h-2.5">
                {akis.products.map((product) => (
                  <div
                    key={product.productId}
                    className={cn('border-r-2 border-qc-surface last:border-r-0', PRODUCT_TONES[product.tone])}
                    style={{ width: `${product.widthPercent}%` }}
                  />
                ))}
              </div>
              <p aria-hidden="true" className="m-0 my-1 text-center text-xs text-qc-secondary">
                {AKIS_COPY.pourIn}
              </p>
            </FunnelRow>

            <FunnelRow
              side={
                <p className="m-0 text-xs leading-[17px] text-qc-secondary">
                  {AKIS_COPY.grossNote(akis.operatingDaysFormatted)}
                </p>
              }
            >
              <div className="flex h-[56px] flex-col items-center justify-center bg-qc-ink text-qc-on-accent">
                <span className="text-xs">{AKIS_COPY.grossLabel}</span>
                <span className="font-mono text-[18px] font-medium tabular-nums lg:text-[20px]">
                  {akis.grossSalesFormatted}
                </span>
              </div>
            </FunnelRow>

            <ol className="m-0 list-none p-0">
              {akis.steps.map((step) => (
                <FunnelStep key={step.key} step={step} />
              ))}
            </ol>

            <FunnelRow>
              <div className="mt-2 flex flex-col items-center text-center">
                <span aria-hidden="true" className="text-sm text-qc-secondary">
                  ↓
                </span>
                <div className="mt-1.5 w-full max-w-[440px] border-y border-qc-rule-mid bg-qc-surface-result px-4 py-5 lg:px-7">
                  <span className="block text-[13px] text-qc-secondary">{AKIS_COPY.resultLabel}</span>
                  <span className="mt-1 block font-mono text-[36px] font-medium leading-[1.1] tracking-[-0.02em] tabular-nums text-qc-accent lg:text-[44px]">
                    {akis.resultFormatted}
                  </span>
                  <div className="mt-3 border-t border-qc-rule pt-3">
                    <span className="block text-[13px] text-qc-secondary">{AKIS_COPY.payback}</span>
                    {payback.available ? (
                      <span className="mt-0.5 block font-mono text-[15px] font-medium tabular-nums text-qc-ink">
                        {payback.value}
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-xs leading-[17px] text-qc-ink">{payback.message}</span>
                    )}
                    <span className="mt-1 block text-xs text-qc-secondary">
                      {AKIS_COPY.initialInvestment(view.initialInvestment)}
                    </span>
                  </div>
                </div>
              </div>
            </FunnelRow>
          </div>
        </>
      ) : (
        <p className="m-0 mt-5 text-[13px] text-qc-ink">{AKIS_COPY.noSales}</p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-qc-rule pt-4">
        <span className="text-xs text-qc-secondary">{AKIS_COPY.readOnlyNote}</span>
        <button type="button" className="qc-text-btn min-h-[44px]" onClick={onGoToInputs}>
          {AKIS_COPY.backToInputs}
        </button>
      </div>
    </div>
  )
}

/**
 * One line of the funnel: the band on the left, its words on the right.
 * Below lg the words come first and the band follows, so money leaves before
 * the narrower band shows what is left.
 */
function FunnelRow({ children, side }: { children: ReactNode; side?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-7">
      <div className="min-w-0 flex-[999_1_420px]">{children}</div>
      <div className="min-w-0 flex-[1_1_260px]" aria-hidden={side ? undefined : true}>
        {side ?? null}
      </div>
    </div>
  )
}

function FunnelStep({ step }: { step: AkisStep }) {
  return (
    <li className="mt-1 flex flex-wrap items-stretch gap-x-7">
      {/* Stretches with a tall explanation so the funnel never breaks into gaps. */}
      <div className="relative order-2 min-h-[52px] min-w-0 flex-[999_1_420px] lg:order-1">
        <div
          aria-hidden="true"
          className={cn('absolute inset-0', step.isLast ? 'bg-qc-accent' : 'bg-qc-bar-variable')}
          style={{ clipPath: step.clipPath }}
        />
        {step.isNarrow ? null : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-qc-on-accent">
            <span className="text-[11px]">{AKIS_COPY.remaining}</span>
            <span className="font-mono text-[15px] font-medium tabular-nums lg:text-[17px]">
              {step.remainingFormatted}
            </span>
          </div>
        )}
      </div>
      <div className="order-1 min-w-0 flex-[1_1_260px] py-2 lg:order-2">
        <p className="m-0 flex flex-wrap items-baseline gap-x-2">
          <span aria-hidden="true" className="text-sm text-qc-secondary">
            →
          </span>
          <span className="font-mono text-[15px] font-medium tabular-nums text-qc-ink">{step.outFormatted}</span>
          <span className="text-sm font-medium text-qc-ink">{step.label}</span>
        </p>
        <p className="m-0 ml-6 text-xs leading-[17px] text-qc-secondary">
          {step.explain}
          {step.detail ? <span className="text-qc-ink"> {step.detail}</span> : null}
          {step.isNarrow ? (
            <span className="block text-qc-ink">
              {AKIS_COPY.remaining}{' '}
              <span className="font-mono tabular-nums">{step.remainingFormatted}</span>
            </span>
          ) : null}
        </p>
      </div>
    </li>
  )
}
