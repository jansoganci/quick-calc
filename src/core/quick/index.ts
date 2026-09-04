export { calculateQuick, resolveMonthlyPayroll, resolveRentCost } from './calculate.ts';
export type { ResolvedRentCost } from './calculate.ts';
export { QUICK_DEFAULTS } from './defaults.ts';
export { QUICK_LIMITS } from './limits.ts';
export { simulateQuick } from './simulate.ts';
export { validateQuickInput } from './validate.ts';

export type {
  BreakdownLine,
  BreakdownPerSale,
  CostLine,
  MonthlyResult,
  PaybackAvailable,
  PaybackResult,
  PerSaleResult,
  PrimaryInputField,
  QuickCalculationInput,
  QuickCalculationResult,
  QuickInputField,
  QuickResolvedInput,
  QuickSimulationRow,
  RentInputBasis,
  SecondaryInputField,
  SimulationLabel,
  Unavailable,
  ValidateQuickResult,
  ValidationError,
  ValidationErrorCode,
} from './types.ts';
