/**
 * January what-if — spec Appendix B.3.
 *
 * Scales payroll and rent on an already-calculated month. Variable costs do not
 * move. Not a scenario.
 */

import { calculateBreakEven } from './breakEven.ts';
import { buildFixedCostDays, type FixedCostDays } from './fixedCostDays.ts';
import type { BreakEvenResult, MonthResult } from './types.ts';

export type JanuaryTestInput = {
  wageIncreaseRate: number;
  rentIncreaseRate: number;
};

export type JanuaryTestResult = {
  monthlyPayroll: number;
  rentCost: number;
  monthlyOccupancyCost: number;
  monthlyFixedCost: number;
  monthlyOperatingResult: number;
  breakEven: BreakEvenResult;
  days: FixedCostDays;
};

function scale(cost: number, rate: number): number {
  if (!Number.isFinite(cost) || !Number.isFinite(rate)) return cost;
  const next = cost * (1 + rate);
  return Number.isFinite(next) ? next : cost;
}

export function applyJanuaryTest(
  month: MonthResult,
  breakEven: BreakEvenResult,
  operatingDaysPerMonth: number,
  rates: JanuaryTestInput,
): JanuaryTestResult {
  const wage = Number.isFinite(rates.wageIncreaseRate) ? rates.wageIncreaseRate : 0;
  const rent = Number.isFinite(rates.rentIncreaseRate) ? rates.rentIncreaseRate : 0;
  const monthlyPayroll = scale(month.monthlyPayroll, wage);
  const rentCost = scale(month.rentCost, rent);
  const monthlyAidat = month.monthlyOccupancyCost - month.rentCost;
  const monthlyOccupancyCost = rentCost + monthlyAidat;
  const monthlyFixedCost =
    monthlyPayroll + month.monthlyOwnerCost + monthlyOccupancyCost + month.monthlyOpex;
  const monthlyOperatingResult = month.totalContribution - monthlyFixedCost;

  const adjustedMonth: MonthResult = {
    ...month,
    monthlyPayroll,
    rentCost,
    monthlyOccupancyCost,
    monthlyFixedCost,
    monthlyOperatingResult,
  };

  const nextBreakEven = calculateBreakEven({
    totalContribution: month.totalContribution,
    totalUnits: month.totalUnits,
    monthlyFixedCost,
    operatingDaysPerMonth,
  });

  return {
    monthlyPayroll,
    rentCost,
    monthlyOccupancyCost,
    monthlyFixedCost,
    monthlyOperatingResult,
    breakEven: breakEven.available ? nextBreakEven : breakEven,
    days: buildFixedCostDays(adjustedMonth, operatingDaysPerMonth),
  };
}
