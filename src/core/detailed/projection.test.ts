import { describe, expect, it } from 'vitest';
import { calculateDetailed, calculateMonth } from './calculate.ts';
import { RAMP_UP_TABLES } from './defaults.ts';
import { goldenRawInput } from './goldenVector.ts';
import { calculateTotalInitialInvestment } from './monthlyCosts.ts';
import { escalationFactor, rampUpMultiplier } from './projection.ts';
import type { DetailedInput, DetailedResolvedInput } from './types.ts';
import { validateDetailedInput } from './validate.ts';

const INVARIANT = 9;

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

describe('ramp-up presets (spec §5.2 / DF-25)', () => {
  it('matches the locked slow table', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((m) => rampUpMultiplier('slow', m))).toEqual([
      0.4, 0.55, 0.7, 0.8, 0.9, 1, 1,
    ]);
  });

  it('matches the locked normal table', () => {
    expect([1, 2, 3, 4, 5, 6].map((m) => rampUpMultiplier('normal', m))).toEqual([
      0.6, 0.75, 0.85, 0.95, 1, 1,
    ]);
  });

  it('matches the locked fast table', () => {
    expect([1, 2, 3, 4].map((m) => rampUpMultiplier('fast', m))).toEqual([0.8, 0.9, 1, 1]);
  });

  it('returns 100% for every month past the end of a table', () => {
    for (const preset of ['slow', 'normal', 'fast'] as const) {
      const past = RAMP_UP_TABLES[preset].length + 1;
      expect(rampUpMultiplier(preset, past)).toBe(1);
      expect(rampUpMultiplier(preset, 36)).toBe(1);
    }
  });
});

describe('scenario then ramp-up order (DF-69)', () => {
  it('reproduces the locked example 100 x 0.75 x 0.60 = 45', () => {
    const raw = goldenRawInput();
    const input = resolve({
      ...raw,
      products: [
        {
          id: 'single',
          name: 'Single',
          normalPrice: 100,
          onlinePrice: 100,
          dailyQuantity: 100,
          unitProductCost: 10,
        },
      ],
    });

    const effectiveDaily =
      100 * (1 + input.assumptions.scenarioVolumeDeltas.bad) * rampUpMultiplier('normal', 1);
    expect(effectiveDaily).toBeCloseTo(45, INVARIANT);

    const month = calculateMonth(input, {
      month: 1,
      quantityFactor: 0.75 * rampUpMultiplier('normal', 1),
      priceFactor: 1,
      cogsFactor: 1,
      fixedFactor: 1,
    });
    expect(month.totalUnits).toBeCloseTo(45 * 30, INVARIANT);
  });

  it('keeps the bad scenario at 75% once ramp-up is complete', () => {
    const result = calculateDetailed(resolve());
    const bad = result.scenarios.bad;
    const base = result.scenarios.base;

    const badAtFullRamp = bad.projection[11];
    expect(badAtFullRamp?.quantityFactor).toBeCloseTo(0.75, INVARIANT);
    expect(badAtFullRamp?.totalUnits).toBeCloseTo(
      base.stabilizedMonth.totalUnits * 0.75,
      INVARIANT,
    );
    expect(badAtFullRamp?.totalUnits).not.toBeCloseTo(base.stabilizedMonth.totalUnits, 2);
  });

  it('never applies a multiplier twice', () => {
    const result = calculateDetailed(resolve());
    const month1 = result.scenarios.bad.projection[0];
    expect(month1?.quantityFactor).toBeCloseTo(0.75 * 0.6, INVARIANT);
  });

  it('leaves prices and unit costs untouched while ramping', () => {
    const result = calculateDetailed(resolve());
    for (const row of result.scenarios.bad.projection) {
      expect(row.priceFactor).toBe(1);
      expect(row.cogsFactor).toBe(1);
    }
  });
});

describe('escalation (spec §13.3 / DF-43)', () => {
  it('is exactly 1 in month 1 for any rate', () => {
    for (const rate of [-0.1, 0, 0.05, 0.35, 2]) {
      expect(escalationFactor(rate, 1)).toBe(1);
    }
  });

  it('equals 1 + the annual rate at month 13', () => {
    for (const rate of [0, 0.05, 0.35]) {
      expect(escalationFactor(rate, 13)).toBeCloseTo(1 + rate, INVARIANT);
    }
  });

  it('compounds monthly between those points', () => {
    const rate = 0.24;
    expect(escalationFactor(rate, 7)).toBeCloseTo((1 + rate) ** 0.5, INVARIANT);
  });

  it('leaves month 1 equal to the entered values', () => {
    const input = withAssumptions({
      salesPriceAnnualIncrease: 0.3,
      productCogsAnnualIncrease: 0.25,
      fixedCostAnnualIncrease: 0.4,
      rampUpPreset: 'fast',
    });
    const result = calculateDetailed(input);
    const month1 = result.scenarios.base.projection[0];

    expect(month1?.priceFactor).toBe(1);
    expect(month1?.cogsFactor).toBe(1);
    expect(month1?.fixedFactor).toBe(1);
    expect(month1?.monthlyFixedCost).toBeCloseTo(
      result.scenarios.base.stabilizedMonth.monthlyFixedCost,
      INVARIANT,
    );
  });

  it('applies the COGS rate to channel variable costs as well (DF-83)', () => {
    const input = withAssumptions({ productCogsAnnualIncrease: 0.2 });
    const base = calculateMonth(input, {
      month: 1,
      quantityFactor: 1,
      priceFactor: 1,
      cogsFactor: 1,
      fixedFactor: 1,
    });
    const escalated = calculateMonth(input, {
      month: 13,
      quantityFactor: 1,
      priceFactor: 1,
      cogsFactor: escalationFactor(0.2, 13),
      fixedFactor: 1,
    });

    expect(escalated.productCogs).toBeCloseTo(base.productCogs * 1.2, 6);
    expect(escalated.channelVariableCost).toBeCloseTo(base.channelVariableCost * 1.2, 6);
  });

  it('keeps commission rates fixed while fee amounts follow the gross base', () => {
    const input = withAssumptions({ salesPriceAnnualIncrease: 0.1 });
    const result = calculateDetailed(input);
    const stabilized = result.scenarios.base.stabilizedMonth;
    const month13 = result.scenarios.base.projection[12];

    expect(result.meta.assumptions.posCommissionRate).toBe(0.0359);
    expect(result.meta.assumptions.platformFeeRate).toBe(0.15);
    // Month 13 is at full ramp, so the only difference from the stabilized month
    // is the price escalation feeding the gross fee base.
    expect(month13?.quantityFactor).toBeCloseTo(stabilized.quantityFactor, 9);
    expect(month13?.paymentPlatformFee).toBeCloseTo(stabilized.paymentPlatformFee * 1.1, 6);
    expect(month13?.grossCustomerSales).toBeCloseTo(stabilized.grossCustomerSales * 1.1, 6);
  });

  it('never escalates CAPEX', () => {
    const input = withAssumptions({
      salesPriceAnnualIncrease: 0.5,
      productCogsAnnualIncrease: 0.5,
      fixedCostAnnualIncrease: 0.5,
    });
    const result = calculateDetailed(input);
    expect(result.totalInitialInvestment).toBe(calculateTotalInitialInvestment(input));
    expect(result.totalInitialInvestment).toBe(1_900_000);
  });
});

describe('projection horizon (DF-71)', () => {
  it('produces exactly the selected number of rows', () => {
    for (const horizon of [12, 24, 36] as const) {
      const result = calculateDetailed(withAssumptions({ projectionHorizonMonths: horizon }));
      for (const scenario of Object.values(result.scenarios)) {
        expect(scenario.projection).toHaveLength(horizon);
      }
    }
  });

  it('numbers rows from 1', () => {
    const result = calculateDetailed(withAssumptions({ projectionHorizonMonths: 12 }));
    expect(result.scenarios.base.projection.map((row) => row.month)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it('marks the stabilized month with a null month number', () => {
    const result = calculateDetailed(resolve());
    expect(result.scenarios.base.stabilizedMonth.month).toBeNull();
  });
});
