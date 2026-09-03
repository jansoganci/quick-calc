/**
 * Detailed engine defaults — docs/DETAILED_FINANCIAL_SPEC.md §5, §5.2.
 *
 * One home for every default and locked constant (architecture U2). The later
 * form imports these; it never restates them.
 */

import type {
  ChannelMix,
  DeliveryMode,
  PaymentMix,
  ProjectionHorizonMonths,
  RampUpPreset,
  RentInputBasis,
  ScenarioKey,
  ScenarioVolumeDeltas,
} from './types.ts';

export const DETAILED_DEFAULTS = {
  /** DF-65 — editable, unlike Lite's system assumption. */
  vatRate: 0.1,
  /** DF-66 */
  operatingDaysPerMonth: 30,
  /** DF-08 — a default only, never an immutable constant. Lite's 3.56% is unaffected. */
  posCommissionRate: 0.0359,
  /** DF-09 */
  mealCardCommissionRate: 0.1,
  /** DF-10a — not market constants. */
  platformFeeRate: {
    platformOnly: 0.15,
    platformCourier: 0.38,
  } satisfies Record<DeliveryMode, number>,
  deliveryMode: 'platformOnly' as DeliveryMode,
  ownCourierCostPerDeliveryOrder: 0,
  packagingTakeawayPerOrder: 0,
  packagingDeliveryPerOrder: 0,
  channelMix: { salon: 0.5, takeaway: 0.2, delivery: 0.3 } satisfies ChannelMix,
  paymentMix: { cash: 0.4, card: 0.45, mealCard: 0.15 } satisfies PaymentMix,
  /** DF-24, DF-71 — presets only. */
  projectionHorizonMonths: 24 as ProjectionHorizonMonths,
  rampUpPreset: 'normal' as RampUpPreset,
  /** DF-37a — editable defaults. */
  scenarioVolumeDeltas: { bad: -0.25, base: 0, good: 0.25 } satisfies ScenarioVolumeDeltas,
  /**
   * DF-43 leaves the annual rates open and forbids inventing them. 0 is the neutral
   * identity: every projected month uses exactly the values the user entered.
   * Spec §5.1 makes these mandatory in `meta.assumptions` so 0% is never hidden.
   */
  salesPriceAnnualIncrease: 0,
  productCogsAnnualIncrease: 0,
  fixedCostAnnualIncrease: 0,
  /** DF-12 — non-editable system assumption, not a user input. */
  rentWithholdingRate: 0.2,
  rentInputBasis: 'gross' as RentInputBasis,
  monthlyRent: 0,
  monthlyAidat: 0,
  ownerMonthlyAmount: 0,
  ownerBagKurMonthlyCost: 0,
  currency: 'TRY' as const,
  detailedEngineVersion: '1.0.0',
};

/**
 * Ramp-up presets — spec §5.2 / DF-25. Percentage of the scenario-adjusted
 * stabilized quantity, by projection month. Months past a table's end are 100%.
 */
export const RAMP_UP_TABLES = {
  slow: [0.4, 0.55, 0.7, 0.8, 0.9],
  normal: [0.6, 0.75, 0.85, 0.95],
  fast: [0.8, 0.9],
} as const satisfies Record<RampUpPreset, readonly number[]>;

export const SCENARIO_KEYS = ['bad', 'base', 'good'] as const satisfies readonly ScenarioKey[];

export const PROJECTION_HORIZONS = [12, 24, 36] as const satisfies readonly ProjectionHorizonMonths[];

export const CHANNELS = ['salon', 'takeaway', 'delivery'] as const;

export const RAMP_UP_PRESETS = ['slow', 'normal', 'fast'] as const satisfies readonly RampUpPreset[];

export const DELIVERY_MODES = ['platformOnly', 'platformCourier'] as const satisfies readonly DeliveryMode[];

export const RENT_INPUT_BASES = ['net', 'gross'] as const satisfies readonly RentInputBasis[];
