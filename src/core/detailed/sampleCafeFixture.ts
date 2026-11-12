/**
 * Realistic small-cafe raw input matching `features/detailed/formState.ts`
 * `sampleCafeForm()`, for Appendix B tests. Not a golden vector. Not exported
 * from `index.ts`. Core cannot import the feature form.
 */

import type { DetailedInput } from './types.ts';

export function sampleCafeRawInput(): DetailedInput {
  return {
    products: [
      {
        id: 'americano',
        name: 'Amerikano',
        normalPrice: 120,
        onlinePrice: 150,
        dailyQuantity: 80,
        unitProductCost: 25,
      },
      {
        id: 'pogaca',
        name: 'Poğaça',
        normalPrice: 45,
        onlinePrice: 55,
        dailyQuantity: 60,
        unitProductCost: 12,
      },
      {
        id: 'coldbrew',
        name: 'Cold Brew',
        normalPrice: 140,
        onlinePrice: 170,
        dailyQuantity: 30,
        unitProductCost: 35,
      },
    ],
    packaging: { takeawayPerOrder: 5, deliveryPerOrder: 8 },
    delivery: { mode: 'platformOnly' },
    positions: [
      {
        id: 'barista',
        name: 'Barista',
        headcount: 2,
        employerCostPerPerson: 28_000,
        mealCostPerPerson: 2_500,
        transportCostPerPerson: 1_500,
        averageBonusPerPerson: 1_000,
      },
    ],
    owner: { monthlyAmount: 25_000, bagKurMonthlyCost: 6_000 },
    occupancy: { monthlyRent: 65_000, rentInputBasis: 'gross', monthlyAidat: 3_000 },
    opexLines: [
      { id: 'electricity', name: 'Elektrik', monthlyAmount: 6_000 },
      { id: 'water', name: 'Su', monthlyAmount: 1_200 },
    ],
    capexItems: [
      { id: 'fitout', name: 'Tadilat', amount: 350_000 },
      { id: 'equipment', name: 'Ekipman', amount: 180_000 },
    ],
  };
}
