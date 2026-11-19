/**
 * Payback path for the Sonuç charts (spec Appendix E.9 / DF-87).
 *
 * Display helper only. It reads a projection that `calculateDetailed` already
 * produced and never recalculates a month. Payback itself stays DF-36
 * (`paybackFromProjection`); nothing here changes it.
 */

import type { MonthResult } from './types.ts';

export interface PaybackPath {
  /** Running sum of `monthlyOperatingResult`, one entry per projection month (§14.2). */
  cumulative: number[];
  /** The last entry of `cumulative`; 0 for an empty projection. */
  cumulativeAtHorizon: number;
  /** `cumulativeAtHorizon / totalInitialInvestment`; null when there is no investment. */
  recoveredShare: number | null;
  /**
   * Approximate month the investment would come back if the last projection
   * month repeated unchanged after the horizon. Null when payback is reached
   * within the horizon, there is no investment, or the last month is not positive.
   */
  estimatedMonthBeyondHorizon: number | null;
}

export function buildPaybackPath(
  projection: MonthResult[],
  totalInitialInvestment: number,
): PaybackPath {
  const cumulative: number[] = [];
  let running = 0;
  for (const row of projection) {
    running += row.monthlyOperatingResult;
    cumulative.push(running);
  }

  const last = projection[projection.length - 1];
  const horizon = last?.month ?? projection.length;
  const pace = last?.monthlyOperatingResult ?? 0;
  const hasInvestment = totalInitialInvestment > 0;
  const remaining = totalInitialInvestment - running;

  return {
    cumulative,
    cumulativeAtHorizon: running,
    recoveredShare: hasInvestment ? running / totalInitialInvestment : null,
    estimatedMonthBeyondHorizon:
      hasInvestment && remaining > 0 && pace > 0 ? horizon + Math.ceil(remaining / pace) : null,
  };
}
