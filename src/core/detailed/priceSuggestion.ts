/**
 * Automatic price suggestion after a recipe-cost change (V2 step 6).
 *
 * Authority: docs/DETAILED_FINANCIAL_SPEC.md Appendix D.
 * Display helpers only — `calculateDetailed` never calls these. Raw values;
 * `esnafPrice` is the only rounding, and only for the tap-to-apply suggestion.
 */
import { DETAILED_LIMITS } from './limits.ts';

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
  discountRate = 0,
): number | null {
  if (
    !Number.isFinite(grossPrice) ||
    !Number.isFinite(deltaCost) ||
    !Number.isFinite(vatRate) ||
    !Number.isFinite(feeRate) ||
    !Number.isFinite(discountRate)
  ) {
    return null;
  }
  if (vatRate < 0 || feeRate < 0 || discountRate < 0 || discountRate >= 1) return null;
  const vatDivisor = 1 + vatRate;
  if (!(vatDivisor > 0) || !Number.isFinite(vatDivisor)) return null;
  const netShare = 1 / vatDivisor - feeRate;
  if (!(netShare > 0) || !Number.isFinite(netShare)) return null;
  const increase = deltaCost / netShare;
  const next = discountRate === 0 ? grossPrice + increase : grossPrice + increase / (1 - discountRate);
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

/** Appendix D.5: raise a positive list price and use the D.3 whole-lira rule. */
export function raisedPrice(price: number, rate: number): number | null {
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(rate) || rate <= 0 || rate > 1) return null;
  return esnafPrice(price * (1 + rate));
}

/** Appendix D.6: purchase prices retain kuruş; half-up on positive amounts. */
export function raisedPurchasePrice(price: number, rate: number): number | null {
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(rate) || rate <= 0 || rate > DETAILED_LIMITS.bulkPriceRaiseRate.max) return null;
  const raised = price * (1 + rate);
  if (!Number.isFinite(raised)) return null;
  const rounded = Math.round((raised + Number.EPSILON * raised) * 100) / 100;
  return Number.isFinite(rounded) ? rounded : null;
}
