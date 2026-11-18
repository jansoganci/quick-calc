/**
 * Visible 2026 form prefills (DF-85).
 *
 * The engine does not import this file. An omitted employer cost or Bağ-Kur
 * still falls back to 0 inside `validateDetailedInput`. These records only fill
 * a new form and a new position row.
 */

export type StatutoryParameter = {
  value: number
  /** Turkish field string, two fraction digits. */
  input: string
  source: string
  validFrom: string
  note: string
}

export const DETAILED_FORM_PREFILL = {
  employerCostPerPerson: {
    value: 40874.63,
    input: '40.874,63',
    source: 'ÇSGB asgari ücret 2026, teşviksiz işveren maliyeti',
    validFrom: '2026-01-01',
    note: 'Asgari ücret brüt 33.030 TL. İşveren SGK %21,75 + işsizlik %2.',
  },
  bagKurMonthlyCost: {
    value: 11808.23,
    input: '11.808,23',
    source: '2026 Bağ-Kur tabanı, 5 puan indirimsiz',
    validFrom: '2026-01-01',
    note: '33.030 TL × %35,75.',
  },
} as const satisfies Record<string, StatutoryParameter>
