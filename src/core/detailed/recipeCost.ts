/**
 * Optional recipe total for one product's entered `unitProductCost`.
 *
 * Authority: docs/DETAILED_FINANCIAL_SPEC.md Appendix A.
 * `calculate.ts` does not call this. The monthly engine still receives one
 * `unitProductCost` and never sees a recipe. Raw values only — no rounding.
 */

export const PURCHASE_UNITS = ['kg', 'g', 'L', 'ml', 'adet'] as const;

export type PurchaseUnit = (typeof PURCHASE_UNITS)[number];

/** The unit a recipe line's usage quantity is typed in. */
export type UsageUnit = 'g' | 'ml' | 'adet';

/** `null` is a blank field. `'invalid'` is a present value that is not a finite number. */
export type RecipeAmount = number | null | 'invalid';

export type RecipeIngredientCostInput = {
  id: string;
  purchaseQuantity: RecipeAmount;
  purchaseUnit: string;
  purchasePrice: RecipeAmount;
};

export type RecipeLineCostInput = {
  ingredientId: string;
  usageQuantity: RecipeAmount;
};

export type RecipeCostErrorCode =
  | 'empty_recipe'
  | 'ingredient_not_found'
  | 'invalid_unit'
  | 'not_a_number'
  | 'purchase_quantity_empty'
  | 'purchase_quantity_zero'
  | 'purchase_price_empty'
  | 'usage_quantity_empty';

export type RecipeCostField =
  | 'ingredient'
  | 'purchaseQuantity'
  | 'purchaseUnit'
  | 'purchasePrice'
  | 'usageQuantity';

export type RecipeCostError = {
  /** Index into `lines`. `-1` is the whole recipe (`empty_recipe` only). */
  lineIndex: number;
  field: RecipeCostField;
  code: RecipeCostErrorCode;
};

export type RecipeCostResult =
  | { ok: true; unitProductCost: number }
  | { ok: false; errors: RecipeCostError[] };

const FACTOR: Record<PurchaseUnit, number> = {
  kg: 1000,
  g: 1,
  L: 1000,
  ml: 1,
  adet: 1,
};

export function isPurchaseUnit(value: string): value is PurchaseUnit {
  return (PURCHASE_UNITS as readonly string[]).includes(value);
}

/** kg/g → g, L/ml → ml, adet → adet. Families never cross. */
export function usageUnitFor(unit: PurchaseUnit): UsageUnit {
  if (unit === 'kg' || unit === 'g') return 'g';
  if (unit === 'L' || unit === 'ml') return 'ml';
  return 'adet';
}

export function purchaseFactor(unit: PurchaseUnit): number {
  return FACTOR[unit];
}

/**
 * Appendix A `unitPrice`. `null` when the denominator is zero or the inputs
 * are not finite. Presentation of `gramı` / `tanesi` / `ml’si` lives in the
 * feature layer.
 */
export function unitPriceFromPurchase(
  purchaseQuantity: number,
  purchaseUnit: PurchaseUnit,
  purchasePrice: number,
): number | null {
  const denominator = purchaseQuantity * FACTOR[purchaseUnit];
  if (denominator === 0 || !Number.isFinite(denominator) || !Number.isFinite(purchasePrice)) {
    return null;
  }
  const value = purchasePrice / denominator;
  return Number.isFinite(value) ? value : null;
}

/**
 * Spec §9.4: contribution moves only with `unitProductCost`, so the change in
 * what's left per unit is −Δcost on every channel. Display helper, not a
 * `calculateDetailed` input.
 */
export function remainingPerUnitDelta(deltaCost: number): number {
  return -deltaCost;
}

/**
 * Appendix A.6. Salon selling price that restores the previous remainder after
 * a recipe-cost change. Raw; no rounding. Not called by `calculateDetailed`.
 */
export function salonRestorePrice(normalPrice: number, deltaCost: number, vatRate: number): number {
  return normalPrice + deltaCost * (1 + vatRate);
}

function push(
  errors: RecipeCostError[],
  lineIndex: number,
  field: RecipeCostField,
  code: RecipeCostErrorCode,
): void {
  const already = errors.some((error) => error.lineIndex === lineIndex && error.field === field);
  if (!already) errors.push({ lineIndex, field, code });
}

/**
 * A finite number, or why it cannot be used.
 * Blank and "not a number" stay distinct: a 0 the owner typed is not a blank.
 */
function readAmount(
  value: RecipeAmount,
): { ok: true; value: number } | { ok: false; code: 'purchase_quantity_empty' | 'not_a_number' } {
  if (value === null) return { ok: false, code: 'purchase_quantity_empty' };
  if (value === 'invalid' || typeof value !== 'number' || !Number.isFinite(value)) {
    return { ok: false, code: 'not_a_number' };
  }
  return { ok: true, value };
}

export function recipeCost(
  ingredients: readonly RecipeIngredientCostInput[],
  lines: readonly RecipeLineCostInput[],
): RecipeCostResult {
  if (lines.length === 0) {
    return {
      ok: false,
      errors: [{ lineIndex: -1, field: 'ingredient', code: 'empty_recipe' }],
    };
  }

  const byId = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const errors: RecipeCostError[] = [];
  let sum = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) continue;

    const usage = readAmount(line.usageQuantity);
    if (!usage.ok) {
      push(
        errors,
        index,
        'usageQuantity',
        usage.code === 'purchase_quantity_empty' ? 'usage_quantity_empty' : 'not_a_number',
      );
    }

    const ingredient = line.ingredientId === '' ? undefined : byId.get(line.ingredientId);
    if (ingredient === undefined) {
      push(errors, index, 'ingredient', 'ingredient_not_found');
      continue;
    }

    if (!isPurchaseUnit(ingredient.purchaseUnit)) {
      push(errors, index, 'purchaseUnit', 'invalid_unit');
      continue;
    }

    const quantity = readAmount(ingredient.purchaseQuantity);
    if (!quantity.ok) {
      push(
        errors,
        index,
        'purchaseQuantity',
        quantity.code === 'purchase_quantity_empty' ? 'purchase_quantity_empty' : 'not_a_number',
      );
    } else if (quantity.value <= 0) {
      push(errors, index, 'purchaseQuantity', 'purchase_quantity_zero');
    }

    const price = readAmount(ingredient.purchasePrice);
    if (!price.ok) {
      push(
        errors,
        index,
        'purchasePrice',
        price.code === 'purchase_quantity_empty' ? 'purchase_price_empty' : 'not_a_number',
      );
    }

    if (errors.some((error) => error.lineIndex === index)) continue;

    if (!usage.ok || !quantity.ok || !price.ok) continue;
    const factor = FACTOR[ingredient.purchaseUnit];
    const denominator = quantity.value * factor;
    if (denominator === 0) {
      push(errors, index, 'purchaseQuantity', 'purchase_quantity_zero');
      continue;
    }
    sum += (price.value / denominator) * usage.value;
  }

  if (errors.length > 0) return { ok: false, errors };
  if (!Number.isFinite(sum)) {
    return {
      ok: false,
      errors: [{ lineIndex: 0, field: 'purchasePrice', code: 'not_a_number' }],
    };
  }
  return { ok: true, unitProductCost: sum };
}
