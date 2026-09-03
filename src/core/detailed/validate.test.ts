import { describe, expect, it } from 'vitest';
import { DETAILED_DEFAULTS } from './defaults.ts';
import { goldenRawInput, minimalRawInput } from './goldenVector.ts';
import type { DetailedInput, ValidationError } from './types.ts';
import { validateDetailedInput } from './validate.ts';

function errorsOf(input: DetailedInput): ValidationError[] {
  const result = validateDetailedInput(input);
  return result.ok ? [] : result.errors;
}

function hasError(
  input: DetailedInput,
  path: (string | number)[],
  code: ValidationError['code'],
): boolean {
  return errorsOf(input).some(
    (error) => error.code === code && JSON.stringify(error.path) === JSON.stringify(path),
  );
}

function resolved(input: DetailedInput) {
  const result = validateDetailedInput(input);
  if (!result.ok) {
    throw new Error(`expected valid input, got ${JSON.stringify(result.errors)}`);
  }
  return result.input;
}

describe('validateDetailedInput — golden vector', () => {
  it('accepts the specification worked example', () => {
    expect(validateDetailedInput(goldenRawInput()).ok).toBe(true);
  });

  it('never throws, whatever it is handed', () => {
    expect(() => validateDetailedInput({})).not.toThrow();
    expect(() => validateDetailedInput({ products: 'nonsense' })).not.toThrow();
    expect(() => validateDetailedInput({ products: [null] })).not.toThrow();
    expect(() => validateDetailedInput({ assumptions: 42 })).not.toThrow();
  });
});

describe('products', () => {
  it('rejects an empty product list', () => {
    const raw = { ...goldenRawInput(), products: [] };
    expect(hasError(raw, ['products'], 'empty_products')).toBe(true);
  });

  it('rejects an absent product list', () => {
    const raw = { ...goldenRawInput(), products: undefined };
    expect(hasError(raw, ['products'], 'empty_products')).toBe(true);
  });

  it('rejects a non-array product list', () => {
    const raw = { ...goldenRawInput(), products: { id: 'x' } };
    expect(hasError(raw, ['products'], 'empty_products')).toBe(true);
  });

  it('accepts products whose daily quantity is zero', () => {
    const raw = goldenRawInput();
    const products = (raw.products as Record<string, unknown>[]).map((product) => ({
      ...product,
      dailyQuantity: 0,
    }));
    expect(validateDetailedInput({ ...raw, products }).ok).toBe(true);
  });

  it('addresses an error inside a product by index', () => {
    const raw = goldenRawInput();
    const products = [...(raw.products as Record<string, unknown>[])];
    products.push({ ...products[0], id: 'third', normalPrice: -1 });
    expect(hasError({ ...raw, products }, ['products', 2, 'normalPrice'], 'below_min')).toBe(true);
  });

  it('rejects a zero selling price as an exclusive minimum', () => {
    const raw = goldenRawInput();
    const products = (raw.products as Record<string, unknown>[]).map((product, index) =>
      index === 0 ? { ...product, normalPrice: 0 } : product,
    );
    expect(hasError({ ...raw, products }, ['products', 0, 'normalPrice'], 'below_min')).toBe(true);
  });

  it('reports a missing required product field', () => {
    const raw = goldenRawInput();
    const products = (raw.products as Record<string, unknown>[]).map((product, index) =>
      index === 1 ? { ...product, unitProductCost: undefined } : product,
    );
    expect(hasError({ ...raw, products }, ['products', 1, 'unitProductCost'], 'required')).toBe(
      true,
    );
  });
});

describe('percentage mixes', () => {
  it('rejects a channel mix that does not total 100%', () => {
    const raw = { ...goldenRawInput(), channelMix: { salon: 0.5, takeaway: 0.2, delivery: 0.2 } };
    expect(hasError(raw, ['channelMix'], 'mix_not_100')).toBe(true);
  });

  it('rejects a payment mix that does not total 100%', () => {
    const raw = { ...goldenRawInput(), paymentMix: { cash: 0.5, card: 0.45, mealCard: 0.15 } };
    expect(hasError(raw, ['paymentMix'], 'mix_not_100')).toBe(true);
  });

  it('accepts a mix within the 1e-6 tolerance', () => {
    const raw = {
      ...goldenRawInput(),
      channelMix: { salon: 0.5, takeaway: 0.2, delivery: 0.3 + 5e-7 },
    };
    expect(validateDetailedInput(raw).ok).toBe(true);
  });

  it('rejects a mix outside the 1e-6 tolerance', () => {
    const raw = {
      ...goldenRawInput(),
      channelMix: { salon: 0.5, takeaway: 0.2, delivery: 0.3 + 1e-4 },
    };
    expect(hasError(raw, ['channelMix'], 'mix_not_100')).toBe(true);
  });

  it('never normalises a mix silently', () => {
    const raw = { ...goldenRawInput(), channelMix: { salon: 1, takeaway: 1, delivery: 1 } };
    expect(validateDetailedInput(raw).ok).toBe(false);
  });

  it('accepts a single-channel mix', () => {
    const raw = { ...goldenRawInput(), channelMix: { salon: 1, takeaway: 0, delivery: 0 } };
    expect(resolved(raw).channelMix).toEqual({ salon: 1, takeaway: 0, delivery: 0 });
  });
});

describe('limits', () => {
  it('accepts meal-card commission rates above the 10% default', () => {
    for (const rate of [0.12, 0.15, 0.3]) {
      expect(validateDetailedInput({ ...goldenRawInput(), mealCardCommissionRate: rate }).ok).toBe(
        true,
      );
    }
  });

  it('rejects a meal-card commission rate above its ceiling', () => {
    const raw = { ...goldenRawInput(), mealCardCommissionRate: 0.31 };
    expect(hasError(raw, ['mealCardCommissionRate'], 'above_max')).toBe(true);
  });

  it('keeps the POS ceiling at 10%', () => {
    expect(validateDetailedInput({ ...goldenRawInput(), posCommissionRate: 0.1 }).ok).toBe(true);
    expect(hasError({ ...goldenRawInput(), posCommissionRate: 0.11 }, ['posCommissionRate'], 'above_max')).toBe(true);
  });

  it('allows a zero platform fee', () => {
    const raw = goldenRawInput();
    const delivery = { ...(raw.delivery as object), platformFeeRate: 0 };
    expect(resolved({ ...raw, delivery }).delivery.platformFeeRate).toBe(0);
  });

  it('rejects a non-finite number', () => {
    const raw = { ...goldenRawInput(), posCommissionRate: Number.NaN };
    expect(hasError(raw, ['posCommissionRate'], 'not_a_number')).toBe(true);
  });

  it('accumulates every error rather than stopping at the first', () => {
    const raw: DetailedInput = {
      products: [],
      channelMix: { salon: 0.5, takeaway: 0.2, delivery: 0.2 },
      posCommissionRate: 0.9,
    };
    expect(errorsOf(raw).length).toBeGreaterThanOrEqual(3);
  });
});

describe('enumerations', () => {
  it('rejects a horizon that is not a preset', () => {
    const raw = goldenRawInput();
    const assumptions = { ...(raw.assumptions as object), projectionHorizonMonths: 18 };
    expect(hasError({ ...raw, assumptions }, ['assumptions', 'projectionHorizonMonths'], 'invalid_value')).toBe(true);
  });

  it('accepts each locked horizon preset', () => {
    for (const horizon of [12, 24, 36]) {
      const raw = goldenRawInput();
      const assumptions = { ...(raw.assumptions as object), projectionHorizonMonths: horizon };
      expect(resolved({ ...raw, assumptions }).assumptions.projectionHorizonMonths).toBe(horizon);
    }
  });

  it('rejects an unknown ramp-up preset', () => {
    const raw = goldenRawInput();
    const assumptions = { ...(raw.assumptions as object), rampUpPreset: 'instant' };
    expect(hasError({ ...raw, assumptions }, ['assumptions', 'rampUpPreset'], 'invalid_value')).toBe(true);
  });

  it('rejects an unknown delivery mode', () => {
    const raw = goldenRawInput();
    const delivery = { ...(raw.delivery as object), mode: 'pigeon' };
    expect(hasError({ ...raw, delivery }, ['delivery', 'mode'], 'invalid_value')).toBe(true);
  });
});

describe('defaults', () => {
  it('applies every default when only the required fields are supplied', () => {
    const input = resolved(minimalRawInput());

    expect(input.assumptions.vatRate).toBe(DETAILED_DEFAULTS.vatRate);
    expect(input.assumptions.operatingDaysPerMonth).toBe(DETAILED_DEFAULTS.operatingDaysPerMonth);
    expect(input.assumptions.projectionHorizonMonths).toBe(24);
    expect(input.assumptions.rampUpPreset).toBe('normal');
    expect(input.assumptions.scenarioVolumeDeltas).toEqual({ bad: -0.25, base: 0, good: 0.25 });
    expect(input.assumptions.salesPriceAnnualIncrease).toBe(0);
    expect(input.assumptions.productCogsAnnualIncrease).toBe(0);
    expect(input.assumptions.fixedCostAnnualIncrease).toBe(0);
    expect(input.posCommissionRate).toBe(0.0359);
    expect(input.mealCardCommissionRate).toBe(0.1);
    expect(input.channelMix).toEqual(DETAILED_DEFAULTS.channelMix);
    expect(input.paymentMix).toEqual(DETAILED_DEFAULTS.paymentMix);
    expect(input.rentWithholdingRate).toBe(0.2);
    expect(input.occupancy).toEqual({ monthlyRent: 0, rentInputBasis: 'gross', monthlyAidat: 0 });
    expect(input.owner).toEqual({ monthlyAmount: 0, bagKurMonthlyCost: 0 });
    expect(input.positions).toEqual([]);
    expect(input.opexLines).toEqual([]);
    expect(input.capexItems).toEqual([]);
  });

  it('uses the mode-specific platform fee default', () => {
    const raw = goldenRawInput();
    const only = resolved({ ...raw, delivery: { mode: 'platformOnly' } });
    const courier = resolved({ ...raw, delivery: { mode: 'platformCourier' } });
    expect(only.delivery.platformFeeRate).toBe(0.15);
    expect(courier.delivery.platformFeeRate).toBe(0.38);
  });

  it('defaults per-person position costs to zero', () => {
    const raw = goldenRawInput();
    const positions = [{ id: 'p', name: 'Servis', headcount: 2 }];
    const position = resolved({ ...raw, positions }).positions[0];
    expect(position).toEqual({
      id: 'p',
      name: 'Servis',
      headcount: 2,
      employerCostPerPerson: 0,
      mealCostPerPerson: 0,
      transportCostPerPerson: 0,
      averageBonusPerPerson: 0,
    });
  });
});

describe('delivery mode requirement (spec §6.4)', () => {
  it('requires a mode when the business delivers', () => {
    const raw = { ...goldenRawInput(), delivery: { platformFeeRate: 0.15 } };
    expect(hasError(raw, ['delivery', 'mode'], 'required')).toBe(true);
  });

  it('requires a mode when the delivery share comes from the default channel mix', () => {
    const raw = { products: goldenRawInput().products };
    expect(hasError(raw, ['delivery', 'mode'], 'required')).toBe(true);
  });

  it('requires a mode when the delivery section is absent entirely', () => {
    const raw = { ...goldenRawInput(), delivery: undefined };
    expect(hasError(raw, ['delivery', 'mode'], 'required')).toBe(true);
  });

  it('accepts either locked mode', () => {
    for (const mode of ['platformOnly', 'platformCourier'] as const) {
      const raw = { ...goldenRawInput(), delivery: { mode } };
      expect(resolved(raw).delivery.mode).toBe(mode);
    }
  });

  it('does not require a mode when nothing is delivered', () => {
    const raw = {
      ...goldenRawInput(),
      channelMix: { salon: 0.7, takeaway: 0.3, delivery: 0 },
      delivery: undefined,
    };
    expect(validateDetailedInput(raw).ok).toBe(true);
  });

  it('resolves an inert mode when nothing is delivered', () => {
    const raw = {
      ...goldenRawInput(),
      channelMix: { salon: 1, takeaway: 0, delivery: 0 },
      delivery: undefined,
    };
    expect(resolved(raw).delivery.mode).toBe('platformOnly');
  });

  it('still accepts an explicit mode when nothing is delivered', () => {
    const raw = {
      ...goldenRawInput(),
      channelMix: { salon: 1, takeaway: 0, delivery: 0 },
      delivery: { mode: 'platformCourier' },
    };
    expect(resolved(raw).delivery.mode).toBe('platformCourier');
  });

  it('never silently defaults the mode for a delivering business', () => {
    const result = validateDetailedInput({ ...goldenRawInput(), delivery: {} });
    expect(result.ok).toBe(false);
  });
});

describe('approved zero defaults', () => {
  it('resolves empty takeaway and delivery packaging to 0 TL', () => {
    const raw = { ...goldenRawInput(), packaging: undefined };
    expect(resolved(raw).packaging).toEqual({ takeawayPerOrder: 0, deliveryPerOrder: 0 });
  });

  it('resolves a partially filled packaging section to 0 for the missing side', () => {
    const raw = { ...goldenRawInput(), packaging: { deliveryPerOrder: 5 } };
    expect(resolved(raw).packaging).toEqual({ takeawayPerOrder: 0, deliveryPerOrder: 5 });
  });

  it('resolves an empty employer cost to 0 TL without blocking the calculation', () => {
    const raw = {
      ...goldenRawInput(),
      positions: [{ id: 'barista', name: 'Barista', headcount: 3 }],
    };
    const result = validateDetailedInput(raw);
    expect(result.ok).toBe(true);
    expect(resolved(raw).positions[0]?.employerCostPerPerson).toBe(0);
  });

  it('leaves meal, transport and bonus at 0 when they are empty', () => {
    const raw = {
      ...goldenRawInput(),
      positions: [{ id: 'barista', name: 'Barista', headcount: 3, employerCostPerPerson: 45_000 }],
    };
    const position = resolved(raw).positions[0];
    expect(position?.mealCostPerPerson).toBe(0);
    expect(position?.transportCostPerPerson).toBe(0);
    expect(position?.averageBonusPerPerson).toBe(0);
  });

  it('still requires headcount on a position that exists', () => {
    const raw = { ...goldenRawInput(), positions: [{ id: 'p', name: 'Servis' }] };
    expect(hasError(raw, ['positions', 0, 'headcount'], 'required')).toBe(true);
  });
});

describe('own-courier resolution (DF-81)', () => {
  it('keeps the own-courier cost under platform-only mode', () => {
    const raw = goldenRawInput();
    const delivery = { mode: 'platformOnly', platformFeeRate: 0.15, ownCourierCostPerDeliveryOrder: 40 };
    expect(resolved({ ...raw, delivery }).delivery.ownCourierCostPerDeliveryOrder).toBe(40);
  });

  it('zeroes the own-courier cost under platform-courier mode without erroring', () => {
    const raw = goldenRawInput();
    const delivery = { mode: 'platformCourier', platformFeeRate: 0.38, ownCourierCostPerDeliveryOrder: 40 };
    const result = validateDetailedInput({ ...raw, delivery });
    expect(result.ok).toBe(true);
    expect(resolved({ ...raw, delivery }).delivery.ownCourierCostPerDeliveryOrder).toBe(0);
  });
});
