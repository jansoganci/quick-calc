import { describe, expect, it } from 'vitest';
import {
  recipeCost,
  usageUnitFor,
  type RecipeIngredientCostInput,
  type RecipeLineCostInput,
} from './recipeCost.ts';

function ingredient(
  overrides: Partial<RecipeIngredientCostInput> = {},
): RecipeIngredientCostInput {
  return {
    id: 'flour',
    purchaseQuantity: 5,
    purchaseUnit: 'kg',
    purchasePrice: 450,
    ...overrides,
  };
}

function line(overrides: Partial<RecipeLineCostInput> = {}): RecipeLineCostInput {
  return { ingredientId: 'flour', usageQuantity: 180, ...overrides };
}

function cost(
  ingredients: readonly RecipeIngredientCostInput[],
  lines: readonly RecipeLineCostInput[],
): number {
  const result = recipeCost(ingredients, lines);
  if (!result.ok) throw new Error(JSON.stringify(result.errors));
  return result.unitProductCost;
}

describe('recipe cost (spec Appendix A)', () => {
  it('prices 5 kg at 450 TL and 180 g as 16.2', () => {
    expect(cost([ingredient()], [line()])).toBeCloseTo(16.2, 10);
    expect(cost([ingredient()], [line()])).toBeCloseTo((450 / (5 * 1000)) * 180, 10);
  });

  it('treats kg and g as one family, and L and ml as another', () => {
    expect(usageUnitFor('kg')).toBe('g');
    expect(usageUnitFor('g')).toBe('g');
    expect(usageUnitFor('L')).toBe('ml');
    expect(usageUnitFor('ml')).toBe('ml');
    expect(usageUnitFor('adet')).toBe('adet');

    const perHundredGrams = (100 / 1000) * 100;
    expect(cost([ingredient({ purchaseQuantity: 1, purchaseUnit: 'kg', purchasePrice: 100 })], [line({ usageQuantity: 100 })])).toBeCloseTo(
      perHundredGrams,
      10,
    );
    expect(cost([ingredient({ purchaseQuantity: 1000, purchaseUnit: 'g', purchasePrice: 100 })], [line({ usageQuantity: 100 })])).toBeCloseTo(
      perHundredGrams,
      10,
    );

    const perHundredMl = (40 / 1000) * 100;
    expect(cost([ingredient({ id: 'milk', purchaseQuantity: 1, purchaseUnit: 'L', purchasePrice: 40 })], [line({ ingredientId: 'milk', usageQuantity: 100 })])).toBeCloseTo(
      perHundredMl,
      10,
    );
    expect(cost([ingredient({ id: 'milk', purchaseQuantity: 1000, purchaseUnit: 'ml', purchasePrice: 40 })], [line({ ingredientId: 'milk', usageQuantity: 100 })])).toBeCloseTo(
      perHundredMl,
      10,
    );

    expect(cost([ingredient({ id: 'egg', purchaseQuantity: 10, purchaseUnit: 'adet', purchasePrice: 30 })], [line({ ingredientId: 'egg', usageQuantity: 2 })])).toBeCloseTo(
      6,
      10,
    );
  });

  it('sums every line and reuses one ingredient price', () => {
    const total = cost(
      [
        ingredient(),
        ingredient({ id: 'milk', purchaseQuantity: 1, purchaseUnit: 'L', purchasePrice: 40 }),
      ],
      [line(), line({ ingredientId: 'milk', usageQuantity: 200 })],
    );
    expect(total).toBeCloseTo(16.2 + 8, 10);

    expect(cost([ingredient()], [line({ usageQuantity: 180 }), line({ usageQuantity: 20 })])).toBeCloseTo(
      18,
      10,
    );
  });

  it('accepts a zero price and a zero usage, and returns no partial sum', () => {
    expect(cost([ingredient({ purchasePrice: 0 })], [line()])).toBe(0);
    expect(cost([ingredient()], [line({ usageQuantity: 0 })])).toBe(0);

    const result = recipeCost(
      [ingredient(), ingredient({ id: 'milk', purchaseQuantity: 0, purchaseUnit: 'L', purchasePrice: 40 })],
      [line(), line({ ingredientId: 'milk', usageQuantity: 200 })],
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        { lineIndex: 1, field: 'purchaseQuantity', code: 'purchase_quantity_zero' },
      ]);
    }
  });
});

describe('recipe cost failures (spec §A.4)', () => {
  it('rejects an empty recipe', () => {
    expect(recipeCost([ingredient()], [])).toEqual({
      ok: false,
      errors: [{ lineIndex: -1, field: 'ingredient', code: 'empty_recipe' }],
    });
  });

  it('rejects a blank, zero or negative purchase quantity without dividing', () => {
    expect(recipeCost([ingredient({ purchaseQuantity: null })], [line()]).ok).toBe(false);
    const blank = recipeCost([ingredient({ purchaseQuantity: null })], [line()]);
    if (!blank.ok) expect(blank.errors[0]).toMatchObject({ code: 'purchase_quantity_empty' });

    for (const purchaseQuantity of [0, -2]) {
      const result = recipeCost([ingredient({ purchaseQuantity })], [line()]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toContainEqual({
          lineIndex: 0,
          field: 'purchaseQuantity',
          code: 'purchase_quantity_zero',
        });
        expect(JSON.stringify(result)).not.toContain('Infinity');
        expect(JSON.stringify(result)).not.toContain('NaN');
      }
    }
  });

  it('rejects a missing ingredient and a value that is not a number', () => {
    const missing = recipeCost([ingredient()], [line({ ingredientId: 'gone' })]);
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.errors).toContainEqual({
        lineIndex: 0,
        field: 'ingredient',
        code: 'ingredient_not_found',
      });
    }

    const broken = recipeCost(
      [ingredient({ purchasePrice: 'invalid', purchaseQuantity: 'invalid' })],
      [line({ usageQuantity: 'invalid' })],
    );
    expect(broken.ok).toBe(false);
    if (!broken.ok) {
      expect(broken.errors.map((error) => error.code)).toEqual([
        'not_a_number',
        'not_a_number',
        'not_a_number',
      ]);
      expect(JSON.stringify(broken)).not.toMatch(/NaN|Infinity/);
    }
  });

  it('rejects a unit outside the five purchase units', () => {
    const result = recipeCost([ingredient({ purchaseUnit: 'lb' })], [line()]);
    expect(result).toEqual({
      ok: false,
      errors: [{ lineIndex: 0, field: 'purchaseUnit', code: 'invalid_unit' }],
    });
  });
});
