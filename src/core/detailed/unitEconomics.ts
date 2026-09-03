/**
 * Per-unit, volume-free economics — docs/DETAILED_FINANCIAL_SPEC.md §7.2, §7.3, §9.
 *
 * Nothing in this module may involve quantity: it must never read
 * `product.dailyQuantity`, never apply `channelMix`, never touch
 * `operatingDaysPerMonth`, and never produce a monthly total. Quantity enters
 * exactly once, in `calculate.ts` (spec §12.1).
 *
 * `product` is carried on each entry only so the monthly aggregation can iterate a
 * single array.
 */

import type {
  Channel,
  DetailedResolvedInput,
  ProductUnitEconomics,
  UnitEconomics,
  UnitEconomicsLine,
} from './types.ts';

export function buildUnitEconomics(
  input: DetailedResolvedInput,
  priceFactor: number,
  cogsFactor: number,
): UnitEconomics {
  // Cash carries no processing commission (DF-07), so it contributes nothing here.
  const directFeeRate =
    input.paymentMix.card * input.posCommissionRate +
    input.paymentMix.mealCard * input.mealCardCommissionRate;

  const vatDivisor = 1 + input.assumptions.vatRate;

  // Channel variable costs escalate with the Product COGS rate (DF-83) while
  // remaining a separate cost line from Product COGS (DF-68).
  // Own-courier payment is already 0 under Mode 2 — validation zeroed it (DF-81).
  const unitTakeawayVariable = input.packaging.takeawayPerOrder * cogsFactor;
  const unitDeliveryVariable =
    (input.packaging.deliveryPerOrder + input.delivery.ownCourierCostPerDeliveryOrder) *
    cogsFactor;

  const products: ProductUnitEconomics[] = input.products.map((product) => {
    const normalGrossPerUnit = product.normalPrice * priceFactor;
    const onlineGrossPerUnit = product.onlinePrice * priceFactor;
    const unitProductCost = product.unitProductCost * cogsFactor;

    const line = (
      grossPerUnit: number,
      unitChannelVariableCost: number,
      feeRate: number,
    ): UnitEconomicsLine => {
      const netPerUnit = grossPerUnit / vatDivisor;
      // The fee base is VAT-inclusive gross, never `netPerUnit` (DF-65, spec §9.3).
      const unitPaymentPlatformFee = grossPerUnit * feeRate;
      return {
        grossPerUnit,
        netPerUnit,
        unitProductCost,
        unitChannelVariableCost,
        unitPaymentPlatformFee,
        unitContribution:
          netPerUnit - unitProductCost - unitChannelVariableCost - unitPaymentPlatformFee,
      };
    };

    const byChannel: Record<Channel, UnitEconomicsLine> = {
      // Salon and takeaway both sell at the normal price (DF-46) and are direct
      // store sales, so they carry the payment-mix fee.
      salon: line(normalGrossPerUnit, 0, directFeeRate),
      takeaway: line(normalGrossPerUnit, unitTakeawayVariable, directFeeRate),
      // Delivery sells at the online price and carries the platform deduction
      // and nothing else — no POS, no meal-card fee (DF-49).
      delivery: line(onlineGrossPerUnit, unitDeliveryVariable, input.delivery.platformFeeRate),
    };

    return { product, byChannel };
  });

  return { directFeeRate, products };
}
