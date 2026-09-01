export type CostLine =
  | 'vat'
  | 'variable'
  | 'payroll'
  | 'rent'
  | 'otherOpex'
  | 'pos'
  | 'investmentRecovery';

export type SimulationLabel = '-50%' | '-25%' | 'current' | '+25%' | '+50%';

export type ValidationErrorCode =
  | 'required'
  | 'not_a_number'
  | 'below_min'
  | 'above_max';

export type PrimaryInputField =
  | 'monthlyRent'
  | 'employeeCount'
  | 'averageEmployeeMonthlyCost'
  | 'otherMonthlyOpex'
  | 'initialCapex'
  | 'averageTicket'
  | 'dailySalesVolume'
  | 'variableCostPerSale';

export type SecondaryInputField =
  | 'operatingDaysPerMonth'
  | 'capexRecoveryPeriodMonths'
  | 'cardPaymentShare'
  | 'posCommissionRate';

export type QuickInputField = PrimaryInputField | SecondaryInputField;

export interface QuickCalculationInput {
  monthlyRent?: unknown;
  employeeCount?: unknown;
  averageEmployeeMonthlyCost?: unknown;
  otherMonthlyOpex?: unknown;
  initialCapex?: unknown;
  averageTicket?: unknown;
  dailySalesVolume?: unknown;
  variableCostPerSale?: unknown;
  operatingDaysPerMonth?: unknown;
  capexRecoveryPeriodMonths?: unknown;
  cardPaymentShare?: unknown;
  posCommissionRate?: unknown;
}

export interface QuickResolvedInput {
  monthlyRent: number;
  employeeCount: number;
  averageEmployeeMonthlyCost: number;
  otherMonthlyOpex: number;
  initialCapex: number;
  averageTicket: number;
  dailySalesVolume: number;
  variableCostPerSale: number;
  operatingDaysPerMonth: number;
  capexRecoveryPeriodMonths: number;
  cardPaymentShare: number;
  posCommissionRate: number;
  vatRate: number;
}

export interface ValidationError {
  field: QuickInputField;
  code: ValidationErrorCode;
  limit?: number;
}

export type ValidateQuickResult =
  | { ok: true; input: QuickResolvedInput }
  | { ok: false; errors: ValidationError[] };

export interface Unavailable {
  available: false;
  reason: string;
}

export interface PaybackAvailable {
  months: number;
  exceedsRecoveryPeriod: boolean;
}

export type PaybackResult = PaybackAvailable | Unavailable;

export interface MonthlyResult {
  salesVolume: number;
  grossCollections: number;
  vat: number;
  netRevenue: number;
  payroll: number;
  variableCost: number;
  transactionCost: number;
  capexRecoveryAllocation: number;
  fixedCost: number;
  totalCost: number;
  operatingEarnings: number;
  operatingEarningsBeforeCapexRecoveryAllocation: number;
}

export interface PerSaleResult {
  grossTicket: number;
  netTicket: number;
  vat: number;
  variable: number;
  pos: number;
  fixed: number;
  estimatedTotalCost: number;
  remainingProfit: number;
}

export interface BreakdownLine {
  line: CostLine;
  amount: number;
}

export interface BreakdownPerSale {
  averageSale: number;
  lines: BreakdownLine[];
  remainingProfit: number;
}

export interface QuickCalculationResult {
  monthly: MonthlyResult;
  perSale: PerSaleResult | null;
  breakdownPerSale: BreakdownPerSale | null;
  grossProfitMargin: number | null;
  operatingProfitMargin: number | null;
  payback: PaybackResult;
  meta: {
    quickEngineVersion: string;
    currency: 'TRY';
    vatRate: number;
    revenueBasis: 'net';
  };
}

export interface QuickSimulationRow {
  label: SimulationLabel;
  dailySales: number;
  estimatedTotalCostPerSale: number | null;
  monthlyOperatingEarnings: number;
  isCurrent: boolean;
}
