export function formatPercentValue(value: number): string {
  const magnitude = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(value))
  // Turkish puts the sign before the percent sign — `-%104,4`, not `%-104,4`.
  // The sign follows the *displayed* magnitude, so a value that rounds to zero
  // never renders as a signed zero.
  const showsAsZero = Math.round(Math.abs(value) * 10) === 0
  return value < 0 && !showsAsZero ? `-%${magnitude}` : `%${magnitude}`
}

/** Formats a 0–1 rate as a Turkish percent, e.g. 0.9 → `%90,0`. */
export function formatPercent(rate: number): string {
  return formatPercentValue(rate * 100)
}
