export interface FieldLimit {
  min: number;
  max: number;
  exclusiveMin?: boolean;
}

export const QUICK_LIMITS = {
  monthlyRent: { min: 0, max: 50_000_000 },
  employeeCount: { min: 0, max: 500 },
  averageEmployeeMonthlyCost: { min: 0, max: 1_000_000 },
  otherMonthlyOpex: { min: 0, max: 50_000_000 },
  initialCapex: { min: 0, max: 500_000_000 },
  averageTicket: { min: 0, max: 100_000, exclusiveMin: true },
  dailySalesVolume: { min: 0, max: 100_000 },
  variableCostPerSale: { min: 0, max: 100_000 },
  operatingDaysPerMonth: { min: 1, max: 31 },
  capexRecoveryPeriodMonths: { min: 1, max: 240 },
  cardPaymentShare: { min: 0, max: 1 },
  posCommissionRate: { min: 0, max: 0.1 },
} as const satisfies Record<string, FieldLimit>;
