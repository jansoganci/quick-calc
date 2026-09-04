import { describe, expect, it } from 'vitest';
import { calculateQuick, resolveMonthlyPayroll } from './calculate.ts';
import { QUICK_DEFAULTS } from './defaults.ts';
import type { CostLine, QuickResolvedInput } from './types.ts';
import { validateQuickInput } from './validate.ts';

const MONEY = 4;
const RATIO = 5;
const INVARIANT = 9;

const GOLDEN_RAW = {
  monthlyRent: 450_000,
  employeeCount: 12,
  averageEmployeeMonthlyCost: 48_000,
  otherMonthlyOpex: 110_000,
  initialCapex: 10_000_000,
  averageTicket: 140,
  dailySalesVolume: 1_000,
  variableCostPerSale: 14.5,
};

function goldenInput(): QuickResolvedInput {
  const result = validateQuickInput(GOLDEN_RAW);
  if (!result.ok) {
    throw new Error('golden input must be valid');
  }
  return result.input;
}

function resolve(overrides: Partial<QuickResolvedInput> = {}): QuickResolvedInput {
  return { ...goldenInput(), ...overrides };
}

function assertInvariants(input: QuickResolvedInput): void {
  const result = calculateQuick(input);

  if (result.breakdownPerSale !== null) {
    const lineSum = result.breakdownPerSale.lines.reduce((sum, line) => sum + line.amount, 0);
    expect(lineSum + result.breakdownPerSale.remainingProfit).toBeCloseTo(
      result.breakdownPerSale.averageSale,
      INVARIANT,
    );
    expect(result.breakdownPerSale.averageSale).toBe(input.averageTicket);
  }

  if (result.perSale !== null) {
    expect(result.monthly.operatingEarnings).toBeCloseTo(
      result.perSale.remainingProfit * result.monthly.salesVolume,
      INVARIANT,
    );
  }

  expect(result.monthly.operatingEarnings).toBeCloseTo(
    result.monthly.netRevenue - result.monthly.totalCost,
    INVARIANT,
  );

  expect(result.monthly.operatingEarningsBeforeCapexRecoveryAllocation).toBeCloseTo(
    result.monthly.operatingEarnings + result.monthly.capexRecoveryAllocation,
    INVARIANT,
  );

  expect(result.monthly.rentPaidToLandlord + result.monthly.rentWithholdingTax).toBeCloseTo(
    result.monthly.rentCost,
    INVARIANT,
  );
}

describe('calculateQuick golden vector', () => {
  const result = calculateQuick(goldenInput());

  it('matches expected monthly values', () => {
    expect(result.monthly.salesVolume).toBeCloseTo(30_000, MONEY);
    expect(result.monthly.grossCollections).toBeCloseTo(4_200_000, MONEY);
    expect(result.monthly.vat).toBeCloseTo(381_818.1818, MONEY);
    expect(result.monthly.netRevenue).toBeCloseTo(3_818_181.8182, MONEY);
    expect(result.monthly.payroll).toBeCloseTo(576_000, MONEY);
    expect(result.monthly.rentCost).toBeCloseTo(450_000, MONEY);
    expect(result.monthly.rentPaidToLandlord).toBeCloseTo(360_000, MONEY);
    expect(result.monthly.rentWithholdingTax).toBeCloseTo(90_000, MONEY);
    expect(result.monthly.variableCost).toBeCloseTo(435_000, MONEY);
    expect(result.monthly.transactionCost).toBeCloseTo(134_568, MONEY);
    expect(result.monthly.capexRecoveryAllocation).toBeCloseTo(166_666.6667, MONEY);
    expect(result.monthly.fixedCost).toBeCloseTo(1_302_666.6667, MONEY);
    expect(result.monthly.totalCost).toBeCloseTo(1_872_234.6667, MONEY);
    expect(result.monthly.operatingEarnings).toBeCloseTo(1_945_947.15, 2);
    expect(result.monthly.operatingEarningsBeforeCapexRecoveryAllocation).toBeCloseTo(
      2_112_613.82,
      2,
    );
  });

  it('matches expected per-sale values', () => {
    expect(result.perSale).not.toBeNull();
    if (result.perSale === null) return;
    expect(result.perSale.netTicket).toBeCloseTo(127.2727, MONEY);
    expect(result.perSale.vat).toBeCloseTo(12.7273, MONEY);
    expect(result.perSale.variable).toBeCloseTo(14.5, MONEY);
    expect(result.perSale.pos).toBeCloseTo(4.4856, MONEY);
    expect(result.perSale.fixed).toBeCloseTo(43.4222, MONEY);
    expect(result.perSale.estimatedTotalCost).toBeCloseTo(75.1351, MONEY);
    expect(result.perSale.remainingProfit).toBeCloseTo(64.8649, MONEY);
  });

  it('matches the approved breakdown order and residual', () => {
    expect(result.breakdownPerSale).not.toBeNull();
    if (result.breakdownPerSale === null) return;
    const expected: Array<{ line: CostLine; amount: number }> = [
      { line: 'vat', amount: 12.7273 },
      { line: 'variable', amount: 14.5 },
      { line: 'payroll', amount: 19.2 },
      { line: 'rent', amount: 15 },
      { line: 'otherOpex', amount: 3.6667 },
      { line: 'pos', amount: 4.4856 },
      { line: 'investmentRecovery', amount: 5.5556 },
    ];
    expect(result.breakdownPerSale.lines.map((entry) => entry.line)).toEqual(
      expected.map((entry) => entry.line),
    );
    for (const [index, line] of result.breakdownPerSale.lines.entries()) {
      const amount = expected[index]?.amount;
      expect(amount).toBeDefined();
      if (amount === undefined) return;
      expect(line.amount).toBeCloseTo(amount, MONEY);
    }
    expect(result.breakdownPerSale.remainingProfit).toBeCloseTo(64.8649, MONEY);
  });

  it('matches expected headline outputs', () => {
    expect(result.grossProfitMargin).toBeCloseTo(0.88607, RATIO);
    expect(result.operatingProfitMargin).toBeCloseTo(0.50965, RATIO);
    expect(result.payback).toMatchObject({ exceedsRecoveryPeriod: false });
    if ('months' in result.payback) {
      expect(result.payback.months).toBeCloseTo(4.7335, MONEY);
    }
  });

  it('records engine meta from defaults', () => {
    expect(result.meta).toEqual({
      quickEngineVersion: QUICK_DEFAULTS.quickEngineVersion,
      currency: 'TRY',
      vatRate: QUICK_DEFAULTS.vatRate,
      revenueBasis: 'net',
    });
  });
});

describe('resolveMonthlyPayroll', () => {
  // Extracted from calculateQuick so the Quick form can show the same product
  // beneath its two payroll inputs without restating the multiplication.
  it('multiplies headcount by the blended per-employee cost', () => {
    expect(
      resolveMonthlyPayroll({ employeeCount: 12, averageEmployeeMonthlyCost: 48_000 }),
    ).toBe(576_000);
  });

  it('is zero when there are no employees', () => {
    expect(resolveMonthlyPayroll({ employeeCount: 0, averageEmployeeMonthlyCost: 48_000 })).toBe(0);
  });

  it('is the value calculateQuick reports as monthly payroll', () => {
    const validated = validateQuickInput({
      monthlyRent: 450_000,
      employeeCount: 12,
      averageEmployeeMonthlyCost: 48_000,
      otherMonthlyOpex: 110_000,
      initialCapex: 10_000_000,
      averageTicket: 140,
      dailySalesVolume: 1_000,
      variableCostPerSale: 14.5,
    });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    expect(calculateQuick(validated.input).monthly.payroll).toBe(
      resolveMonthlyPayroll(validated.input),
    );
  });
});

describe('calculateQuick structural invariants', () => {
  it.each([
    goldenInput(),
    resolve({ dailySalesVolume: 250, employeeCount: 3, initialCapex: 1_000_000 }),
    resolve({ averageTicket: 80, variableCostPerSale: 40, monthlyRent: 20_000 }),
    resolve({ dailySalesVolume: 0.25, operatingDaysPerMonth: 1 }),
    resolve({ rentInputBasis: 'net', monthlyRent: 450_000 }),
    resolve({ monthlyRent: 0, rentInputBasis: 'net' }),
  ])('holds for varied inputs %#', (input) => {
    assertInvariants(input);
  });

  it('does not include a volumeSimulation field', () => {
    const result = calculateQuick(goldenInput());
    expect(result).not.toHaveProperty('volumeSimulation');
    expect(Object.keys(result).sort()).toEqual(
      [
        'breakdownPerSale',
        'grossProfitMargin',
        'meta',
        'monthly',
        'operatingProfitMargin',
        'payback',
        'perSale',
      ].sort(),
    );
  });
});

describe('calculateQuick rent withholding (§8.6a)', () => {
  it('treats gross 450,000 at 20% as 360,000 net + 90,000 stopaj with unchanged cash cost', () => {
    const result = calculateQuick(resolve({ monthlyRent: 450_000, rentInputBasis: 'gross' }));
    expect(result.monthly.rentPaidToLandlord).toBe(360_000);
    expect(result.monthly.rentWithholdingTax).toBe(90_000);
    expect(result.monthly.rentCost).toBe(450_000);
    expect(result.breakdownPerSale?.lines.find((line) => line.line === 'rent')?.amount).toBeCloseTo(
      15,
      MONEY,
    );
    expect(result.monthly.fixedCost).toBeCloseTo(1_302_666.6667, MONEY);
    expect(result.monthly.operatingEarnings).toBeCloseTo(1_945_947.15, 2);
  });

  it('grosses net 450,000 at 20% to 562,500, never 450,000 × 1.20', () => {
    const result = calculateQuick(resolve({ monthlyRent: 450_000, rentInputBasis: 'net' }));
    expect(result.monthly.rentPaidToLandlord).toBe(450_000);
    expect(result.monthly.rentCost).toBe(562_500);
    expect(result.monthly.rentWithholdingTax).toBe(112_500);
    expect(result.monthly.rentCost).not.toBe(450_000 * 1.2);

    const extraRent = 112_500;
    const sales = 30_000;
    expect(result.breakdownPerSale?.lines.find((line) => line.line === 'rent')?.amount).toBeCloseTo(
      562_500 / sales,
      MONEY,
    );
    expect(result.perSale?.remainingProfit).toBeCloseTo(64.8649 - extraRent / sales, MONEY);
    expect(result.monthly.operatingEarnings).toBeCloseTo(1_945_947.15 - extraRent, 2);
    expect(result.monthly.fixedCost).toBeCloseTo(1_302_666.6667 + extraRent, MONEY);
  });

  it('keeps zero rent at zero on both bases', () => {
    for (const rentInputBasis of ['gross', 'net'] as const) {
      const result = calculateQuick(resolve({ monthlyRent: 0, rentInputBasis }));
      expect(result.monthly.rentCost).toBe(0);
      expect(result.monthly.rentPaidToLandlord).toBe(0);
      expect(result.monthly.rentWithholdingTax).toBe(0);
      expect(result.breakdownPerSale?.lines.find((line) => line.line === 'rent')?.amount).toBe(0);
    }
  });

  it('reconciles net-rent per-sale and monthly figures', () => {
    const result = calculateQuick(resolve({ monthlyRent: 450_000, rentInputBasis: 'net' }));
    expect(result.perSale).not.toBeNull();
    expect(result.breakdownPerSale).not.toBeNull();
    if (result.perSale === null || result.breakdownPerSale === null) return;

    const rentLine = result.breakdownPerSale.lines.find((line) => line.line === 'rent');
    expect(rentLine?.amount).toBeCloseTo(result.monthly.rentCost / result.monthly.salesVolume, INVARIANT);
    expect(result.monthly.operatingEarnings).toBeCloseTo(
      result.perSale.remainingProfit * result.monthly.salesVolume,
      INVARIANT,
    );
    expect(result.perSale.estimatedTotalCost).toBeCloseTo(
      result.breakdownPerSale.averageSale - result.perSale.remainingProfit,
      INVARIANT,
    );
  });
});
