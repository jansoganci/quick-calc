import { describe, expect, it } from 'vitest'
import {
  caretAfterFormat,
  formatTypedTurkishNumber,
  parseTurkishNumber,
} from './number.ts'

describe('formatTypedTurkishNumber', () => {
  const money = { maxFractionDigits: 2 }

  it('groups thousands with a Turkish dot', () => {
    expect(formatTypedTurkishNumber('1000', money)).toBe('1.000')
    expect(formatTypedTurkishNumber('10000', money)).toBe('10.000')
    expect(formatTypedTurkishNumber('450000', money)).toBe('450.000')
    expect(formatTypedTurkishNumber('1500000', money)).toBe('1.500.000')
  })

  it('displays supported decimals with a Turkish comma', () => {
    expect(formatTypedTurkishNumber('1500000.50', money)).toBe('1.500.000,50')
    expect(formatTypedTurkishNumber('1.500.000,50', money)).toBe('1.500.000,50')
    expect(formatTypedTurkishNumber('1500000,50', money)).toBe('1.500.000,50')
    expect(formatTypedTurkishNumber('14,5', money)).toBe('14,5')
  })

  it('keeps a trailing comma while the user is typing decimals', () => {
    expect(formatTypedTurkishNumber('14,', money)).toBe('14,')
    expect(formatTypedTurkishNumber('1.500,', money)).toBe('1.500,')
  })

  it('does not treat extra digits after a grouped value as an English decimal', () => {
    expect(formatTypedTurkishNumber('1.0000', money)).toBe('10.000')
    expect(formatTypedTurkishNumber('15.0000', money)).toBe('150.000')
  })

  it('leaves invalid keystrokes alone', () => {
    expect(formatTypedTurkishNumber('12a', money)).toBe('12a')
  })

  it('does not change the numeric value of a completed number', () => {
    const samples = ['1000', '1.000', '450000', '1.500.000,50', '1500000.50', '14,50']
    for (const sample of samples) {
      const formatted = formatTypedTurkishNumber(sample, money)
      const before = parseTurkishNumber(sample)
      const after = parseTurkishNumber(formatted)
      expect(before.status).toBe('ok')
      expect(after.status).toBe('ok')
      if (before.status !== 'ok' || after.status !== 'ok') return
      expect(after.value).toBe(before.value)
    }
  })
})

describe('caretAfterFormat', () => {
  it('stays after the last typed digit when grouping dots are inserted', () => {
    expect(caretAfterFormat('1000', 4, '1.000')).toBe(5)
    expect(caretAfterFormat('1.0000', 6, '10.000')).toBe(6)
  })

  it('stays after a trailing comma', () => {
    expect(caretAfterFormat('14,', 3, '14,')).toBe(3)
  })
})
