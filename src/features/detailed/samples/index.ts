import type { SampleConcept } from './buildSample.ts'
import { HAMBURGERCI } from './hamburgerci.ts'
import { KAFE } from './kafe.ts'
import { KEBAPCI } from './kebapci.ts'
import { PASTANE } from './pastane.ts'
import { TATLICI } from './tatlici.ts'

/** The chooser's order. Adding a concept is one file plus one line here. */
export const SAMPLE_CONCEPTS: readonly SampleConcept[] = [KAFE, PASTANE, HAMBURGERCI, KEBAPCI, TATLICI]

export { buildSampleForm } from './buildSample.ts'
export type { SampleConcept } from './buildSample.ts'
