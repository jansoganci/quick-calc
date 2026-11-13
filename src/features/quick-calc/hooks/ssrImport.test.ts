import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * SEO step 2: `renderToString` (step 4) imports these modules with no `window`.
 * Lives under `hooks/` so root `tsc` (no DOM, no jsx) does not follow `.tsx`.
 */
describe('Quick and shell modules import without window', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('loads App and Hızlı Hesap when window is undefined', async () => {
    vi.resetModules()
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)

    await expect(import('../../../app/App.tsx')).resolves.toMatchObject({ App: expect.any(Function) })
    await expect(import('../QuickCalcPage.tsx')).resolves.toMatchObject({
      QuickCalcPage: expect.any(Function),
    })
    await expect(import('./useQuickCalc.ts')).resolves.toMatchObject({
      useQuickCalc: expect.any(Function),
    })
  })
})
