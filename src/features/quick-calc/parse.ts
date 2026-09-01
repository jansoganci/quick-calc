export type ParsedNumber =
  | { status: 'empty' }
  | { status: 'invalid' }
  | { status: 'ok'; value: number }

const THOUSANDS_ONLY = /^\d{1,3}(\.\d{3})+$/

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
