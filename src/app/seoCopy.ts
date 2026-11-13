import { DETAILED_SCREEN_LABELS, pathForScreen, type DetailedScreen } from '../features/detailed/screens.ts'
import {
  REHBER_PAGES,
  pathForRehberPage,
  rehberJsonLd,
  rehberPageFromPath,
} from '../features/rehber/pages.ts'
import { calculatorJsonLd } from './jsonLd.ts'
import { canonicalPathFromLocation } from './location.ts'
import { AREA_LABELS, AREA_PATHS, CANONICAL_URL, DOCUMENT_TITLE, SHELL_COPY } from './shellCopy.ts'

/**
 * Per-path document copy. Titles and descriptions stay Turkish; canonical URLs
 * are the English paths (`docs/SEO_PRERENDER_PLAN.md` §3). The prerender script
 * and the client tab helper import this same module so HTML files cannot drift.
 */

export type SeoDocument = {
  path: string
  title: string
  description: string
  canonicalUrl: string
  noindex: boolean
  ogType: 'website' | 'article'
  jsonLd: readonly unknown[]
  hakkindaFooter: boolean
}

type SeoPage = {
  title: string
  description: string
  noindex: boolean
  ogType: SeoDocument['ogType']
}

function detailedTitle(screen: DetailedScreen): string {
  if (screen === 'menu') return `${AREA_LABELS.detailed} — ${SHELL_COPY.productName}`
  return `${DETAILED_SCREEN_LABELS[screen]} — ${AREA_LABELS.detailed} — ${SHELL_COPY.productName}`
}

const PAGE_SEO: Record<string, SeoPage> = {
  [AREA_PATHS.quick]: {
    title: DOCUMENT_TITLE,
    description: SHELL_COPY.metaDescription,
    noindex: false,
    ogType: 'website',
  },
  [pathForScreen('menu')]: {
    title: detailedTitle('menu'),
    description:
      'Ürün, kanal, personel, kira, senaryolar ve indirilebilir PDF. Türkiye’ye özel KDV netleme ve kira stopajı dahildir.',
    noindex: false,
    ogType: 'website',
  },
  [pathForScreen('ingredients')]: {
    title: detailedTitle('ingredients'),
    description:
      'Ortak malzeme listesi: alış fiyatı tek yerde, kullanım ürüne özgü. Zam gelince etkilenen ürünleri görürsün.',
    noindex: false,
    ogType: 'website',
  },
  [pathForScreen('sales')]: {
    title: detailedTitle('sales'),
    description:
      'Günlük satış adedi, kanallar, ödemeler ve paket servis. Komisyonlar hesaba dahildir; muhasebe bilgisi gerekmez.',
    noindex: false,
    ogType: 'website',
  },
  [pathForScreen('costs')]: {
    title: detailedTitle('costs'),
    description:
      'Personel, işletme sahibi, kira, diğer giderler ve ilk yatırım. Boş bıraktığın kalemler 0 TL sayılır.',
    noindex: false,
    ogType: 'website',
  },
  [pathForScreen('results')]: {
    title: detailedTitle('results'),
    description:
      'Hesapla’dan sonra aylık işletme sonucu burada. Bu sayfada hazır bir sonuç yok.',
    noindex: true,
    ogType: 'website',
  },
  [AREA_PATHS.simulations]: {
    title: `${AREA_LABELS.simulations} — ${SHELL_COPY.productName}`,
    description:
      'Ocak testi: asgari ücret veya kira artınca aylık kalan nasıl değişir. Detaylı taslağını okur; yeni girdi sormaz.',
    noindex: false,
    ogType: 'website',
  },
  ...Object.fromEntries(
    REHBER_PAGES.map((page) => [
      pathForRehberPage(page),
      {
        title: `${page.h1} — ${SHELL_COPY.productName}`,
        description: page.lead,
        noindex: true,
        ogType: 'article' as const,
      },
    ]),
  ),
}

export const SEO_PATHS = Object.keys(PAGE_SEO)

/** Visible 404 copy. The file is `dist/404.html`; it is not a public `/404` route. */
export const NOT_FOUND_COPY = {
  heading: 'Bu sayfa yok.',
  lead: 'Aradığın adres Maliyet’te yok. Hızlı Hesap, Detaylı Hesap veya Simülasyonlar’dan devam edersin.',
  title: `Bu sayfa yok — ${SHELL_COPY.productName}`,
  description:
    'Bu adres Maliyet’te yok. Hızlı Hesap, Detaylı Hesap veya Simülasyonlar’dan devam edersin. Muhasebe bilgisi gerekmez.',
} as const

function absoluteUrl(path: string): string {
  if (path === '/' || path === '') return CANONICAL_URL
  return `https://${SHELL_COPY.domain}${path}`
}

export function hasSeoPage(pathname: string): boolean {
  const path = canonicalPathFromLocation(pathname, '')
  return Object.hasOwn(PAGE_SEO, path)
}

function notFoundDocument(): SeoDocument {
  return {
    path: '',
    title: NOT_FOUND_COPY.title,
    description: NOT_FOUND_COPY.description,
    canonicalUrl: CANONICAL_URL,
    noindex: true,
    ogType: 'website',
    jsonLd: [],
    hakkindaFooter: false,
  }
}

/** Known calculator or guide path. Unknown pathnames are the 404 page (Q3). */
export function seoForPath(pathname: string): SeoDocument {
  const path = canonicalPathFromLocation(pathname, '')
  const page = PAGE_SEO[path]
  if (page === undefined) return notFoundDocument()
  const canonicalUrl = absoluteUrl(path)
  const guide = rehberPageFromPath(path)
  return {
    path,
    title: page.title,
    description: page.description,
    canonicalUrl,
    noindex: page.noindex,
    ogType: page.ogType,
    jsonLd:
      guide !== undefined
        ? rehberJsonLd(guide)
        : calculatorJsonLd({ canonicalUrl, description: page.description }),
    hakkindaFooter: guide === undefined,
  }
}
