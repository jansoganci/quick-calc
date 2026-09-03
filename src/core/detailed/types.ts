/**
 * Detailed Feasibility engine types.
 *
 * Authority: docs/DETAILED_FINANCIAL_SPEC.md §3.3, §4, §16.
 * This file imports nothing, which keeps the module graph acyclic by construction.
 * Types only — no values, no constants, no functions.
 */

/* ------------------------------------------------------------------ *
 * Enumerations — spec §3.3
 * ------------------------------------------------------------------ */

export type Channel = 'salon' | 'takeaway' | 'delivery';

export type PaymentMethod = 'cash' | 'card' | 'mealCard';

/** `platformOnly` is DF-10 Mode 1 (merchant courier); `platformCourier` is Mode 2. */
export type DeliveryMode = 'platformOnly' | 'platformCourier';

export type RentInputBasis = 'net' | 'gross';

export type RampUpPreset = 'slow' | 'normal' | 'fast';

export type ScenarioKey = 'bad' | 'base' | 'good';

/** Presets only — no free numeric horizon (DF-71). */
export type ProjectionHorizonMonths = 12 | 24 | 36;

/* ------------------------------------------------------------------ *
 * Validation — spec §6.1
 * ------------------------------------------------------------------ */

export type ValidationErrorCode =
  | 'required'
  | 'not_a_number'
  | 'below_min'
  | 'above_max'
  | 'invalid_value'
  | 'mix_not_100'
  | 'empty_products';

export type ValidationPathSegment = string | number;

export interface ValidationError {
  path: ValidationPathSegment[];
  code: ValidationErrorCode;
  limit?: number;
}

export type ValidateDetailedResult =
  | { ok: true; input: DetailedResolvedInput }
  | { ok: false; errors: ValidationError[] };

/* ------------------------------------------------------------------ *
 * Raw input — spec §4
 *
 * Every leaf is `unknown`: the shape arriving from the UI is untrusted and
 * validation is the only thing allowed to narrow it.
 * ------------------------------------------------------------------ */

export interface DetailedInput {
  products?: unknown;
  channelMix?: unknown;
  paymentMix?: unknown;
  posCommissionRate?: unknown;
  mealCardCommissionRate?: unknown;
  delivery?: unknown;
  packaging?: unknown;
  occupancy?: unknown;
  positions?: unknown;
  owner?: unknown;
  opexLines?: unknown;
  capexItems?: unknown;
  assumptions?: unknown;
}

/* ------------------------------------------------------------------ *
 * Resolved input — spec §4
 * ------------------------------------------------------------------ */

/** Prices are VAT-inclusive as entered (DF-03). Quantity is daily and stabilized (DF-66). */
export interface ResolvedProduct {
  id: string;
  name: string;
  normalPrice: number;
  onlinePrice: number;
  dailyQuantity: number;
  unitProductCost: number;
}

/** One business-level split, must total 1 (DF-04a). */
export interface ChannelMix {
  salon: number;
  takeaway: number;
  delivery: number;
}

/** Direct store sales only — salon and takeaway (DF-49). Must total 1 (DF-06a). */
export interface PaymentMix {
  cash: number;
  card: number;
  mealCard: number;
}

export interface ResolvedDelivery {
  mode: DeliveryMode;
  /** Effective total deduction, VAT included (DF-54). May be 0 (DF-82). */
  platformFeeRate: number;
  /** Mode 1 only; validation forces this to 0 under `platformCourier` (DF-81). */
  ownCourierCostPerDeliveryOrder: number;
}

/** Business-level amounts, not per product (spec §9.2). */
export interface ResolvedPackaging {
  takeawayPerOrder: number;
  deliveryPerOrder: number;
}

export interface ResolvedOccupancy {
  monthlyRent: number;
  rentInputBasis: RentInputBasis;
  monthlyAidat: number;
}

export interface ResolvedPosition {
  id: string;
  name: string;
  headcount: number;
  employerCostPerPerson: number;
  mealCostPerPerson: number;
  transportCostPerPerson: number;
  averageBonusPerPerson: number;
}

/** Separate from employee positions (DF-59). No owner payroll or income-tax engine. */
export interface ResolvedOwner {
  monthlyAmount: number;
  bagKurMonthlyCost: number;
}

export interface ResolvedOpexLine {
  id: string;
  name: string;
  monthlyAmount: number;
}

export interface ResolvedCapexItem {
  id: string;
  name: string;
  amount: number;
}

export interface ScenarioVolumeDeltas {
  bad: number;
  base: number;
  good: number;
}

export interface ResolvedAssumptions {
  vatRate: number;
  operatingDaysPerMonth: number;
  projectionHorizonMonths: ProjectionHorizonMonths;
  rampUpPreset: RampUpPreset;
  scenarioVolumeDeltas: ScenarioVolumeDeltas;
  salesPriceAnnualIncrease: number;
  productCogsAnnualIncrease: number;
  fixedCostAnnualIncrease: number;
}

export interface DetailedResolvedInput {
  products: ResolvedProduct[];
  channelMix: ChannelMix;
  paymentMix: PaymentMix;
  posCommissionRate: number;
  mealCardCommissionRate: number;
  delivery: ResolvedDelivery;
  packaging: ResolvedPackaging;
  occupancy: ResolvedOccupancy;
  positions: ResolvedPosition[];
  owner: ResolvedOwner;
  opexLines: ResolvedOpexLine[];
  capexItems: ResolvedCapexItem[];
  assumptions: ResolvedAssumptions;
  /** Non-editable system assumption (spec §5, §10.3). Never a user input. */
  rentWithholdingRate: number;
}

/* ------------------------------------------------------------------ *
 * Internal intermediates — not exported from index.ts
 * ------------------------------------------------------------------ */

/** Per unit and volume-free — spec §9. */
export interface UnitEconomicsLine {
  grossPerUnit: number;
  netPerUnit: number;
  unitProductCost: number;
  unitChannelVariableCost: number;
  unitPaymentPlatformFee: number;
  unitContribution: number;
}

/**
 * `product` is carried for pairing only, so the monthly aggregation can iterate a
 * single array. `unitEconomics.ts` must never read `product.dailyQuantity`.
 */
export interface ProductUnitEconomics {
  product: ResolvedProduct;
  byChannel: Record<Channel, UnitEconomicsLine>;
}

export interface UnitEconomics {
  directFeeRate: number;
  products: ProductUnitEconomics[];
}

/** Volume-independent monthly costs — spec §10. CAPEX is deliberately absent. */
export interface MonthlyFixedCosts {
  monthlyPayroll: number;
  monthlyOwnerCost: number;
  monthlyOccupancyCost: number;
  monthlyOpex: number;
  rentCost: number;
  rentPaidToLandlord: number;
  rentWithholdingTax: number;
  monthlyFixedCost: number;
}

/** The four multipliers that are the only way scenarios, ramp-up and escalation act. */
export interface MonthFactors {
  month: number | null;
  quantityFactor: number;
  priceFactor: number;
  cogsFactor: number;
  fixedFactor: number;
}

export interface BreakEvenBasis {
  totalContribution: number;
  totalUnits: number;
  monthlyFixedCost: number;
  operatingDaysPerMonth: number;
}

export interface ResolvedRentCost {
  rentCost: number;
  rentPaidToLandlord: number;
  rentWithholdingTax: number;
}

/* ------------------------------------------------------------------ *
 * Output contract — spec §16. Nothing beyond DF-61's output set.
 * ------------------------------------------------------------------ */

export interface ChannelLine {
  units: number;
  grossCustomerSales: number;
  netRevenue: number;
  productCogs: number;
  channelVariableCost: number;
  paymentPlatformFee: number;
  contribution: number;
}

export interface MonthResult {
  /** `null` for a stabilized month; 1-based for a projection row. */
  month: number | null;
  quantityFactor: number;
  priceFactor: number;
  cogsFactor: number;
  fixedFactor: number;
  totalUnits: number;
  grossCustomerSales: number;
  vatAmount: number;
  netRevenue: number;
  productCogs: number;
  channelVariableCost: number;
  paymentPlatformFee: number;
  totalVariableCost: number;
  totalContribution: number;
  monthlyPayroll: number;
  monthlyOwnerCost: number;
  monthlyOccupancyCost: number;
  monthlyOpex: number;
  rentCost: number;
  rentPaidToLandlord: number;
  rentWithholdingTax: number;
  monthlyFixedCost: number;
  monthlyOperatingResult: number;
  byChannel: Record<Channel, ChannelLine>;
}

export type BreakEvenUnavailableReason = 'no_sales_volume' | 'non_positive_contribution';

export type BreakEvenResult =
  | {
      available: true;
      weightedContributionPerUnit: number;
      unitsPerMonth: number;
      unitsPerDay: number;
    }
  | { available: false; reason: BreakEvenUnavailableReason };

export type PaybackUnavailableReason =
  | 'not_reached_within_horizon'
  | 'non_positive_operating_result';

export type PaybackResult =
  | { available: true; month: number; cumulativeAtPayback: number }
  | { available: false; reason: PaybackUnavailableReason };

export interface ScenarioResult {
  scenarioMultiplier: number;
  stabilizedMonth: MonthResult;
  projection: MonthResult[];
  payback: PaybackResult;
}

/**
 * Mandatory assumption transparency (spec §16.4). The later UI must display the
 * three annual escalation rates even when they are 0.
 */
export interface ResultAssumptions {
  vatRate: number;
  operatingDaysPerMonth: number;
  rentWithholdingRate: number;
  projectionHorizonMonths: ProjectionHorizonMonths;
  rampUpPreset: RampUpPreset;
  scenarioVolumeDeltas: ScenarioVolumeDeltas;
  deliveryMode: DeliveryMode;
  platformFeeRate: number;
  posCommissionRate: number;
  mealCardCommissionRate: number;
  salesPriceAnnualIncrease: number;
  productCogsAnnualIncrease: number;
  fixedCostAnnualIncrease: number;
}

export interface ResultMeta {
  detailedEngineVersion: string;
  currency: 'TRY';
  revenueBasis: 'net';
  assumptions: ResultAssumptions;
}

export interface DetailedResult {
  totalInitialInvestment: number;
  breakEven: BreakEvenResult;
  scenarios: Record<ScenarioKey, ScenarioResult>;
  meta: ResultMeta;
}
