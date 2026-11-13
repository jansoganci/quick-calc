import { describe, expect, it } from 'vitest'
import { CANONICAL_URL, SHELL_COPY } from '../../app/shellCopy.ts'
import {
  GUIDES_PREFIX,
  REHBER_COPY,
  REHBER_PAGES,
  pathForRehberPage,
  pathForRehberSlug,
  rehberBreadcrumbLabels,
  rehberJsonLd,
  rehberPageFromPath,
} from './pages.ts'

const BANNED = ['marj', 'amortisman', 'net kâr', 'net kar', 'garanti', 'yapay zeka', 'depreciation', 'netProfit']

function allCopy(page: (typeof REHBER_PAGES)[number]): string {
  const body = page.body
    .map((block) => {
      if (block.type === 'ul') return block.items.join(' ')
      return block.text
    })
    .join(' ')
  const faq = page.faq.map((item) => `${item.question} ${item.answer}`).join(' ')
  return [page.h1, page.lead, body, faq, page.calculatorLink.label, REHBER_COPY.placeholderNotice].join(
    ' ',
  )
}

describe('REHBER_PAGES', () => {
  it('ships exactly two placeholder slugs, clearly TBD', () => {
    expect(REHBER_PAGES.map((page) => page.slug)).toEqual(['slug-tbd-1', 'slug-tbd-2'])
    expect(pathForRehberSlug('slug-tbd-1')).toBe(`${GUIDES_PREFIX}/slug-tbd-1`)
    expect(pathForRehberPage(REHBER_PAGES[1]!)).toBe(`${GUIDES_PREFIX}/slug-tbd-2`)
  })

  it('uses the plan’s working H1s and calculator hrefs', () => {
    expect(REHBER_PAGES[0]?.h1).toBe('Bir satıştan işletmede ne kalıyor?')
    expect(REHBER_PAGES[0]?.calculatorLink).toEqual({ href: '/', label: 'Hızlı Hesap’a git' })
    expect(REHBER_PAGES[1]?.h1).toBe('Kafe açmadan önce hangi sayıları girmelisin?')
    expect(REHBER_PAGES[1]?.calculatorLink).toEqual({
      href: '/detailed',
      label: 'Detaylı Hesap’a git',
    })
  })

  it('keeps each lead in the 150–160 character meta window, sen Turkish, no banned terms', () => {
    for (const page of REHBER_PAGES) {
      expect(page.lead.length, page.slug).toBeGreaterThanOrEqual(150)
      expect(page.lead.length, page.slug).toBeLessThanOrEqual(160)
      expect(page.faq.length, page.slug).toBeGreaterThanOrEqual(2)
      expect(page.faq.length, page.slug).toBeLessThanOrEqual(3)
      const lower = allCopy(page).toLocaleLowerCase('tr-TR')
      for (const banned of BANNED) {
        expect(lower, page.slug).not.toContain(banned)
      }
    }
  })

  it('resolves known paths and ignores unknown slugs', () => {
    expect(rehberPageFromPath('/guides/slug-tbd-1/')?.slug).toBe('slug-tbd-1')
    expect(rehberPageFromPath('/guides/not-a-page')).toBeUndefined()
    expect(rehberPageFromPath('/guides')).toBeUndefined()
    expect(rehberPageFromPath('/')).toBeUndefined()
  })
})

describe('rehberJsonLd', () => {
  it('mirrors the visible breadcrumb labels and the page’s own FAQ', () => {
    const page = REHBER_PAGES[0]
    if (page === undefined) throw new Error('missing placeholder page')
    const [breadcrumb, faq] = rehberJsonLd(page) as [
      {
        '@type': string
        itemListElement: { name: string; item?: string; position: number }[]
      },
      {
        '@type': string
        mainEntity: { name: string; acceptedAnswer: { text: string } }[]
      },
    ]
    expect(breadcrumb['@type']).toBe('BreadcrumbList')
    expect(faq['@type']).toBe('FAQPage')
    expect(breadcrumb.itemListElement.map((item) => item.name)).toEqual([...rehberBreadcrumbLabels(page)])
    expect(breadcrumb.itemListElement[0]?.item).toBe(CANONICAL_URL)
    expect(breadcrumb.itemListElement[1]?.item).toBeUndefined()
    expect(breadcrumb.itemListElement[2]?.item).toBe(
      `https://${SHELL_COPY.domain}${pathForRehberPage(page)}`,
    )
    expect(faq.mainEntity.map((item) => item.name)).toEqual(page.faq.map((item) => item.question))
    expect(faq.mainEntity.map((item) => item.acceptedAnswer.text)).toEqual(
      page.faq.map((item) => item.answer),
    )
  })

  it('does not mark a guide as a WebApplication', () => {
    const dumped = JSON.stringify(rehberJsonLd(REHBER_PAGES[0]!))
    expect(dumped).not.toContain('WebApplication')
  })
})
