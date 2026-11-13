import type { DetailedFormState } from './formState.ts'
import { COPY, RECIPE_COPY, type SectionId } from './labels.ts'
import { typedDailyUnits } from './sectionSummary.ts'
import { formatCount } from '../../lib/number.ts'

/**
 * V2 step 5: Detaylı is five screens, not one long page. The monthly engine and
 * the v1 draft shape do not change. Hash suffixes are ASCII so a phone keyboard
 * and a bookmark both round-trip; `#detailed-feasibility` with no suffix is Menü
 * so the existing deep link keeps working.
 */

export const DETAILED_SCREENS = ['menu', 'ingredients', 'sales', 'costs', 'results'] as const

export type DetailedScreen = (typeof DETAILED_SCREENS)[number]

export const DETAILED_SCREEN_LABELS: Record<DetailedScreen, string> = {
  menu: 'Menü',
  ingredients: 'Malzemeler',
  sales: 'Satış',
  costs: 'Giderler',
  results: 'Sonuç',
}

const SCREEN_SLUG: Record<Exclude<DetailedScreen, 'menu'>, string> = {
  ingredients: 'malzemeler',
  sales: 'satis',
  costs: 'giderler',
  results: 'sonuc',
}

const SLUG_TO_SCREEN: Record<string, DetailedScreen> = {
  malzemeler: 'ingredients',
  satis: 'sales',
  giderler: 'costs',
  sonuc: 'results',
}

/** Same token as `MODE_ANCHORS.detailed` in the shell. Kept here so this module does not import `app/`. */
export const DETAILED_HASH_ROOT = 'detailed-feasibility'

const SECTION_SCREEN: Record<SectionId, DetailedScreen> = {
  products: 'menu',
  sales: 'sales',
  channels: 'sales',
  payments: 'sales',
  delivery: 'sales',
  positions: 'costs',
  owner: 'costs',
  occupancy: 'costs',
  opex: 'costs',
  capex: 'costs',
  assumptions: 'costs',
}

export function hashForScreen(screen: DetailedScreen): string {
  if (screen === 'menu') return DETAILED_HASH_ROOT
  return `${DETAILED_HASH_ROOT}/${SCREEN_SLUG[screen]}`
}

/**
 * `null` when the hash is not a Detailed address (Quick, empty, or junk). An
 * unknown suffix under `#detailed-feasibility/` is **not** null — callers treat
 * it as Menü so a mistyped bookmark still opens Detaylı rather than Hızlı Hesap.
 */
export function detailedScreenFromHash(hash: string): DetailedScreen | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (raw === DETAILED_HASH_ROOT || raw === `${DETAILED_HASH_ROOT}/`) return 'menu'
  if (!raw.startsWith(`${DETAILED_HASH_ROOT}/`)) return null
  const slug = raw.slice(DETAILED_HASH_ROOT.length + 1)
  return SLUG_TO_SCREEN[slug] ?? 'menu'
}

export function screenForSection(section: SectionId): DetailedScreen {
  return SECTION_SCREEN[section]
}

export function sectionsOnScreen(screen: DetailedScreen, visible: readonly SectionId[]): SectionId[] {
  return visible.filter((section) => SECTION_SCREEN[section] === screen)
}

export function neighbourScreens(screen: DetailedScreen): {
  prev: DetailedScreen | null
  next: DetailedScreen | null
} {
  const index = DETAILED_SCREENS.indexOf(screen)
  return {
    prev: DETAILED_SCREENS[index - 1] ?? null,
    next: DETAILED_SCREENS[index + 1] ?? null,
  }
}

export function screenSummary(form: DetailedFormState, screen: DetailedScreen): string {
  switch (screen) {
    case 'menu':
      return COPY.productCount(form.products.length)
    case 'ingredients':
      return form.ingredients.length === 0 ? COPY.none : RECIPE_COPY.ingredientCount(form.ingredients.length)
    case 'sales': {
      const units = typedDailyUnits(form)
      return units === 0 ? COPY.none : COPY.dailyUnits(formatCount(units))
    }
    case 'costs':
      return costsEntered(form) ? 'girildi' : COPY.none
    case 'results':
      return COPY.none
  }
}

function costsEntered(form: DetailedFormState): boolean {
  if (form.positions.length > 0 || form.opexLines.length > 0 || form.capexItems.length > 0) return true
  return [form.owner.monthlyAmount, form.owner.bagKurMonthlyCost, form.occupancy.monthlyRent, form.occupancy.monthlyAidat].some(
    (value) => value.trim() !== '',
  )
}
