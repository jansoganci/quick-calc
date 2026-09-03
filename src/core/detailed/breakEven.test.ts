import { describe, expect, it } from 'vitest';
import { calculateBreakEven } from './breakEven.ts';
import { calculateDetailed, calculateMonth } from './calculate.ts';
import { GOLDEN, goldenRawInput } from './goldenVector.ts';
import type { DetailedInput, DetailedResolvedInput, MonthResult } from './types.ts';
import { validateDetailedInput } from './validate.ts';

const MONEY = 4;

function resolve(raw: DetailedInput = goldenRawInput()): DetailedResolvedInput {
  const result = validateDetailedInput(raw);
  if (!result.ok) {
    throw new Error(`fixture must be valid: ${JSON.stringify(result.errors)}`);
  }
  return result.input;
}

function basisOf(month: MonthResult, operatingDaysPerMonth: number) {
  return {
    totalContribution: month.totalContribution,
    totalUnits: month.totalUnits,
    monthlyFixedCost: month.monthlyFixedCost,
    operatingDaysPerMonth,
  };
}

describe('golden break-even (spec §18.2)', () => {
  const breakEven = calculateDetailed(resolve()).breakEven;

  it('matches the specification figures', () => {
    expect(breakEven.available).toBe(true);
    if (!breakEven.available) return;
    expect(breakEven.weightedContributionPerUnit).toBeCloseTo(
      GOLDEN.weightedContributionPerUnit,
      6,
    );
    expect(breakEven.unitsPerMonth).toBeCloseTo(GOLDEN.breakEvenUnitsPerMonth, MONEY);
    expect(breakEven.unitsPerDay).toBeCloseTo(GOLDEN.breakEvenUnitsPerDay, MONEY);
  });

  it('sits below the modelled volume for a viable business', () => {
    if (!breakEven.available) throw new Error('expected an available break-even');
    expect(breakEven.unitsPerDay).toBeLessThan(270);
  });

  it('matches the Mode 2 sub-case', () => {
    const mode2 = calculateDetailed(
      resolve({
        ...goldenRawInput(),
        delivery: {
          mode: 'platformCourier',
          platformFeeRate: 0.38,
          ownCourierCostPerDeliveryOrder: 40,
        },
      }),
    ).breakEven;
    expect(mode2.available && mode2.unitsPerDay).toBeCloseTo(GOLDEN.mode2.breakEvenUnitsPerDay, 3);
  });
});

describe('round-trip (invariant I6)', () => {
  it('produces an operating result of approximately zero at the break-even volume', () => {
    const input = resolve();
    const result = calculateDetailed(input);
    if (!result.breakEven.available) throw new Error('expected an available break-even');

    const stabilizedDailyUnits = input.products.reduce(
      (sum, product) => sum + product.dailyQuantity,
      0,
    );
    const quantityFactor = result.breakEven.unitsPerDay / stabilizedDailyUnits;

    const atBreakEven = calculateMonth(input, {
      month: null,
      quantityFactor,
      priceFactor: 1,
      cogsFactor: 1,
      fixedFactor: 1,
    });

    expect(atBreakEven.totalUnits / 30).toBeCloseTo(result.breakEven.unitsPerDay, 6);
    expect(atBreakEven.monthlyOperatingResult).toBeCloseTo(0, 6);
  });

  it('holds for a delivery-only business too', () => {
    const input = resolve({
      ...goldenRawInput(),
      channelMix: { salon: 0, takeaway: 0, delivery: 1 },
    });
    const result = calculateDetailed(input);
    if (!result.breakEven.available) throw new Error('expected an available break-even');

    const stabilizedDailyUnits = input.products.reduce(
      (sum, product) => sum + product.dailyQuantity,
      0,
    );
    const atBreakEven = calculateMonth(input, {
      month: null,
      quantityFactor: result.breakEven.unitsPerDay / stabilizedDailyUnits,
      priceFactor: 1,
      cogsFactor: 1,
      fixedFactor: 1,
    });
    expect(atBreakEven.monthlyOperatingResult).toBeCloseTo(0, 6);
  });
});

describe('scenario invariance (invariant I7)', () => {
  it('is identical whichever scenario it is derived from', () => {
    const input = resolve();
    const result = calculateDetailed(input);
    const days = input.assumptions.operatingDaysPerMonth;

    const perScenario = Object.values(result.scenarios).map((scenario) =>
      calculateBreakEven(basisOf(scenario.stabilizedMonth, days)),
    );

    for (const candidate of perScenario) {
      expect(candidate.available).toBe(true);
      if (!candidate.available || !result.breakEven.available) continue;
      expect(candidate.unitsPerDay).toBeCloseTo(result.breakEven.unitsPerDay, 6);
      expect(candidate.unitsPerMonth).toBeCloseTo(result.breakEven.unitsPerMonth, 6);
      expect(candidate.weightedContributionPerUnit).toBeCloseTo(
        result.breakEven.weightedContributionPerUnit,
        6,
      );
    }
  });
});

describe('unavailable states (spec §15)', () => {
  it('reports no sales volume when nothing is sold', () => {
    expect(
      calculateBreakEven({
        totalContribution: 0,
        totalUnits: 0,
        monthlyFixedCost: 100,
        operatingDaysPerMonth: 30,
      }),
    ).toEqual({ available: false, reason: 'no_sales_volume' });
  });

  it('reports non-positive contribution when each unit loses money', () => {
    expect(
      calculateBreakEven({
        totalContribution: -500,
        totalUnits: 100,
        monthlyFixedCost: 100,
        operatingDaysPerMonth: 30,
      }),
    ).toEqual({ available: false, reason: 'non_positive_contribution' });
  });

  it('treats exactly zero contribution as unreachable', () => {
    expect(
      calculateBreakEven({
        totalContribution: 0,
        totalUnits: 100,
        monthlyFixedCost: 100,
        operatingDaysPerMonth: 30,
      }),
    ).toEqual({ available: false, reason: 'non_positive_contribution' });
  });

  it('is unavailable through the engine when every product loses money per unit', () => {
    const result = calculateDetailed(
      resolve({
        ...goldenRawInput(),
        products: [
          {
            id: 'loss',
            name: 'Zararlı',
            normalPrice: 10,
            onlinePrice: 10,
            dailyQuantity: 100,
            unitProductCost: 100,
          },
        ],
      }),
    );
    expect(result.breakEven).toEqual({
      available: false,
      reason: 'non_positive_contribution',
    });
  });

  it('is unavailable through the engine when all quantities are zero', () => {
    const raw = goldenRawInput();
    const products = (raw.products as Record<string, unknown>[]).map((product) => ({
      ...product,
      dailyQuantity: 0,
    }));
    expect(calculateDetailed(resolve({ ...raw, products })).breakEven).toEqual({
      available: false,
      reason: 'no_sales_volume',
    });
  });

  it('excludes CAPEX from the break-even calculation', () => {
    const withoutCapex = calculateDetailed(resolve({ ...goldenRawInput(), capexItems: [] }));
    const withCapex = calculateDetailed(resolve());
    expect(withoutCapex.breakEven).toEqual(withCapex.breakEven);
  });
});
