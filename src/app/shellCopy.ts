/**
 * Copy owned by the application shell — the masthead, the mode switch and the
 * colophon. It sits here rather than in a feature because both calculation modes
 * render inside the same shell, and U4 allows exactly one home per label.
 *
 * `features/quick-calc/labels.ts` re-exports these into its own `COPY` so the
 * Quick module keeps a single import surface. This file imports nothing.
 */

export type CalculationMode = 'quick' | 'detailed'

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
  modeNavigation: 'Hesaplama modu',
  quickMode: 'Hızlı Hesap',
  detailedMode: 'Detaylı Fizibilite',
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

/** The anchor each mode owns, so the masthead entries stay real links. */
export const MODE_ANCHORS = {
  quick: 'quick-calculation',
  detailed: 'detailed-feasibility',
} as const satisfies Record<CalculationMode, string>

export const MODE_LABELS = {
  quick: SHELL_COPY.quickMode,
  detailed: SHELL_COPY.detailedMode,
} as const satisfies Record<CalculationMode, string>

export const MODES = ['quick', 'detailed'] as const satisfies readonly CalculationMode[]

/** Browser tab, bookmarks and share previews. */
export const DOCUMENT_TITLE = `${SHELL_COPY.productName} — ${SHELL_COPY.slogan}`

/** Canonical address, used by the `index.html` share tags. */
export const CANONICAL_URL = `https://${SHELL_COPY.domain}/`
