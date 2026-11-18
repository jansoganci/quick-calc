import { describe, expect, it } from 'vitest';
import { calculateDetailed } from './calculate.ts';
import { GOLDEN, goldenRawInput } from './goldenVector.ts';
import type { DetailedInput, DetailedResult, MonthResult } from './types.ts';
import { validateDetailedInput } from './validate.ts';

const TOLERANCE = 1e-6;

function resultOf(raw: DetailedInput): DetailedResult {
  const validated = validateDetailedInput(raw);
  if (!validated.ok) {
    throw new Error(`fixture must be valid: ${JSON.stringify(validated.errors)}`);
  }
  return calculateDetailed(validated.input);
}

function expectIdentity(month: MonthResult): void {
  const reconstructed =
    month.grossProfitBeforeChannel -
    month.channelCost -
    month.monthlyPayroll -
    month.rentCost -
    month.monthlyAidat -
    month.monthlyOpex -
    month.monthlyOwnerDraw -
    month.monthlyBagKur;
  expect(Math.abs(reconstructed - month.monthlyOperatingResult)).toBeLessThanOrEqual(TOLERANCE);
  expect(month.grossProfitBeforeChannel).toBeCloseTo(month.netRevenue - month.productCogs, 9);
  expect(month.channelCost).toBeCloseTo(month.channelVariableCost + month.paymentPlatformFee, 9);
  expect(month.monthlyAidat).toBeCloseTo(month.monthlyOccupancyCost - month.rentCost, 9);
  expect(month.monthlyOwnerDraw + month.monthlyBagKur).toBeCloseTo(month.monthlyOwnerCost, 9);
}

function expectEveryMonth(result: DetailedResult): void {
  for (const scenario of Object.values(result.scenarios)) {
    expectIdentity(scenario.stabilizedMonth);
    expect(scenario.projection.length).toBeGreaterThan(0);
    for (const month of scenario.projection) expectIdentity(month);
  }
}

describe('additive month fields', () => {
  it('keeps the golden operating result and payback month', () => {
    const result = resultOf(goldenRawInput());
    const base = result.scenarios.base;
    expect(base.stabilizedMonth.monthlyOperatingResult).toBeCloseTo(
      GOLDEN.monthlyOperatingResult,
      4,
    );
    expect(base.payback).toEqual(
      expect.objectContaining({ available: true, month: GOLDEN.paybackMonth.base }),
    );
    expectEveryMonth(result);
  });

  it('holds on delivery 0%, both courier modes, cash only, and aidat above zero', () => {
    const noDelivery = goldenRawInput();
    noDelivery.channelMix = { salon: 0.8, takeaway: 0.2, delivery: 0 };

    const ownCourier = goldenRawInput();
    ownCourier.delivery = {
      mode: 'platformOnly',
      platformFeeRate: 0.15,
      ownCourierCostPerDeliveryOrder: 40,
    };

    const platformCourier = goldenRawInput();
    platformCourier.delivery = {
      mode: 'platformCourier',
      platformFeeRate: 0.38,
      ownCourierCostPerDeliveryOrder: 40,
    };

    const cashOnly = goldenRawInput();
    cashOnly.paymentMix = { cash: 1, card: 0, mealCard: 0 };

    const withAidat = goldenRawInput();
    withAidat.occupancy = { monthlyRent: 60_000, rentInputBasis: 'net', monthlyAidat: 12_000 };

    for (const raw of [noDelivery, ownCourier, platformCourier, cashOnly, withAidat]) {
      expectEveryMonth(resultOf(raw));
    }
  });
});
