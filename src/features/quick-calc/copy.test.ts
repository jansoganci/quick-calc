import { describe, expect, it } from 'vitest'
import { COPY, ERROR_COPY, FIELD_HINTS, FIELD_LABELS, SIM_LABELS } from './labels.ts'

/** UI_UX_FIX_LIST F14: Quick speaks to the owner as sen, like Detailed. Copy only. */
const SIZ_FORMS = [
  'girin',
  'yapın',
  'edin',
  'doldurun',
  'kullanın',
  'bastığınız',
  'girdiğiniz',
] as const

function collectStrings(value: unknown, into: string[]): void {
  if (typeof value === 'string') {
    into.push(value)
    return
  }
  if (typeof value === 'function') {
    collectStrings(value('2', '2'), into)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, into)
    return
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, into)
  }
}

describe('Quick copy register', () => {
  it('uses sen, never siz', () => {
    const strings: string[] = []
    for (const source of [COPY, ERROR_COPY, FIELD_HINTS, FIELD_LABELS, SIM_LABELS]) {
      collectStrings(source, strings)
    }
    const text = strings.join('\n').toLocaleLowerCase('tr-TR')
    for (const form of SIZ_FORMS) {
      expect(text, `Quick copy contains "${form}"`).not.toMatch(new RegExp(`(^|[^a-zçğıöşü])${form}($|[^a-zçğıöşü])`, 'u'))
    }
  })
})
