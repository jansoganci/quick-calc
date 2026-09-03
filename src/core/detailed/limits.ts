/**
 * Detailed input ranges — docs/DETAILED_FINANCIAL_SPEC.md §6.
 *
 * These are part of the calculation contract, not UI preferences (architecture D8/U3).
 * An upper bound is a validity ceiling, not a suggestion: the only figures this
 * product asserts are the defaults in `defaults.ts`.
 */

export interface FieldLimit {
  min: number;
  max: number;
  exclusiveMin?: boolean;
}

export const DETAILED_LIMITS = {
  normalPrice: { min: 0, max: 100_000, exclusiveMin: true },
  onlinePrice: { min: 0, max: 100_000, exclusiveMin: true },
  dailyQuantity: { min: 0, max: 100_000 },
  unitProductCost: { min: 0, max: 100_000 },

  packagingTakeawayPerOrder: { min: 0, max: 100_000 },
  packagingDeliveryPerOrder: { min: 0, max: 100_000 },
  ownCourierCostPerDeliveryOrder: { min: 0, max: 100_000 },

  posCommissionRate: { min: 0, max: 0.1 },
  /** Bounded well above its 10% default because DF-09 makes the rate genuinely editable. */
  mealCardCommissionRate: { min: 0, max: 0.3 },
  platformFeeRate: { min: 0, max: 0.6 },

  vatRate: { min: 0, max: 0.5 },
  operatingDaysPerMonth: { min: 1, max: 31 },

  monthlyRent: { min: 0, max: 50_000_000 },
  monthlyAidat: { min: 0, max: 50_000_000 },
  opexMonthlyAmount: { min: 0, max: 50_000_000 },

  headcount: { min: 0, max: 500 },
  employerCostPerPerson: { min: 0, max: 1_000_000 },
  mealCostPerPerson: { min: 0, max: 1_000_000 },
  transportCostPerPerson: { min: 0, max: 1_000_000 },
  averageBonusPerPerson: { min: 0, max: 1_000_000 },

  ownerMonthlyAmount: { min: 0, max: 1_000_000 },
  ownerBagKurMonthlyCost: { min: 0, max: 1_000_000 },

  capexAmount: { min: 0, max: 500_000_000 },

  scenarioVolumeDelta: { min: -0.9, max: 5 },
  annualIncrease: { min: -0.5, max: 2 },
  mixComponent: { min: 0, max: 1 },
} as const satisfies Record<string, FieldLimit>;

/** Both mixes must sum to 1 within this tolerance (spec §6.2). Never normalised. */
export const MIX_TOLERANCE = 1e-6;
