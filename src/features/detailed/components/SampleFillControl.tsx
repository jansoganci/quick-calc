import { useState } from 'react'
import { COPY } from '../labels.ts'
import { SAMPLE_CONCEPTS, type SampleConcept } from '../samples/index.ts'

/**
 * "Örnek bir işletmeyle başla" — the onboarding escape hatch for someone facing
 * a blank Products section. It opens a short list of sample businesses (Kafe,
 * Pastane, Hamburgerci, Kebapçı, Tatlıcı); picking one fills the whole form.
 * Sits at the top of the section, before the first product row.
 *
 * The inline confirm mirrors `DraftNotice` (no browser `confirm()` in this
 * product) and appears only when a saved draft would be replaced. After a
 * sample loads, a quiet note says which one it is and that the figures are
 * estimates, so nobody mistakes the sample for their own numbers.
 */
export function SampleFillControl({
  draftSaved,
  loadedSample,
  onLoadSample,
}: {
  draftSaved: boolean
  loadedSample: string | null
  onLoadSample: (conceptId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<SampleConcept | null>(null)

  function choose(concept: SampleConcept) {
    if (draftSaved) {
      setPending(concept)
      return
    }
    load(concept)
  }

  function load(concept: SampleConcept) {
    setPending(null)
    setOpen(false)
    onLoadSample(concept.id)
  }

  return (
    <div className="mb-3.5 mt-1 text-[13px]">
      {loadedSample ? (
        <p className="mb-2 border-y border-qc-rule-row bg-qc-surface-result px-3 py-2 text-xs leading-relaxed text-qc-ink">
          {COPY.loadSampleNote(loadedSample)}
        </p>
      ) : null}

      <button
        type="button"
        className="qc-text-btn is-accent"
        aria-expanded={open}
        aria-controls={open ? 'sample-chooser' : undefined}
        onClick={() => {
          setOpen((current) => !current)
          setPending(null)
        }}
      >
        {loadedSample ? COPY.loadSampleOther : COPY.loadSample}
      </button>

      {open ? (
        <div id="sample-chooser" className="mt-2 max-w-[600px] border-t border-qc-rule-row">
          <p className="m-0 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-qc-secondary">
            {COPY.loadSampleChooser}
          </p>
          <ul className="m-0 list-none p-0">
            {SAMPLE_CONCEPTS.map((concept) => (
              <li key={concept.id} className="border-b border-qc-rule-row">
                <button
                  type="button"
                  className="flex min-h-[44px] w-full flex-col items-start gap-0.5 py-2 text-left"
                  onClick={() => choose(concept)}
                >
                  <span className="text-[15px] font-medium text-qc-ink">{concept.name}</span>
                  <span className="text-xs text-qc-secondary">{concept.summary}</span>
                </button>
              </li>
            ))}
          </ul>
          {pending ? (
            <p className="m-0 mt-2" role="status">
              <span className="text-qc-secondary">{COPY.loadSampleConfirm(pending.name)}</span>{' '}
              <button type="button" className="qc-text-btn is-accent" onClick={() => load(pending)}>
                {COPY.loadSampleYes}
              </button>
              {' · '}
              <button type="button" className="qc-text-btn" onClick={() => setPending(null)}>
                {COPY.loadSampleCancel}
              </button>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
