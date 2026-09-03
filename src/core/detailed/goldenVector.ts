/**
 * The worked example from docs/DETAILED_FINANCIAL_SPEC.md §18.2.
 *
 * Test fixture only — not exported from `index.ts` and not used by the engine.
 * It lives here so the golden input and its hand-computed expectations have one
 * home instead of being copied across nine test files.
 *
 * Every expected figure below is taken verbatim from spec §18.2. A failing
 * assertion is investigated against the specification before any number here is
 * changed (CLAUDE.md §5).
 */

import type { DetailedInput } from './types.ts';

export function goldenRawInput(): DetailedInput {
  return {
    products: [
      {
        id: 'americano',
        name: 'Americano',
        normalPrice: 150,
        onlinePrice: 200,
        dailyQuantity: 180,
        unitProductCost: 30,
      },
      {
        id: 'tost',
        name: 'Tost',
        normalPrice: 90,
        onlinePrice: 120,
        dailyQuantity: 90,
        unitProductCost: 35,
      },
    ],
    channelMix: { salon: 0.5, takeaway: 0.2, delivery: 0.3 },
    paymentMix: { cash: 0.4, card: 0.45, mealCard: 0.15 },
    posCommissionRate: 0.0359,
    mealCardCommissionRate: 0.1,
    delivery: {
      mode: 'platformOnly',
      platformFeeRate: 0.15,
      ownCourierCostPerDeliveryOrder: 40,
    },
    packaging: { takeawayPerOrder: 3, deliveryPerOrder: 5 },
    occupancy: { monthlyRent: 60_000, rentInputBasis: 'net', monthlyAidat: 5_000 },
    positions: [
      {
        id: 'barista',
        name: 'Barista',
        headcount: 3,
        employerCostPerPerson: 45_000,
        mealCostPerPerson: 3_000,
        transportCostPerPerson: 2_000,
        averageBonusPerPerson: 2_500,
      },
    ],
    owner: { monthlyAmount: 60_000, bagKurMonthlyCost: 5_000 },
    opexLines: [
      { id: 'electricity', name: 'Elektrik', monthlyAmount: 18_000 },
      { id: 'water', name: 'Su', monthlyAmount: 3_000 },
      { id: 'internet', name: 'İnternet', monthlyAmount: 1_500 },
      { id: 'accountant', name: 'Mali müşavir', monthlyAmount: 6_000 },
      { id: 'cleaning', name: 'Temizlik', monthlyAmount: 4_000 },
    ],
    capexItems: [
      { id: 'fitout', name: 'Tadilat', amount: 900_000 },
      { id: 'equipment', name: 'Ekipman', amount: 600_000 },
      { id: 'furniture', name: 'Mobilya', amount: 200_000 },
      { id: 'signage', name: 'Tabela', amount: 50_000 },
      { id: 'openingStock', name: 'Açılış stoğu', amount: 100_000 },
      { id: 'setup', name: 'Kuruluş giderleri', amount: 50_000 },
    ],
    assumptions: {
      vatRate: 0.1,
      operatingDaysPerMonth: 30,
      projectionHorizonMonths: 24,
      rampUpPreset: 'normal',
      scenarioVolumeDeltas: { bad: -0.25, base: 0, good: 0.25 },
      salesPriceAnnualIncrease: 0,
      productCogsAnnualIncrease: 0,
      fixedCostAnnualIncrease: 0,
    },
  };
}

/**
 * The smallest valid input: products, plus the delivery mode.
 *
 * The mode is required because the default channel mix carries a 30% delivery
 * share, and a business that delivers must say how (spec §6.4).
 */
export function minimalRawInput(): DetailedInput {
  return {
    products: goldenRawInput().products,
    delivery: { mode: 'platformOnly' },
  };
}

/** Spec §18.2 — base stabilized month, monthly figures. */
export const GOLDEN = {
  directFeeRate: 0.031155,
  totalUnits: 8_100,
  grossCustomerSales: 1_158_300,
  vatAmount: 105_300,
  netRevenue: 1_053_000,
  productCogs: 256_500,
  channelVariableCost: 114_210,
  paymentPlatformFee: 86_144.3505,
  totalVariableCost: 456_854.3505,
  totalContribution: 596_145.6495,
  monthlyPayroll: 157_500,
  monthlyOwnerCost: 65_000,
  rentCost: 75_000,
  rentPaidToLandlord: 60_000,
  rentWithholdingTax: 15_000,
  monthlyOccupancyCost: 80_000,
  monthlyOpex: 32_500,
  monthlyFixedCost: 335_000,
  monthlyOperatingResult: 261_145.6495,
  weightedContributionPerUnit: 73.5982283333,
  breakEvenUnitsPerMonth: 4_551.74,
  breakEvenUnitsPerDay: 151.7247,
  totalInitialInvestment: 1_900_000,
  stabilizedOperatingResult: { bad: 112_109.24, base: 261_145.6495, good: 410_182.06 },
  paybackMonth: { bad: 21, base: 10, good: 7 },
  /** Base projection, first five months and their cumulative operating result. */
  baseProjection: [
    { month: 1, result: 22_687.39, cumulative: 22_687.39 },
    { month: 2, result: 112_109.24, cumulative: 134_796.63 },
    { month: 3, result: 171_723.8, cumulative: 306_520.43 },
    { month: 4, result: 231_338.37, cumulative: 537_858.8 },
    { month: 5, result: 261_145.65, cumulative: 799_004.45 },
  ],
  baseCumulativeAtMonth9: 1_843_587.04,
  baseCumulativeAtMonth10: 2_104_732.69,
  /** Spec §18.2, daily per-channel lines of the base stabilized month. */
  dailyChannelLines: [
    { product: 'Americano', channel: 'salon', units: 90, gross: 13_500, net: 12_272.7273, cogs: 2_700, channelVariable: 0, fee: 420.5925, contribution: 9_152.1348 },
    { product: 'Americano', channel: 'takeaway', units: 36, gross: 5_400, net: 4_909.0909, cogs: 1_080, channelVariable: 108, fee: 168.237, contribution: 3_552.8539 },
    { product: 'Americano', channel: 'delivery', units: 54, gross: 10_800, net: 9_818.1818, cogs: 1_620, channelVariable: 2_430, fee: 1_620, contribution: 4_148.1818 },
    { product: 'Tost', channel: 'salon', units: 45, gross: 4_050, net: 3_681.8182, cogs: 1_575, channelVariable: 0, fee: 126.1778, contribution: 1_980.6404 },
    { product: 'Tost', channel: 'takeaway', units: 18, gross: 1_620, net: 1_472.7273, cogs: 630, channelVariable: 54, fee: 50.4711, contribution: 738.2562 },
    { product: 'Tost', channel: 'delivery', units: 27, gross: 3_240, net: 2_945.4545, cogs: 945, channelVariable: 1_215, fee: 486, contribution: 299.4545 },
  ],
  /** Spec §18.2 Mode 2 sub-case — only the delivery lines change. */
  mode2: {
    americanoDelivery: { channelVariable: 270, fee: 4_104, contribution: 3_824.1818 },
    tostDelivery: { channelVariable: 135, fee: 1_231.2, contribution: 634.2545 },
    monthlyOperatingResult: 261_469.648,
    breakEvenUnitsPerDay: 151.6423,
  },
} as const;
