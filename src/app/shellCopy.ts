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
   * The slogan is scoped to what the tool actually does — it asks whether the
   * numbers add up, and never claims the business will succeed. `tutmak` is the
   * everyday Turkish idiom for figures reconciling, so it reads as a question an
   * owner already asks rather than as advertising.
   */
  slogan: 'Rakamlar tutuyor mu?',
  domain: 'maliyet.lol',
  /** Document metadata only. The UI does not need a second explanatory sentence. */
  metaDescription:
    'Kafe, restoran ve küçük işletmeler için sade bir maliyet ve fizibilite hesabı. Muhasebe bilgisi gerektirmez.',
  modeNavigation: 'Hesaplama modu',
  quickMode: 'Hızlı Hesap',
  detailedMode: 'Detaylı Fizibilite',
  footerScope: 'TRY · Türkiye',
  footerNature: 'Basitleştirilmiş bir ön değerlendirmedir.',
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

/** Browser tab, bookmarks and share previews — the one place the slogan reaches phones. */
export const DOCUMENT_TITLE = `${SHELL_COPY.productName} — ${SHELL_COPY.slogan}`
