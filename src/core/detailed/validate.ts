/**
 * Detailed input validation and default resolution.
 *
 * Authority: docs/DETAILED_FINANCIAL_SPEC.md §6.
 *
 * Errors are accumulated and returned; nothing is ever thrown. The calculator only
 * accepts `DetailedResolvedInput`, so unresolved input cannot reach a formula.
 * This module resolves and range-checks — it never computes a financial value.
 */

import {
  DELIVERY_MODES,
  DETAILED_DEFAULTS,
  PROJECTION_HORIZONS,
  RAMP_UP_PRESETS,
  RENT_INPUT_BASES,
} from './defaults.ts';
import { DETAILED_LIMITS, MIX_TOLERANCE, type FieldLimit } from './limits.ts';
import type {
  DeliveryMode,
  DetailedInput,
  DetailedResolvedInput,
  ProjectionHorizonMonths,
  RampUpPreset,
  RentInputBasis,
  ResolvedAssumptions,
  ResolvedCapexItem,
  ResolvedDelivery,
  ResolvedOccupancy,
  ResolvedOpexLine,
  ResolvedOwner,
  ResolvedPackaging,
  ResolvedPosition,
  ResolvedProduct,
  ScenarioVolumeDeltas,
  ValidateDetailedResult,
  ValidationError,
  ValidationErrorCode,
  ValidationPathSegment,
} from './types.ts';

const CHANNEL_MIX_KEYS = ['salon', 'takeaway', 'delivery'] as const;
const PAYMENT_MIX_KEYS = ['cash', 'card', 'mealCard'] as const;

/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

function isAbsent(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function fail(
  errors: ValidationError[],
  path: ValidationPathSegment[],
  code: ValidationErrorCode,
  limit?: number,
): void {
  errors.push(limit === undefined ? { path, code } : { path, code, limit });
}

/** Present but not an object is an error; absent is not. Either way callers get defaults. */
function section(
  errors: ValidationError[],
  path: ValidationPathSegment[],
  value: unknown,
): Record<string, unknown> {
  if (isAbsent(value)) return {};
  const object = asObject(value);
  if (object === null) {
    fail(errors, path, 'invalid_value');
    return {};
  }
  return object;
}

/** Absent → `[]`. Present but not an array is an error. */
function optionalArray(
  errors: ValidationError[],
  path: ValidationPathSegment[],
  value: unknown,
): unknown[] {
  if (isAbsent(value)) return [];
  if (!Array.isArray(value)) {
    fail(errors, path, 'invalid_value');
    return [];
  }
  return value;
}

/* ------------------------------------------------------------------ *
 * Field reader
 *
 * Binds the error list, the path prefix and the raw object once per section so a
 * field rule reads as one line. It is a readability helper over the primitives
 * above, not an abstraction layer: it adds no behaviour of its own.
 * ------------------------------------------------------------------ */

interface FieldReader {
  required(key: string, limit: FieldLimit): number;
  optional(key: string, limit: FieldLimit, fallback: number): number;
  text(key: string): string;
  choice<T extends string | number>(key: string, allowed: readonly T[], fallback: T): T;
  raw(key: string): unknown;
}

function fieldsOf(
  errors: ValidationError[],
  base: ValidationPathSegment[],
  raw: Record<string, unknown>,
): FieldReader {
  const check = (key: string, value: unknown, limit: FieldLimit): number | undefined => {
    const path = [...base, key];
    if (!isFiniteNumber(value)) {
      fail(errors, path, 'not_a_number');
      return undefined;
    }
    if (limit.exclusiveMin === true ? value <= limit.min : value < limit.min) {
      fail(errors, path, 'below_min', limit.min);
      return undefined;
    }
    if (value > limit.max) {
      fail(errors, path, 'above_max', limit.max);
      return undefined;
    }
    return value;
  };

  return {
    required(key, limit) {
      const value = raw[key];
      if (isAbsent(value)) {
        fail(errors, [...base, key], 'required');
        return limit.min;
      }
      return check(key, value, limit) ?? limit.min;
    },
    optional(key, limit, fallback) {
      const value = raw[key];
      if (isAbsent(value)) return fallback;
      return check(key, value, limit) ?? fallback;
    },
    text(key) {
      const value = raw[key];
      if (isAbsent(value)) {
        fail(errors, [...base, key], 'required');
        return '';
      }
      if (typeof value !== 'string') {
        fail(errors, [...base, key], 'invalid_value');
        return '';
      }
      return value;
    },
    choice(key, allowed, fallback) {
      const value = raw[key];
      if (isAbsent(value)) return fallback;
      if (allowed.includes(value as never)) return value as typeof fallback;
      fail(errors, [...base, key], 'invalid_value');
      return fallback;
    },
    raw(key) {
      return raw[key];
    },
  };
}

/* ------------------------------------------------------------------ *
 * Mixes — spec §6.2. Must sum to 1; never silently normalised.
 * ------------------------------------------------------------------ */

function resolveMix<K extends string>(
  errors: ValidationError[],
  key: string,
  value: unknown,
  componentKeys: readonly K[],
  fallback: Record<K, number>,
): Record<K, number> {
  if (isAbsent(value)) return fallback;

  const object = asObject(value);
  if (object === null) {
    fail(errors, [key], 'invalid_value');
    return fallback;
  }

  const fields = fieldsOf(errors, [key], object);
  const resolved = {} as Record<K, number>;
  let sum = 0;
  for (const component of componentKeys) {
    const share = fields.required(component, DETAILED_LIMITS.mixComponent);
    resolved[component] = share;
    sum += share;
  }

  if (Math.abs(sum - 1) > MIX_TOLERANCE) {
    fail(errors, [key], 'mix_not_100');
  }
  return resolved;
}

/* ------------------------------------------------------------------ *
 * Sections
 * ------------------------------------------------------------------ */

function resolveProducts(errors: ValidationError[], value: unknown): ResolvedProduct[] {
  // An empty or absent list is rejected here, so no engine path handles zero
  // products (spec §6.3). Zero daily quantity is a different, valid case.
  if (!Array.isArray(value) || value.length === 0) {
    fail(errors, ['products'], 'empty_products');
    return [];
  }

  return value.map((entry, index) => {
    const path = ['products', index];
    const f = fieldsOf(errors, path, section(errors, path, entry));
    return {
      id: f.text('id'),
      name: f.text('name'),
      normalPrice: f.required('normalPrice', DETAILED_LIMITS.normalPrice),
      onlinePrice: f.required('onlinePrice', DETAILED_LIMITS.onlinePrice),
      dailyQuantity: f.required('dailyQuantity', DETAILED_LIMITS.dailyQuantity),
      unitProductCost: f.required('unitProductCost', DETAILED_LIMITS.unitProductCost),
    };
  });
}

function resolvePositions(errors: ValidationError[], value: unknown): ResolvedPosition[] {
  return optionalArray(errors, ['positions'], value).map((entry, index) => {
    const path = ['positions', index];
    const f = fieldsOf(errors, path, section(errors, path, entry));
    return {
      id: f.text('id'),
      name: f.text('name'),
      headcount: f.required('headcount', DETAILED_LIMITS.headcount),
      employerCostPerPerson: f.optional('employerCostPerPerson', DETAILED_LIMITS.employerCostPerPerson, 0),
      mealCostPerPerson: f.optional('mealCostPerPerson', DETAILED_LIMITS.mealCostPerPerson, 0),
      transportCostPerPerson: f.optional('transportCostPerPerson', DETAILED_LIMITS.transportCostPerPerson, 0),
      averageBonusPerPerson: f.optional('averageBonusPerPerson', DETAILED_LIMITS.averageBonusPerPerson, 0),
    };
  });
}

function resolveOpexLines(errors: ValidationError[], value: unknown): ResolvedOpexLine[] {
  return optionalArray(errors, ['opexLines'], value).map((entry, index) => {
    const path = ['opexLines', index];
    const f = fieldsOf(errors, path, section(errors, path, entry));
    return {
      id: f.text('id'),
      name: f.text('name'),
      monthlyAmount: f.required('monthlyAmount', DETAILED_LIMITS.opexMonthlyAmount),
    };
  });
}

function resolveCapexItems(errors: ValidationError[], value: unknown): ResolvedCapexItem[] {
  return optionalArray(errors, ['capexItems'], value).map((entry, index) => {
    const path = ['capexItems', index];
    const f = fieldsOf(errors, path, section(errors, path, entry));
    return {
      id: f.text('id'),
      name: f.text('name'),
      amount: f.required('amount', DETAILED_LIMITS.capexAmount),
    };
  });
}

/**
 * `hasDeliveryVolume` is `channelMix.delivery > 0`.
 *
 * The mode selects the platform deduction (15% vs 38%) and whether own-courier
 * payment applies at all, so it is never silently defaulted for a business that
 * actually delivers: the user must choose. When the delivery share is 0 the mode
 * reaches no figure, and an inert value is resolved so the caller still gets a
 * complete input.
 */
function resolveDelivery(
  errors: ValidationError[],
  value: unknown,
  hasDeliveryVolume: boolean,
): ResolvedDelivery {
  const f = fieldsOf(errors, ['delivery'], section(errors, ['delivery'], value));

  if (hasDeliveryVolume && isAbsent(f.raw('mode'))) {
    fail(errors, ['delivery', 'mode'], 'required');
  }
  const mode = f.choice<DeliveryMode>('mode', DELIVERY_MODES, DETAILED_DEFAULTS.deliveryMode);
  const platformFeeRate = f.optional(
    'platformFeeRate',
    DETAILED_LIMITS.platformFeeRate,
    DETAILED_DEFAULTS.platformFeeRate[mode],
  );
  const ownCourier = f.optional(
    'ownCourierCostPerDeliveryOrder',
    DETAILED_LIMITS.ownCourierCostPerDeliveryOrder,
    DETAILED_DEFAULTS.ownCourierCostPerDeliveryOrder,
  );

  return {
    mode,
    platformFeeRate,
    // DF-81 — own-courier payment is Mode 1 only. Supplying it under Mode 2 is not
    // an error; it is discarded (spec §6.4).
    ownCourierCostPerDeliveryOrder: mode === 'platformCourier' ? 0 : ownCourier,
  };
}

function resolvePackaging(errors: ValidationError[], value: unknown): ResolvedPackaging {
  const f = fieldsOf(errors, ['packaging'], section(errors, ['packaging'], value));
  return {
    takeawayPerOrder: f.optional(
      'takeawayPerOrder',
      DETAILED_LIMITS.packagingTakeawayPerOrder,
      DETAILED_DEFAULTS.packagingTakeawayPerOrder,
    ),
    deliveryPerOrder: f.optional(
      'deliveryPerOrder',
      DETAILED_LIMITS.packagingDeliveryPerOrder,
      DETAILED_DEFAULTS.packagingDeliveryPerOrder,
    ),
  };
}

function resolveOccupancy(errors: ValidationError[], value: unknown): ResolvedOccupancy {
  const f = fieldsOf(errors, ['occupancy'], section(errors, ['occupancy'], value));
  return {
    monthlyRent: f.optional('monthlyRent', DETAILED_LIMITS.monthlyRent, DETAILED_DEFAULTS.monthlyRent),
    rentInputBasis: f.choice<RentInputBasis>(
      'rentInputBasis',
      RENT_INPUT_BASES,
      DETAILED_DEFAULTS.rentInputBasis,
    ),
    monthlyAidat: f.optional('monthlyAidat', DETAILED_LIMITS.monthlyAidat, DETAILED_DEFAULTS.monthlyAidat),
  };
}

function resolveOwner(errors: ValidationError[], value: unknown): ResolvedOwner {
  const f = fieldsOf(errors, ['owner'], section(errors, ['owner'], value));
  return {
    monthlyAmount: f.optional(
      'monthlyAmount',
      DETAILED_LIMITS.ownerMonthlyAmount,
      DETAILED_DEFAULTS.ownerMonthlyAmount,
    ),
    bagKurMonthlyCost: f.optional(
      'bagKurMonthlyCost',
      DETAILED_LIMITS.ownerBagKurMonthlyCost,
      DETAILED_DEFAULTS.ownerBagKurMonthlyCost,
    ),
  };
}

function resolveScenarioDeltas(errors: ValidationError[], value: unknown): ScenarioVolumeDeltas {
  const path = ['assumptions', 'scenarioVolumeDeltas'];
  const f = fieldsOf(errors, path, section(errors, path, value));
  const limit = DETAILED_LIMITS.scenarioVolumeDelta;
  const fallback = DETAILED_DEFAULTS.scenarioVolumeDeltas;
  return {
    bad: f.optional('bad', limit, fallback.bad),
    base: f.optional('base', limit, fallback.base),
    good: f.optional('good', limit, fallback.good),
  };
}

function resolveAssumptions(errors: ValidationError[], value: unknown): ResolvedAssumptions {
  const raw = section(errors, ['assumptions'], value);
  const f = fieldsOf(errors, ['assumptions'], raw);
  const increase = DETAILED_LIMITS.annualIncrease;
  return {
    vatRate: f.optional('vatRate', DETAILED_LIMITS.vatRate, DETAILED_DEFAULTS.vatRate),
    operatingDaysPerMonth: f.optional(
      'operatingDaysPerMonth',
      DETAILED_LIMITS.operatingDaysPerMonth,
      DETAILED_DEFAULTS.operatingDaysPerMonth,
    ),
    projectionHorizonMonths: f.choice<ProjectionHorizonMonths>(
      'projectionHorizonMonths',
      PROJECTION_HORIZONS,
      DETAILED_DEFAULTS.projectionHorizonMonths,
    ),
    rampUpPreset: f.choice<RampUpPreset>(
      'rampUpPreset',
      RAMP_UP_PRESETS,
      DETAILED_DEFAULTS.rampUpPreset,
    ),
    scenarioVolumeDeltas: resolveScenarioDeltas(errors, f.raw('scenarioVolumeDeltas')),
    salesPriceAnnualIncrease: f.optional(
      'salesPriceAnnualIncrease',
      increase,
      DETAILED_DEFAULTS.salesPriceAnnualIncrease,
    ),
    productCogsAnnualIncrease: f.optional(
      'productCogsAnnualIncrease',
      increase,
      DETAILED_DEFAULTS.productCogsAnnualIncrease,
    ),
    fixedCostAnnualIncrease: f.optional(
      'fixedCostAnnualIncrease',
      increase,
      DETAILED_DEFAULTS.fixedCostAnnualIncrease,
    ),
  };
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

export function validateDetailedInput(raw: DetailedInput): ValidateDetailedResult {
  const errors: ValidationError[] = [];
  const top = fieldsOf(errors, [], raw as Record<string, unknown>);

  // Resolved before the object literal below: whether delivery mode is required
  // depends on the delivery share, so the ordering must be explicit rather than
  // relying on property evaluation order.
  const channelMix = resolveMix(
    errors,
    'channelMix',
    raw.channelMix,
    CHANNEL_MIX_KEYS,
    DETAILED_DEFAULTS.channelMix,
  );

  const input: DetailedResolvedInput = {
    products: resolveProducts(errors, raw.products),
    channelMix,
    paymentMix: resolveMix(
      errors,
      'paymentMix',
      raw.paymentMix,
      PAYMENT_MIX_KEYS,
      DETAILED_DEFAULTS.paymentMix,
    ),
    posCommissionRate: top.optional(
      'posCommissionRate',
      DETAILED_LIMITS.posCommissionRate,
      DETAILED_DEFAULTS.posCommissionRate,
    ),
    mealCardCommissionRate: top.optional(
      'mealCardCommissionRate',
      DETAILED_LIMITS.mealCardCommissionRate,
      DETAILED_DEFAULTS.mealCardCommissionRate,
    ),
    delivery: resolveDelivery(errors, raw.delivery, channelMix.delivery > 0),
    packaging: resolvePackaging(errors, raw.packaging),
    occupancy: resolveOccupancy(errors, raw.occupancy),
    positions: resolvePositions(errors, raw.positions),
    owner: resolveOwner(errors, raw.owner),
    opexLines: resolveOpexLines(errors, raw.opexLines),
    capexItems: resolveCapexItems(errors, raw.capexItems),
    assumptions: resolveAssumptions(errors, raw.assumptions),
    // Non-editable system assumption (spec §5, §10.3), never a user input.
    rentWithholdingRate: DETAILED_DEFAULTS.rentWithholdingRate,
  };

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, input };
}
