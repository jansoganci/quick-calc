import { QUICK_DEFAULTS } from './defaults.ts';
import type {
  BreakdownPerSale,
  PaybackResult,
  PerSaleResult,
  QuickCalculationResult,
  QuickResolvedInput,
  RentInputBasis,
} from './types.ts';

export interface ResolvedRentCost {
  rentCost: number;
  rentPaidToLandlord: number;
  rentWithholdingTax: number;
}

/**
 * Monthly payroll: headcount times the blended per-employee employer cost that
 * scope §6.2 keeps consolidated. Extracted so the Quick form can show the same
 * product beneath its two payroll inputs without restating the multiplication —
 * a formula has exactly one home.
 */
export function resolveMonthlyPayroll(input: {
  employeeCount: number;
  averageEmployeeMonthlyCost: number;
}): number {
  return input.employeeCount * input.averageEmployeeMonthlyCost;
}

export function resolveRentCost(input: {
  monthlyRent: number;
  rentInputBasis: RentInputBasis;
  rentWithholdingRate: number;
}): ResolvedRentCost {
  const entered = input.monthlyRent;
  const rate = input.rentWithholdingRate;

  if (entered === 0 || rate === 0) {
    return {
      rentCost: entered,
      rentPaidToLandlord: entered,
      rentWithholdingTax: 0,
    };
  }

  if (input.rentInputBasis === 'net') {
    const rentCost = entered / (1 - rate);
    const rentWithholdingTax = rentCost - entered;
    return {
      rentCost,
      rentPaidToLandlord: entered,
      rentWithholdingTax,
    };
  }

  const rentWithholdingTax = entered * rate;
  return {
    rentCost: entered,
    rentPaidToLandlord: entered - rentWithholdingTax,
    rentWithholdingTax,
  };
}

export function calculateQuick(input: QuickResolvedInput): QuickCalculationResult {
  const monthlySalesVolume = input.dailySalesVolume * input.operatingDaysPerMonth;

  const netAverageTicket = input.averageTicket / (1 + input.vatRate);
  const vatPerSale = input.averageTicket - netAverageTicket;
  const monthlyGrossCollections = monthlySalesVolume * input.averageTicket;
  const monthlyNetRevenue = monthlySalesVolume * netAverageTicket;
  const monthlyVat = monthlyGrossCollections - monthlyNetRevenue;

  const monthlyPayroll = resolveMonthlyPayroll(input);
  const monthlyVariableCost = monthlySalesVolume * input.variableCostPerSale;

  const posCostPerSale = input.averageTicket * input.cardPaymentShare * input.posCommissionRate;
  const monthlyTransactionCost = monthlySalesVolume * posCostPerSale;

  const monthlyCapexRecoveryAllocation = input.initialCapex / input.capexRecoveryPeriodMonths;

  const rent = resolveRentCost(input);

  const monthlyFixedCost =
    rent.rentCost + monthlyPayroll + input.otherMonthlyOpex + monthlyCapexRecoveryAllocation;

  const monthlyTotalCost = monthlyFixedCost + monthlyVariableCost + monthlyTransactionCost;

  const monthlyOperatingEarnings = monthlyNetRevenue - monthlyTotalCost;
  const monthlyOperatingEarningsBeforeCapexRecoveryAllocation =
    monthlyOperatingEarnings + monthlyCapexRecoveryAllocation;

  let perSale: PerSaleResult | null = null;
  let breakdownPerSale: BreakdownPerSale | null = null;

  if (monthlySalesVolume !== 0) {
    const fixedCostPerSale = monthlyFixedCost / monthlySalesVolume;
    const payrollPerSale = monthlyPayroll / monthlySalesVolume;
    const rentPerSale = rent.rentCost / monthlySalesVolume;
    const otherOpexPerSale = input.otherMonthlyOpex / monthlySalesVolume;
    const investmentRecoveryPerSale = monthlyCapexRecoveryAllocation / monthlySalesVolume;
    const estimatedTotalCostPerSale =
      vatPerSale + input.variableCostPerSale + posCostPerSale + fixedCostPerSale;
    const remainingProfitPerSale =
      input.averageTicket -
      (vatPerSale +
        input.variableCostPerSale +
        payrollPerSale +
        rentPerSale +
        otherOpexPerSale +
        posCostPerSale +
        investmentRecoveryPerSale);

    perSale = {
      grossTicket: input.averageTicket,
      netTicket: netAverageTicket,
      vat: vatPerSale,
      variable: input.variableCostPerSale,
      pos: posCostPerSale,
      fixed: fixedCostPerSale,
      estimatedTotalCost: estimatedTotalCostPerSale,
      remainingProfit: remainingProfitPerSale,
    };

    breakdownPerSale = {
      averageSale: input.averageTicket,
      lines: [
        { line: 'vat', amount: vatPerSale },
        { line: 'variable', amount: input.variableCostPerSale },
        { line: 'payroll', amount: payrollPerSale },
        { line: 'rent', amount: rentPerSale },
        { line: 'otherOpex', amount: otherOpexPerSale },
        { line: 'pos', amount: posCostPerSale },
        { line: 'investmentRecovery', amount: investmentRecoveryPerSale },
      ],
      remainingProfit: remainingProfitPerSale,
    };
  }

  const grossProfitMargin =
    monthlyNetRevenue === 0 ? null : (monthlyNetRevenue - monthlyVariableCost) / monthlyNetRevenue;
  const operatingProfitMargin =
    monthlyNetRevenue === 0 ? null : monthlyOperatingEarnings / monthlyNetRevenue;

  let payback: PaybackResult;
  if (input.initialCapex === 0) {
    payback = { months: 0, exceedsRecoveryPeriod: false };
  } else if (monthlyOperatingEarningsBeforeCapexRecoveryAllocation <= 0) {
    payback = { available: false, reason: 'non_positive_earnings_before_recovery' };
  } else {
    const paybackMonths = input.initialCapex / monthlyOperatingEarningsBeforeCapexRecoveryAllocation;
    payback = {
      months: paybackMonths,
      exceedsRecoveryPeriod: paybackMonths > input.capexRecoveryPeriodMonths,
    };
  }

  return {
    monthly: {
      salesVolume: monthlySalesVolume,
      grossCollections: monthlyGrossCollections,
      vat: monthlyVat,
      netRevenue: monthlyNetRevenue,
      payroll: monthlyPayroll,
      rentCost: rent.rentCost,
      rentPaidToLandlord: rent.rentPaidToLandlord,
      rentWithholdingTax: rent.rentWithholdingTax,
      variableCost: monthlyVariableCost,
      transactionCost: monthlyTransactionCost,
      capexRecoveryAllocation: monthlyCapexRecoveryAllocation,
      fixedCost: monthlyFixedCost,
      totalCost: monthlyTotalCost,
      operatingEarnings: monthlyOperatingEarnings,
      operatingEarningsBeforeCapexRecoveryAllocation:
        monthlyOperatingEarningsBeforeCapexRecoveryAllocation,
    },
    perSale,
    breakdownPerSale,
    grossProfitMargin,
    operatingProfitMargin,
    payback,
    meta: {
      quickEngineVersion: QUICK_DEFAULTS.quickEngineVersion,
      currency: QUICK_DEFAULTS.currency,
      vatRate: input.vatRate,
      revenueBasis: 'net',
    },
  };
}
