import {
  BillingMonthRecord,
  BillSplitResult,
  TenantCalculationResult,
  TenantStayInput,
  ValidationFieldErrors,
} from './types';

const MS_PER_DAY = 86_400_000;

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * Formats an integer centavo value as Philippine Peso: ₱1,234.56
 */
export function formatCentavos(centavos: number): string {
  if (!Number.isFinite(centavos)) {
    return '₱0.00';
  }
  const rounded = Math.round(centavos);
  const isNegative = rounded < 0;
  const abs = Math.abs(rounded);
  const pesos = Math.floor(abs / 100);
  const cents = abs % 100;
  const formattedPesos = pesos.toLocaleString('en-US');
  const formattedCents = String(cents).padStart(2, '0');
  return `${isNegative ? '-' : ''}₱${formattedPesos}.${formattedCents}`;
}

/**
 * Parses a peso string or number into exact integer centavos without float drift.
 */
export function parsePesosToCentavos(raw: string | number): {
  centavos: number | null;
  error: string | null;
} {
  const str = String(raw ?? '')
    .trim()
    .replace(/^₱\s*/, '')
    .replace(/,/g, '');

  if (str === '') {
    return {
      centavos: null,
      error: 'Enter the total electricity bill amount in pesos.',
    };
  }

  if (str.startsWith('-')) {
    return {
      centavos: null,
      error: 'Bill amount cannot be negative.',
    };
  }

  if (!/^\d+(\.\d+)?$/.test(str)) {
    return {
      centavos: null,
      error: 'Enter a valid peso amount (e.g., 4250.75).',
    };
  }

  const [wholePart, fracPart = ''] = str.split('.');
  if (fracPart.length > 2) {
    return {
      centavos: null,
      error: 'Bill amount can have at most 2 decimal places (centavos).',
    };
  }

  const pesos = Number.parseInt(wholePart, 10);
  const cents = Number.parseInt(fracPart.padEnd(2, '0'), 10);
  const totalCentavos = pesos * 100 + cents;

  if (!Number.isSafeInteger(totalCentavos) || totalCentavos > 100_000_000_00) {
    return {
      centavos: null,
      error: 'Bill amount exceeds the maximum supported value.',
    };
  }

  if (totalCentavos <= 0) {
    return {
      centavos: null,
      error: 'Bill amount must be greater than ₱0.00.',
    };
  }

  return { centavos: totalCentavos, error: null };
}

/**
 * Returns default first and last calendar day (YYYY-MM-DD) for a given year and month (1..12).
 */
export function getDefaultMonthPeriod(
  year: number,
  month: number
): { start: string; end: string; daysInMonth: number } {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const ym = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`;
  return {
    start: `${ym}-01`,
    end: `${ym}-${String(daysInMonth).padStart(2, '0')}`,
    daysInMonth,
  };
}

/**
 * Parses YYYY-MM-DD to UTC midnight timestamp, verifying real calendar dates.
 */
export function parseIsoDateToUtcMs(dateStr: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const ms = Date.UTC(year, month - 1, day);
  const check = new Date(ms);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  return ms;
}

/**
 * Counts inclusive calendar days between two valid YYYY-MM-DD strings where start <= end.
 */
export function countInclusiveDays(startStr: string, endStr: string): number {
  const startMs = parseIsoDateToUtcMs(startStr);
  const endMs = parseIsoDateToUtcMs(endStr);
  if (startMs === null || endMs === null || endMs < startMs) {
    return 0;
  }
  return Math.round((endMs - startMs) / MS_PER_DAY) + 1;
}

/**
 * Clips a tenant's [stayStart, stayEnd] range to [periodStart, periodEnd] and counts inclusive days.
 * Dates outside the billing period are ignored.
 */
export function calculateClippedStayDays(
  stayStart: string,
  stayEnd: string,
  periodStart: string,
  periodEnd: string
): {
  days: number;
  clippedStart: string | null;
  clippedEnd: string | null;
  wasClipped: boolean;
  error: string | null;
} {
  const stayStartMs = parseIsoDateToUtcMs(stayStart);
  const stayEndMs = parseIsoDateToUtcMs(stayEnd);
  const periodStartMs = parseIsoDateToUtcMs(periodStart);
  const periodEndMs = parseIsoDateToUtcMs(periodEnd);

  if (stayStartMs === null || stayEndMs === null) {
    return {
      days: 0,
      clippedStart: null,
      clippedEnd: null,
      wasClipped: false,
      error: 'Select both a valid start date and end date.',
    };
  }

  if (stayEndMs < stayStartMs) {
    return {
      days: 0,
      clippedStart: null,
      clippedEnd: null,
      wasClipped: false,
      error: 'End date cannot be earlier than start date.',
    };
  }

  if (periodStartMs === null || periodEndMs === null || periodEndMs < periodStartMs) {
    return {
      days: 0,
      clippedStart: null,
      clippedEnd: null,
      wasClipped: false,
      error: null,
    };
  }

  const effectiveStart = stayStart < periodStart ? periodStart : stayStart;
  const effectiveEnd = stayEnd > periodEnd ? periodEnd : stayEnd;
  const wasClipped = effectiveStart !== stayStart || effectiveEnd !== stayEnd;

  // Stay falls completely outside the billing period
  if (effectiveStart > effectiveEnd) {
    return {
      days: 0,
      clippedStart: null,
      clippedEnd: null,
      wasClipped: true,
      error: null,
    };
  }

  const days = countInclusiveDays(effectiveStart, effectiveEnd);
  return {
    days,
    clippedStart: effectiveStart,
    clippedEnd: effectiveEnd,
    wasClipped,
    error: null,
  };
}

/**
 * Integer division with exact round-half-up (e.g., 2.5 -> 3, 2.49 -> 2).
 */
export function roundHalfUpDivision(numerator: number, denominator: number): number {
  if (denominator <= 0 || numerator <= 0) return 0;
  const num = BigInt(Math.round(numerator));
  const den = BigInt(Math.round(denominator));
  const quotient = num / den;
  const remainder = num % den;
  return Number(remainder * 2n >= den ? quotient + 1n : quotient);
}

/**
 * Evaluates a single tenant's stay input against the billing period.
 */
function evaluateTenantStay(
  tenant: TenantStayInput,
  periodStart: string,
  periodEnd: string
): {
  daysStayed: number;
  clippedStart: string | null;
  clippedEnd: string | null;
  wasClipped: boolean;
  error: string | null;
} {
  if (!tenant.name.trim()) {
    return {
      daysStayed: 0,
      clippedStart: null,
      clippedEnd: null,
      wasClipped: false,
      error: 'Enter a tenant name.',
    };
  }

  if (tenant.mode === 'manual') {
    const raw = String(tenant.manualDays ?? '').trim();
    if (raw === '') {
      return {
        daysStayed: 0,
        clippedStart: null,
        clippedEnd: null,
        wasClipped: false,
        error: 'Enter the number of days stayed.',
      };
    }

    const parsedNum = Number(raw);
    if (!Number.isFinite(parsedNum) || Number.isNaN(parsedNum)) {
      return {
        daysStayed: 0,
        clippedStart: null,
        clippedEnd: null,
        wasClipped: false,
        error: 'Days stayed must be a valid number.',
      };
    }

    if (parsedNum < 0) {
      return {
        daysStayed: 0,
        clippedStart: null,
        clippedEnd: null,
        wasClipped: false,
        error: 'Days stayed cannot be negative.',
      };
    }

    if (!Number.isInteger(parsedNum)) {
      return {
        daysStayed: 0,
        clippedStart: null,
        clippedEnd: null,
        wasClipped: false,
        error: 'Days stayed must be a whole number of calendar days.',
      };
    }

    if (parsedNum > 366) {
      return {
        daysStayed: 0,
        clippedStart: null,
        clippedEnd: null,
        wasClipped: false,
        error: 'Days stayed cannot exceed 366 days.',
      };
    }

    return {
      daysStayed: parsedNum,
      clippedStart: null,
      clippedEnd: null,
      wasClipped: false,
      error: null,
    };
  }

  const clipped = calculateClippedStayDays(
    tenant.startDate,
    tenant.endDate,
    periodStart,
    periodEnd
  );
  return {
    daysStayed: clipped.days,
    clippedStart: clipped.clippedStart,
    clippedEnd: clipped.clippedEnd,
    wasClipped: clipped.wasClipped,
    error: clipped.error,
  };
}

/**
 * Main calculation engine for splitting the monthly electricity bill.
 */
export function calculateBillSplit(
  record: Pick<
    BillingMonthRecord,
    'billAmountInput' | 'periodStart' | 'periodEnd' | 'tenants'
  >
): BillSplitResult {
  const errors: string[] = [];
  const fieldErrors: ValidationFieldErrors = {
    byTenantId: {},
  };

  // 1. Validate billing period dates
  const periodStartMs = parseIsoDateToUtcMs(record.periodStart);
  const periodEndMs = parseIsoDateToUtcMs(record.periodEnd);
  let billingPeriodDays = 0;

  if (periodStartMs === null || periodEndMs === null) {
    const msg = 'Select valid billing period start and end dates.';
    errors.push(msg);
    fieldErrors.periodDates = msg;
  } else if (periodEndMs < periodStartMs) {
    const msg = 'Billing period end date cannot be earlier than start date.';
    errors.push(msg);
    fieldErrors.periodDates = msg;
  } else {
    billingPeriodDays = countInclusiveDays(record.periodStart, record.periodEnd);
  }

  // 2. Validate total bill amount
  const billParsed = parsePesosToCentavos(record.billAmountInput);
  if (billParsed.error || billParsed.centavos === null) {
    const msg = billParsed.error ?? 'Invalid bill amount.';
    errors.push(msg);
    fieldErrors.billAmount = msg;
  }
  const totalBillCentavos = billParsed.centavos ?? 0;

  // 3. Validate tenants list
  if (record.tenants.length === 0) {
    const msg = 'Add at least one tenant to split the monthly bill.';
    errors.push(msg);
    fieldErrors.tenants = msg;
  }

  // 4. Evaluate each tenant's stay days
  const evaluatedTenants = record.tenants.map((tenant) => {
    const stay = evaluateTenantStay(tenant, record.periodStart, record.periodEnd);
    if (stay.error) {
      fieldErrors.byTenantId[tenant.id] = stay.error;
      errors.push(`${tenant.name.trim() || 'Unnamed tenant'}: ${stay.error}`);
    }
    return {
      tenant,
      ...stay,
    };
  });

  const totalTenantDays = evaluatedTenants.reduce(
    (sum, item) => sum + item.daysStayed,
    0
  );

  if (
    record.tenants.length > 0 &&
    Object.keys(fieldErrors.byTenantId).length === 0 &&
    totalTenantDays === 0
  ) {
    const msg =
      'Total tenant stay days cannot be 0. Ensure at least one tenant stayed during the billing period.';
    errors.push(msg);
    fieldErrors.tenants = msg;
  }

  const isValid = errors.length === 0 && totalBillCentavos > 0 && totalTenantDays > 0;

  if (!isValid) {
    const emptyResults: TenantCalculationResult[] = evaluatedTenants.map((item) => ({
      tenantId: item.tenant.id,
      name: item.tenant.name,
      mode: item.tenant.mode,
      daysStayed: item.daysStayed,
      clippedStart: item.clippedStart,
      clippedEnd: item.clippedEnd,
      wasClipped: item.wasClipped,
      rawStartDate: item.tenant.startDate,
      rawEndDate: item.tenant.endDate,
      roundedShareCentavos: 0,
      adjustmentCentavos: 0,
      finalShareCentavos: 0,
      sharePercentage: 0,
      validationError: item.error,
    }));

    return {
      isValid: false,
      errors,
      fieldErrors,
      totalBillCentavos,
      billingPeriodDays,
      totalTenantDays,
      perDayRateCentavosExact: 0,
      perDayRateRoundedCentavos: 0,
      tenantResults: emptyResults,
      totalSharesCentavos: 0,
      reconciliationDiffCentavos: 0,
      reconciledTenantId: null,
    };
  }

  // 5. Compute per-day rate & round-half-up share in centavos for each tenant
  const perDayRateCentavosExact = totalBillCentavos / totalTenantDays;
  const perDayRateRoundedCentavos = roundHalfUpDivision(
    totalBillCentavos,
    totalTenantDays
  );

  const tenantResults: TenantCalculationResult[] = evaluatedTenants.map((item) => {
    const roundedShareCentavos = roundHalfUpDivision(
      item.daysStayed * totalBillCentavos,
      totalTenantDays
    );
    return {
      tenantId: item.tenant.id,
      name: item.tenant.name.trim(),
      mode: item.tenant.mode,
      daysStayed: item.daysStayed,
      clippedStart: item.clippedStart,
      clippedEnd: item.clippedEnd,
      wasClipped: item.wasClipped,
      rawStartDate: item.tenant.startDate,
      rawEndDate: item.tenant.endDate,
      roundedShareCentavos,
      adjustmentCentavos: 0,
      finalShareCentavos: roundedShareCentavos,
      sharePercentage: (item.daysStayed / totalTenantDays) * 100,
      validationError: null,
    };
  });

  // 6. Reconcile any leftover centavo difference to the tenant with the largest share
  const sumRoundedCentavos = tenantResults.reduce(
    (sum, item) => sum + item.roundedShareCentavos,
    0
  );
  const reconciliationDiffCentavos = totalBillCentavos - sumRoundedCentavos;
  let reconciledTenantId: string | null = null;

  if (reconciliationDiffCentavos !== 0 && tenantResults.length > 0) {
    let largestIdx = 0;
    for (let i = 1; i < tenantResults.length; i++) {
      if (tenantResults[i].daysStayed > tenantResults[largestIdx].daysStayed) {
        largestIdx = i;
      }
    }
    tenantResults[largestIdx].adjustmentCentavos = reconciliationDiffCentavos;
    tenantResults[largestIdx].finalShareCentavos += reconciliationDiffCentavos;
    reconciledTenantId = tenantResults[largestIdx].tenantId;
  }

  const totalSharesCentavos = tenantResults.reduce(
    (sum, item) => sum + item.finalShareCentavos,
    0
  );

  return {
    isValid: true,
    errors: [],
    fieldErrors,
    totalBillCentavos,
    billingPeriodDays,
    totalTenantDays,
    perDayRateCentavosExact,
    perDayRateRoundedCentavos,
    tenantResults,
    totalSharesCentavos,
    reconciliationDiffCentavos,
    reconciledTenantId,
  };
}
