import { BillingMonthRecord } from './types';

export const DEFAULT_UNIT_NAME = 'Unit 4B — Sampaguita Residences';

export function createSampleBillingMonth(): BillingMonthRecord {
  return {
    id: 'sample-2026-10',
    year: 2026,
    month: 10,
    billAmountInput: '5480.00',
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
    updatedAt: '2026-10-31T09:30:00.000Z',
    tenants: [
      {
        id: 'tenant-andrea',
        name: 'Andrea Santos',
        mode: 'dates',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        manualDays: '31',
      },
      {
        id: 'tenant-marco',
        name: 'Marco Reyes',
        mode: 'dates',
        startDate: '2026-10-12',
        endDate: '2026-10-31',
        manualDays: '20',
      },
      {
        id: 'tenant-patricia',
        name: 'Patricia Lim',
        mode: 'dates',
        startDate: '2026-10-01',
        endDate: '2026-10-18',
        manualDays: '18',
      },
    ],
  };
}
