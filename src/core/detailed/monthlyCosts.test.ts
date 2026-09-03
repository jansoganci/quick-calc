import { describe, expect, it } from 'vitest';
import { GOLDEN, goldenRawInput, minimalRawInput } from './goldenVector.ts';
import {
  buildMonthlyFixedCosts,
  calculateTotalInitialInvestment,
  resolveRentCost,
} from './monthlyCosts.ts';
import type { DetailedInput, DetailedResolvedInput } from './types.ts';
import { validateDetailedInput } from './validate.ts';

const MONEY = 4;

function resolve(raw: DetailedInput = goldenRawInput()): DetailedResolvedInput {
  const result = validateDetailedInput(raw);
  if (!result.ok) {
    throw new Error(`fixture must be valid: ${JSON.stringify(result.errors)}`);
  }
  return result.input;
}

describe('rent withholding (DF-12)', () => {
  it('treats a gross entry as the withholding base', () => {
    const rent = resolveRentCost({
      monthlyRent: 450_000,
      rentInputBasis: 'gross',
      rentWithholdingRate: 0.2,
    });
    expect(rent.rentCost).toBe(450_000);
    expect(rent.rentPaidToLandlord).toBe(360_000);
    expect(rent.rentWithholdingTax).toBe(90_000);
  });

  it('grosses a net entry up by dividing, never by multiplying by 1.20', () => {
    const rent = resolveRentCost({
      monthlyRent: 450_000,
      rentInputBasis: 'net',
      rentWithholdingRate: 0.2,
    });
    expect(rent.rentCost).toBeCloseTo(562_500, MONEY);
    expect(rent.rentPaidToLandlord).toBe(450_000);
    expect(rent.rentWithholdingTax).toBeCloseTo(112_500, MONEY);
    expect(rent.rentCost).not.toBeCloseTo(450_000 * 1.2, 2);
  });

  it('matches the golden vector net entry', () => {
    const rent = resolveRentCost({
      monthlyRent: 60_000,
      rentInputBasis: 'net',
      rentWithholdingRate: 0.2,
    });
    expect(rent.rentCost).toBeCloseTo(GOLDEN.rentCost, MONEY);
    expect(rent.rentPaidToLandlord).toBeCloseTo(GOLDEN.rentPaidToLandlord, MONEY);
    expect(rent.rentWithholdingTax).toBeCloseTo(GOLDEN.rentWithholdingTax, MONEY);
  });

  it('returns zeroes when there is no rent', () => {
    const rent = resolveRentCost({
      monthlyRent: 0,
      rentInputBasis: 'net',
      rentWithholdingRate: 0.2,
    });
    expect(rent).toEqual({ rentCost: 0, rentPaidToLandlord: 0, rentWithholdingTax: 0 });
  });

  it('keeps cost at or above what the landlord receives, differing by the withholding', () => {
    for (const basis of ['net', 'gross'] as const) {
      const rent = resolveRentCost({
        monthlyRent: 123_456,
        rentInputBasis: basis,
        rentWithholdingRate: 0.2,
      });
      expect(rent.rentCost).toBeGreaterThanOrEqual(rent.rentPaidToLandlord);
      expect(rent.rentCost - rent.rentPaidToLandlord).toBeCloseTo(rent.rentWithholdingTax, 9);
    }
  });
});

describe('monthly fixed costs (spec §10)', () => {
  it('reproduces the golden vector', () => {
    const fixed = buildMonthlyFixedCosts(resolve(), 1);
    expect(fixed.monthlyPayroll).toBeCloseTo(GOLDEN.monthlyPayroll, MONEY);
    expect(fixed.monthlyOwnerCost).toBeCloseTo(GOLDEN.monthlyOwnerCost, MONEY);
    expect(fixed.rentCost).toBeCloseTo(GOLDEN.rentCost, MONEY);
    expect(fixed.rentPaidToLandlord).toBeCloseTo(GOLDEN.rentPaidToLandlord, MONEY);
    expect(fixed.rentWithholdingTax).toBeCloseTo(GOLDEN.rentWithholdingTax, MONEY);
    expect(fixed.monthlyOccupancyCost).toBeCloseTo(GOLDEN.monthlyOccupancyCost, MONEY);
    expect(fixed.monthlyOpex).toBeCloseTo(GOLDEN.monthlyOpex, MONEY);
    expect(fixed.monthlyFixedCost).toBeCloseTo(GOLDEN.monthlyFixedCost, MONEY);
  });

  it('sums payroll over positions and headcount', () => {
    const raw = goldenRawInput();
    const positions = [
      { id: 'a', name: 'Barista', headcount: 2, employerCostPerPerson: 40_000 },
      {
        id: 'b',
        name: 'Servis',
        headcount: 1,
        employerCostPerPerson: 30_000,
        mealCostPerPerson: 2_000,
        transportCostPerPerson: 1_000,
        averageBonusPerPerson: 500,
      },
    ];
    const fixed = buildMonthlyFixedCosts(resolve({ ...raw, positions }), 1);
    expect(fixed.monthlyPayroll).toBeCloseTo(2 * 40_000 + 33_500, MONEY);
  });

  it('is zero across the board for an empty business', () => {
    const fixed = buildMonthlyFixedCosts(resolve(minimalRawInput()), 1);
    expect(fixed.monthlyFixedCost).toBe(0);
    expect(fixed.rentCost).toBe(0);
  });

  it('scales every group by the fixed-cost factor', () => {
    const base = buildMonthlyFixedCosts(resolve(), 1);
    const scaled = buildMonthlyFixedCosts(resolve(), 1.2);
    expect(scaled.monthlyPayroll).toBeCloseTo(base.monthlyPayroll * 1.2, MONEY);
    expect(scaled.monthlyOwnerCost).toBeCloseTo(base.monthlyOwnerCost * 1.2, MONEY);
    expect(scaled.monthlyOccupancyCost).toBeCloseTo(base.monthlyOccupancyCost * 1.2, MONEY);
    expect(scaled.monthlyOpex).toBeCloseTo(base.monthlyOpex * 1.2, MONEY);
    expect(scaled.monthlyFixedCost).toBeCloseTo(base.monthlyFixedCost * 1.2, MONEY);
  });
});

describe('approved zero employer cost (spec §4.5a)', () => {
  it('contributes no payroll for a position whose employer cost is empty', () => {
    const raw = goldenRawInput();
    const positions = [{ id: 'barista', name: 'Barista', headcount: 3 }];
    expect(buildMonthlyFixedCosts(resolve({ ...raw, positions }), 1).monthlyPayroll).toBe(0);
  });

  it('still counts the per-person extras that were entered', () => {
    const raw = goldenRawInput();
    const positions = [
      { id: 'barista', name: 'Barista', headcount: 2, mealCostPerPerson: 3_000 },
    ];
    expect(buildMonthlyFixedCosts(resolve({ ...raw, positions }), 1).monthlyPayroll).toBe(6_000);
  });

  it('is the condition the UI warns on — headcount above zero with no employer cost', () => {
    const raw = goldenRawInput();
    const positions = [
      { id: 'warned', name: 'Barista', headcount: 3 },
      { id: 'quiet', name: 'Planlanan', headcount: 0 },
      { id: 'complete', name: 'Servis', headcount: 1, employerCostPerPerson: 30_000 },
    ];
    const resolvedPositions = resolve({ ...raw, positions }).positions;
    const needsWarning = resolvedPositions.filter(
      (position) => position.headcount > 0 && position.employerCostPerPerson === 0,
    );
    // A planned-but-unstaffed position is deliberate and must not warn.
    expect(needsWarning.map((position) => position.id)).toEqual(['warned']);
  });
});

describe('total initial investment (spec §11)', () => {
  it('sums every CAPEX item including opening stock', () => {
    expect(calculateTotalInitialInvestment(resolve())).toBe(GOLDEN.totalInitialInvestment);
  });

  it('is zero when no CAPEX is entered', () => {
    expect(calculateTotalInitialInvestment(resolve(minimalRawInput()))).toBe(0);
  });

  it('never appears in monthly fixed cost', () => {
    const fixed = buildMonthlyFixedCosts(resolve(), 1);
    const capex = calculateTotalInitialInvestment(resolve());
    expect(capex).toBeGreaterThan(0);
    expect(fixed.monthlyFixedCost).toBeLessThan(capex);
    expect(fixed.monthlyFixedCost).toBeCloseTo(
      fixed.monthlyPayroll +
        fixed.monthlyOwnerCost +
        fixed.monthlyOccupancyCost +
        fixed.monthlyOpex,
      9,
    );
  });
});
