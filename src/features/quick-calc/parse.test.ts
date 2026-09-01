import { describe, expect, it } from 'vitest'
import { parseTurkishNumber } from './parse.ts'

describe('parseTurkishNumber', () => {
  it('treats blank input as empty', () => {
    expect(parseTurkishNumber('')).toEqual({ status: 'empty' })
    expect(parseTurkishNumber('   ')).toEqual({ status: 'empty' })
  })

  it('parses Turkish thousands and comma decimals', () => {
    expect(parseTurkishNumber('45.000')).toEqual({ status: 'ok', value: 45_000 })
    expect(parseTurkishNumber('140,50')).toEqual({ status: 'ok', value: 140.5 })
    expect(parseTurkishNumber('1.945.947')).toEqual({ status: 'ok', value: 1_945_947 })
    expect(parseTurkishNumber('10.000,25')).toEqual({ status: 'ok', value: 10_000.25 })
  })

  it('keeps a single dot as a decimal point', () => {
    expect(parseTurkishNumber('14.5')).toEqual({ status: 'ok', value: 14.5 })
  })

  it('accepts a leading minus', () => {
    expect(parseTurkishNumber('-28,50')).toEqual({ status: 'ok', value: -28.5 })
  })

  it('rejects letters and leftover separators', () => {
    expect(parseTurkishNumber('abc')).toEqual({ status: 'invalid' })
    expect(parseTurkishNumber('12,34,56')).toEqual({ status: 'invalid' })
  })
})
