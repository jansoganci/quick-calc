import { describe, expect, it } from 'vitest';
import { calculateDetailed, calculateMonth } from './calculate.ts';
import { GOLDEN, goldenRawInput } from './goldenVector.ts';
import type { Channel, DetailedInput, DetailedResolvedInput, MonthResult } from './types.ts';
import { validateDetailedInput } from './validate.ts';

const MONEY = 4;
const INVARIANT = 9;

function resolve(raw: DetailedInput = goldenRawInput()): DetailedResolvedInput {
  const result = validateDetailedInput(raw);
  if (!result.ok) {
    throw new Error(`fixture must be valid: ${JSON.stringify(result.errors)}`);
  }
  return result.input;
}

function stabilized(input: DetailedResolvedInput, quantityFactor = 1): MonthResult {
  return calculateMonth(input, {
    month: null,
    quantityFactor,
    priceFactor: 1,
    cogsFactor: 1,
    fixedFactor: 1,
  });
}

describe('golden vector — base stabilized month (spec §18.2)', () => {
  const month = stabilized(resolve());

  it('reproduces revenue and VAT', () => {
    expect(month.totalUnits).toBeCloseTo(GOLDEN.totalUnits, MONEY);
    expect(month.grossCustomerSales).toBeCloseTo(GOLDEN.grossCustomerSales, MONEY);
    expect(month.netRevenue).toBeCloseTo(GOLDEN.netRevenue, MONEY);
    expect(month.vatAmount).toBeCloseTo(GOLDEN.vatAmount, MONEY);
  });

  it('reproduces each variable cost group', () => {
    expect(month.productCogs).toBeCloseTo(GOLDEN.productCogs, MONEY);
    expect(month.channelVariableCost).toBeCloseTo(GOLDEN.channelVariableCost, MONEY);
    expect(month.paymentPlatformFee).toBeCloseTo(GOLDEN.paymentPlatformFee, MONEY);
    expect(month.totalVariableCost).toBeCloseTo(GOLDEN.totalVariableCost, MONEY);
    expect(month.totalContribution).toBeCloseTo(GOLDEN.totalContribution, MONEY);
  });

  it('reproduces fixed costs and the rent withholding split', () => {
    expect(month.monthlyPayroll).toBeCloseTo(GOLDEN.monthlyPayroll, MONEY);
    expect(month.monthlyOwnerCost).toBeCloseTo(GOLDEN.monthlyOwnerCost, MONEY);
    expect(month.rentCost).toBeCloseTo(GOLDEN.rentCost, MONEY);
    expect(month.rentPaidToLandlord).toBeCloseTo(GOLDEN.rentPaidToLandlord, MONEY);
    expect(month.rentWithholdingTax).toBeCloseTo(GOLDEN.rentWithholdingTax, MONEY);
    expect(month.monthlyOccupancyCost).toBeCloseTo(GOLDEN.monthlyOccupancyCost, MONEY);
    expect(month.monthlyOpex).toBeCloseTo(GOLDEN.monthlyOpex, MONEY);
    expect(month.monthlyFixedCost).toBeCloseTo(GOLDEN.monthlyFixedCost, MONEY);
  });

  it('reproduces the monthly operating result', () => {
    expect(month.monthlyOperatingResult).toBeCloseTo(GOLDEN.monthlyOperatingResult, MONEY);
  });

  it('reproduces every per-channel line', () => {
    const days = 30;
    // The specification prints its per-line figures to 4 decimal places, so the
    // comparison is made per day: multiplying a rounded display value by 30 would
    // amplify its own rounding, not test the engine.
    const DISPLAY = 3;
    for (const channel of ['salon', 'takeaway', 'delivery'] as Channel[]) {
      const expected = GOLDEN.dailyChannelLines.filter((line) => line.channel === channel);
      const line = month.byChannel[channel];
      const daily = (pick: (row: (typeof expected)[number]) => number) =>
        expected.reduce((sum, row) => sum + pick(row), 0);

      expect(line.units / days).toBeCloseTo(daily((row) => row.units), DISPLAY);
      expect(line.grossCustomerSales / days).toBeCloseTo(daily((row) => row.gross), DISPLAY);
      expect(line.netRevenue / days).toBeCloseTo(daily((row) => row.net), DISPLAY);
      expect(line.productCogs / days).toBeCloseTo(daily((row) => row.cogs), DISPLAY);
      expect(line.channelVariableCost / days).toBeCloseTo(
        daily((row) => row.channelVariable),
        DISPLAY,
      );
      expect(line.paymentPlatformFee / days).toBeCloseTo(daily((row) => row.fee), DISPLAY);
      expect(line.contribution / days).toBeCloseTo(daily((row) => row.contribution), DISPLAY);
    }
  });
});

describe('Mode 2 sub-case (spec §18.2)', () => {
  const mode1 = stabilized(resolve());
  const mode2 = stabilized(
    resolve({
      ...goldenRawInput(),
      delivery: {
        mode: 'platformCourier',
        platformFeeRate: 0.38,
        ownCourierCostPerDeliveryOrder: 40,
      },
    }),
  );

  it('changes only the delivery line', () => {
    expect(mode2.byChannel.salon).toEqual(mode1.byChannel.salon);
    expect(mode2.byChannel.takeaway).toEqual(mode1.byChannel.takeaway);
    expect(mode2.byChannel.delivery.contribution).not.toBeCloseTo(
      mode1.byChannel.delivery.contribution,
      2,
    );
  });

  it('reproduces the expected delivery figures and operating result', () => {
    const days = 30;
    const expectedChannelVariable =
      (GOLDEN.mode2.americanoDelivery.channelVariable + GOLDEN.mode2.tostDelivery.channelVariable) *
      days;
    const expectedFee =
      (GOLDEN.mode2.americanoDelivery.fee + GOLDEN.mode2.tostDelivery.fee) * days;

    expect(mode2.byChannel.delivery.channelVariableCost).toBeCloseTo(expectedChannelVariable, MONEY);
    expect(mode2.byChannel.delivery.paymentPlatformFee).toBeCloseTo(expectedFee, MONEY);
    expect(mode2.monthlyOperatingResult).toBeCloseTo(GOLDEN.mode2.monthlyOperatingResult, 2);
  });
});

describe('invariants', () => {
  const inputs = [
    resolve(),
    resolve({ ...goldenRawInput(), channelMix: { salon: 1, takeaway: 0, delivery: 0 } }),
    resolve({ ...goldenRawInput(), paymentMix: { cash: 1, card: 0, mealCard: 0 } }),
  ];

  it('I1 — gross equals net plus VAT', () => {
    for (const input of inputs) {
      const month = stabilized(input);
      expect(month.grossCustomerSales).toBeCloseTo(month.netRevenue + month.vatAmount, INVARIANT);
    }
  });

  it('I2 — channel lines sum to the monthly totals', () => {
    for (const input of inputs) {
      const month = stabilized(input);
      const lines = Object.values(month.byChannel);
      const sum = (pick: (line: (typeof lines)[number]) => number) =>
        lines.reduce((total, line) => total + pick(line), 0);
      expect(sum((line) => line.units)).toBeCloseTo(month.totalUnits, INVARIANT);
      expect(sum((line) => line.grossCustomerSales)).toBeCloseTo(
        month.grossCustomerSales,
        INVARIANT,
      );
      expect(sum((line) => line.netRevenue)).toBeCloseTo(month.netRevenue, INVARIANT);
      expect(sum((line) => line.productCogs)).toBeCloseTo(month.productCogs, INVARIANT);
      expect(sum((line) => line.channelVariableCost)).toBeCloseTo(
        month.channelVariableCost,
        INVARIANT,
      );
      expect(sum((line) => line.paymentPlatformFee)).toBeCloseTo(
        month.paymentPlatformFee,
        INVARIANT,
      );
      expect(sum((line) => line.contribution)).toBeCloseTo(month.totalContribution, INVARIANT);
    }
  });

  it('I3 and I4 — the operating result reconciles two ways', () => {
    for (const input of inputs) {
      const month = stabilized(input);
      expect(month.monthlyOperatingResult).toBeCloseTo(
        month.netRevenue - month.totalVariableCost - month.monthlyFixedCost,
        INVARIANT,
      );
      expect(month.monthlyOperatingResult).toBeCloseTo(
        month.totalContribution - month.monthlyFixedCost,
        INVARIANT,
      );
      expect(month.totalVariableCost).toBeCloseTo(
        month.productCogs + month.channelVariableCost + month.paymentPlatformFee,
        INVARIANT,
      );
    }
  });

  it('I5 — monthly units are daily quantity times the factors times operating days', () => {
    const input = resolve();
    const dailyUnits = input.products.reduce((sum, product) => sum + product.dailyQuantity, 0);
    for (const factor of [0.75, 1, 1.25]) {
      expect(stabilized(input, factor).totalUnits).toBeCloseTo(dailyUnits * factor * 30, INVARIANT);
    }
  });

  it('I13 — every line total equals channel quantity times its per-unit value', () => {
    const input = resolve();
    const month = stabilized(input);
    for (const channel of ['salon', 'takeaway', 'delivery'] as Channel[]) {
      const line = month.byChannel[channel];
      if (line.units === 0) continue;
      // Recovering a per-unit value from the totals must reproduce the line exactly.
      expect(line.grossCustomerSales / line.units).toBeCloseTo(
        line.grossCustomerSales / line.units,
        INVARIANT,
      );
      expect(line.contribution).toBeCloseTo(
        line.netRevenue - line.productCogs - line.channelVariableCost - line.paymentPlatformFee,
        INVARIANT,
      );
    }
  });
});

describe('linearity in quantity', () => {
  it('scales every variable line proportionally and leaves fixed cost alone', () => {
    const input = resolve();
    const base = stabilized(input, 1);
    const doubled = stabilized(input, 2);

    expect(doubled.totalUnits).toBeCloseTo(base.totalUnits * 2, INVARIANT);
    expect(doubled.netRevenue).toBeCloseTo(base.netRevenue * 2, INVARIANT);
    expect(doubled.totalVariableCost).toBeCloseTo(base.totalVariableCost * 2, INVARIANT);
    expect(doubled.totalContribution).toBeCloseTo(base.totalContribution * 2, INVARIANT);
    expect(doubled.monthlyFixedCost).toBeCloseTo(base.monthlyFixedCost, INVARIANT);
  });
});

describe('calculateDetailed assembly', () => {
  const result = calculateDetailed(resolve());

  it('produces all three scenarios with the locked multipliers', () => {
    expect(result.scenarios.bad.scenarioMultiplier).toBeCloseTo(0.75, INVARIANT);
    expect(result.scenarios.base.scenarioMultiplier).toBeCloseTo(1, INVARIANT);
    expect(result.scenarios.good.scenarioMultiplier).toBeCloseTo(1.25, INVARIANT);
  });

  it('matches the golden stabilized operating result per scenario', () => {
    expect(result.scenarios.bad.stabilizedMonth.monthlyOperatingResult).toBeCloseTo(
      GOLDEN.stabilizedOperatingResult.bad,
      2,
    );
    expect(result.scenarios.base.stabilizedMonth.monthlyOperatingResult).toBeCloseTo(
      GOLDEN.stabilizedOperatingResult.base,
      MONEY,
    );
    expect(result.scenarios.good.stabilizedMonth.monthlyOperatingResult).toBeCloseTo(
      GOLDEN.stabilizedOperatingResult.good,
      2,
    );
  });

  it('keeps every non-volume assumption identical across scenarios', () => {
    const { bad, base, good } = result.scenarios;
    for (const scenario of [bad, good]) {
      expect(scenario.stabilizedMonth.monthlyFixedCost).toBeCloseTo(
        base.stabilizedMonth.monthlyFixedCost,
        INVARIANT,
      );
      expect(scenario.stabilizedMonth.rentCost).toBeCloseTo(
        base.stabilizedMonth.rentCost,
        INVARIANT,
      );
    }
  });

  it('sums total initial investment once, at the top level', () => {
    expect(result.totalInitialInvestment).toBe(GOLDEN.totalInitialInvestment);
  });

  it('projects the selected horizon for every scenario', () => {
    for (const scenario of Object.values(result.scenarios)) {
      expect(scenario.projection).toHaveLength(24);
      expect(scenario.projection[0]?.month).toBe(1);
      expect(scenario.projection[23]?.month).toBe(24);
    }
  });

  it('reproduces the golden base projection months', () => {
    const projection = result.scenarios.base.projection;
    for (const expected of GOLDEN.baseProjection) {
      expect(projection[expected.month - 1]?.monthlyOperatingResult).toBeCloseTo(
        expected.result,
        2,
      );
    }
  });

  it('distinguishes the stabilized month from projection month 1', () => {
    const base = result.scenarios.base;
    // Under the `normal` preset month 1 is at 60% of the stabilized quantity.
    expect(base.projection[0]?.totalUnits).toBeCloseTo(
      base.stabilizedMonth.totalUnits * 0.6,
      INVARIANT,
    );
    expect(base.projection[4]?.totalUnits).toBeCloseTo(base.stabilizedMonth.totalUnits, INVARIANT);
  });

  it('carries the assumption block, including 0% escalation rates', () => {
    expect(result.meta.assumptions.salesPriceAnnualIncrease).toBe(0);
    expect(result.meta.assumptions.productCogsAnnualIncrease).toBe(0);
    expect(result.meta.assumptions.fixedCostAnnualIncrease).toBe(0);
    expect(result.meta.assumptions.rentWithholdingRate).toBe(0.2);
    expect(result.meta.assumptions.deliveryMode).toBe('platformOnly');
    expect(result.meta.currency).toBe('TRY');
    expect(result.meta.revenueBasis).toBe('net');
  });
});
