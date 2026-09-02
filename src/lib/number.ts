/** Plain Turkish number formatting for non-money values: counts, days, months, periods. */
export function formatCount(value: number): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(value)
}

export function formatDecimal(value: number, maximumFractionDigits: number): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits }).format(value)
}

export type ParsedNumber =
  | { status: 'empty' }
  | { status: 'invalid' }
  | { status: 'ok'; value: number }

const THOUSANDS_ONLY = /^\d{1,3}(\.\d{3})+$/
const ENGLISH_DECIMAL = /^(\d+)\.(\d{1,2})$/

export function parseTurkishNumber(raw: string): ParsedNumber {
  const trimmed = raw.trim()
  if (trimmed === '') return { status: 'empty' }

  let sign = 1
  let unsigned = trimmed
  if (unsigned.startsWith('+')) unsigned = unsigned.slice(1)
  else if (unsigned.startsWith('-')) {
    sign = -1
    unsigned = unsigned.slice(1)
  }
  unsigned = unsigned.trim()
  if (unsigned === '') return { status: 'invalid' }

  let normalized: string
  if (unsigned.includes(',')) {
    normalized = unsigned.replaceAll('.', '').replace(',', '.')
  } else if (THOUSANDS_ONLY.test(unsigned)) {
    normalized = unsigned.replaceAll('.', '')
  } else {
    normalized = unsigned
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) return { status: 'invalid' }

  const value = Number(normalized)
  if (!Number.isFinite(value)) return { status: 'invalid' }
  return { status: 'ok', value: sign * value }
}

function stripLeadingZeros(digits: string): string {
  const stripped = digits.replace(/^0+/, '')
  return stripped === '' ? '0' : stripped
}

function formatIntegerDigits(digits: string): string {
  const stripped = stripLeadingZeros(digits)
  const numeric = Number(stripped)
  if (Number.isSafeInteger(numeric)) {
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(numeric)
  }
  const parts: string[] = []
  for (let index = stripped.length; index > 0; index -= 3) {
    parts.unshift(stripped.slice(Math.max(0, index - 3), index))
  }
  return parts.join('.')
}

/**
 * Presentation grouping for a value the user is still typing.
 * Does not round. Incomplete trailing commas are kept.
 */
export function formatTypedTurkishNumber(
  raw: string,
  options: { maxFractionDigits: number },
): string {
  const trimmed = raw.trim()
  if (trimmed === '') return ''

  let sign = ''
  let body = trimmed
  if (body.startsWith('+')) body = body.slice(1).trim()
  else if (body.startsWith('-')) {
    sign = '-'
    body = body.slice(1).trim()
  }

  if (body === '') return sign
  if (/[^0-9.,\s]/.test(body)) return raw

  const compact = body.replace(/\s/g, '')
  let intDigits: string
  let fracDigits: string | null = null
  let trailingDecimal = false

  if (compact.includes(',')) {
    const commaIndex = compact.indexOf(',')
    const intPart = compact.slice(0, commaIndex)
    const fracPart = compact.slice(commaIndex + 1)
    if (fracPart.includes(',')) return raw
    intDigits = intPart.replace(/\D/g, '')
    const fracClean = fracPart.replace(/\D/g, '')
    trailingDecimal = fracClean.length === 0
    if (options.maxFractionDigits === 0) {
      fracDigits = null
      trailingDecimal = false
    } else {
      fracDigits = fracClean.slice(0, options.maxFractionDigits)
    }
  } else {
    const english = compact.match(ENGLISH_DECIMAL)
    if (english && !THOUSANDS_ONLY.test(compact) && options.maxFractionDigits > 0) {
      intDigits = english[1] ?? ''
      fracDigits = (english[2] ?? '').slice(0, options.maxFractionDigits)
    } else {
      intDigits = compact.replace(/\D/g, '')
    }
  }

  if (intDigits === '' && fracDigits === null && !trailingDecimal) return sign

  const intDisplay = formatIntegerDigits(intDigits === '' ? '0' : intDigits)
  let result = `${sign}${intDisplay}`
  if (trailingDecimal && (fracDigits === null || fracDigits === '')) {
    result += ','
  } else if (fracDigits !== null && fracDigits.length > 0) {
    result += `,${fracDigits}`
  }
  return result
}

export function caretAfterFormat(previous: string, caret: number, next: string): number {
  const before = previous.slice(0, Math.max(0, caret))
  const digitCount = before.match(/\d/g)?.length ?? 0
  const endedOnComma = before.replaceAll('.', '').endsWith(',')

  if (endedOnComma) {
    const commaAt = next.indexOf(',')
    return commaAt === -1 ? next.length : commaAt + 1
  }

  let seen = 0
  for (let index = 0; index < next.length; index += 1) {
    const character = next[index]
    if (character !== undefined && /\d/.test(character)) {
      seen += 1
      if (seen === digitCount) return index + 1
    }
  }
  return next.length
}
