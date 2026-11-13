/**
 * Automatic price suggestion after a recipe-cost change (V2 step 6).
 *
 * Authority: docs/DETAILED_FINANCIAL_SPEC.md Appendix D.
 * Display helpers only — `calculateDetailed` never calls these. Raw values;
 * `esnafPrice` is the only rounding, and only for the tap-to-apply suggestion.
 */

/**
 * Channel selling price (KDV included) that restores the previous §9.4 remainder
 * after a product-cost change. `feeRate` is the percentage fee on VAT-inclusive
 * gross: `0` for the locked salon helper, `platformFeeRate` for delivery.
 *
 * `null` when the extra lira of price cannot restore remaining (net share ≤ 0)
 * or any input is not a finite number.
 */
export function channelRestorePrice(
  grossPrice: number,
  deltaCost: number,
  vatRate: number,
  feeRate: number,
): number | null {
  if (
    !Number.isFinite(grossPrice) ||
    !Number.isFinite(deltaCost) ||
    !Number.isFinite(vatRate) ||
    !Number.isFinite(feeRate)
  ) {
    return null;
  }
  if (vatRate < 0 || feeRate < 0) return null;
  const vatDivisor = 1 + vatRate;
  if (!(vatDivisor > 0) || !Number.isFinite(vatDivisor)) return null;
  const netShare = 1 / vatDivisor - feeRate;
  if (!(netShare > 0) || !Number.isFinite(netShare)) return null;
  const next = grossPrice + deltaCost / netShare;
  return Number.isFinite(next) ? next : null;
}

/**
 * Whole-lira shopkeeper price. Never rounds down, so the suggestion does not
 * undershoot the restore. Values within 1e-9 of an integer stay there.
 * `null` when the amount is not a finite non-negative number.
 */
export function esnafPrice(amount: number): number | null {
  if (!Number.isFinite(amount) || amount < 0) return null;
  const nearest = Math.round(amount);
  if (Math.abs(amount - nearest) < 1e-9) return nearest;
  const rounded = Math.ceil(amount);
  return Number.isFinite(rounded) ? rounded : null;
}
