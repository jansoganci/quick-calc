import type { RentInputBasis } from './types.ts';

export const QUICK_DEFAULTS = {
  operatingDaysPerMonth: 30,
  capexRecoveryPeriodMonths: 60,
  cardPaymentShare: 0.90,
  posCommissionRate: 0.0356,
  rentInputBasis: 'gross' as RentInputBasis,
  rentWithholdingRate: 0.20,
  vatRate: 0.10,
  currency: 'TRY' as const,
  quickEngineVersion: '1.1.0',
};
