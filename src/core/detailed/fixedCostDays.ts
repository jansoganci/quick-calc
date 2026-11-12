/**
 * Fixed costs as days of the month — spec Appendix B.2.
 *
 * Display helper. `dailyContribution` is totalContribution / operatingDaysPerMonth.
 */

import type { MonthResult } from './types.ts';

export type FixedCostDayKey = 'rent' | 'payroll' | 'other';

export type FixedCostDayBucket = {
  key: FixedCostDayKey;
  cost: number;
  days: number;
};

export type FixedCostDays =
  | { available: false; reason: 'non_positive_contribution' }
  | {
      available: true;
      operatingDaysPerMonth: number;
      dailyContribution: number;
      buckets: FixedCostDayBucket[];
      remainderDays: number;
      coversMonth: boolean;
    };

function aidatOf(month: MonthResult): number {
  return month.monthlyOccupancyCost - month.rentCost;
}

export function buildFixedCostDays(
  month: MonthResult,
  operatingDaysPerMonth: number,
): FixedCostDays {
  if (!(operatingDaysPerMonth > 0) || !Number.isFinite(operatingDaysPerMonth)) {
    return { available: false, reason: 'non_positive_contribution' };
  }
  if (!(month.totalContribution > 0) || !Number.isFinite(month.totalContribution)) {
    return { available: false, reason: 'non_positive_contribution' };
  }

  const dailyContribution = month.totalContribution / operatingDaysPerMonth;
  const otherCost = month.monthlyOwnerCost + month.monthlyOpex + aidatOf(month);
  const candidates: Array<{ key: FixedCostDayKey; cost: number }> = [
    { key: 'rent', cost: month.rentCost },
    { key: 'payroll', cost: month.monthlyPayroll },
    { key: 'other', cost: otherCost },
  ];
  const buckets = candidates
    .filter((entry) => entry.cost > 0)
    .map((entry) => ({
      key: entry.key,
      cost: entry.cost,
      days: entry.cost / dailyContribution,
    }));

  const remainderDays = month.monthlyOperatingResult / dailyContribution;
  return {
    available: true,
    operatingDaysPerMonth,
    dailyContribution,
    buckets,
    remainderDays,
    coversMonth: remainderDays >= 0,
  };
}
