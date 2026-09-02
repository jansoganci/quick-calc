import { COPY } from '../labels.ts'
import { QUICK_DEFAULTS } from '../viewModel.ts'

/**
 * Colophon: the v1 scope (§26) and the engine version, which §18 requires so a
 * shared result stays reproducible and a formula change is detectable.
 * The §10.1 limitation statement deliberately stays with the earnings figure.
 */
export function AppFooter() {
  return (
    <footer className="border-t border-qc-rule px-[18px] py-[18px] text-xs text-qc-muted lg:px-[30px]">
      <div className="flex flex-col gap-[5px] lg:flex-row lg:items-baseline lg:justify-between lg:gap-6">
        <span>{COPY.footerScope}</span>
        <span>{COPY.footerNature}</span>
        <span className="font-mono text-[11px] text-qc-subtle">
          {COPY.footerVersion(QUICK_DEFAULTS.quickEngineVersion)}
        </span>
      </div>
    </footer>
  )
}
