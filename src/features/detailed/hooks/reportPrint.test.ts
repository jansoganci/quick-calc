import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import indexHtml from '../../../../index.html?raw'
import pageSource from '../DetailedFeasibilityPage.tsx?raw'
import { ReportAppendix } from '../components/ReportAppendix.tsx'
import { sampleCafeForm } from '../formState.ts'
import { REPORT_COPY } from '../labels.ts'
import { toDetailedInput } from '../toInput.ts'
import { evaluateDetailed } from '../viewModel.ts'

beforeEach(() => vi.stubGlobal('React', React))
afterEach(() => vi.unstubAllGlobals())

/**
 * The PDF report is the browser's print of this page. Print hides everything
 * marked `qc-screen-only`, and `<main>` carries that class, so the report body
 * must sit after `</main>`. On 13 Nov 2026 the five-screen split moved it inside
 * and the PDF silently printed only the cover; these checks keep it out.
 */
describe('PDF report layout', () => {
  it('prints the report body (Klasik + Ek A/B) outside the screen-only <main>', () => {
    const mainEnd = pageSource.indexOf('</main>')
    expect(mainEnd).toBeGreaterThan(-1)
    const afterMain = pageSource.slice(mainEnd)
    expect(afterMain).toMatch(/className="qc-print-only"[\s\S]*<DetailedResults[\s\S]*<ReportAppendix/)
    expect(pageSource.slice(0, mainEnd)).not.toContain('<ReportAppendix')
  })

  it('keeps the site footer (about text and FAQ) off paper', () => {
    expect(indexHtml).toMatch(/<footer class="qc-screen-only /)
  })

  it('ends the report with the plain-language closing note', () => {
    const form = sampleCafeForm()
    const evaluation = evaluateDetailed(form, toDetailedInput(form))
    expect(evaluation.ok).toBe(true)
    if (!evaluation.ok) return
    const markup = renderToStaticMarkup(React.createElement(ReportAppendix, { view: evaluation.view }))
    const note = markup.indexOf(REPORT_COPY.closingNote)
    expect(note).toBeGreaterThan(markup.indexOf(REPORT_COPY.limitsTitle))
    expect(markup).toContain(REPORT_COPY.closingNoteTitle)
  })
})
