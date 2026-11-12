import { describe, expect, it } from 'vitest';
import { calculateDetailed } from './calculate.ts';
import { applyJanuaryTest } from './januaryTest.ts';
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

describe('applyJanuaryTest (Appendix B.3)', () => {
  const input = resolve();
  const result = calculateDetailed(input);
  const month = result.scenarios.base.stabilizedMonth;
  const days = input.assumptions.operatingDaysPerMonth;

  it('is a no-op at 0% / 0%', () => {
    const same = applyJanuaryTest(month, result.breakEven, days, {
      wageIncreaseRate: 0,
      rentIncreaseRate: 0,
    });
    expect(same.monthlyPayroll).toBeCloseTo(month.monthlyPayroll, 8);
    expect(same.rentCost).toBeCloseTo(month.rentCost, 8);
    expect(same.monthlyFixedCost).toBeCloseTo(month.monthlyFixedCost, 8);
    expect(same.monthlyOperatingResult).toBeCloseTo(month.monthlyOperatingResult, 8);
    if (result.breakEven.available && same.breakEven.available) {
      expect(same.breakEven.unitsPerMonth).toBeCloseTo(result.breakEven.unitsPerMonth, 6);
    }
  });

  it('scales payroll only when the wage rate is set', () => {
    const next = applyJanuaryTest(month, result.breakEven, days, {
      wageIncreaseRate: 0.3,
      rentIncreaseRate: 0,
    });
    expect(next.monthlyPayroll).toBeCloseTo(month.monthlyPayroll * 1.3, 8);
    expect(next.rentCost).toBeCloseTo(month.rentCost, 8);
    expect(next.monthlyOperatingResult).toBeCloseTo(
      month.totalContribution - next.monthlyFixedCost,
      8,
    );
    expect(next.monthlyFixedCost).toBeCloseTo(
      month.monthlyFixedCost + month.monthlyPayroll * 0.3,
      8,
    );
  });

  it('scales rent only, leaving aidat untouched', () => {
    const next = applyJanuaryTest(month, result.breakEven, days, {
      wageIncreaseRate: 0,
      rentIncreaseRate: 0.5,
    });
    const aidat = month.monthlyOccupancyCost - month.rentCost;
    expect(next.rentCost).toBeCloseTo(month.rentCost * 1.5, 8);
    expect(next.monthlyOccupancyCost).toBeCloseTo(month.rentCost * 1.5 + aidat, 8);
    expect(next.monthlyPayroll).toBeCloseTo(month.monthlyPayroll, 8);
  });

  it('does not apply the wage rate to owner cost', () => {
    const next = applyJanuaryTest(month, result.breakEven, days, {
      wageIncreaseRate: 1,
      rentIncreaseRate: 0,
    });
    expect(month.monthlyOwnerCost).toBeGreaterThan(0);
    expect(next.monthlyFixedCost).toBeCloseTo(
      month.monthlyFixedCost + month.monthlyPayroll,
      8,
    );
  });

  it('raises break-even units when fixed cost rises', () => {
    const next = applyJanuaryTest(month, result.breakEven, days, {
      wageIncreaseRate: 0.3,
      rentIncreaseRate: 0.5,
    });
    expect(result.breakEven.available).toBe(true);
    expect(next.breakEven.available).toBe(true);
    if (!result.breakEven.available || !next.breakEven.available) return;
    expect(next.breakEven.unitsPerMonth).toBeGreaterThan(result.breakEven.unitsPerMonth);
    expect(next.breakEven.unitsPerMonth).toBeCloseTo(
      next.monthlyFixedCost / result.breakEven.weightedContributionPerUnit,
      6,
    );
  });

  it('does not change calculateDetailed', () => {
    const before = calculateDetailed(input);
    applyJanuaryTest(month, result.breakEven, days, {
      wageIncreaseRate: 0.3,
      rentIncreaseRate: 0.5,
    });
    expect(calculateDetailed(input)).toEqual(before);
  });
});
