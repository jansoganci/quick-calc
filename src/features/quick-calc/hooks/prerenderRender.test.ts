import { createElement, StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../../app/App.tsx'
import { SEO_PATHS } from '../../../app/seoCopy.ts'

describe('renderToString App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders every calculator path without window.location', () => {
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)

    for (const path of SEO_PATHS) {
      const html = renderToString(
        createElement(StrictMode, null, createElement(App, { initialPath: path })),
      )
      expect(html.length, path).toBeGreaterThan(500)
      expect(html, path).toContain('id="quick-calculation"')
      expect(html, path).toContain('id="detailed-feasibility"')
      expect(html, path).toContain('id="simulations"')
      expect(html, path).toContain('Hızlı Hesap')
    }
  })

  it('leaves the matching area unhidden', () => {
    const home = renderToString(createElement(App, { initialPath: '/' }))
    expect(home).toMatch(/<div><main id="quick-calculation"/)

    const detailed = renderToString(createElement(App, { initialPath: '/detailed' }))
    expect(detailed).toMatch(/<div><div class="qc-detailed/)

    const simulations = renderToString(createElement(App, { initialPath: '/simulations' }))
    expect(simulations).toMatch(/<div><main id="simulations"/)
  })
})
