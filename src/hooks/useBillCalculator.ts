import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  calculateBillSplit,
  countInclusiveDays,
  getDefaultMonthPeriod,
  MONTH_NAMES,
} from '../calculator';
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

export interface BillCalculatorState {
  unitName: string;
  savedMonths: BillingMonthRecord[];
  activeRecord: BillingMonthRecord;
  activeMonthTitle: string;
  splitResult: BillSplitResult;
  defaultMonthBounds: { start: string; end: string; daysInMonth: number };
  isCustomPeriod: boolean;
  saveToast: string | null;
  exportingId: string | null;
  quickTenantName: string;
  mobileArchiveOpen: boolean;
}

export interface BillCalculatorActions {
  setUnitName: (value: string) => void;
  setQuickTenantName: (value: string) => void;
  toggleMobileArchive: () => void;
  selectMonth: (monthId: string) => void;
  changeMonthOrYear: (newMonth: number, newYear: number) => void;
  changeBillAmount: (billAmountInput: string) => void;
  changePeriodStart: (periodStart: string) => void;
  changePeriodEnd: (periodEnd: string) => void;
  resetPeriodToFullMonth: () => void;
  addTenant: (nameOverride?: string) => void;
  quickAddTenant: (e: FormEvent) => void;
  updateTenant: (tenantId: string, patch: Partial<TenantStayInput>) => void;
  deleteTenant: (tenantId: string) => void;
  createNewMonth: () => void;
  deleteMonth: (monthId: string) => void;
  restoreSampleData: () => void;
  manualSaveConfirm: () => void;
  exportCombined: () => Promise<void>;
  exportSingle: (tenantId: string) => Promise<void>;
}

export interface UseBillCalculatorReturn {
  state: BillCalculatorState;
  actions: BillCalculatorActions;
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
    const timer = window.setTimeout(() => {
      saveUnitName(unitName);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [unitName]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveMonthsList(savedMonths);
    }, 250);
    return () => window.clearTimeout(timer);
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

  const updateActiveRecord = useCallback(
    (updater: (prev: BillingMonthRecord) => BillingMonthRecord) => {
      setSavedMonths((prevList) =>
        prevList.map((item) =>
          item.id === activeMonthId
            ? { ...updater(item), updatedAt: new Date().toISOString() }
            : item
        )
      );
    },
    [activeMonthId]
  );

  const triggerToast = useCallback((msg: string) => {
    setSaveToast(msg);
    window.setTimeout(() => {
      setSaveToast((curr) => (curr === msg ? null : curr));
    }, 2400);
  }, []);

  const handleToggleMobileArchive = useCallback(() => {
    setMobileArchiveOpen((prev) => !prev);
  }, []);

  const handleSelectMonth = useCallback((monthId: string) => {
    setActiveMonthId(monthId);
    setMobileArchiveOpen(false);
  }, []);

  const handleMonthOrYearChange = useCallback(
    (newMonth: number, newYear: number) => {
      const validYear = Math.max(2000, Math.min(2100, newYear || 2026));

      updateActiveRecord((prev) => {
        const oldDefault = getDefaultMonthPeriod(prev.year, prev.month);
        const newDefault = getDefaultMonthPeriod(validYear, newMonth);

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
    },
    [updateActiveRecord]
  );

  const handleBillAmountChange = useCallback(
    (billAmountInput: string) => {
      updateActiveRecord((prev) => ({
        ...prev,
        billAmountInput,
      }));
    },
    [updateActiveRecord]
  );

  const handlePeriodStartChange = useCallback(
    (periodStart: string) => {
      updateActiveRecord((prev) => ({
        ...prev,
        periodStart,
      }));
    },
    [updateActiveRecord]
  );

  const handlePeriodEndChange = useCallback(
    (periodEnd: string) => {
      updateActiveRecord((prev) => ({
        ...prev,
        periodEnd,
      }));
    },
    [updateActiveRecord]
  );

  const handleResetPeriodToFullMonth = useCallback(() => {
    updateActiveRecord((prev) => {
      const defaultBounds = getDefaultMonthPeriod(prev.year, prev.month);
      return {
        ...prev,
        periodStart: defaultBounds.start,
        periodEnd: defaultBounds.end,
      };
    });
  }, [updateActiveRecord]);

  const handleAddTenant = useCallback(
    (nameOverride?: string) => {
      updateActiveRecord((prev) => {
        const chosenName =
          typeof nameOverride === 'string' && nameOverride.trim()
            ? nameOverride.trim()
            : `Tenant ${prev.tenants.length + 1}`;

        const bounds = getDefaultMonthPeriod(prev.year, prev.month);
        const days =
          countInclusiveDays(prev.periodStart, prev.periodEnd) ||
          bounds.daysInMonth;

        const newTenant: TenantStayInput = {
          id: createId('tenant'),
          name: chosenName,
          mode: 'dates',
          startDate: prev.periodStart,
          endDate: prev.periodEnd,
          manualDays: String(days),
        };

        return {
          ...prev,
          tenants: [...prev.tenants, newTenant],
        };
      });
    },
    [updateActiveRecord]
  );

  const handleQuickAddTenant = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      handleAddTenant(quickTenantName);
      setQuickTenantName('');
    },
    [handleAddTenant, quickTenantName]
  );

  const handleUpdateTenant = useCallback(
    (tenantId: string, patch: Partial<TenantStayInput>) => {
      updateActiveRecord((prev) => ({
        ...prev,
        tenants: prev.tenants.map((t) =>
          t.id === tenantId ? { ...t, ...patch } : t
        ),
      }));
    },
    [updateActiveRecord]
  );

  const handleDeleteTenant = useCallback(
    (tenantId: string) => {
      updateActiveRecord((prev) => ({
        ...prev,
        tenants: prev.tenants.filter((t) => t.id !== tenantId),
      }));
    },
    [updateActiveRecord]
  );

  const handleCreateNewMonth = useCallback(() => {
    setSavedMonths((prev) => {
      const active =
        prev.find((m) => m.id === activeMonthId) ??
        prev[0] ??
        createSampleBillingMonth();
      const latest = prev[0] ?? active;
      let nextMonth = latest.month + 1;
      let nextYear = latest.year;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }

      const bounds = getDefaultMonthPeriod(nextYear, nextMonth);
      const carriedTenants: TenantStayInput[] =
        active.tenants.length > 0
          ? active.tenants.map((t) => ({
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
        billAmountInput: active.billAmountInput || '5000.00',
        periodStart: bounds.start,
        periodEnd: bounds.end,
        tenants: carriedTenants,
        updatedAt: new Date().toISOString(),
      };

      setActiveMonthId(newRecord.id);
      triggerToast(`Created ${MONTH_NAMES[nextMonth - 1]} ${nextYear}`);
      return [newRecord, ...prev];
    });
  }, [activeMonthId, triggerToast]);

  const handleDeleteMonth = useCallback((monthId: string) => {
    setSavedMonths((prev) => {
      const remaining = prev.filter((m) => m.id !== monthId);
      if (remaining.length === 0) {
        const fallback = createSampleBillingMonth();
        setActiveMonthId(fallback.id);
        return [fallback];
      }
      setActiveMonthId((currentActiveId) =>
        currentActiveId === monthId ? remaining[0].id : currentActiveId
      );
      return remaining;
    });
  }, []);

  const handleRestoreSampleData = useCallback(() => {
    const sample = createSampleBillingMonth();
    setSavedMonths((prev) => {
      const withoutSample = prev.filter((m) => m.id !== sample.id);
      return [sample, ...withoutSample];
    });
    setActiveMonthId(sample.id);
    setUnitName(DEFAULT_UNIT_NAME);
    triggerToast('Sample month restored');
  }, [triggerToast]);

  const handleManualSaveConfirm = useCallback(() => {
    saveMonthsList(savedMonths);
    saveUnitName(unitName);
    triggerToast('Saved to local history');
  }, [savedMonths, unitName, triggerToast]);

  const handleExportCombined = useCallback(async () => {
    if (!splitResult.isValid) return;
    setExportingId('combined');
    try {
      const { exportCombinedBillPdf } = await import('../pdfExport');
      await exportCombinedBillPdf(activeRecord, splitResult, unitName);
    } finally {
      setExportingId(null);
    }
  }, [activeRecord, splitResult, unitName]);

  const handleExportSingle = useCallback(
    async (tenantId: string) => {
      if (!splitResult.isValid) return;
      const tenantCalc = splitResult.tenantResults.find(
        (t) => t.tenantId === tenantId
      );
      if (!tenantCalc) return;
      setExportingId(tenantId);
      try {
        const { exportSingleTenantPdf } = await import('../pdfExport');
        await exportSingleTenantPdf(
          activeRecord,
          splitResult,
          tenantCalc,
          unitName
        );
      } finally {
        setExportingId(null);
      }
    },
    [activeRecord, splitResult, unitName]
  );

  const activeMonthTitle = `${MONTH_NAMES[activeRecord.month - 1]} ${activeRecord.year}`;

  return {
    state: {
      unitName,
      savedMonths,
      activeRecord,
      activeMonthTitle,
      splitResult,
      defaultMonthBounds,
      isCustomPeriod,
      saveToast,
      exportingId,
      quickTenantName,
      mobileArchiveOpen,
    },
    actions: {
      setUnitName,
      setQuickTenantName,
      toggleMobileArchive: handleToggleMobileArchive,
      selectMonth: handleSelectMonth,
      changeMonthOrYear: handleMonthOrYearChange,
      changeBillAmount: handleBillAmountChange,
      changePeriodStart: handlePeriodStartChange,
      changePeriodEnd: handlePeriodEndChange,
      resetPeriodToFullMonth: handleResetPeriodToFullMonth,
      addTenant: handleAddTenant,
      quickAddTenant: handleQuickAddTenant,
      updateTenant: handleUpdateTenant,
      deleteTenant: handleDeleteTenant,
      createNewMonth: handleCreateNewMonth,
      deleteMonth: handleDeleteMonth,
      restoreSampleData: handleRestoreSampleData,
      manualSaveConfirm: handleManualSaveConfirm,
      exportCombined: handleExportCombined,
      exportSingle: handleExportSingle,
    },
  };
}
