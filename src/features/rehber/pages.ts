import { CANONICAL_URL, SHELL_COPY } from '../../app/shellCopy.ts'

/**
 * Rehber copy and slugs. English path prefix `/guides/`; on-page heading stays
 * Turkish (`docs/SEO_PRERENDER_PLAN.md` §6). Adding a slug is a content change.
 *
 * The two slugs below are placeholders (Q9). They prerender as noindex and stay
 * out of the sitemap until keyword research picks real URLs.
 */

export const GUIDES_PREFIX = '/guides'

export const REHBER_COPY = {
  section: 'Rehber',
  breadcrumbNav: 'Konum',
  placeholderNotice:
    'Taslak. Bu adres henüz kesin değil — anahtar kelime araştırması bitince yayınlanır.',
  faqHeading: 'Sık sorulanlar',
} as const

export type RehberBodyBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'ul'; items: readonly string[] }

export type RehberFaq = {
  question: string
  answer: string
}

export type RehberCalculatorLink = {
  href: '/' | '/detailed'
  label: string
}

export type RehberPage = {
  slug: string
  h1: string
  lead: string
  body: readonly RehberBodyBlock[]
  faq: readonly RehberFaq[]
  calculatorLink: RehberCalculatorLink
}

export function pathForRehberSlug(slug: string): string {
  return `${GUIDES_PREFIX}/${slug}`
}

export const REHBER_PAGES: readonly RehberPage[] = [
  {
    slug: 'slug-tbd-1',
    h1: 'Bir satıştan işletmede ne kalıyor?',
    lead:
      'Satış tutarından KDV, malzeme, personel, kira ve diğer giderler düşünce işletmede ne kaldığını Hızlı Hesap’ta görürsün. Fatura veya muhasebe bilgisi gerekmez.',
    body: [
      {
        type: 'h2',
        text: 'Ne bakarsın',
      },
      {
        type: 'p',
        text: 'Hızlı Hesap bir satışın nereye gittiğini gösterir: KDV, malzeme payı, personel, kira, diğer giderler, komisyon ve yatırım geri kazanım payı. Kalan, işletmede kalan kısımdır.',
      },
      {
        type: 'h2',
        text: 'Ne girmezsin',
      },
      {
        type: 'p',
        text: 'Fatura dökümü, muhasebe kodu veya vergi dairesi sormaz. Sekiz girdi yeter; Hesapla’dan sonra dağılımı görürsün.',
      },
      {
        type: 'ul',
        items: [
          'Ortalama satış tutarı ve KDV',
          'Malzeme, personel ve kira',
          'Diğer giderler ve kart payı',
        ],
      },
      {
        type: 'h2',
        text: 'Örnek (örnektir, senin rakamın değil)',
      },
      {
        type: 'p',
        text: 'Aynı satış tutarı iki işletmede farklı kalır: kira ve personel payı değişir. Bu sayfa bir sonuç uydurmaz; rakamı Hızlı Hesap’ta görürsün.',
      },
    ],
    faq: [
      {
        question: 'Bu hesap ücretsiz mi?',
        answer:
          'Evet. Maliyet tamamen ücretsizdir; hesap açmaya veya ödeme yapmaya gerek yoktur.',
      },
      {
        question: 'Rakamlar kime gönderilir?',
        answer: 'Hiç kimseye; tarayıcıda kalır.',
      },
      {
        question: 'Bu sayfa yayında mı?',
        answer: 'Hayır. Bu bir taslak; adres henüz kesin değil.',
      },
    ],
    calculatorLink: { href: '/', label: 'Hızlı Hesap’a git' },
  },
  {
    slug: 'slug-tbd-2',
    h1: 'Kafe açmadan önce hangi sayıları girmelisin?',
    lead:
      'Kafe açmadan önce ürün, kanal, personel, kira ve ilk yatırımı Detaylı Hesap’ta denersin. Boş bıraktığın kalemler 0 TL sayılır. Muhasebe bilgisi gerekmez.',
    body: [
      {
        type: 'h2',
        text: 'Sırayla ne girersin',
      },
      {
        type: 'p',
        text: 'Ortak malzeme listesi, günlük satış, kanallar, personel, kira, diğer giderler ve ilk yatırım. Hesapla’dan sonra aylık işletme sonucu çıkar.',
      },
      {
        type: 'h2',
        text: 'Boş kalem',
      },
      {
        type: 'p',
        text: 'Bilmediğin bir satırı boş bırakabilirsin. O kalem 0 TL sayılır; sonra doldurursun.',
      },
      {
        type: 'h2',
        text: 'Bu sayfa bir taslak',
      },
      {
        type: 'p',
        text: 'Adres henüz kesin değil. Anahtar kelime araştırması bitince gerçek rehber metni buraya gelir. Şimdilik Detaylı Hesap’a giden yolu denersin.',
      },
    ],
    faq: [
      {
        question: 'Detaylı Hesap nedir?',
        answer:
          'Ürün, kanal, personel, kira, senaryolar ve indirilebilir PDF. Türkiye’ye özel KDV netleme ve kira stopajı dahildir.',
      },
      {
        question: 'Rakamlar kime gönderilir?',
        answer: 'Hiç kimseye; tarayıcıda kalır.',
      },
      {
        question: 'Bu sayfa yayında mı?',
        answer: 'Hayır. Bu bir taslak; adres henüz kesin değil.',
      },
    ],
    calculatorLink: { href: '/detailed', label: 'Detaylı Hesap’a git' },
  },
]

export function rehberPageBySlug(slug: string): RehberPage | undefined {
  return REHBER_PAGES.find((page) => page.slug === slug)
}

export function rehberPageFromPath(pathname: string): RehberPage | undefined {
  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  const prefix = `${GUIDES_PREFIX}/`
  if (!path.startsWith(prefix)) return undefined
  return rehberPageBySlug(path.slice(prefix.length))
}

export function pathForRehberPage(page: RehberPage): string {
  return pathForRehberSlug(page.slug)
}

/** Visible breadcrumb labels, in order. JSON-LD names must match these 1:1. */
export function rehberBreadcrumbLabels(page: RehberPage): readonly [string, string, string] {
  return [SHELL_COPY.productName, REHBER_COPY.section, page.h1]
}

export function rehberJsonLd(page: RehberPage): readonly unknown[] {
  const url = `https://${SHELL_COPY.domain}${pathForRehberPage(page)}`
  const [homeLabel, sectionLabel, currentLabel] = rehberBreadcrumbLabels(page)
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: homeLabel,
          item: CANONICAL_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: sectionLabel,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: currentLabel,
          item: url,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faq.map((item) => ({
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
