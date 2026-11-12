/**
 * Salon food-cost rate and remaining per unit — spec Appendix B.1.
 *
 * Display helpers. They do not change `calculateDetailed`. Packaging is not in
 * the ratio. The remaining figure is §9.4 for the salon channel only.
 */

import type { DetailedResolvedInput } from './types.ts';
import { buildUnitEconomics } from './unitEconomics.ts';

export type SalonMenuProduct = {
  productId: string;
  name: string;
  sellingPrice: number;
  unitProductCost: number;
  foodCostRate: number | null;
  remainingPerUnit: number;
};

export type SalonMenuEconomics = {
  products: SalonMenuProduct[];
  weakestProductId: string | null;
};

export function salonFoodCostRate(
  unitProductCost: number,
  salonNetPerUnit: number,
): number | null {
  if (!(salonNetPerUnit > 0) || !Number.isFinite(salonNetPerUnit) || !Number.isFinite(unitProductCost)) {
    return null;
  }
  const rate = unitProductCost / salonNetPerUnit;
  return Number.isFinite(rate) ? rate : null;
}

export function buildSalonMenuEconomics(input: DetailedResolvedInput): SalonMenuEconomics {
  const economics = buildUnitEconomics(input, 1, 1);
  const products: SalonMenuProduct[] = economics.products.map(({ product, byChannel }) => {
    const salon = byChannel.salon;
    return {
      productId: product.id,
      name: product.name,
      sellingPrice: salon.grossPerUnit,
      unitProductCost: salon.unitProductCost,
      foodCostRate: salonFoodCostRate(salon.unitProductCost, salon.netPerUnit),
      remainingPerUnit: salon.unitContribution,
    };
  });

  let weakestProductId: string | null = null;
  if (products.length > 1) {
    let weakest = products[0]!;
    for (const row of products.slice(1)) {
      if (row.remainingPerUnit < weakest.remainingPerUnit) weakest = row;
    }
    weakestProductId = weakest.productId;
  }

  return { products, weakestProductId };
}
