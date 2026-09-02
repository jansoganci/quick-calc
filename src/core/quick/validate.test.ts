import { describe, expect, it } from 'vitest';
import { QUICK_DEFAULTS } from './defaults.ts';
import { QUICK_LIMITS } from './limits.ts';
import type { PrimaryInputField, QuickCalculationInput } from './types.ts';
import { validateQuickInput } from './validate.ts';

const VALID_PRIMARY: QuickCalculationInput = {
  monthlyRent: 450_000,
  employeeCount: 12,
  averageEmployeeMonthlyCost: 48_000,
  otherMonthlyOpex: 110_000,
  initialCapex: 10_000_000,
  averageTicket: 140,
  dailySalesVolume: 1_000,
  variableCostPerSale: 14.5,
};

const PRIMARY_FIELDS: PrimaryInputField[] = [
  'monthlyRent',
  'employeeCount',
  'averageEmployeeMonthlyCost',
  'otherMonthlyOpex',
  'initialCapex',
  'averageTicket',
  'dailySalesVolume',
  'variableCostPerSale',
];

describe('validateQuickInput', () => {
  it('accepts a valid full input and returns a resolved input', () => {
    const result = validateQuickInput(VALID_PRIMARY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.monthlyRent).toBe(450_000);
    expect(result.input.vatRate).toBe(QUICK_DEFAULTS.vatRate);
    expect(result.input.operatingDaysPerMonth).toBe(QUICK_DEFAULTS.operatingDaysPerMonth);
    expect(result.input.capexRecoveryPeriodMonths).toBe(QUICK_DEFAULTS.capexRecoveryPeriodMonths);
    expect(result.input.cardPaymentShare).toBe(QUICK_DEFAULTS.cardPaymentShare);
    expect(result.input.posCommissionRate).toBe(QUICK_DEFAULTS.posCommissionRate);
    expect(result.input.rentInputBasis).toBe(QUICK_DEFAULTS.rentInputBasis);
    expect(result.input.rentWithholdingRate).toBe(QUICK_DEFAULTS.rentWithholdingRate);
  });

  it.each(PRIMARY_FIELDS)('returns required when %s is missing', (field) => {
    const raw = { ...VALID_PRIMARY };
    delete raw[field];
    const result = validateQuickInput(raw);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual({ field, code: 'required' });
  });

  it.each(['', null, undefined] as const)(
    'returns required for empty-like value %s',
    (empty) => {
      const result = validateQuickInput({ ...VALID_PRIMARY, monthlyRent: empty });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toContainEqual({ field: 'monthlyRent', code: 'required' });
    },
  );

  it.each([NaN, Infinity, -Infinity, '140', true, {}, []] as const)(
    'returns not_a_number for %s',
    (value) => {
      const result = validateQuickInput({ ...VALID_PRIMARY, averageTicket: value });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toContainEqual({ field: 'averageTicket', code: 'not_a_number' });
    },
  );

  it('returns below_min for negative money', () => {
    const result = validateQuickInput({ ...VALID_PRIMARY, monthlyRent: -1 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual({
      field: 'monthlyRent',
      code: 'below_min',
      limit: QUICK_LIMITS.monthlyRent.min,
    });
  });

  it('returns below_min when averageTicket is 0', () => {
    const result = validateQuickInput({ ...VALID_PRIMARY, averageTicket: 0 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual({
      field: 'averageTicket',
      code: 'below_min',
      limit: QUICK_LIMITS.averageTicket.min,
    });
  });

  it.each(PRIMARY_FIELDS)('returns above_max when %s exceeds its maximum', (field) => {
    const result = validateQuickInput({
      ...VALID_PRIMARY,
      [field]: QUICK_LIMITS[field].max + 1,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual({
      field,
      code: 'above_max',
      limit: QUICK_LIMITS[field].max,
    });
  });

  it('applies secondary defaults when they are omitted', () => {
    const result = validateQuickInput(VALID_PRIMARY);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.operatingDaysPerMonth).toBe(30);
    expect(result.input.capexRecoveryPeriodMonths).toBe(60);
    expect(result.input.cardPaymentShare).toBe(0.9);
    expect(result.input.posCommissionRate).toBe(0.0356);
    expect(result.input.rentInputBasis).toBe('gross');
    expect(result.input.rentWithholdingRate).toBe(0.2);
  });

  it('accepts rentInputBasis net and gross', () => {
    const net = validateQuickInput({ ...VALID_PRIMARY, rentInputBasis: 'net' });
    expect(net.ok).toBe(true);
    if (net.ok) expect(net.input.rentInputBasis).toBe('net');
    const gross = validateQuickInput({ ...VALID_PRIMARY, rentInputBasis: 'gross' });
    expect(gross.ok).toBe(true);
    if (gross.ok) expect(gross.input.rentInputBasis).toBe('gross');
  });

  it('rejects an invalid rentInputBasis', () => {
    const result = validateQuickInput({ ...VALID_PRIMARY, rentInputBasis: 'brüt' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual({ field: 'rentInputBasis', code: 'invalid_value' });
  });

  it('rejects operatingDaysPerMonth 0 and 32', () => {
    const tooLow = validateQuickInput({ ...VALID_PRIMARY, operatingDaysPerMonth: 0 });
    expect(tooLow.ok).toBe(false);
    if (!tooLow.ok) {
      expect(tooLow.errors).toContainEqual({
        field: 'operatingDaysPerMonth',
        code: 'below_min',
        limit: 1,
      });
    }
    const tooHigh = validateQuickInput({ ...VALID_PRIMARY, operatingDaysPerMonth: 32 });
    expect(tooHigh.ok).toBe(false);
    if (!tooHigh.ok) {
      expect(tooHigh.errors).toContainEqual({
        field: 'operatingDaysPerMonth',
        code: 'above_max',
        limit: 31,
      });
    }
  });

  it('rejects capexRecoveryPeriodMonths 0 and 241', () => {
    const tooLow = validateQuickInput({ ...VALID_PRIMARY, capexRecoveryPeriodMonths: 0 });
    expect(tooLow.ok).toBe(false);
    if (!tooLow.ok) {
      expect(tooLow.errors).toContainEqual({
        field: 'capexRecoveryPeriodMonths',
        code: 'below_min',
        limit: 1,
      });
    }
    const tooHigh = validateQuickInput({ ...VALID_PRIMARY, capexRecoveryPeriodMonths: 241 });
    expect(tooHigh.ok).toBe(false);
    if (!tooHigh.ok) {
      expect(tooHigh.errors).toContainEqual({
        field: 'capexRecoveryPeriodMonths',
        code: 'above_max',
        limit: 240,
      });
    }
  });

  it('rejects cardPaymentShare -0.1 and 1.1', () => {
    const tooLow = validateQuickInput({ ...VALID_PRIMARY, cardPaymentShare: -0.1 });
    expect(tooLow.ok).toBe(false);
    if (!tooLow.ok) {
      expect(tooLow.errors).toContainEqual({
        field: 'cardPaymentShare',
        code: 'below_min',
        limit: 0,
      });
    }
    const tooHigh = validateQuickInput({ ...VALID_PRIMARY, cardPaymentShare: 1.1 });
    expect(tooHigh.ok).toBe(false);
    if (!tooHigh.ok) {
      expect(tooHigh.errors).toContainEqual({
        field: 'cardPaymentShare',
        code: 'above_max',
        limit: 1,
      });
    }
  });

  it('rejects posCommissionRate -0.01 and 0.11', () => {
    const tooLow = validateQuickInput({ ...VALID_PRIMARY, posCommissionRate: -0.01 });
    expect(tooLow.ok).toBe(false);
    if (!tooLow.ok) {
      expect(tooLow.errors).toContainEqual({
        field: 'posCommissionRate',
        code: 'below_min',
        limit: 0,
      });
    }
    const tooHigh = validateQuickInput({ ...VALID_PRIMARY, posCommissionRate: 0.11 });
    expect(tooHigh.ok).toBe(false);
    if (!tooHigh.ok) {
      expect(tooHigh.errors).toContainEqual({
        field: 'posCommissionRate',
        code: 'above_max',
        limit: 0.1,
      });
    }
  });

  it('returns all errors together for multiple invalid fields', () => {
    const result = validateQuickInput({
      ...VALID_PRIMARY,
      monthlyRent: undefined,
      averageTicket: 0,
      employeeCount: 501,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual(
      expect.arrayContaining([
        { field: 'monthlyRent', code: 'required' },
        { field: 'averageTicket', code: 'below_min', limit: 0 },
        { field: 'employeeCount', code: 'above_max', limit: 500 },
      ]),
    );
    expect(result.errors).toHaveLength(3);
  });

  it('accepts variableCostPerSale greater than the net average ticket', () => {
    const result = validateQuickInput({ ...VALID_PRIMARY, variableCostPerSale: 200 });
    expect(result.ok).toBe(true);
  });

  it('accepts initialCapex 0 and dailySalesVolume 0', () => {
    const result = validateQuickInput({
      ...VALID_PRIMARY,
      initialCapex: 0,
      dailySalesVolume: 0,
    });
    expect(result.ok).toBe(true);
  });

  it('accepts fractional employeeCount 9.5', () => {
    const result = validateQuickInput({ ...VALID_PRIMARY, employeeCount: 9.5 });
    expect(result.ok).toBe(true);
  });

  it('never throws', () => {
    const samples: QuickCalculationInput[] = [
      {},
      VALID_PRIMARY,
      { monthlyRent: 'x' },
      { averageTicket: Number.POSITIVE_INFINITY },
    ];
    for (const sample of samples) {
      expect(() => validateQuickInput(sample)).not.toThrow();
    }
  });
});
