import { describe, expect, it } from 'vitest';
import { calculateDetailed } from './calculate.ts';
import { goldenRawInput } from './goldenVector.ts';
import * as publicApi from './index.ts';
import type { DetailedInput, DetailedResolvedInput } from './types.ts';
import { validateDetailedInput } from './validate.ts';

function resolve(raw: DetailedInput = goldenRawInput()): DetailedResolvedInput {
  const result = validateDetailedInput(raw);
  if (!result.ok) {
    throw new Error(`fixture must be valid: ${JSON.stringify(result.errors)}`);
  }
  return result.input;
}

describe('result contract (spec §16)', () => {
  const result = calculateDetailed(resolve());

  it('exposes exactly the documented top-level keys', () => {
    expect(Object.keys(result).sort()).toEqual(
      ['breakEven', 'meta', 'scenarios', 'totalInitialInvestment'].sort(),
    );
  });

  it('exposes exactly the documented scenario keys', () => {
    expect(Object.keys(result.scenarios).sort()).toEqual(['bad', 'base', 'good']);
    for (const scenario of Object.values(result.scenarios)) {
      expect(Object.keys(scenario).sort()).toEqual(
        ['payback', 'projection', 'scenarioMultiplier', 'stabilizedMonth'].sort(),
      );
    }
  });

  it('exposes exactly the documented month keys', () => {
    const expected = [
      'month',
      'quantityFactor',
      'priceFactor',
      'cogsFactor',
      'fixedFactor',
      'totalUnits',
      'grossCustomerSales',
      'vatAmount',
      'netRevenue',
      'productCogs',
      'channelVariableCost',
      'paymentPlatformFee',
      'totalVariableCost',
      'totalContribution',
      'monthlyPayroll',
      'monthlyOwnerCost',
      'monthlyOccupancyCost',
      'monthlyOpex',
      'rentCost',
      'rentPaidToLandlord',
      'rentWithholdingTax',
      'monthlyFixedCost',
      'monthlyOperatingResult',
      'byChannel',
    ].sort();
    expect(Object.keys(result.scenarios.base.stabilizedMonth).sort()).toEqual(expected);
    expect(Object.keys(result.scenarios.base.projection[0] ?? {}).sort()).toEqual(expected);
  });

  it('exposes exactly the documented channel-line keys', () => {
    for (const line of Object.values(result.scenarios.base.stabilizedMonth.byChannel)) {
      expect(Object.keys(line).sort()).toEqual(
        [
          'units',
          'grossCustomerSales',
          'netRevenue',
          'productCogs',
          'channelVariableCost',
          'paymentPlatformFee',
          'contribution',
        ].sort(),
      );
    }
  });

  it('publishes no margin ratios — DF-61 does not list them', () => {
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('Margin');
    expect(serialized).not.toContain('margin');
  });

  it('carries the full assumption block (spec §16.4)', () => {
    expect(Object.keys(result.meta.assumptions).sort()).toEqual(
      [
        'vatRate',
        'operatingDaysPerMonth',
        'rentWithholdingRate',
        'projectionHorizonMonths',
        'rampUpPreset',
        'scenarioVolumeDeltas',
        'deliveryMode',
        'platformFeeRate',
        'posCommissionRate',
        'mealCardCommissionRate',
        'salesPriceAnnualIncrease',
        'productCogsAnnualIncrease',
        'fixedCostAnnualIncrease',
      ].sort(),
    );
  });

  it('surfaces the escalation rates even when they are zero', () => {
    for (const key of [
      'salesPriceAnnualIncrease',
      'productCogsAnnualIncrease',
      'fixedCostAnnualIncrease',
    ] as const) {
      expect(result.meta.assumptions[key]).toBe(0);
      expect(Object.hasOwn(result.meta.assumptions, key)).toBe(true);
    }
  });
});

describe('terminology (spec §3.1)', () => {
  const serialized = JSON.stringify(calculateDetailed(resolve()));

  it('emits no banned term in the result contract', () => {
    for (const banned of [
      'depreciation',
      'amortisation',
      'amortization',
      'netProfit',
      'customerCount',
      'recovery',
    ]) {
      expect(serialized.toLowerCase()).not.toContain(banned.toLowerCase());
    }
  });

  it('names the bottom line an operating result', () => {
    expect(serialized).toContain('monthlyOperatingResult');
  });

  it('expresses break-even in units, never customers or tickets', () => {
    expect(serialized).toContain('unitsPerDay');
    expect(serialized).toContain('unitsPerMonth');
    expect(serialized).not.toContain('ticket');
  });
});

describe('public surface', () => {
  it('exports exactly the documented runtime values', () => {
    expect(Object.keys(publicApi).sort()).toEqual(
      [
        'DETAILED_DEFAULTS',
        'DETAILED_LIMITS',
        'MIX_TOLERANCE',
        'RAMP_UP_TABLES',
        'calculateDetailed',
        'validateDetailedInput',
      ].sort(),
    );
  });

  it('keeps every internal helper off the public surface', () => {
    for (const internal of [
      'calculateMonth',
      'buildUnitEconomics',
      'buildMonthlyFixedCosts',
      'calculateBreakEven',
      'paybackFromProjection',
      'rampUpMultiplier',
      'escalationFactor',
      'resolveRentCost',
      'goldenRawInput',
      'GOLDEN',
    ]) {
      expect(Object.hasOwn(publicApi, internal), `index.ts exposes ${internal}`).toBe(false);
    }
  });

  it('exposes no generic calculator interface shared with Quick', () => {
    for (const shared of ['calculate', 'simulate', 'Engine', 'engine']) {
      expect(Object.keys(publicApi)).not.toContain(shared);
    }
  });
});

describe('no internal rounding (spec §16.6)', () => {
  const result = calculateDetailed(resolve());

  it('returns raw values, not presentation-rounded ones', () => {
    const fee = result.scenarios.base.stabilizedMonth.paymentPlatformFee;
    // 86 144.3505 — a rounded engine would have lost these decimals.
    expect(fee).not.toBe(Math.round(fee));
    expect(fee).not.toBe(Number(fee.toFixed(2)));
  });

  it('keeps fractional units when a scenario produces them', () => {
    const input = resolve({
      ...goldenRawInput(),
      products: [
        {
          id: 'odd',
          name: 'Tek',
          normalPrice: 100,
          onlinePrice: 100,
          dailyQuantity: 33,
          unitProductCost: 10,
        },
      ],
    });
    const bad = calculateDetailed(input).scenarios.bad.stabilizedMonth;
    // 33 x 0.75 x 30 = 742.5 — never rounded to a whole unit.
    expect(bad.totalUnits).toBeCloseTo(742.5, 9);
  });

  it('keeps break-even as a fractional volume', () => {
    if (!result.breakEven.available) throw new Error('expected an available break-even');
    expect(result.breakEven.unitsPerDay).not.toBe(Math.round(result.breakEven.unitsPerDay));
  });
});
