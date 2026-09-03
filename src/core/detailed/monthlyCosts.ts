/**
 * Volume-independent monthly costs and total initial investment.
 *
 * Authority: docs/DETAILED_FINANCIAL_SPEC.md §10, §11.
 *
 * Nothing here depends on sales volume. CAPEX is summed here but is returned
 * separately and is never added to `monthlyFixedCost`: Detailed v1 has no
 * accounting depreciation and no recovery allocation (DF-34).
 */

import type {
  DetailedResolvedInput,
  MonthlyFixedCosts,
  RentInputBasis,
  ResolvedRentCost,
} from './types.ts';

/**
 * İşyeri kira stopajı — spec §10.3 / DF-12.
 *
 * The withholding rate applies to the gross base, so a net entry grosses up by
 * dividing by `1 − rate`. Never `netRent × 1.20`.
 */
export function resolveRentCost(input: {
  monthlyRent: number;
  rentInputBasis: RentInputBasis;
  rentWithholdingRate: number;
}): ResolvedRentCost {
  const entered = input.monthlyRent;
  const rate = input.rentWithholdingRate;

  if (entered === 0 || rate === 0) {
    return { rentCost: entered, rentPaidToLandlord: entered, rentWithholdingTax: 0 };
  }

  if (input.rentInputBasis === 'net') {
    const rentCost = entered / (1 - rate);
    return {
      rentCost,
      rentPaidToLandlord: entered,
      rentWithholdingTax: rentCost - entered,
    };
  }

  const rentWithholdingTax = entered * rate;
  return {
    rentCost: entered,
    rentPaidToLandlord: entered - rentWithholdingTax,
    rentWithholdingTax,
  };
}

export function buildMonthlyFixedCosts(
  input: DetailedResolvedInput,
  fixedFactor: number,
): MonthlyFixedCosts {
  // The user enters employer cost directly; there is no gross-to-net payroll engine (DF-15).
  const basePayroll = input.positions.reduce(
    (total, position) =>
      total +
      position.headcount *
        (position.employerCostPerPerson +
          position.mealCostPerPerson +
          position.transportCostPerPerson +
          position.averageBonusPerPerson),
    0,
  );

  // Owner amount and Bağ-Kur are ordinary monthly operating costs (DF-59).
  const baseOwnerCost = input.owner.monthlyAmount + input.owner.bagKurMonthlyCost;

  const rent = resolveRentCost({
    monthlyRent: input.occupancy.monthlyRent,
    rentInputBasis: input.occupancy.rentInputBasis,
    rentWithholdingRate: input.rentWithholdingRate,
  });

  // `rentCost`, not `rentPaidToLandlord`, is the business's cash cost.
  const baseOccupancyCost = rent.rentCost + input.occupancy.monthlyAidat;

  const baseOpex = input.opexLines.reduce((total, line) => total + line.monthlyAmount, 0);

  const monthlyPayroll = basePayroll * fixedFactor;
  const monthlyOwnerCost = baseOwnerCost * fixedFactor;
  const monthlyOccupancyCost = baseOccupancyCost * fixedFactor;
  const monthlyOpex = baseOpex * fixedFactor;

  return {
    monthlyPayroll,
    monthlyOwnerCost,
    monthlyOccupancyCost,
    monthlyOpex,
    rentCost: rent.rentCost * fixedFactor,
    rentPaidToLandlord: rent.rentPaidToLandlord * fixedFactor,
    rentWithholdingTax: rent.rentWithholdingTax * fixedFactor,
    monthlyFixedCost:
      monthlyPayroll + monthlyOwnerCost + monthlyOccupancyCost + monthlyOpex,
  };
}

/**
 * Spec §11 — opening stock included (DF-33). Takes no escalation factor, so CAPEX
 * cannot escalate (DF-43).
 */
export function calculateTotalInitialInvestment(input: DetailedResolvedInput): number {
  return input.capexItems.reduce((total, item) => total + item.amount, 0);
}
