import { describe, expect, it } from 'vitest';
import { calculateDetailed } from './calculate.ts';
import { buildFixedCostDays } from './fixedCostDays.ts';
import { sampleCafeRawInput } from './sampleCafeFixture.ts';
import type { DetailedInput, DetailedResolvedInput } from './types.ts';
import { validateDetailedInput } from './validate.ts';

function resolve(raw: DetailedInput = sampleCafeRawInput()): DetailedResolvedInput {
  const result = validateDetailedInput(raw);
  if (!result.ok) {
    throw new Error(`fixture must be valid: ${JSON.stringify(result.errors)}`);
  }
  return result.input;
}

describe('buildFixedCostDays (Appendix B.2)', () => {
  const input = resolve();
  const month = calculateDetailed(input).scenarios.base.stabilizedMonth;
  const days = buildFixedCostDays(month, input.assumptions.operatingDaysPerMonth);

  it('uses operatingDaysPerMonth from the assumptions', () => {
    expect(input.assumptions.operatingDaysPerMonth).toBe(30);
    expect(days.available).toBe(true);
    if (!days.available) return;
    expect(days.operatingDaysPerMonth).toBe(30);
    expect(days.dailyContribution).toBeCloseTo(month.totalContribution / 30, 8);
  });

  it('splits kira, personel and other from the month’s fixed lines', () => {
    expect(days.available).toBe(true);
    if (!days.available) return;
    const rent = days.buckets.find((bucket) => bucket.key === 'rent');
    const payroll = days.buckets.find((bucket) => bucket.key === 'payroll');
    const other = days.buckets.find((bucket) => bucket.key === 'other');
    expect(rent?.cost).toBeCloseTo(month.rentCost, 6);
    expect(payroll?.cost).toBeCloseTo(month.monthlyPayroll, 6);
    expect(other?.cost).toBeCloseTo(
      month.monthlyOwnerCost + month.monthlyOpex + (month.monthlyOccupancyCost - month.rentCost),
      6,
    );
    expect(rent?.days).toBeCloseTo(month.rentCost / days.dailyContribution, 8);
    expect(days.remainderDays).toBeCloseTo(
      month.monthlyOperatingResult / days.dailyContribution,
      8,
    );
  });

  it('is unavailable when contribution is not positive', () => {
    const zero = buildFixedCostDays({ ...month, totalContribution: 0 }, 30);
    expect(zero).toEqual({ available: false, reason: 'non_positive_contribution' });
  });

  it('marks the month as uncovered when the result is negative', () => {
    const loss = buildFixedCostDays(
      { ...month, monthlyOperatingResult: -1_000, totalContribution: 10_000 },
      30,
    );
    expect(loss.available).toBe(true);
    if (!loss.available) return;
    expect(loss.coversMonth).toBe(false);
    expect(loss.remainderDays).toBeCloseTo(-3, 8);
  });
});
