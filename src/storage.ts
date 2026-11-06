import { createSampleBillingMonth, DEFAULT_UNIT_NAME } from './sampleData';
import { BillingMonthRecord } from './types';

const STORAGE_KEYS = {
  UNIT_NAME: 'mebs_unit_name_v1',
  MONTHS: 'mebs_billing_months_v1',
  ACTIVE_ID: 'mebs_active_month_id_v1',
} as const;

export function loadUnitName(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.UNIT_NAME);
    return stored !== null ? stored : DEFAULT_UNIT_NAME;
  } catch {
    return DEFAULT_UNIT_NAME;
  }
}

export function saveUnitName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.UNIT_NAME, name);
  } catch {
    // Ignore storage quota errors
  }
}

export function loadSavedMonths(): BillingMonthRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MONTHS);
    if (!raw) {
      const sample = [createSampleBillingMonth()];
      saveMonthsList(sample);
      return sample;
    }
    const parsed = JSON.parse(raw) as BillingMonthRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const sample = [createSampleBillingMonth()];
      saveMonthsList(sample);
      return sample;
    }
    return parsed;
  } catch {
    return [createSampleBillingMonth()];
  }
}

export function saveMonthsList(months: BillingMonthRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MONTHS, JSON.stringify(months));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadActiveMonthId(fallbackId: string): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ID) || fallbackId;
  } catch {
    return fallbackId;
  }
}

export function saveActiveMonthId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, id);
  } catch {
    // Ignore storage quota errors
  }
}
