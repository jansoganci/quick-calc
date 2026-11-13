import { DETAILED_SCREEN_LABELS, pathForScreen, type DetailedScreen } from '../features/detailed/screens.ts'
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
  ogType: 'website'
}

type SeoPage = {
  title: string
  description: string
  noindex: boolean
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
  },
  [pathForScreen('menu')]: {
    title: detailedTitle('menu'),
    description:
      'Ürün, kanal, personel, kira, senaryolar ve indirilebilir PDF. Türkiye’ye özel KDV netleme ve kira stopajı dahildir.',
    noindex: false,
  },
  [pathForScreen('ingredients')]: {
    title: detailedTitle('ingredients'),
    description:
      'Ortak malzeme listesi: alış fiyatı tek yerde, kullanım ürüne özgü. Zam gelince etkilenen ürünleri görürsün.',
    noindex: false,
  },
  [pathForScreen('sales')]: {
    title: detailedTitle('sales'),
    description:
      'Günlük satış adedi, kanallar, ödemeler ve paket servis. Komisyonlar hesaba dahildir; muhasebe bilgisi gerekmez.',
    noindex: false,
  },
  [pathForScreen('costs')]: {
    title: detailedTitle('costs'),
    description:
      'Personel, işletme sahibi, kira, diğer giderler ve ilk yatırım. Boş bıraktığın kalemler 0 TL sayılır.',
    noindex: false,
  },
  [pathForScreen('results')]: {
    title: detailedTitle('results'),
    description:
      'Hesapla’dan sonra aylık işletme sonucu burada. Bu sayfada hazır bir sonuç yok.',
    noindex: true,
  },
  [AREA_PATHS.simulations]: {
    title: `${AREA_LABELS.simulations} — ${SHELL_COPY.productName}`,
    description:
      'Ocak testi: asgari ücret veya kira artınca aylık kalan nasıl değişir. Detaylı taslağını okur; yeni girdi sormaz.',
    noindex: false,
  },
}

export const SEO_PATHS = Object.keys(PAGE_SEO)

function absoluteUrl(path: string): string {
  if (path === '/' || path === '') return CANONICAL_URL
  return `https://${SHELL_COPY.domain}${path}`
}

/** Known calculator path, or home copy when the SPA fallback is showing Hızlı. */
export function seoForPath(pathname: string): SeoDocument {
  const path = canonicalPathFromLocation(pathname, '')
  const home = PAGE_SEO[AREA_PATHS.quick]
  if (home === undefined) throw new Error('Home SEO copy missing')
  const page = PAGE_SEO[path] ?? home
  const canonicalPath = path in PAGE_SEO ? path : AREA_PATHS.quick
  return {
    path: canonicalPath,
    title: page.title,
    description: page.description,
    canonicalUrl: absoluteUrl(canonicalPath),
    noindex: page.noindex,
    ogType: 'website',
  }
}
