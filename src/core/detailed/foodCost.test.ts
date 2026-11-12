import { describe, expect, it } from 'vitest';
import { calculateDetailed } from './calculate.ts';
import { salonFoodCostRate, buildSalonMenuEconomics } from './foodCost.ts';
import { sampleCafeRawInput } from './sampleCafeFixture.ts';
import type { DetailedInput, DetailedResolvedInput } from './types.ts';
import { validateDetailedInput } from './validate.ts';

function resolve(raw: DetailedInput = sampleCafeRawInput()): DetailedResolvedInput {
  const result = validateDetailedInput(raw);
  if (!result.ok) {
    throw new Error(`fixture must be valid: ${JSON.stringify(result.errors)}`);
  }
  return result.input;
}

describe('salonFoodCostRate (Appendix B.1)', () => {
  it('is cost over salon net-of-KDV price', () => {
    // 25 / (120 / 1.10) = 0.229166…
    expect(salonFoodCostRate(25, 120 / 1.1)).toBeCloseTo(25 / (120 / 1.1), 10);
  });

  it('excludes packaging by construction — only unit product cost enters', () => {
    expect(salonFoodCostRate(12, 45 / 1.1)).toBeCloseTo(12 / (45 / 1.1), 10);
  });

  it('is unavailable when salon net is not positive', () => {
    expect(salonFoodCostRate(25, 0)).toBeNull();
    expect(salonFoodCostRate(25, -10)).toBeNull();
  });
});

describe('buildSalonMenuEconomics on the sample cafe', () => {
  const menu = buildSalonMenuEconomics(resolve());
  const byName = Object.fromEntries(menu.products.map((row) => [row.name, row]));

  it('uses the entered salon price and product cost', () => {
    expect(byName['Amerikano']?.sellingPrice).toBe(120);
    expect(byName['Amerikano']?.unitProductCost).toBe(25);
    expect(byName['Poğaça']?.sellingPrice).toBe(45);
    expect(byName['Cold Brew']?.sellingPrice).toBe(140);
  });

  it('matches the hand-worked food-cost rates', () => {
    expect(byName['Amerikano']?.foodCostRate).toBeCloseTo(25 / (120 / 1.1), 8);
    expect(byName['Poğaça']?.foodCostRate).toBeCloseTo(12 / (45 / 1.1), 8);
    expect(byName['Cold Brew']?.foodCostRate).toBeCloseTo(35 / (140 / 1.1), 8);
  });

  it('sets remaining per unit to salon §9.4 contribution', () => {
    const feeRate = 0.45 * 0.0359 + 0.15 * 0.1;
    const remaining = (price: number, cost: number) => price / 1.1 - cost - price * feeRate;
    expect(byName['Amerikano']?.remainingPerUnit).toBeCloseTo(remaining(120, 25), 6);
    expect(byName['Poğaça']?.remainingPerUnit).toBeCloseTo(remaining(45, 12), 6);
    expect(byName['Cold Brew']?.remainingPerUnit).toBeCloseTo(remaining(140, 35), 6);
  });

  it('names Poğaça the weakest — lowest salon remaining', () => {
    expect(menu.weakestProductId).toBe('pogaca');
    const pogaca = byName['Poğaça']?.remainingPerUnit ?? 0;
    const americano = byName['Amerikano']?.remainingPerUnit ?? 0;
    const cold = byName['Cold Brew']?.remainingPerUnit ?? 0;
    expect(pogaca).toBeLessThan(americano);
    expect(pogaca).toBeLessThan(cold);
  });

  it('does not pick a weakest product on a one-row menu', () => {
    const one = buildSalonMenuEconomics(
      resolve({
        ...sampleCafeRawInput(),
        products: [
          {
            id: 'americano',
            name: 'Amerikano',
            normalPrice: 120,
            onlinePrice: 150,
            dailyQuantity: 80,
            unitProductCost: 25,
          },
        ],
      }),
    );
    expect(one.products).toHaveLength(1);
    expect(one.weakestProductId).toBeNull();
  });

  it('does not change calculateDetailed', () => {
    const before = calculateDetailed(resolve());
    buildSalonMenuEconomics(resolve());
    const after = calculateDetailed(resolve());
    expect(after).toEqual(before);
  });
});
