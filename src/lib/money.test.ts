import { describe, expect, it } from 'vitest'
import { formatTry, formatTryExact } from './money.ts'

describe('formatTry', () => {
  it('formats monthly money with thousand separators and no decimals', () => {
    expect(formatTry(1_945_947)).toBe('1.945.947')
    expect(formatTry(100_000)).toBe('100.000')
  })
})

describe('formatTryExact', () => {
  it('formats per-sale money with two decimals', () => {
    expect(formatTryExact(107.56, 2)).toBe('107,56')
    expect(formatTryExact(64.8649, 2)).toBe('64,86')
  })

  it('formats payback with one decimal', () => {
    expect(formatTryExact(7.7, 1)).toBe('7,7')
    expect(formatTryExact(4.73, 1)).toBe('4,7')
  })
})
