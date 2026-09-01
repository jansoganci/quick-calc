export function formatPercentValue(value: number): string {
  return `%${new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}`
}

/** Formats a 0–1 rate as a Turkish percent, e.g. 0.9 → `%90,0`. */
export function formatPercent(rate: number): string {
  return formatPercentValue(rate * 100)
}
