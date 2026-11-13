import { describe, expect, it } from 'vitest'
import {
  HASH_REDIRECTS,
  PATH_ALIASES,
  areaFromLocation,
  canonicalPathFromLocation,
  pathFromHash,
  screenFromLocation,
} from './location.ts'
import { AREA_PATHS } from './shellCopy.ts'
import { DETAILED_SCREENS, hashForScreen, pathForScreen } from '../features/detailed/screens.ts'

describe('hash → path map', () => {
  it('sends every known bookmark to its English path', () => {
    expect(pathFromHash('#quick')).toBe('/')
    expect(pathFromHash('quick-calculation')).toBe('/')
    expect(pathFromHash('#detailed-feasibility')).toBe('/detailed')
    expect(pathFromHash('#detailed-feasibility/malzemeler')).toBe('/detailed/ingredients')
    expect(pathFromHash('#detailed-feasibility/satis')).toBe('/detailed/sales')
    expect(pathFromHash('#detailed-feasibility/giderler')).toBe('/detailed/expenses')
    expect(pathFromHash('#detailed-feasibility/sonuc')).toBe('/detailed/result')
    expect(pathFromHash('#simulations')).toBe('/simulations')
    expect(pathFromHash('#simulasyonlar')).toBe('/simulations')
  })

  it('covers every Detailed screen from the hash helper, with no leftover Turkish public paths', () => {
    for (const screen of DETAILED_SCREENS) {
      expect(pathFromHash(`#${hashForScreen(screen)}`)).toBe(pathForScreen(screen))
      expect(pathForScreen(screen).startsWith('/detailed')).toBe(true)
    }
    expect(HASH_REDIRECTS.map(([from]) => from)).not.toContain('hizli-hesap')
    expect(HASH_REDIRECTS.map(([, to]) => to).join(' ')).not.toMatch(/detayli-hesap|simulasyonlar|\/rehber/)
  })

  it('treats an unknown suffix under #detailed-feasibility as Menü, and junk hashes as home', () => {
    expect(pathFromHash('#detailed-feasibility/fiyat')).toBe('/detailed')
    expect(pathFromHash('#something-else')).toBe('/')
    expect(pathFromHash('')).toBe('/')
  })
})

describe('pathname', () => {
  it('opens the three areas from English paths, including the /quick alias', () => {
    expect(areaFromLocation('/', '')).toBe('quick')
    expect(areaFromLocation('/quick', '')).toBe('quick')
    expect(areaFromLocation('/detailed', '')).toBe('detailed')
    expect(areaFromLocation('/detailed/sales', '')).toBe('detailed')
    expect(areaFromLocation('/simulations', '')).toBe('simulations')
    expect(areaFromLocation('/asdf', '')).toBe('quick')
  })

  it('lets a leftover hash win so a bookmark still works if the inline script has not run', () => {
    expect(areaFromLocation('/', '#detailed-feasibility/satis')).toBe('detailed')
    expect(screenFromLocation('/', '#detailed-feasibility/satis')).toBe('sales')
    expect(areaFromLocation('/detailed', '#simulations')).toBe('simulations')
  })

  it('reads Detailed screens from the English path, including /detailed/menu', () => {
    expect(screenFromLocation('/detailed', '')).toBe('menu')
    expect(screenFromLocation('/detailed/menu', '')).toBe('menu')
    expect(screenFromLocation('/detailed/ingredients', '')).toBe('ingredients')
    expect(screenFromLocation('/detailed/sales', '')).toBe('sales')
    expect(screenFromLocation('/detailed/expenses', '')).toBe('costs')
    expect(screenFromLocation('/detailed/result', '')).toBe('results')
    expect(screenFromLocation('/detailed/fiyat', '')).toBe('menu')
    expect(screenFromLocation('/detailed/', '')).toBe('menu')
  })
})

describe('canonicalPathFromLocation', () => {
  it('rewrites hashes, /quick and /detailed/menu, and unknown Detailed suffixes', () => {
    expect(canonicalPathFromLocation('/', '#detailed-feasibility/satis')).toBe('/detailed/sales')
    expect(canonicalPathFromLocation('/quick', '')).toBe('/')
    expect(canonicalPathFromLocation('/detailed/menu', '')).toBe('/detailed')
    expect(canonicalPathFromLocation('/detailed/fiyat', '')).toBe('/detailed')
    expect(canonicalPathFromLocation('/detailed/sales/', '')).toBe('/detailed/sales')
    expect(canonicalPathFromLocation('/simulations', '')).toBe('/simulations')
    expect(canonicalPathFromLocation('/', '')).toBe('/')
    expect(canonicalPathFromLocation('/guides/slug-tbd-1', '')).toBe('/guides/slug-tbd-1')
    expect(canonicalPathFromLocation('/guides/slug-tbd-1/', '')).toBe('/guides/slug-tbd-1')
  })

  it('does not rewrite an unknown pathname to / (SPA fallback still paints Hızlı)', () => {
    expect(canonicalPathFromLocation('/asdf', '')).toBe('/asdf')
    expect(AREA_PATHS.quick).toBe('/')
  })
})

describe('path aliases', () => {
  it('lists only /quick and /detailed/menu as 301 parents (Cloudflare `_redirects` copies this)', () => {
    expect(PATH_ALIASES).toEqual([
      { from: '/quick', to: '/' },
      { from: '/detailed/menu', to: '/detailed' },
    ])
    for (const { from, to } of PATH_ALIASES) {
      expect(canonicalPathFromLocation(from, '')).toBe(to)
    }
  })
})
