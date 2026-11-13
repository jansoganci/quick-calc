import { SHELL_COPY } from './shellCopy.ts'

/**
 * Structured data for prerendered HTML (`docs/SEO_PRERENDER_PLAN.md` §5).
 * Calculator pages: WebApplication + the Hakkında FAQPage. Guides: BreadcrumbList
 * + that article’s FAQPage (built in `features/rehber/pages.ts`). No ratings,
 * reviews, HowTo, or SearchAction. Offer price is only the free `"0"` / TRY.
 */

export const SCHEMA_CONTEXT = 'https://schema.org'

export type HakkindaFaq = {
  question: string
  answer: string
}

/** Same three questions as the static Hakkında footer in `index.html`. */
export const HAKKINDA_FAQ: readonly HakkindaFaq[] = [
  {
    question: 'Maliyet ücretsiz mi?',
    answer: 'Evet. Maliyet tamamen ücretsizdir; hesap açmaya veya ödeme yapmaya gerek yoktur.',
  },
  {
    question: 'Bir satışın maliyeti nasıl hesaplanır?',
    answer:
      'Ortalama satış tutarından KDV, ürün maliyeti, personel, kira, diğer işletme giderleri, POS/platform komisyonu ve yatırım geri kazanım payı düşülür; kalan tutar işletmede kalan kısımdır.',
  },
  {
    question: 'İşyeri kira stopajı hesaba dahil mi?',
    answer:
      'Evet. Girilen kiranın net mi brüt mü olduğu seçilir ve stopaj otomatik hesaplanır; ayrıca bir vergi bilgisi girmeye gerek yoktur.',
  },
]

const ALLOWED_TYPES = new Set([
  'WebApplication',
  'FAQPage',
  'Question',
  'Answer',
  'Offer',
  'BreadcrumbList',
  'ListItem',
])

const FORBIDDEN_TYPES = new Set([
  'AggregateRating',
  'Review',
  'Rating',
  'HowTo',
  'HowToStep',
  'SearchAction',
  'Product',
  'VideoObject',
])

const FORBIDDEN_KEYS = new Set([
  'aggregateRating',
  'review',
  'reviewCount',
  'ratingValue',
  'bestRating',
  'worstRating',
  'reviewRating',
])

export type CalculatorJsonLdInput = {
  canonicalUrl: string
  description: string
}

export function calculatorJsonLd(input: CalculatorJsonLdInput): readonly unknown[] {
  return [
    {
      '@context': SCHEMA_CONTEXT,
      '@type': 'WebApplication',
      name: SHELL_COPY.productName,
      url: input.canonicalUrl,
      description: input.description,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any (web browser)',
      inLanguage: 'tr',
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'TRY',
      },
    },
    {
      '@context': SCHEMA_CONTEXT,
      '@type': 'FAQPage',
      mainEntity: HAKKINDA_FAQ.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ]
}

const LD_JSON_SCRIPT = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g

export function extractJsonLdScripts(html: string): string[] {
  return [...html.matchAll(LD_JSON_SCRIPT)].map((match) => match[1]?.trim() ?? '')
}

export function parseJsonLdBlocks(html: string): unknown[] {
  return extractJsonLdScripts(html).map((raw, index) => {
    if (raw === '') throw new Error(`JSON-LD block ${index} is empty`)
    try {
      return JSON.parse(raw) as unknown
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      throw new Error(`JSON-LD block ${index} does not parse: ${reason}`, { cause: error })
    }
  })
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function walkJsonLd(node: unknown, path: string, isRoot: boolean): void {
  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      walkJsonLd(item, `${path}[${index}]`, false)
    })
    return
  }
  const rec = asRecord(node)
  if (rec === null) return

  if (isRoot) {
    if (rec['@context'] !== SCHEMA_CONTEXT && rec['@context'] !== 'http://schema.org') {
      throw new Error(`${path} is missing @context ${SCHEMA_CONTEXT}`)
    }
    if (typeof rec['@type'] !== 'string' || rec['@type'] === '') {
      throw new Error(`${path} is missing @type`)
    }
  }

  const type = rec['@type']
  if (typeof type === 'string') {
    if (FORBIDDEN_TYPES.has(type)) {
      throw new Error(`${path} uses forbidden @type ${type}`)
    }
    if (!ALLOWED_TYPES.has(type)) {
      throw new Error(`${path} uses unexpected @type ${type}`)
    }
  }

  for (const [key, value] of Object.entries(rec)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new Error(`${path} has forbidden key ${key}`)
    }
    if (key === 'price' && type === 'Offer' && value !== '0') {
      throw new Error(`${path}.price must be the free offer "0", got ${JSON.stringify(value)}`)
    }
    walkJsonLd(value, `${path}.${key}`, false)
  }
}

export type JsonLdPageKind = 'calculator' | 'guide'

export type JsonLdAuditInput = {
  kind: JsonLdPageKind
  canonicalUrl: string
  description: string
}

function faqEntities(block: unknown): { name: string; text: string }[] {
  const rec = asRecord(block)
  const main = rec?.['mainEntity']
  if (!Array.isArray(main)) return []
  return main.map((item) => {
    const question = asRecord(item)
    const answer = asRecord(question?.['acceptedAnswer'])
    return {
      name: typeof question?.['name'] === 'string' ? question.name : '',
      text: typeof answer?.['text'] === 'string' ? answer.text : '',
    }
  })
}

function breadcrumbNames(block: unknown): string[] {
  const rec = asRecord(block)
  const items = rec?.['itemListElement']
  if (!Array.isArray(items)) return []
  return items.map((item) => {
    const row = asRecord(item)
    return typeof row?.['name'] === 'string' ? row.name : ''
  })
}

/**
 * Offline JSON-LD audit for one prerendered file. Google Rich Results Test is
 * not available without a public URL; this is the local substitute: parse,
 * `@context` / `@type`, type allowlist, no fake ratings, FAQ/breadcrumb 1:1
 * with visible copy, free Offer only.
 */
export function auditPrerenderedJsonLd(html: string, input: JsonLdAuditInput): unknown[] {
  const blocks = parseJsonLdBlocks(html)
  if (blocks.length === 0) throw new Error('page has no JSON-LD')

  blocks.forEach((block, index) => {
    walkJsonLd(block, `ld[${index}]`, true)
  })

  const types = blocks.map((block) => {
    const rec = asRecord(block)
    return typeof rec?.['@type'] === 'string' ? rec['@type'] : ''
  })

  const faqBlock = blocks.find((block) => asRecord(block)?.['@type'] === 'FAQPage')
  if (faqBlock === undefined) throw new Error('missing FAQPage')
  const faqs = faqEntities(faqBlock)
  if (faqs.length === 0) throw new Error('FAQPage has no questions')
  for (const faq of faqs) {
    if (!html.includes(faq.name)) {
      throw new Error(`FAQ question not visible: ${faq.name}`)
    }
    if (!html.includes(faq.text)) {
      throw new Error(`FAQ answer not visible: ${faq.name}`)
    }
  }

  if (input.kind === 'guide') {
    if (!types.includes('BreadcrumbList')) throw new Error('guide missing BreadcrumbList')
    if (types.includes('WebApplication')) throw new Error('guide must not be WebApplication')
    const crumbs = breadcrumbNames(blocks.find((block) => asRecord(block)?.['@type'] === 'BreadcrumbList'))
    for (const name of crumbs) {
      if (name !== '' && !html.includes(name)) {
        throw new Error(`breadcrumb name not visible: ${name}`)
      }
    }
  } else {
    if (!types.includes('WebApplication')) throw new Error('calculator missing WebApplication')
    if (types.includes('BreadcrumbList')) throw new Error('calculator must not have BreadcrumbList')
    const app = asRecord(blocks.find((block) => asRecord(block)?.['@type'] === 'WebApplication'))
    if (app?.['url'] !== input.canonicalUrl) {
      throw new Error(`WebApplication url ${JSON.stringify(app?.['url'])} ≠ ${input.canonicalUrl}`)
    }
    if (app?.['description'] !== input.description) {
      throw new Error('WebApplication description does not match the page meta description')
    }
    if (app?.['isAccessibleForFree'] !== true) {
      throw new Error('WebApplication must be isAccessibleForFree')
    }
    if (faqs.length !== HAKKINDA_FAQ.length) {
      throw new Error(`Hakkında FAQ count ${faqs.length} ≠ ${HAKKINDA_FAQ.length}`)
    }
    HAKKINDA_FAQ.forEach((item, index) => {
      if (faqs[index]?.name !== item.question || faqs[index]?.text !== item.answer) {
        throw new Error(`Hakkında FAQ ${index} does not match JSON-LD`)
      }
    })
  }

  return blocks
}
