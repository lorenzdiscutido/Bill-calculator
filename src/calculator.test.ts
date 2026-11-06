import { describe, expect, it } from 'vitest';
import {
  calculateBillSplit,
  calculateClippedStayDays,
  formatCentavos,
  getDefaultMonthPeriod,
  parsePesosToCentavos,
  roundHalfUpDivision,
} from './calculator';
import { TenantStayInput } from './types';

function makeTenant(
  overrides: Partial<TenantStayInput> & { id: string; name: string }
): TenantStayInput {
  return {
    mode: 'dates',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    manualDays: '31',
    ...overrides,
  };
}

describe('Monthly Electricity Bill Calculator', () => {
  describe('Currency formatting & parsing', () => {
    it('formats centavos as Philippine peso with thousands separators and two decimal places', () => {
      expect(formatCentavos(123456)).toBe('₱1,234.56');
      expect(formatCentavos(0)).toBe('₱0.00');
      expect(formatCentavos(5)).toBe('₱0.05');
      expect(formatCentavos(100000000)).toBe('₱1,000,000.00');
    });

    it('parses peso strings without floating-point drift', () => {
      expect(parsePesosToCentavos('19.99').centavos).toBe(1999);
      expect(parsePesosToCentavos('₱1,234.56').centavos).toBe(123456);
      expect(parsePesosToCentavos('4500').centavos).toBe(450000);
    });
  });

  describe('Even split', () => {
    it('splits a bill evenly when all tenants stay the same number of days', () => {
      const result = calculateBillSplit({
        billAmountInput: '3600.00',
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        tenants: [
          makeTenant({ id: 't1', name: 'Andrea Santos' }),
          makeTenant({ id: 't2', name: 'Marco Reyes' }),
          makeTenant({ id: 't3', name: 'Patricia Lim' }),
        ],
      });

      expect(result.isValid).toBe(true);
      expect(result.totalTenantDays).toBe(93); // 31 * 3
      expect(result.totalBillCentavos).toBe(360000);
      expect(result.totalSharesCentavos).toBe(360000);
      expect(result.reconciliationDiffCentavos).toBe(0);
      expect(result.tenantResults.map((r) => r.finalShareCentavos)).toEqual([
        120000, 120000, 120000,
      ]);
    });
  });

  describe('Uneven split & vacant days recovery', () => {
    it('splits a bill proportionally to days stayed and recovers 100% even with vacant days', () => {
      // Total days = 30 + 20 + 10 = 60 tenant-days, Bill = ₱6,000.00 -> ₱100.00/tenant-day
      const result = calculateBillSplit({
        billAmountInput: '6000.00',
        periodStart: '2026-11-01',
        periodEnd: '2026-11-30',
        tenants: [
          makeTenant({
            id: 't1',
            name: 'Tenant A',
            mode: 'manual',
            manualDays: '30',
          }),
          makeTenant({
            id: 't2',
            name: 'Tenant B',
            mode: 'manual',
            manualDays: '20',
          }),
          makeTenant({
            id: 't3',
            name: 'Tenant C',
            mode: 'manual',
            manualDays: '10',
          }),
        ],
      });

      expect(result.isValid).toBe(true);
      expect(result.totalTenantDays).toBe(60);
      expect(result.perDayRateRoundedCentavos).toBe(10000); // ₱100.00
      expect(result.tenantResults[0].finalShareCentavos).toBe(300000); // ₱3,000.00
      expect(result.tenantResults[1].finalShareCentavos).toBe(200000); // ₱2,000.00
      expect(result.tenantResults[2].finalShareCentavos).toBe(100000); // ₱1,000.00
      expect(result.totalSharesCentavos).toBe(600000);
    });
  });

  describe('Mid-month move-in and billing period clipping', () => {
    it('counts inclusive calendar days and clips dates outside the billing period', () => {
      // Billing period: Oct 1 to Oct 31, 2026 (31 days)
      // Tenant 1: Full month (Sep 25 to Nov 5 -> clipped to Oct 1..Oct 31 = 31 days)
      // Tenant 2: Mid-month move-in on Oct 16 -> Oct 16..Oct 31 inclusive = 16 days
      // Tenant 3: Moved out on Oct 10 -> Oct 1..Oct 10 inclusive = 10 days
      const result = calculateBillSplit({
        billAmountInput: '5700.00',
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        tenants: [
          makeTenant({
            id: 't1',
            name: 'Full Month (Clipped)',
            startDate: '2026-09-25',
            endDate: '2026-11-05',
          }),
          makeTenant({
            id: 't2',
            name: 'Mid-Month Move-In',
            startDate: '2026-10-16',
            endDate: '2026-10-31',
          }),
          makeTenant({
            id: 't3',
            name: 'Early Move-Out',
            startDate: '2026-10-01',
            endDate: '2026-10-10',
          }),
        ],
      });

      expect(result.isValid).toBe(true);
      expect(result.tenantResults[0].daysStayed).toBe(31);
      expect(result.tenantResults[0].wasClipped).toBe(true);
      expect(result.tenantResults[0].clippedStart).toBe('2026-10-01');
      expect(result.tenantResults[0].clippedEnd).toBe('2026-10-31');

      expect(result.tenantResults[1].daysStayed).toBe(16);
      expect(result.tenantResults[1].wasClipped).toBe(false);

      expect(result.tenantResults[2].daysStayed).toBe(10);
      expect(result.totalTenantDays).toBe(57); // 31 + 16 + 10 = 57
      // ₱5,700.00 / 57 days = ₱100.00/day
      expect(result.tenantResults.map((r) => r.finalShareCentavos)).toEqual([
        310000, 160000, 100000,
      ]);
    });

    it('counts 1 day when start date and end date are the same calendar day', () => {
      const clipped = calculateClippedStayDays(
        '2026-10-15',
        '2026-10-15',
        '2026-10-01',
        '2026-10-31'
      );
      expect(clipped.days).toBe(1);
      expect(clipped.error).toBeNull();
    });
  });

  describe('Round-half-up and centavo remainder reconciliation', () => {
    it('rounds half-up at exact .5 centavo boundaries', () => {
      // 5 / 2 = 2.5 -> 3
      expect(roundHalfUpDivision(5, 2)).toBe(3);
      // 4 / 2 = 2.0 -> 2
      expect(roundHalfUpDivision(4, 2)).toBe(2);
      // 1 / 3 = 0.333... -> 0
      expect(roundHalfUpDivision(1, 3)).toBe(0);
      // 2 / 3 = 0.666... -> 1
      expect(roundHalfUpDivision(2, 3)).toBe(1);
    });

    it('assigns positive leftover centavo (+₱0.01) to the tenant with the largest share', () => {
      // Bill = ₱100.00 (10,000 centavos)
      // Days: Tenant A = 1, Tenant B = 4, Tenant C = 1 -> Total = 6 days
      // Unrounded shares:
      // A: 1/6 * 10000 = 1666.666... -> rounds half-up to 1667 (₱16.67)
      // B: 4/6 * 10000 = 6666.666... -> rounds half-up to 6667 (₱66.67)
      // C: 1/6 * 10000 = 1666.666... -> rounds half-up to 1667 (₱16.67)
      // Wait: 1667 + 6667 + 1667 = 10001 (diff = -1 centavo).
      // Let's also test a +1 centavo remainder:
      // Days: Tenant A = 1, Tenant B = 1, Tenant C = 4, Bill = ₱100.01 (10001 centavos)
      // Or Days: Tenant A = 2, Tenant B = 5, Tenant C = 2 (Total = 9 days), Bill = ₱100.00 (10,000 centavos):
      // A: 20000 / 9 = 2222.22 -> 2222
      // B: 50000 / 9 = 5555.55 -> 5556
      // C: 20000 / 9 = 2222.22 -> 2222
      // Wait: 2222 + 5556 + 2222 = 10000!
      // What about Days: A = 1, B = 1, C = 4 (Total = 6), Bill = ₱100.04 (10004 centavos):
      // A: 10004 / 6 = 1667.33 -> 1667
      // B: 10004 / 6 = 1667.33 -> 1667
      // C: 40016 / 6 = 6669.33 -> 6669
      // Sum = 1667 + 1667 + 6669 = 10003 -> diff = +1 centavo!
      // Largest share is Tenant C (4 days), so Tenant C gets +1 centavo -> 6670!
      const result = calculateBillSplit({
        billAmountInput: '100.04',
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        tenants: [
          makeTenant({ id: 't1', name: 'Tenant A', mode: 'manual', manualDays: '1' }),
          makeTenant({ id: 't2', name: 'Tenant B', mode: 'manual', manualDays: '1' }),
          makeTenant({ id: 't3', name: 'Tenant C', mode: 'manual', manualDays: '4' }),
        ],
      });

      expect(result.isValid).toBe(true);
      expect(result.reconciliationDiffCentavos).toBe(1);
      expect(result.reconciledTenantId).toBe('t3');
      expect(result.tenantResults[0].finalShareCentavos).toBe(1667);
      expect(result.tenantResults[1].finalShareCentavos).toBe(1667);
      expect(result.tenantResults[2].roundedShareCentavos).toBe(6669);
      expect(result.tenantResults[2].adjustmentCentavos).toBe(1);
      expect(result.tenantResults[2].finalShareCentavos).toBe(6670);
      expect(result.totalSharesCentavos).toBe(10004);
    });

    it('assigns negative leftover centavo (-₱0.01) to the tenant with the largest share when rounded shares exceed total', () => {
      // Days: A = 1, B = 4, C = 1 (Total = 6), Bill = ₱100.00 (10000 centavos)
      // A: 1666.67 -> 1667
      // B: 6666.67 -> 6667
      // C: 1666.67 -> 1667
      // Sum = 10001 -> diff = -1 centavo assigned to B (largest share: 4 days) -> B gets 6666
      const result = calculateBillSplit({
        billAmountInput: '100.00',
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        tenants: [
          makeTenant({ id: 't1', name: 'Tenant A', mode: 'manual', manualDays: '1' }),
          makeTenant({ id: 't2', name: 'Tenant B', mode: 'manual', manualDays: '4' }),
          makeTenant({ id: 't3', name: 'Tenant C', mode: 'manual', manualDays: '1' }),
        ],
      });

      expect(result.isValid).toBe(true);
      expect(result.reconciliationDiffCentavos).toBe(-1);
      expect(result.reconciledTenantId).toBe('t2');
      expect(result.tenantResults[1].roundedShareCentavos).toBe(6667);
      expect(result.tenantResults[1].adjustmentCentavos).toBe(-1);
      expect(result.tenantResults[1].finalShareCentavos).toBe(6666);
      expect(result.totalSharesCentavos).toBe(10000);
    });
  });

  describe('Zero-day and validation edge cases', () => {
    it('fails validation when there are zero tenants', () => {
      const result = calculateBillSplit({
        billAmountInput: '2500.00',
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        tenants: [],
      });

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.tenants).toMatch(/at least one tenant/i);
    });

    it('fails validation when total tenant days equal 0', () => {
      const result = calculateBillSplit({
        billAmountInput: '2500.00',
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        tenants: [
          makeTenant({ id: 't1', name: 'Absent Tenant 1', mode: 'manual', manualDays: '0' }),
          makeTenant({
            id: 't2',
            name: 'Outside Period Tenant',
            mode: 'dates',
            startDate: '2026-09-01',
            endDate: '2026-09-15',
          }),
        ],
      });

      expect(result.isValid).toBe(false);
      expect(result.totalTenantDays).toBe(0);
      expect(result.fieldErrors.tenants).toMatch(/cannot be 0/i);
    });

    it('allows one tenant to have 0 days if another tenant has > 0 days', () => {
      const result = calculateBillSplit({
        billAmountInput: '2500.00',
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        tenants: [
          makeTenant({ id: 't1', name: 'Away All Month', mode: 'manual', manualDays: '0' }),
          makeTenant({ id: 't2', name: 'Present Tenant', mode: 'manual', manualDays: '25' }),
        ],
      });

      expect(result.isValid).toBe(true);
      expect(result.tenantResults[0].finalShareCentavos).toBe(0);
      expect(result.tenantResults[1].finalShareCentavos).toBe(250000);
    });

    it('fails validation when bill is empty, zero, negative, or non-numeric', () => {
      const base = {
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        tenants: [makeTenant({ id: 't1', name: 'Tenant 1' })],
      };

      expect(calculateBillSplit({ ...base, billAmountInput: '' }).isValid).toBe(false);
      expect(calculateBillSplit({ ...base, billAmountInput: '0' }).isValid).toBe(false);
      expect(calculateBillSplit({ ...base, billAmountInput: '-500' }).isValid).toBe(false);
      expect(calculateBillSplit({ ...base, billAmountInput: 'abc' }).isValid).toBe(false);
    });

    it('fails validation when tenant end date is earlier than start date', () => {
      const result = calculateBillSplit({
        billAmountInput: '3000.00',
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        tenants: [
          makeTenant({
            id: 't1',
            name: 'Inverted Dates Tenant',
            startDate: '2026-10-20',
            endDate: '2026-10-05',
          }),
        ],
      });

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.byTenantId['t1']).toMatch(/earlier than start date/i);
    });

    it('fails validation when billing period end date is earlier than start date', () => {
      const result = calculateBillSplit({
        billAmountInput: '3000.00',
        periodStart: '2026-10-31',
        periodEnd: '2026-10-01',
        tenants: [makeTenant({ id: 't1', name: 'Tenant 1' })],
      });

      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.periodDates).toMatch(/earlier than start date/i);
    });

    it('computes default month start and end dates accurately including leap years', () => {
      expect(getDefaultMonthPeriod(2026, 2)).toEqual({
        start: '2026-02-01',
        end: '2026-02-28',
        daysInMonth: 28,
      });
      expect(getDefaultMonthPeriod(2024, 2)).toEqual({
        start: '2024-02-01',
        end: '2024-02-29',
        daysInMonth: 29,
      });
    });
  });
});
