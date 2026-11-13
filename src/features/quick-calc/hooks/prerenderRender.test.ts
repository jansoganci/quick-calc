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

    const calculatorPaths = SEO_PATHS.filter((path) => !path.startsWith('/guides/'))
    for (const path of calculatorPaths) {
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

  it('renders placeholder guides as an article, without calculator landmarks', () => {
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('document', undefined)

    const html = renderToString(
      createElement(StrictMode, null, createElement(App, { initialPath: '/guides/slug-tbd-1' })),
    )
    expect(html).toContain('<article')
    expect(html).toContain('Bir satıştan işletmede ne kalıyor?')
    expect(html).toContain('Taslak')
    expect(html).toContain('Rehber')
    expect(html).toContain('Hızlı Hesap’a git')
    expect(html).not.toContain('id="quick-calculation"')
    expect(html).not.toContain('id="detailed-feasibility"')
    expect(html).not.toContain('aria-current="page"')
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
