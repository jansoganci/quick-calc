import { AREAS, AREA_LABELS, AREA_PATHS } from './shellCopy.ts'
import { NOT_FOUND_COPY } from './seoCopy.ts'

/**
 * Honest 404 inside AppShell. Area nav stays the three calculators (none
 * current). Body links are real hrefs so a full load brings Hakkında back.
 */
export function NotFoundPage() {
  return (
    <main className="px-[18px] py-5 lg:px-[30px] lg:py-[26px] lg:pb-[34px]">
      <h1 className="max-w-[640px] text-[22px] font-semibold tracking-[-0.005em] text-qc-ink">
        {NOT_FOUND_COPY.heading}
      </h1>
      <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-qc-secondary">
        {NOT_FOUND_COPY.lead}
      </p>
      <ul className="mt-6 max-w-[640px] list-none space-y-1 p-0">
        {AREAS.map((area) => (
          <li key={area}>
            <a
              href={AREA_PATHS[area]}
              className="qc-text-btn is-accent inline-flex min-h-[44px] items-center"
            >
              {AREA_LABELS[area]}
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
