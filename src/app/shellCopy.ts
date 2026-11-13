/**
 * Copy owned by the application shell — the masthead, the three-area switch and
 * the colophon. It sits here rather than in a feature because every area renders
 * inside the same shell, and U4 allows exactly one home per label.
 *
 * `features/quick-calc/labels.ts` re-exports these into its own `COPY` so the
 * Quick module keeps a single import surface. This file imports nothing.
 */

export type AppArea = 'quick' | 'detailed' | 'simulations'

export const SHELL_COPY = {
  productName: 'Maliyet',
  /**
   * The slogan names the tool's actual output — the breakdown reconciles to
   * `İşletmede kalan`, and the R1 sentence ends `…’si işletmede kalıyor` — so it
   * describes what the visitor gets rather than asking them to already have
   * figures. It stays a question and still claims nothing about success.
   */
  slogan: 'Bir satıştan geriye ne kalıyor?',
  domain: 'maliyet.lol',
  /** Document metadata only. The UI does not need a second explanatory sentence. */
  metaDescription:
    'Kafe, restoran ve küçük işletmeler için sade bir maliyet ve fizibilite hesabı. Muhasebe bilgisi gerektirmez.',
  areaNavigation: 'Bölümler',
  quickMode: 'Hızlı Hesap',
  detailedMode: 'Detaylı Fizibilite',
  detailedNav: 'Detaylı Hesap',
  simulationsMode: 'Simülasyonlar',
  /**
   * The handoff at the foot of a finished Quick result: the moment the reader has
   * their answer is the moment "there is a deeper version" is worth saying.
   */
  quickHandoff:
    'Bu bir ön bakış. Kanal kırılımı, personel dökümü, senaryolar ve indirilebilir PDF rapor için Detaylı Fizibilite’yi kullan.',
  quickHandoffLink: 'Detaylı Fizibilite’ye geç →',
  footerScope: 'TRY · Türkiye',
  footerNature: 'Basitleştirilmiş bir ön değerlendirmedir.',
  /**
   * Colophon attribution. `null` renders no attribution at all, which is the
   * safe default: a wrong handle would send visitors to somebody else's profile.
   * Set this to the handle (`'@example'`) and `authorUrl` to its address to turn
   * the fourth colophon item on.
   */
  authorHandle: null as string | null,
  authorUrl: null as string | null,
} as const

/**
 * Canonical public path each area writes. Page copy stays Turkish; the path
 * tokens are English (`docs/SEO_PRERENDER_PLAN.md` Decisions).
 */
export const AREA_PATHS = {
  quick: '/',
  detailed: '/detailed',
  simulations: '/simulations',
} as const satisfies Record<AppArea, string>

/**
 * Legacy hash tokens. Incoming `#detailed-feasibility` (and suffixes) still
 * open Detaylı; `#quick-calculation` still opens Hızlı. New clicks write
 * `AREA_PATHS` instead.
 */
export const AREA_ANCHORS = {
  quick: 'quick',
  detailed: 'detailed-feasibility',
  simulations: 'simulations',
} as const satisfies Record<AppArea, string>

const AREA_ANCHOR_ALIASES: Record<AppArea, readonly string[]> = {
  quick: ['quick-calculation'],
  detailed: [],
  simulations: ['simulasyonlar'],
}

function hashMatchesArea(raw: string, area: AppArea): boolean {
  if (raw === AREA_ANCHORS[area] || raw.startsWith(`${AREA_ANCHORS[area]}/`)) return true
  return AREA_ANCHOR_ALIASES[area].some(
    (alias) => raw === alias || raw.startsWith(`${alias}/`),
  )
}

/**
 * Hash bookmarks. `#detailed-feasibility` (and any `/…` suffix it owns) opens
 * Detaylı; `#simulations` / `#simulasyonlar` open Simülasyonlar; any other hash
 * (including `#quick`, `#quick-calculation` and none) opens Hızlı Hesap.
 * Form state is not encoded.
 */
export function areaFromLocationHash(hash: string): AppArea {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (hashMatchesArea(raw, 'detailed')) return 'detailed'
  if (hashMatchesArea(raw, 'simulations')) return 'simulations'
  return 'quick'
}

function stripTrailingSlash(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}

/**
 * Pathname first-paint. `/detailed` (and any `/…` suffix it owns) opens Detaylı;
 * `/simulations` opens Simülasyonlar; `/` and `/quick` open Hızlı Hesap.
 * Unknown paths still classify as Hızlı here; App paints NotFound instead.
 */
export function areaFromPathname(pathname: string): AppArea {
  const path = stripTrailingSlash(pathname)
  if (path === AREA_PATHS.detailed || path.startsWith(`${AREA_PATHS.detailed}/`)) return 'detailed'
  if (path === AREA_PATHS.simulations) return 'simulations'
  return 'quick'
}

export const AREA_LABELS = {
  quick: SHELL_COPY.quickMode,
  detailed: SHELL_COPY.detailedNav,
  simulations: SHELL_COPY.simulationsMode,
} as const satisfies Record<AppArea, string>

export const AREAS = ['quick', 'detailed', 'simulations'] as const satisfies readonly AppArea[]

/** Home tab title. Per-path titles live in `seoCopy.ts`. */
export const DOCUMENT_TITLE = `${SHELL_COPY.productName} — ${SHELL_COPY.slogan}`

/** Canonical address, used by the `index.html` share tags. */
export const CANONICAL_URL = `https://${SHELL_COPY.domain}/`
