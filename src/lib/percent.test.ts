import { describe, expect, it } from 'vitest'
import { formatPercent, formatPercentValue } from './percent.ts'

describe('formatPercentValue', () => {
  it('formats a 0–100 value with one decimal', () => {
    expect(formatPercentValue(25.5)).toBe('%25,5')
    expect(formatPercentValue(90)).toBe('%90,0')
    expect(formatPercentValue(3.56)).toBe('%3,6')
  })

  it('puts the minus sign before the percent sign, as Turkish does', () => {
    expect(formatPercentValue(-104.4)).toBe('-%104,4')
    expect(formatPercentValue(-0.04)).toBe('%0,0')
  })
})

describe('formatPercent', () => {
  it('formats a 0–1 rate', () => {
    expect(formatPercent(0.9)).toBe('%90,0')
    expect(formatPercent(0.0356)).toBe('%3,6')
    expect(formatPercent(-0.949)).toBe('-%94,9')
  })
})
