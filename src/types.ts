export type StayInputMode = 'dates' | 'manual';

export interface TenantStayInput {
  id: string;
  name: string;
  mode: StayInputMode;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  manualDays: string; // String representation for controlled input
}

export interface BillingMonthRecord {
  id: string;
  year: number;       // e.g. 2026
  month: number;      // 1..12
  billAmountInput: string; // e.g. "5420.50"
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  tenants: TenantStayInput[];
  updatedAt: string;   // ISO timestamp
}

export interface TenantCalculationResult {
  tenantId: string;
  name: string;
  mode: StayInputMode;
  daysStayed: number;
  clippedStart: string | null;
  clippedEnd: string | null;
  wasClipped: boolean;
  rawStartDate?: string;
  rawEndDate?: string;
  roundedShareCentavos: number;
  adjustmentCentavos: number;
  finalShareCentavos: number;
  sharePercentage: number;
  validationError: string | null;
}

export interface ValidationFieldErrors {
  billAmount?: string;
  periodDates?: string;
  tenants?: string;
  byTenantId: Record<string, string>;
}

export interface BillSplitResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: ValidationFieldErrors;
  totalBillCentavos: number;
  billingPeriodDays: number;
  totalTenantDays: number;
  perDayRateCentavosExact: number;
  perDayRateRoundedCentavos: number;
  tenantResults: TenantCalculationResult[];
  totalSharesCentavos: number;
  reconciliationDiffCentavos: number;
  reconciledTenantId: string | null;
}
