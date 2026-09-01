import { useEffect, useMemo, useRef, useState } from 'react'
import {
  EMPTY_FORM,
  PRIMARY_FIELDS,
  allPrimaryFilled,
  evaluateForm,
  type QuickField,
  type QuickFormState,
  type QuickView,
} from '../viewModel.ts'

export function useQuickCalc() {
  const [form, setForm] = useState<QuickFormState>(EMPTY_FORM)
  const [dirty, setDirty] = useState<Record<QuickField, boolean>>(
    Object.fromEntries(PRIMARY_FIELDS.map((field) => [field, false])) as Record<
      QuickField,
      boolean
    >,
  )
  const [hasCalculated, setHasCalculated] = useState(false)
  const [view, setView] = useState<QuickView | null>(null)
  const [liveFlash, setLiveFlash] = useState(false)
  const [copied, setCopied] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)
  const previousViewKeyRef = useRef<string | null>(null)

  const evaluation = useMemo(() => evaluateForm(form), [form])
  const canCalculate = evaluation.ok && allPrimaryFilled(form)

  useEffect(() => {
    if (!hasCalculated || !evaluation.ok) return
    const key = JSON.stringify(evaluation.view)
    if (previousViewKeyRef.current === key) return
    const isFirstResult = previousViewKeyRef.current === null
    previousViewKeyRef.current = key
    setView(evaluation.view)
    if (isFirstResult) return
    setLiveFlash(true)
    const timer = window.setTimeout(() => setLiveFlash(false), 180)
    return () => window.clearTimeout(timer)
  }, [hasCalculated, evaluation])

  function setField(field: QuickField, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setDirty((current) => ({ ...current, [field]: true }))
  }

  function markBlurred(field: QuickField) {
    setDirty((current) => ({ ...current, [field]: true }))
  }

  function calculate() {
    if (!evaluation.ok) return
    setHasCalculated(true)
    setView(evaluation.view)
    setDirty(
      Object.fromEntries(PRIMARY_FIELDS.map((field) => [field, true])) as Record<
        QuickField,
        boolean
      >,
    )
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  async function copySummary() {
    if (!view) return
    try {
      await navigator.clipboard.writeText(view.copyText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return {
    form,
    dirty,
    evaluation,
    view,
    hasCalculated,
    canCalculate,
    liveFlash,
    copied,
    resultsRef,
    setField,
    markBlurred,
    calculate,
    copySummary,
  }
}
