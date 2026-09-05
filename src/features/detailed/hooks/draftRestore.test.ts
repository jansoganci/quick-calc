import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DraftNotice } from '../components/DraftNotice.tsx'
import { initialForm } from '../formState.ts'
import { resolveInitialDraft } from './draftStorage.ts'

beforeEach(() => vi.stubGlobal('React', React))
afterEach(() => vi.unstubAllGlobals())

describe('restored Detailed draft state', () => {
  it('immediately renders the saved-draft and reset notice', () => {
    const restored = initialForm()
    restored.products[0]!.name = 'Filtre kahve'

    const initialDraft = resolveInitialDraft({ form: restored, businessName: 'Kadıköy Kahve' })
    const markup = renderToStaticMarkup(
      React.createElement(DraftNotice, {
        saved: initialDraft.hasStoredDraft,
        onReset: () => undefined,
      }),
    )

    expect(initialDraft.form).toBe(restored)
    expect(initialDraft.businessName).toBe('Kadıköy Kahve')
    expect(initialDraft.hasStoredDraft).toBe(true)
    expect(markup).toContain('Taslak bu cihaza kaydedildi')
    expect(markup).toContain('Baştan başla')
  })
})
