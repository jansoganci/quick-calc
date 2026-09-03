import { describe, expect, it } from 'vitest';
import { calculateDetailed } from './calculate.ts';
import { goldenRawInput, minimalRawInput } from './goldenVector.ts';
import type { DetailedInput, DetailedResolvedInput, DetailedResult } from './types.ts';
import { validateDetailedInput } from './validate.ts';

function resolve(raw: DetailedInput): DetailedResolvedInput {
  const result = validateDetailedInput(raw);
  if (!result.ok) {
    throw new Error(`fixture must be valid: ${JSON.stringify(result.errors)}`);
  }
  return result.input;
}

function collectNumbers(value: unknown, found: number[]): void {
  if (typeof value === 'number') {
    found.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectNumbers(entry, found);
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const nested of Object.values(value)) collectNumbers(nested, found);
  }
}

function zeroQuantityInput(): DetailedInput {
  const raw = goldenRawInput();
  return {
    ...raw,
    products: (raw.products as Record<string, unknown>[]).map((product) => ({
      ...product,
      dailyQuantity: 0,
    })),
  };
}

/** Every row of spec §15, as a named case the sweep can iterate. */
const EDGE_CASES: { name: string; raw: DetailedInput }[] = [
  { name: 'golden vector', raw: goldenRawInput() },
  { name: 'all daily quantities zero', raw: zeroQuantityInput() },
  {
    name: 'minimal input — products and delivery mode only',
    raw: minimalRawInput(),
  },
  {
    name: 'zero platform fee',
    raw: {
      ...goldenRawInput(),
      delivery: { mode: 'platformOnly', platformFeeRate: 0, ownCourierCostPerDeliveryOrder: 40 },
    },
  },
  {
    name: 'platform courier mode',
    raw: {
      ...goldenRawInput(),
      delivery: {
        mode: 'platformCourier',
        platformFeeRate: 0.38,
        ownCourierCostPerDeliveryOrder: 40,
      },
    },
  },
  {
    name: 'no rent',
    raw: {
      ...goldenRawInput(),
      occupancy: { monthlyRent: 0, rentInputBasis: 'net', monthlyAidat: 0 },
    },
  },
  {
    name: 'salon only channel mix',
    raw: { ...goldenRawInput(), channelMix: { salon: 1, takeaway: 0, delivery: 0 } },
  },
  {
    name: 'delivery only channel mix',
    raw: { ...goldenRawInput(), channelMix: { salon: 0, takeaway: 0, delivery: 1 } },
  },
  {
    name: 'all cash payment mix',
    raw: { ...goldenRawInput(), paymentMix: { cash: 1, card: 0, mealCard: 0 } },
  },
  { name: 'no CAPEX', raw: { ...goldenRawInput(), capexItems: [] } },
  {
    name: 'non-positive contribution',
    raw: {
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
    },
  },
  {
    name: 'single product, single day, minimal everything',
    raw: {
      products: [
        {
          id: 'one',
          name: 'Tek',
          normalPrice: 1,
          onlinePrice: 1,
          dailyQuantity: 0,
          unitProductCost: 0,
        },
      ],
      delivery: { mode: 'platformOnly' },
      assumptions: { operatingDaysPerMonth: 1, projectionHorizonMonths: 12 },
    },
  },
];

describe('edge cases produce finite numbers only', () => {
  for (const edgeCase of EDGE_CASES) {
    it(`never yields NaN or Infinity — ${edgeCase.name}`, () => {
      const result = calculateDetailed(resolve(edgeCase.raw));
      const found: number[] = [];
      collectNumbers(result, found);
      expect(found.length).toBeGreaterThan(0);
      for (const value of found) {
        expect(Number.isFinite(value)).toBe(true);
      }
    });
  }

  it('never throws on any edge case', () => {
    for (const edgeCase of EDGE_CASES) {
      expect(() => calculateDetailed(resolve(edgeCase.raw))).not.toThrow();
    }
  });
});

describe('zero sales volume (spec §15)', () => {
  const result = calculateDetailed(resolve(zeroQuantityInput()));

  it('leaves the operating result at minus the fixed cost', () => {
    const month = result.scenarios.base.stabilizedMonth;
    expect(month.totalUnits).toBe(0);
    expect(month.grossCustomerSales).toBe(0);
    expect(month.netRevenue).toBe(0);
    expect(month.totalVariableCost).toBe(0);
    expect(month.monthlyFixedCost).toBeGreaterThan(0);
    expect(month.monthlyOperatingResult).toBeCloseTo(-month.monthlyFixedCost, 9);
  });

  it('reports break-even as unavailable for want of volume', () => {
    expect(result.breakEven).toEqual({ available: false, reason: 'no_sales_volume' });
  });

  it('reports payback as unavailable because operations are not positive', () => {
    expect(result.scenarios.base.payback).toEqual({
      available: false,
      reason: 'non_positive_operating_result',
    });
  });
});

describe('empty sections (spec §15)', () => {
  it('models a business with no rent, staff, owner cost, OPEX or CAPEX', () => {
    const result = calculateDetailed(resolve(minimalRawInput()));
    const month = result.scenarios.base.stabilizedMonth;

    expect(month.monthlyFixedCost).toBe(0);
    expect(result.totalInitialInvestment).toBe(0);
    expect(month.monthlyOperatingResult).toBeCloseTo(month.totalContribution, 9);
    expect(result.scenarios.base.payback).toEqual({
      available: true,
      month: 0,
      cumulativeAtPayback: 0,
    });
  });

  it('gives a zero break-even volume when there is no fixed cost to cover', () => {
    const result = calculateDetailed(resolve(minimalRawInput()));
    expect(result.breakEven.available).toBe(true);
    expect(result.breakEven.available && result.breakEven.unitsPerDay).toBe(0);
  });
});

describe('zero-rate paths (spec §15)', () => {
  it('charges no platform fee at a 0% rate', () => {
    const result = calculateDetailed(
      resolve({
        ...goldenRawInput(),
        delivery: { mode: 'platformOnly', platformFeeRate: 0, ownCourierCostPerDeliveryOrder: 40 },
      }),
    );
    const delivery = result.scenarios.base.stabilizedMonth.byChannel.delivery;
    expect(delivery.paymentPlatformFee).toBe(0);
    // Delivery still carries product COGS and its channel variable costs.
    expect(delivery.productCogs).toBeGreaterThan(0);
    expect(delivery.channelVariableCost).toBeGreaterThan(0);
  });

  it('charges no payment fee on an all-cash mix', () => {
    const result = calculateDetailed(
      resolve({ ...goldenRawInput(), paymentMix: { cash: 1, card: 0, mealCard: 0 } }),
    );
    const month = result.scenarios.base.stabilizedMonth;
    expect(month.byChannel.salon.paymentPlatformFee).toBe(0);
    expect(month.byChannel.takeaway.paymentPlatformFee).toBe(0);
    // Delivery is unaffected: it is platform-collected, not paid in the store.
    expect(month.byChannel.delivery.paymentPlatformFee).toBeGreaterThan(0);
  });

  it('leaves rent figures at zero when no rent is entered', () => {
    const result = calculateDetailed(
      resolve({
        ...goldenRawInput(),
        occupancy: { monthlyRent: 0, rentInputBasis: 'net', monthlyAidat: 0 },
      }),
    );
    const month = result.scenarios.base.stabilizedMonth;
    expect(month.rentCost).toBe(0);
    expect(month.rentPaidToLandlord).toBe(0);
    expect(month.rentWithholdingTax).toBe(0);
    expect(month.monthlyOccupancyCost).toBe(0);
  });

  it('contributes nothing from a channel with a zero mix share', () => {
    const result = calculateDetailed(
      resolve({ ...goldenRawInput(), channelMix: { salon: 1, takeaway: 0, delivery: 0 } }),
    );
    const month = result.scenarios.base.stabilizedMonth;
    expect(month.byChannel.takeaway.units).toBe(0);
    expect(month.byChannel.takeaway.contribution).toBe(0);
    expect(month.byChannel.delivery.units).toBe(0);
    expect(month.byChannel.delivery.paymentPlatformFee).toBe(0);
    expect(month.totalUnits).toBeCloseTo(month.byChannel.salon.units, 9);
  });
});

describe('delivery mode is inert at a zero delivery share (spec §15)', () => {
  const withoutDelivery = (mode: 'platformOnly' | 'platformCourier', fee: number) =>
    calculateDetailed(
      resolve({
        ...goldenRawInput(),
        channelMix: { salon: 0.7, takeaway: 0.3, delivery: 0 },
        delivery: { mode, platformFeeRate: fee, ownCourierCostPerDeliveryOrder: 40 },
      }),
    );

  it('produces identical figures whichever mode is selected', () => {
    const mode1 = withoutDelivery('platformOnly', 0.15);
    const mode2 = withoutDelivery('platformCourier', 0.38);

    const financials = (result: ReturnType<typeof calculateDetailed>) => ({
      totalInitialInvestment: result.totalInitialInvestment,
      breakEven: result.breakEven,
      scenarios: result.scenarios,
    });

    expect(financials(mode2)).toEqual(financials(mode1));
  });

  it('is unaffected even by an extreme platform fee', () => {
    const normal = withoutDelivery('platformOnly', 0.15);
    const extreme = withoutDelivery('platformOnly', 0.6);
    expect(extreme.scenarios.base.stabilizedMonth.monthlyOperatingResult).toBe(
      normal.scenarios.base.stabilizedMonth.monthlyOperatingResult,
    );
  });

  it('still reports the selected mode in the assumptions block', () => {
    // The mode reaches no figure, but the result stays honest about what was chosen.
    expect(withoutDelivery('platformCourier', 0.38).meta.assumptions.deliveryMode).toBe(
      'platformCourier',
    );
  });
});

describe('extreme but valid inputs', () => {
  it('handles the largest permitted magnitudes without losing finiteness', () => {
    const result: DetailedResult = calculateDetailed(
      resolve({
        products: [
          {
            id: 'max',
            name: 'Max',
            normalPrice: 100_000,
            onlinePrice: 100_000,
            dailyQuantity: 100_000,
            unitProductCost: 100_000,
          },
        ],
        delivery: { mode: 'platformCourier' },
        occupancy: { monthlyRent: 50_000_000, rentInputBasis: 'net', monthlyAidat: 50_000_000 },
        capexItems: [{ id: 'c', name: 'Max', amount: 500_000_000 }],
        assumptions: { projectionHorizonMonths: 36, salesPriceAnnualIncrease: 2 },
      }),
    );
    const found: number[] = [];
    collectNumbers(result, found);
    for (const value of found) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });
});
