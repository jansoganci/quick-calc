import { describe, expect, it } from 'vitest';
import { calculateQuick } from './calculate.ts';
import { simulateQuick } from './simulate.ts';
import type { QuickResolvedInput, SimulationLabel } from './types.ts';
import { validateQuickInput } from './validate.ts';

const MONEY = 4;

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

function resolve(overrides: Partial<QuickResolvedInput>): QuickResolvedInput {
  return { ...goldenInput(), ...overrides };
}

describe('simulateQuick', () => {
  it('returns an array of exactly 5 rows', () => {
    const rows = simulateQuick(goldenInput());
    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toHaveLength(5);
  });

  it('emits labels in order with exactly one current row', () => {
    const rows = simulateQuick(goldenInput());
    const labels: SimulationLabel[] = ['-50%', '-25%', 'current', '+25%', '+50%'];
    expect(rows.map((row) => row.label)).toEqual(labels);
    expect(rows.filter((row) => row.isCurrent)).toHaveLength(1);
    expect(rows[2]?.isCurrent).toBe(true);
  });

  it('uses the approved levels for base 1,000', () => {
    const rows = simulateQuick(goldenInput());
    expect(rows.map((row) => row.dailySales)).toEqual([500, 750, 1_000, 1_250, 1_500]);
  });

  it('matches golden-vector cost per sale and earnings', () => {
    const rows = simulateQuick(goldenInput());
    const expectedCost = [118.5573, 89.6092, 75.1351, 66.4507, 60.661];
    const expectedEarnings = [321_640, 1_133_794, 1_945_947, 2_758_101, 3_570_254];
    for (const [index, row] of rows.entries()) {
      const cost = expectedCost[index];
      const earnings = expectedEarnings[index];
      expect(cost).toBeDefined();
      expect(earnings).toBeDefined();
      if (cost === undefined || earnings === undefined) return;
      expect(row.estimatedTotalCostPerSale).toBeCloseTo(cost, MONEY);
      expect(row.monthlyOperatingEarnings).toBeCloseTo(earnings, 0);
    }
  });

  it('matches calculateQuick exactly on the current row', () => {
    const input = goldenInput();
    const main = calculateQuick(input);
    const current = simulateQuick(input).find((row) => row.isCurrent);
    expect(current).toBeDefined();
    expect(current?.estimatedTotalCostPerSale).toBe(main.perSale?.estimatedTotalCost);
    expect(current?.monthlyOperatingEarnings).toBe(main.monthly.operatingEarnings);
    expect(current?.dailySales).toBe(input.dailySalesVolume);
  });

  it('calls calculateQuick once per generated level and terminates', () => {
    const input = goldenInput();
    const rows = simulateQuick(input);
    expect(rows).toHaveLength(5);
    for (const row of rows) {
      const independently = calculateQuick({ ...input, dailySalesVolume: row.dailySales });
      expect(row.estimatedTotalCostPerSale).toBe(
        independently.perSale?.estimatedTotalCost ?? null,
      );
      expect(row.monthlyOperatingEarnings).toBe(independently.monthly.operatingEarnings);
    }
  });

  it('rounds generated levels with Math.round for base 401', () => {
    const rows = simulateQuick(resolve({ dailySalesVolume: 401 }));
    expect(rows.map((row) => row.dailySales)).toEqual([201, 301, 401, 501, 602]);
  });

  it('still emits 5 rows when rounded volumes repeat', () => {
    const rows = simulateQuick(resolve({ dailySalesVolume: 1 }));
    expect(rows).toHaveLength(5);
    expect(rows.map((row) => row.dailySales)).toEqual([1, 1, 1, 1, 2]);
    expect(rows.map((row) => row.label)).toEqual(['-50%', '-25%', 'current', '+25%', '+50%']);
  });

  it('varies only daily sales volume', () => {
    const base = goldenInput();
    const other = resolve({ dailySalesVolume: 500 });
    const baseCalc = calculateQuick(base);
    const otherCalc = calculateQuick(other);
    expect(otherCalc.monthly.payroll).toBe(baseCalc.monthly.payroll);
    expect(otherCalc.monthly.capexRecoveryAllocation).toBe(baseCalc.monthly.capexRecoveryAllocation);
    expect(other.monthlyRent).toBe(base.monthlyRent);
    expect(other.otherMonthlyOpex).toBe(base.otherMonthlyOpex);
    for (const row of simulateQuick(base)) {
      const atLevel = calculateQuick({ ...base, dailySalesVolume: row.dailySales });
      expect(atLevel.monthly.payroll).toBe(baseCalc.monthly.payroll);
      expect(atLevel.monthly.capexRecoveryAllocation).toBe(
        baseCalc.monthly.capexRecoveryAllocation,
      );
    }
  });

  it('yields null cost per sale for a zero base', () => {
    const rows = simulateQuick(resolve({ dailySalesVolume: 0 }));
    expect(rows).toHaveLength(5);
    expect(rows.every((row) => row.dailySales === 0)).toBe(true);
    expect(rows.every((row) => row.estimatedTotalCostPerSale === null)).toBe(true);
  });

  it('has strictly decreasing cost per sale as volume rises on a positive distinct base', () => {
    const rows = simulateQuick(goldenInput());
    for (let index = 1; index < rows.length; index += 1) {
      const previous = rows[index - 1]?.estimatedTotalCostPerSale;
      const current = rows[index]?.estimatedTotalCostPerSale;
      expect(previous).toEqual(expect.any(Number));
      expect(current).toEqual(expect.any(Number));
      if (typeof previous !== 'number' || typeof current !== 'number') return;
      expect(current).toBeLessThan(previous);
    }
  });

  it('carries net-rent stopaj through every volume level', () => {
    const gross = simulateQuick(goldenInput());
    const net = simulateQuick(resolve({ rentInputBasis: 'net' }));
    const extraRent = 112_500;
    for (let index = 0; index < gross.length; index += 1) {
      const grossRow = gross[index];
      const netRow = net[index];
      expect(netRow?.dailySales).toBe(grossRow?.dailySales);
      expect(netRow?.monthlyOperatingEarnings).toBeCloseTo(
        (grossRow?.monthlyOperatingEarnings ?? 0) - extraRent,
        2,
      );
    }
  });
});
