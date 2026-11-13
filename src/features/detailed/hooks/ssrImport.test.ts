import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * SEO step 2: `renderToString` (step 4) imports these modules with no `window`.
 * Lives under `hooks/` so root `tsc` (no DOM, no jsx) does not follow `.tsx`.
 */
describe('Detailed page modules import without window', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('loads Detaylı and Simülasyonlar when window is undefined', async () => {
    vi.resetModules()
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)

    await expect(import('../DetailedFeasibilityPage.tsx')).resolves.toMatchObject({
      DetailedFeasibilityPage: expect.any(Function),
    })
    await expect(import('../SimulationsPage.tsx')).resolves.toMatchObject({
      SimulationsPage: expect.any(Function),
    })
    await expect(import('./useDetailedCalc.ts')).resolves.toMatchObject({
      useDetailedCalc: expect.any(Function),
    })
  })
})
