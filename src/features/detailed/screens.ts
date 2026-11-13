import type { DetailedFormState } from './formState.ts'
import { COPY, RECIPE_COPY, type SectionId } from './labels.ts'
import { typedDailyUnits } from './sectionSummary.ts'
import { formatCount } from '../../lib/number.ts'

/**
 * V2 step 5: Detaylı is five screens, not one long page. The monthly engine and
 * the v1 draft shape do not change. Canonical addresses are English paths
 * (`/detailed`, `/detailed/ingredients`, …). Hash suffixes stay as a one-release
 * compatibility map so `#detailed-feasibility` still opens Menü. Simülasyonlar
 * is a separate top-level area, not a sixth Detailed screen and not a third
 * calculator.
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

/** Legacy hash suffixes. New navigations write `PATH_SLUG` under `/detailed`. */
const HASH_SLUG: Record<Exclude<DetailedScreen, 'menu'>, string> = {
  ingredients: 'malzemeler',
  sales: 'satis',
  costs: 'giderler',
  results: 'sonuc',
}

const HASH_SLUG_TO_SCREEN: Record<string, DetailedScreen> = {
  malzemeler: 'ingredients',
  satis: 'sales',
  giderler: 'costs',
  sonuc: 'results',
}

const PATH_SLUG: Record<Exclude<DetailedScreen, 'menu'>, string> = {
  ingredients: 'ingredients',
  sales: 'sales',
  costs: 'expenses',
  results: 'result',
}

const PATH_SLUG_TO_SCREEN: Record<string, DetailedScreen> = {
  menu: 'menu',
  ingredients: 'ingredients',
  sales: 'sales',
  expenses: 'costs',
  result: 'results',
}

/** Same token as `AREA_ANCHORS.detailed` in the shell. Kept here so this module does not import `app/`. */
export const DETAILED_HASH_ROOT = 'detailed-feasibility'

/** Canonical Detaylı Menü path. `/detailed/menu` is a 301 alias, not written. */
export const DETAILED_PATH_ROOT = '/detailed'

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
  return `${DETAILED_HASH_ROOT}/${HASH_SLUG[screen]}`
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
  return HASH_SLUG_TO_SCREEN[slug] ?? 'menu'
}

export function pathForScreen(screen: DetailedScreen): string {
  if (screen === 'menu') return DETAILED_PATH_ROOT
  return `${DETAILED_PATH_ROOT}/${PATH_SLUG[screen]}`
}

function stripTrailingSlash(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}

/**
 * `null` when the path is not a Detaylı address. `/detailed/menu` is Menü (the
 * production 301 lands on `/detailed`; the SPA still understands the alias).
 * An unknown suffix under `/detailed/` is Menü, matching the hash behaviour.
 */
export function detailedScreenFromPath(pathname: string): DetailedScreen | null {
  const path = stripTrailingSlash(pathname)
  if (path === DETAILED_PATH_ROOT || path === `${DETAILED_PATH_ROOT}/menu`) return 'menu'
  if (!path.startsWith(`${DETAILED_PATH_ROOT}/`)) return null
  const slug = path.slice(DETAILED_PATH_ROOT.length + 1)
  return PATH_SLUG_TO_SCREEN[slug] ?? 'menu'
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
