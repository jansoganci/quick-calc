import { useState } from 'react'
import { COPY } from '../labels.ts'

/**
 * "Örnekle doldur" — the onboarding escape hatch for someone facing a blank
 * Products section with no idea what to type. Sits at the top of the section
 * (before the first empty product row), not beside "+ Ürün ekle": a first-time
 * visitor sees it before ever facing a blank input.
 *
 * The two-step inline confirm mirrors `DraftNotice`'s pattern (V1: no browser
 * `confirm()` dialog in this product's vocabulary) — but only when there is a
 * saved draft to protect. A fresh visitor with nothing entered yet loses
 * nothing by loading the sample, so there is nothing to confirm.
 */
export function SampleFillControl({
  draftSaved,
  onLoadSample,
}: {
  draftSaved: boolean
  onLoadSample: () => void
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <p className="mb-3.5 mt-1 text-[13px]">
      {confirming ? (
        <>
          <span className="text-qc-muted">{COPY.loadSampleConfirm}</span>{' '}
          <button
            type="button"
            className="qc-text-btn is-accent"
            onClick={() => {
              setConfirming(false)
              onLoadSample()
            }}
          >
            {COPY.loadSampleYes}
          </button>
          {' · '}
          <button type="button" className="qc-text-btn" onClick={() => setConfirming(false)}>
            {COPY.loadSampleCancel}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="qc-text-btn is-accent"
          onClick={() => (draftSaved ? setConfirming(true) : onLoadSample())}
        >
          {COPY.loadSample}
        </button>
      )}
    </p>
  )
}
