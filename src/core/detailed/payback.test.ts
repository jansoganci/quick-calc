import { describe, expect, it } from 'vitest';
import { calculateDetailed } from './calculate.ts';
import { GOLDEN, goldenRawInput } from './goldenVector.ts';
import { paybackFromProjection } from './projection.ts';
import type { DetailedInput, DetailedResolvedInput, MonthResult } from './types.ts';
import { validateDetailedInput } from './validate.ts';

function resolve(raw: DetailedInput = goldenRawInput()): DetailedResolvedInput {
  const result = validateDetailedInput(raw);
  if (!result.ok) {
    throw new Error(`fixture must be valid: ${JSON.stringify(result.errors)}`);
  }
  return result.input;
}

function withAssumptions(overrides: Record<string, unknown>): DetailedResolvedInput {
  const raw = goldenRawInput();
  return resolve({ ...raw, assumptions: { ...(raw.assumptions as object), ...overrides } });
}

function rows(results: number[]): MonthResult[] {
  return results.map(
    (monthlyOperatingResult, index) =>
      ({ month: index + 1, monthlyOperatingResult }) as MonthResult,
  );
}

/** A business that cannot cover its fixed costs at any modelled volume. */
function lossMaking(): DetailedResolvedInput {
  const raw = goldenRawInput();
  return resolve({
    ...raw,
    occupancy: { monthlyRent: 5_000_000, rentInputBasis: 'gross', monthlyAidat: 0 },
  });
}

describe('payback branches (spec §14.2)', () => {
  it('returns month 0 when there is no initial investment', () => {
    expect(paybackFromProjection(rows([100, 100]), 0, 100)).toEqual({
      available: true,
      month: 0,
      cumulativeAtPayback: 0,
    });
  });

  it('prefers the zero-investment branch even when operations are negative', () => {
    expect(paybackFromProjection(rows([-100, -100]), 0, -100)).toEqual({
      available: true,
      month: 0,
      cumulativeAtPayback: 0,
    });
  });

  it('returns the first month whose cumulative result covers the investment', () => {
    const payback = paybackFromProjection(rows([40, 40, 40, 40]), 100, 40);
    expect(payback).toEqual({ available: true, month: 3, cumulativeAtPayback: 120 });
  });

  it('treats an exact match as reached', () => {
    const payback = paybackFromProjection(rows([50, 50]), 100, 50);
    expect(payback.available).toBe(true);
    expect(payback.available && payback.month).toBe(2);
  });

  it('reports not reached within the horizon when operations are healthy', () => {
    expect(paybackFromProjection(rows([10, 10, 10]), 1_000, 10)).toEqual({
      available: false,
      reason: 'not_reached_within_horizon',
    });
  });

  it('reports unavailable when the stabilized operation is not positive', () => {
    expect(paybackFromProjection(rows([-10, -10]), 1_000, -10)).toEqual({
      available: false,
      reason: 'non_positive_operating_result',
    });
  });

  it('never recomputes an operating result — it only scans the rows given', () => {
    const projection = rows([1_000, 1_000]);
    const before = projection.map((row) => row.monthlyOperatingResult);
    paybackFromProjection(projection, 1_500, 1_000);
    expect(projection.map((row) => row.monthlyOperatingResult)).toEqual(before);
  });
});

describe('payback through the engine', () => {
  it('reproduces the golden payback month for each scenario', () => {
    const result = calculateDetailed(resolve());
    expect(result.scenarios.bad.payback.available && result.scenarios.bad.payback.month).toBe(
      GOLDEN.paybackMonth.bad,
    );
    expect(result.scenarios.base.payback.available && result.scenarios.base.payback.month).toBe(
      GOLDEN.paybackMonth.base,
    );
    expect(result.scenarios.good.payback.available && result.scenarios.good.payback.month).toBe(
      GOLDEN.paybackMonth.good,
    );
  });

  it('matches the golden cumulative figures around the base payback month', () => {
    const projection = calculateDetailed(resolve()).scenarios.base.projection;
    const cumulativeAt = (month: number) =>
      projection.slice(0, month).reduce((sum, row) => sum + row.monthlyOperatingResult, 0);

    expect(cumulativeAt(9)).toBeCloseTo(GOLDEN.baseCumulativeAtMonth9, 2);
    expect(cumulativeAt(10)).toBeCloseTo(GOLDEN.baseCumulativeAtMonth10, 2);
    expect(cumulativeAt(9)).toBeLessThan(GOLDEN.totalInitialInvestment);
    expect(cumulativeAt(10)).toBeGreaterThanOrEqual(GOLDEN.totalInitialInvestment);
  });

  it('is not reached at a 12-month horizon but is reached at 36 on the same input', () => {
    const short = calculateDetailed(withAssumptions({ projectionHorizonMonths: 12 }));
    const long = calculateDetailed(withAssumptions({ projectionHorizonMonths: 36 }));

    expect(short.scenarios.bad.payback).toEqual({
      available: false,
      reason: 'not_reached_within_horizon',
    });
    expect(long.scenarios.bad.payback.available && long.scenarios.bad.payback.month).toBe(21);
  });

  it('is unavailable when the business never operates positively', () => {
    const result = calculateDetailed(lossMaking());
    for (const scenario of Object.values(result.scenarios)) {
      expect(scenario.payback).toEqual({
        available: false,
        reason: 'non_positive_operating_result',
      });
    }
  });

  it('is month 0 when no CAPEX is entered', () => {
    const result = calculateDetailed(resolve({ ...goldenRawInput(), capexItems: [] }));
    expect(result.totalInitialInvestment).toBe(0);
    expect(result.scenarios.base.payback).toEqual({
      available: true,
      month: 0,
      cumulativeAtPayback: 0,
    });
  });

  it('is affected by the ramp-up preset without any extra input', () => {
    const slow = calculateDetailed(withAssumptions({ rampUpPreset: 'slow' }));
    const fast = calculateDetailed(withAssumptions({ rampUpPreset: 'fast' }));
    const monthOf = (result: ReturnType<typeof calculateDetailed>) =>
      result.scenarios.base.payback.available ? result.scenarios.base.payback.month : Infinity;

    expect(monthOf(fast)).toBeLessThanOrEqual(monthOf(slow));
  });

  it('never allocates CAPEX into a projection row', () => {
    const result = calculateDetailed(resolve());
    for (const row of result.scenarios.base.projection) {
      expect(row.monthlyFixedCost).toBeCloseTo(GOLDEN.monthlyFixedCost, 4);
      expect(row.monthlyFixedCost).toBeLessThan(result.totalInitialInvestment);
    }
  });
});
