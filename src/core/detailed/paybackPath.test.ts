import { describe, expect, it } from 'vitest';
import { calculateDetailed } from './calculate.ts';
import { goldenRawInput } from './goldenVector.ts';
import { buildPaybackPath } from './paybackPath.ts';
import type { MonthResult } from './types.ts';
import { validateDetailedInput } from './validate.ts';

function rows(results: number[]): MonthResult[] {
  return results.map(
    (monthlyOperatingResult, index) =>
      ({ month: index + 1, monthlyOperatingResult }) as MonthResult,
  );
}

describe('payback path (spec Appendix E.9)', () => {
  it('accumulates the projection month by month', () => {
    const path = buildPaybackPath(rows([-100, 50, 150]), 1_000);
    expect(path.cumulative).toEqual([-100, -50, 100]);
    expect(path.cumulativeAtHorizon).toBe(100);
    expect(path.recoveredShare).toBeCloseTo(0.1, 12);
  });

  it('estimates the month beyond the horizon at the last month’s pace', () => {
    // 1.000 − 100 = 900 left; 900 / 150 = 6 more months after month 3.
    expect(buildPaybackPath(rows([-100, 50, 150]), 1_000).estimatedMonthBeyondHorizon).toBe(9);
    // A part month rounds up: 901 / 150 = 6,01 → 7.
    expect(buildPaybackPath(rows([-100, 50, 150]), 1_001).estimatedMonthBeyondHorizon).toBe(10);
  });

  it('gives no estimate when payback is reached, there is no investment, or the pace is not positive', () => {
    expect(buildPaybackPath(rows([600, 600]), 1_000).estimatedMonthBeyondHorizon).toBeNull();
    expect(buildPaybackPath(rows([600, 600]), 1_200).estimatedMonthBeyondHorizon).toBeNull();
    expect(buildPaybackPath(rows([100, 0]), 1_000).estimatedMonthBeyondHorizon).toBeNull();
    expect(buildPaybackPath(rows([100, -10]), 1_000).estimatedMonthBeyondHorizon).toBeNull();

    const none = buildPaybackPath(rows([100]), 0);
    expect(none.recoveredShare).toBeNull();
    expect(none.estimatedMonthBeyondHorizon).toBeNull();
  });

  it('handles an empty projection without NaN', () => {
    const path = buildPaybackPath([], 500);
    expect(path).toEqual({
      cumulative: [],
      cumulativeAtHorizon: 0,
      recoveredShare: 0,
      estimatedMonthBeyondHorizon: null,
    });
  });

  it('crosses the investment in the same month as DF-36 payback', () => {
    const raw = goldenRawInput();
    const resolved = validateDetailedInput(raw);
    if (!resolved.ok) throw new Error('golden input must be valid');
    const result = calculateDetailed(resolved.input);
    const base = result.scenarios.base;
    const path = buildPaybackPath(base.projection, result.totalInitialInvestment);

    expect(path.cumulative).toHaveLength(base.projection.length);
    if (base.payback.available && base.payback.month > 0) {
      const index = base.payback.month - 1;
      expect(path.cumulative[index]).toBeCloseTo(base.payback.cumulativeAtPayback, 6);
      expect(path.cumulative[index]).toBeGreaterThanOrEqual(result.totalInitialInvestment);
      expect(path.estimatedMonthBeyondHorizon).toBeNull();
    }
  });
});
