/**
 * DF-85 discount. Expected money is written from the formulas.
 *
 * One product, 30 days, 10 units/day → 300 units.
 * Mix 0.50 / 0.20 / 0.30 → 150 salon, 60 takeaway, 90 delivery.
 * Card share 1, POS 2%, platform fee 10%, VAT 10%. No other cost.
 */
import { describe, expect, it } from 'vitest';
import { calculateDetailed, calculateMonth } from './calculate.ts';
import { GOLDEN, goldenRawInput, minimalRawInput } from './goldenVector.ts';
import type { DetailedInput, MonthResult } from './types.ts';
import { validateDetailedInput } from './validate.ts';

const MONEY = 4;

function monthOf(raw: DetailedInput): MonthResult {
  const result = validateDetailedInput(raw);
  if (!result.ok) throw new Error(`fixture must be valid: ${JSON.stringify(result.errors)}`);
  return calculateMonth(result.input, {
    month: null,
    quantityFactor: 1,
    priceFactor: 1,
    cogsFactor: 1,
    fixedFactor: 1,
  });
}

function salesInput(discountRate?: number): DetailedInput {
  return {
    products: [
      {
        id: 'kahve',
        name: 'Kahve',
        normalPrice: 110,
        onlinePrice: 220,
        dailyQuantity: 10,
        unitProductCost: 20,
        ...(discountRate === undefined ? {} : { discountRate }),
      },
    ],
    channelMix: { salon: 0.5, takeaway: 0.2, delivery: 0.3 },
    paymentMix: { cash: 0, card: 1, mealCard: 0 },
    posCommissionRate: 0.02,
    mealCardCommissionRate: 0,
    delivery: { mode: 'platformOnly', platformFeeRate: 0.1, ownCourierCostPerDeliveryOrder: 0 },
    packaging: { takeawayPerOrder: 0, deliveryPerOrder: 0 },
    assumptions: { vatRate: 0.1, operatingDaysPerMonth: 30 },
  };
}

describe('product discount', () => {
  it('prices 10% off both list prices and leaves product cost alone', () => {
    const month = monthOf(salesInput(0.1));
    expect(month.grossCustomerSales).toBeCloseTo(38_610, MONEY);
    expect(month.netRevenue).toBeCloseTo(35_100, MONEY);
    expect(month.vatAmount).toBeCloseTo(3_510, MONEY);
    expect(month.productCogs).toBeCloseTo(6_000, MONEY);
    expect(month.paymentPlatformFee).toBeCloseTo(415.8 + 1_782, MONEY);
    expect(month.channelVariableCost).toBe(0);
    expect(month.monthlyOperatingResult).toBeCloseTo(26_902.2, MONEY);
  });

  it('treats an omitted discount the same as zero', () => {
    const omitted = monthOf(salesInput());
    const zero = monthOf(salesInput(0));
    expect(omitted.grossCustomerSales).toBeCloseTo(42_900, MONEY);
    expect(omitted.monthlyOperatingResult).toBeCloseTo(30_558, MONEY);
    expect(zero.monthlyOperatingResult).toBeCloseTo(omitted.monthlyOperatingResult, MONEY);
  });

  it('allows a 100% discount and stays finite', () => {
    const month = monthOf(salesInput(1));
    expect(month.grossCustomerSales).toBe(0);
    expect(month.netRevenue).toBe(0);
    expect(month.productCogs).toBeCloseTo(6_000, MONEY);
    expect(month.paymentPlatformFee).toBe(0);
    expect(month.monthlyOperatingResult).toBeCloseTo(-6_000, MONEY);
    expect(Number.isFinite(month.monthlyOperatingResult)).toBe(true);
  });

  it('leaves the golden operating result and payback month in place', () => {
    const validated = validateDetailedInput(goldenRawInput());
    if (!validated.ok) throw new Error('golden input must be valid');
    const result = calculateDetailed(validated.input);
    expect(result.scenarios.base.stabilizedMonth.monthlyOperatingResult).toBeCloseTo(
      GOLDEN.monthlyOperatingResult,
      MONEY,
    );
    expect(result.scenarios.base.payback).toEqual(
      expect.objectContaining({ available: true, month: GOLDEN.paybackMonth.base }),
    );
  });

  it('carries the 2026 figures as explicit inputs (test plan case ii)', () => {
    // Hand total: zero-discount contribution 30.558 − 40.874,63 − 11.808,23 = −22.124,86.
    const month = monthOf({
      ...salesInput(0),
      positions: [
        { id: 'p1', name: 'Personel', headcount: 1, employerCostPerPerson: 40_874.63 },
      ],
      owner: { monthlyAmount: 0, bagKurMonthlyCost: 11_808.23 },
    });
    expect(month.monthlyPayroll).toBeCloseTo(40_874.63, MONEY);
    expect(month.monthlyBagKur).toBeCloseTo(11_808.23, MONEY);
    expect(month.monthlyOwnerCost).toBeCloseTo(11_808.23, MONEY);
    expect(month.monthlyOperatingResult).toBeCloseTo(-22_124.86, MONEY);
  });

  it('keeps a minimal input at zero Bağ-Kur, payroll and fixed cost', () => {
    const month = monthOf(minimalRawInput());
    expect(month.monthlyBagKur).toBe(0);
    expect(month.monthlyPayroll).toBe(0);
    expect(month.monthlyFixedCost).toBe(0);
  });

  it('rejects a channel mix of 90% without calculating', () => {
    const result = validateDetailedInput({
      ...salesInput(0),
      channelMix: { salon: 0.5, takeaway: 0.2, delivery: 0.2 },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual([
      expect.objectContaining({ path: ['channelMix'], code: 'mix_not_100' }),
    ]);
  });
});
