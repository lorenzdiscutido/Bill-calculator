import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  calculateBillSplit,
  getDefaultMonthPeriod,
  MONTH_NAMES,
} from '../calculator';
import { exportCombinedBillPdf, exportSingleTenantPdf } from '../pdfExport';
import { createSampleBillingMonth, DEFAULT_UNIT_NAME } from '../sampleData';
import {
  loadActiveMonthId,
  loadSavedMonths,
  loadUnitName,
  saveActiveMonthId,
  saveMonthsList,
  saveUnitName,
} from '../storage';
import { BillingMonthRecord, BillSplitResult, TenantStayInput } from '../types';

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export interface UseBillCalculatorReturn {
  unitName: string;
  setUnitName: (value: string) => void;
  savedMonths: BillingMonthRecord[];
  activeRecord: BillingMonthRecord;
  activeMonthTitle: string;
  splitResult: BillSplitResult;
  defaultMonthBounds: { start: string; end: string; daysInMonth: number };
  isCustomPeriod: boolean;
  saveToast: string | null;
  exportingId: string | null;
  quickTenantName: string;
  setQuickTenantName: (value: string) => void;
  mobileArchiveOpen: boolean;
  handleToggleMobileArchive: () => void;
  handleSelectMonth: (monthId: string) => void;
  handleMonthOrYearChange: (newMonth: number, newYear: number) => void;
  handleBillAmountChange: (billAmountInput: string) => void;
  handlePeriodStartChange: (periodStart: string) => void;
  handlePeriodEndChange: (periodEnd: string) => void;
  handleResetPeriodToFullMonth: () => void;
  handleAddTenant: (nameOverride?: string) => void;
  handleQuickAddTenant: (e: FormEvent) => void;
  handleUpdateTenant: (
    tenantId: string,
    patch: Partial<TenantStayInput>
  ) => void;
  handleDeleteTenant: (tenantId: string) => void;
  handleCreateNewMonth: () => void;
  handleDeleteMonth: (monthId: string) => void;
  handleRestoreSampleData: () => void;
  handleManualSaveConfirm: () => void;
  handleExportCombined: () => Promise<void>;
  handleExportSingle: (tenantId: string) => Promise<void>;
}

export function useBillCalculator(): UseBillCalculatorReturn {
  const [unitName, setUnitName] = useState<string>(() => loadUnitName());
  const [savedMonths, setSavedMonths] = useState<BillingMonthRecord[]>(() =>
    loadSavedMonths()
  );
  const [activeMonthId, setActiveMonthId] = useState<string>(() => {
    const initialMonths = loadSavedMonths();
    const storedId = loadActiveMonthId(initialMonths[0]?.id ?? '');
    return initialMonths.some((m) => m.id === storedId)
      ? storedId
      : (initialMonths[0]?.id ?? '');
  });
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [quickTenantName, setQuickTenantName] = useState<string>('');
  const [mobileArchiveOpen, setMobileArchiveOpen] = useState<boolean>(false);

  const activeRecord = useMemo(() => {
    return (
      savedMonths.find((m) => m.id === activeMonthId) ??
      savedMonths[0] ??
      createSampleBillingMonth()
    );
  }, [savedMonths, activeMonthId]);

  useEffect(() => {
    saveUnitName(unitName);
  }, [unitName]);

  useEffect(() => {
    saveMonthsList(savedMonths);
  }, [savedMonths]);

  useEffect(() => {
    if (activeRecord?.id) {
      saveActiveMonthId(activeRecord.id);
    }
  }, [activeRecord?.id]);

  const splitResult = useMemo(
    () => calculateBillSplit(activeRecord),
    [activeRecord]
  );

  const defaultMonthBounds = useMemo(
    () => getDefaultMonthPeriod(activeRecord.year, activeRecord.month),
    [activeRecord.year, activeRecord.month]
  );

  const isCustomPeriod =
    activeRecord.periodStart !== defaultMonthBounds.start ||
    activeRecord.periodEnd !== defaultMonthBounds.end;

  function updateActiveRecord(
    updater: (prev: BillingMonthRecord) => BillingMonthRecord
  ) {
    setSavedMonths((prevList) =>
      prevList.map((item) =>
        item.id === activeRecord.id
          ? { ...updater(item), updatedAt: new Date().toISOString() }
          : item
      )
    );
  }

  function triggerToast(msg: string) {
    setSaveToast(msg);
    window.setTimeout(() => {
      setSaveToast((curr) => (curr === msg ? null : curr));
    }, 2400);
  }

  function handleToggleMobileArchive() {
    setMobileArchiveOpen((prev) => !prev);
  }

  function handleSelectMonth(monthId: string) {
    setActiveMonthId(monthId);
    setMobileArchiveOpen(false);
  }

  function handleMonthOrYearChange(newMonth: number, newYear: number) {
    const validYear = Math.max(2000, Math.min(2100, newYear || 2026));
    const oldDefault = getDefaultMonthPeriod(
      activeRecord.year,
      activeRecord.month
    );
    const newDefault = getDefaultMonthPeriod(validYear, newMonth);

    updateActiveRecord((prev) => {
      const wasUsingDefault =
        prev.periodStart === oldDefault.start &&
        prev.periodEnd === oldDefault.end;

      const nextPeriodStart = wasUsingDefault
        ? newDefault.start
        : prev.periodStart;
      const nextPeriodEnd = wasUsingDefault ? newDefault.end : prev.periodEnd;

      const updatedTenants = prev.tenants.map((t) => {
        if (
          t.mode === 'dates' &&
          t.startDate === oldDefault.start &&
          t.endDate === oldDefault.end
        ) {
          return {
            ...t,
            startDate: newDefault.start,
            endDate: newDefault.end,
            manualDays: String(newDefault.daysInMonth),
          };
        }
        return t;
      });

      return {
        ...prev,
        month: newMonth,
        year: validYear,
        periodStart: nextPeriodStart,
        periodEnd: nextPeriodEnd,
        tenants: updatedTenants,
      };
    });
  }

  function handleBillAmountChange(billAmountInput: string) {
    updateActiveRecord((prev) => ({
      ...prev,
      billAmountInput,
    }));
  }

  function handlePeriodStartChange(periodStart: string) {
    updateActiveRecord((prev) => ({
      ...prev,
      periodStart,
    }));
  }

  function handlePeriodEndChange(periodEnd: string) {
    updateActiveRecord((prev) => ({
      ...prev,
      periodEnd,
    }));
  }

  function handleResetPeriodToFullMonth() {
    updateActiveRecord((prev) => ({
      ...prev,
      periodStart: defaultMonthBounds.start,
      periodEnd: defaultMonthBounds.end,
    }));
  }

  function handleAddTenant(nameOverride?: string) {
    const chosenName =
      typeof nameOverride === 'string' && nameOverride.trim()
        ? nameOverride.trim()
        : `Tenant ${activeRecord.tenants.length + 1}`;

    const newTenant: TenantStayInput = {
      id: createId('tenant'),
      name: chosenName,
      mode: 'dates',
      startDate: activeRecord.periodStart,
      endDate: activeRecord.periodEnd,
      manualDays: String(
        splitResult.billingPeriodDays || defaultMonthBounds.daysInMonth
      ),
    };
    updateActiveRecord((prev) => ({
      ...prev,
      tenants: [...prev.tenants, newTenant],
    }));
  }

  function handleQuickAddTenant(e: FormEvent) {
    e.preventDefault();
    handleAddTenant(quickTenantName);
    setQuickTenantName('');
  }

  function handleUpdateTenant(
    tenantId: string,
    patch: Partial<TenantStayInput>
  ) {
    updateActiveRecord((prev) => ({
      ...prev,
      tenants: prev.tenants.map((t) =>
        t.id === tenantId ? { ...t, ...patch } : t
      ),
    }));
  }

  function handleDeleteTenant(tenantId: string) {
    updateActiveRecord((prev) => ({
      ...prev,
      tenants: prev.tenants.filter((t) => t.id !== tenantId),
    }));
  }

  function handleCreateNewMonth() {
    const latest = savedMonths[0] ?? activeRecord;
    let nextMonth = latest.month + 1;
    let nextYear = latest.year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    const bounds = getDefaultMonthPeriod(nextYear, nextMonth);
    const carriedTenants: TenantStayInput[] =
      activeRecord.tenants.length > 0
        ? activeRecord.tenants.map((t) => ({
            id: createId('tenant'),
            name: t.name,
            mode: t.mode,
            startDate: bounds.start,
            endDate: bounds.end,
            manualDays: String(bounds.daysInMonth),
          }))
        : [
            {
              id: createId('tenant'),
              name: 'Tenant 1',
              mode: 'dates',
              startDate: bounds.start,
              endDate: bounds.end,
              manualDays: String(bounds.daysInMonth),
            },
          ];

    const newRecord: BillingMonthRecord = {
      id: createId('month'),
      year: nextYear,
      month: nextMonth,
      billAmountInput: activeRecord.billAmountInput || '5000.00',
      periodStart: bounds.start,
      periodEnd: bounds.end,
      tenants: carriedTenants,
      updatedAt: new Date().toISOString(),
    };

    setSavedMonths((prev) => [newRecord, ...prev]);
    setActiveMonthId(newRecord.id);
    triggerToast(`Created ${MONTH_NAMES[nextMonth - 1]} ${nextYear}`);
  }

  function handleDeleteMonth(monthId: string) {
    setSavedMonths((prev) => {
      const remaining = prev.filter((m) => m.id !== monthId);
      if (remaining.length === 0) {
        const fallback = createSampleBillingMonth();
        setActiveMonthId(fallback.id);
        return [fallback];
      }
      if (activeMonthId === monthId) {
        setActiveMonthId(remaining[0].id);
      }
      return remaining;
    });
  }

  function handleRestoreSampleData() {
    const sample = createSampleBillingMonth();
    setSavedMonths((prev) => {
      const withoutSample = prev.filter((m) => m.id !== sample.id);
      return [sample, ...withoutSample];
    });
    setActiveMonthId(sample.id);
    setUnitName(DEFAULT_UNIT_NAME);
    triggerToast('Sample month restored');
  }

  function handleManualSaveConfirm() {
    saveMonthsList(savedMonths);
    saveUnitName(unitName);
    triggerToast('Saved to local history');
  }

  async function handleExportCombined() {
    if (!splitResult.isValid) return;
    setExportingId('combined');
    try {
      await exportCombinedBillPdf(activeRecord, splitResult, unitName);
    } finally {
      setExportingId(null);
    }
  }

  async function handleExportSingle(tenantId: string) {
    if (!splitResult.isValid) return;
    const tenantCalc = splitResult.tenantResults.find(
      (t) => t.tenantId === tenantId
    );
    if (!tenantCalc) return;
    setExportingId(tenantId);
    try {
      await exportSingleTenantPdf(
        activeRecord,
        splitResult,
        tenantCalc,
        unitName
      );
    } finally {
      setExportingId(null);
    }
  }

  const activeMonthTitle = `${MONTH_NAMES[activeRecord.month - 1]} ${activeRecord.year}`;

  return {
    unitName,
    setUnitName,
    savedMonths,
    activeRecord,
    activeMonthTitle,
    splitResult,
    defaultMonthBounds,
    isCustomPeriod,
    saveToast,
    exportingId,
    quickTenantName,
    setQuickTenantName,
    mobileArchiveOpen,
    handleToggleMobileArchive,
    handleSelectMonth,
    handleMonthOrYearChange,
    handleBillAmountChange,
    handlePeriodStartChange,
    handlePeriodEndChange,
    handleResetPeriodToFullMonth,
    handleAddTenant,
    handleQuickAddTenant,
    handleUpdateTenant,
    handleDeleteTenant,
    handleCreateNewMonth,
    handleDeleteMonth,
    handleRestoreSampleData,
    handleManualSaveConfirm,
    handleExportCombined,
    handleExportSingle,
  };
}
