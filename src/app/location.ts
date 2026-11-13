import {
  DETAILED_SCREENS,
  detailedScreenFromHash,
  detailedScreenFromPath,
  hashForScreen,
  pathForScreen,
  type DetailedScreen,
} from '../features/detailed/screens.ts'
import {
  AREA_ANCHORS,
  AREA_PATHS,
  areaFromLocationHash,
  areaFromPathname,
  type AppArea,
} from './shellCopy.ts'

/**
 * Incoming hash → canonical English path. Exact rows must stay in sync with
 * the inline script in `index.html` (the script runs before the module bundle).
 * Unknown hashes land on `/`. Unknown suffixes under `#detailed-feasibility/`
 * land on `/detailed` (Menü), matching today's hash parser.
 */
export const HASH_REDIRECTS = [
  [AREA_ANCHORS.quick, AREA_PATHS.quick],
  ['quick-calculation', AREA_PATHS.quick],
  ...DETAILED_SCREENS.map((screen) => [hashForScreen(screen), pathForScreen(screen)] as const),
  [AREA_ANCHORS.simulations, AREA_PATHS.simulations],
  ['simulasyonlar', AREA_PATHS.simulations],
] as const satisfies ReadonlyArray<readonly [string, string]>

const HASH_PATH = new Map<string, string>(HASH_REDIRECTS)

/** Cloudflare `_redirects` aliases. Keep `public/_redirects` in lockstep. */
export const PATH_ALIASES = [
  { from: '/quick', to: '/' },
  { from: '/detailed/menu', to: '/detailed' },
] as const

export function pathFromHash(hash: string): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw) return AREA_PATHS.quick
  const mapped = HASH_PATH.get(raw)
  if (mapped !== undefined) return mapped
  if (raw === AREA_ANCHORS.detailed || raw.startsWith(`${AREA_ANCHORS.detailed}/`)) {
    return AREA_PATHS.detailed
  }
  if (
    raw === AREA_ANCHORS.simulations ||
    raw.startsWith(`${AREA_ANCHORS.simulations}/`) ||
    raw === 'simulasyonlar' ||
    raw.startsWith('simulasyonlar/')
  ) {
    return AREA_PATHS.simulations
  }
  return AREA_PATHS.quick
}

export function areaFromLocation(pathname: string, hash: string): AppArea {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (raw) return areaFromLocationHash(hash)
  return areaFromPathname(pathname)
}

export function screenFromLocation(pathname: string, hash: string): DetailedScreen {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (raw) return detailedScreenFromHash(hash) ?? 'menu'
  return detailedScreenFromPath(pathname) ?? 'menu'
}

/**
 * Path the address bar should show. Hash bookmarks become real paths. `/quick`
 * and `/detailed/menu` collapse to their parents. Unknown `/detailed/…`
 * suffixes collapse to `/detailed`. Other unknown pathnames are left alone
 * (SPA fallback still paints Hızlı).
 */
export function canonicalPathFromLocation(pathname: string, hash: string): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (raw) return pathFromHash(raw)

  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  const alias = PATH_ALIASES.find((entry) => entry.from === path)
  if (alias) return alias.to
  if (path === AREA_PATHS.detailed || path.startsWith(`${AREA_PATHS.detailed}/`)) {
    return pathForScreen(detailedScreenFromPath(path) ?? 'menu')
  }
  if (path === AREA_PATHS.simulations) return AREA_PATHS.simulations
  if (path === '' || path === '/') return AREA_PATHS.quick
  return path
}
