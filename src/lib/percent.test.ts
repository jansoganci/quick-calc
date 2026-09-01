import { describe, expect, it } from 'vitest'
import { formatPercent, formatPercentValue } from './percent.ts'

describe('formatPercentValue', () => {
  it('formats a 0–100 value with one decimal', () => {
    expect(formatPercentValue(25.5)).toBe('%25,5')
    expect(formatPercentValue(90)).toBe('%90,0')
    expect(formatPercentValue(3.56)).toBe('%3,6')
  })
})

describe('formatPercent', () => {
  it('formats a 0–1 rate', () => {
    expect(formatPercent(0.9)).toBe('%90,0')
    expect(formatPercent(0.0356)).toBe('%3,6')
  })
})
