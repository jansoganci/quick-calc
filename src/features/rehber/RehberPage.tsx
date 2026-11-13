import type { RehberPage as RehberPageData } from './pages.ts'
import { REHBER_COPY, rehberBreadcrumbLabels } from './pages.ts'

/**
 * One guide article inside AppShell. Copy comes from `pages.ts` so the
 * prerender list, JSON-LD and the visible page cannot drift.
 */
export function RehberPage({ page }: { page: RehberPageData }) {
  const [homeLabel, sectionLabel, currentLabel] = rehberBreadcrumbLabels(page)
  const headingId = `rehber-${page.slug}`

  return (
    <article aria-labelledby={headingId} className="px-[18px] py-5 lg:px-[30px] lg:py-[26px] lg:pb-[34px]">
      <nav aria-label={REHBER_COPY.breadcrumbNav} className="text-[13px] leading-relaxed text-qc-secondary">
        <ol className="m-0 flex list-none flex-wrap items-center gap-x-2 p-0">
          <li>
            <a href="/" className="inline-flex min-h-[44px] items-center">
              {homeLabel}
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li>{sectionLabel}</li>
          <li aria-hidden="true">/</li>
          <li className="text-qc-ink">{currentLabel}</li>
        </ol>
      </nav>

      <p className="mt-3 max-w-[640px] text-[13px] leading-relaxed text-qc-muted">
        {REHBER_COPY.placeholderNotice}
      </p>

      <h1 id={headingId} className="mt-5 max-w-[640px] text-[22px] font-semibold tracking-[-0.005em] text-qc-ink">
        {page.h1}
      </h1>
      <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-qc-secondary">{page.lead}</p>

      {page.body.map((block, index) => {
        if (block.type === 'h2') {
          return (
            <h2
              key={`h2-${index}`}
              className="mt-7 max-w-[640px] text-[15px] font-semibold tracking-[-0.005em] text-qc-ink"
            >
              {block.text}
            </h2>
          )
        }
        if (block.type === 'ul') {
          return (
            <ul
              key={`ul-${index}`}
              className="mt-3 max-w-[640px] list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-qc-secondary"
            >
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={`p-${index}`} className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-qc-secondary">
            {block.text}
          </p>
        )
      })}

      <section aria-labelledby={`${headingId}-faq`} className="mt-8 max-w-[640px] border-t border-qc-rule pt-[22px]">
        <h2 id={`${headingId}-faq`} className="text-[15px] font-semibold tracking-[-0.005em] text-qc-ink">
          {REHBER_COPY.faqHeading}
        </h2>
        {page.faq.map((item) => (
          <div key={item.question} className="mt-3.5 border-t border-qc-rule-row pt-3.5">
            <h3 className="text-sm font-semibold text-qc-ink">{item.question}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-qc-secondary">{item.answer}</p>
          </div>
        ))}
      </section>

      <p className="mt-8 max-w-[640px] border-t border-qc-rule pt-4">
        <a
          href={page.calculatorLink.href}
          className="qc-text-btn is-accent inline-flex min-h-[44px] items-center"
        >
          {page.calculatorLink.label}
        </a>
      </p>
    </article>
  )
}
