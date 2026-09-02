import { QUICK_DEFAULTS } from './defaults.ts';
import { QUICK_LIMITS, type FieldLimit } from './limits.ts';
import type {
  PrimaryInputField,
  QuickCalculationInput,
  QuickInputField,
  QuickResolvedInput,
  SecondaryInputField,
  ValidateQuickResult,
  ValidationError,
} from './types.ts';

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

const SECONDARY_FIELDS: SecondaryInputField[] = [
  'operatingDaysPerMonth',
  'capexRecoveryPeriodMonths',
  'cardPaymentShare',
  'posCommissionRate',
];

function isAbsent(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function checkPresentNumber(
  field: QuickInputField,
  value: unknown,
  limit: FieldLimit,
  errors: ValidationError[],
): number | undefined {
  if (!isFiniteNumber(value)) {
    errors.push({ field, code: 'not_a_number' });
    return undefined;
  }
  if (limit.exclusiveMin === true ? value <= limit.min : value < limit.min) {
    errors.push({ field, code: 'below_min', limit: limit.min });
    return undefined;
  }
  if (value > limit.max) {
    errors.push({ field, code: 'above_max', limit: limit.max });
    return undefined;
  }
  return value;
}

export function validateQuickInput(raw: QuickCalculationInput): ValidateQuickResult {
  const errors: ValidationError[] = [];
  const resolved = {} as QuickResolvedInput;

  for (const field of PRIMARY_FIELDS) {
    const value = raw[field];
    if (isAbsent(value)) {
      errors.push({ field, code: 'required' });
      continue;
    }
    const parsed = checkPresentNumber(field, value, QUICK_LIMITS[field], errors);
    if (parsed !== undefined) {
      resolved[field] = parsed;
    }
  }

  for (const field of SECONDARY_FIELDS) {
    const value = raw[field];
    if (isAbsent(value)) {
      resolved[field] = QUICK_DEFAULTS[field];
      continue;
    }
    const parsed = checkPresentNumber(field, value, QUICK_LIMITS[field], errors);
    if (parsed !== undefined) {
      resolved[field] = parsed;
    }
  }

  const basis = raw.rentInputBasis;
  if (isAbsent(basis)) {
    resolved.rentInputBasis = QUICK_DEFAULTS.rentInputBasis;
  } else if (basis === 'net' || basis === 'gross') {
    resolved.rentInputBasis = basis;
  } else {
    errors.push({ field: 'rentInputBasis', code: 'invalid_value' });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  resolved.vatRate = QUICK_DEFAULTS.vatRate;
  resolved.rentWithholdingRate = QUICK_DEFAULTS.rentWithholdingRate;
  return { ok: true, input: resolved };
}
