import { useEffect, useMemo, useState } from 'react';
import {
  calculateBillSplit,
  formatCentavos,
  getDefaultMonthPeriod,
  MONTH_NAMES,
  parseIsoDateToUtcMs,
  parsePesosToCentavos,
} from './calculator';
import { exportCombinedBillPdf, exportSingleTenantPdf } from './pdfExport';
import { createSampleBillingMonth, DEFAULT_UNIT_NAME } from './sampleData';
import {
  loadActiveMonthId,
  loadSavedMonths,
  loadUnitName,
  saveActiveMonthId,
  saveMonthsList,
  saveUnitName,
} from './storage';
import { BillingMonthRecord, StayInputMode, TenantStayInput } from './types';

function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function App() {
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

  function handleResetPeriodToFullMonth() {
    updateActiveRecord((prev) => ({
      ...prev,
      periodStart: defaultMonthBounds.start,
      periodEnd: defaultMonthBounds.end,
    }));
  }

  function handleAddTenant() {
    const newTenant: TenantStayInput = {
      id: createId('tenant'),
      name: `Tenant ${activeRecord.tenants.length + 1}`,
      mode: 'dates',
      startDate: activeRecord.periodStart,
      endDate: activeRecord.periodEnd,
      manualDays: String(splitResult.billingPeriodDays || defaultMonthBounds.daysInMonth),
    };
    updateActiveRecord((prev) => ({
      ...prev,
      tenants: [...prev.tenants, newTenant],
    }));
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

  function triggerToast(msg: string) {
    setSaveToast(msg);
    window.setTimeout(() => {
      setSaveToast((curr) => (curr === msg ? null : curr));
    }, 2400);
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

  // Compute visual occupancy bar position for each tenant
  function computeOccupancyBarStyle(
    tCalc: (typeof splitResult.tenantResults)[number]
  ): { left: string; width: string } {
    const totalPeriodDays = Math.max(1, splitResult.billingPeriodDays);
    if (tCalc.daysStayed <= 0) {
      return { left: '0%', width: '0%' };
    }

    if (
      tCalc.mode === 'dates' &&
      tCalc.clippedStart &&
      tCalc.clippedEnd
    ) {
      const periodStartMs = parseIsoDateToUtcMs(activeRecord.periodStart);
      const clipStartMs = parseIsoDateToUtcMs(tCalc.clippedStart);
      if (periodStartMs !== null && clipStartMs !== null) {
        const offsetDays = Math.max(
          0,
          Math.round((clipStartMs - periodStartMs) / 86_400_000)
        );
        const leftPct = Math.min(100, (offsetDays / totalPeriodDays) * 100);
        const widthPct = Math.min(
          100 - leftPct,
          (tCalc.daysStayed / totalPeriodDays) * 100
        );
        return {
          left: `${leftPct.toFixed(2)}%`,
          width: `${Math.max(2, widthPct).toFixed(2)}%`,
        };
      }
    }

    const ratioPct = Math.min(100, (tCalc.daysStayed / totalPeriodDays) * 100);
    return {
      left: '0%',
      width: `${Math.max(2, ratioPct).toFixed(2)}%`,
    };
  }

  const activeMonthTitle = `${MONTH_NAMES[activeRecord.month - 1]} ${activeRecord.year}`;

  return (
    <div>
      {/* Top Operational Bar */}
      <header className="topbar">
        <div className="topbar-brand">
          <span className="topbar-badge" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </span>
          <div>
            <h1 className="topbar-title">Monthly Electricity Bill Splitter</h1>
            <p className="topbar-subtitle">
              Single-meter apartment proration by tenant stay days (₱)
            </p>
          </div>
        </div>

        <div className="topbar-controls">
          <div className="unit-setting-field">
            <label htmlFor="unit-name-input" className="unit-setting-label">
              Unit Label (PDF):
            </label>
            <input
              id="unit-name-input"
              type="text"
              className="unit-setting-input"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="e.g. Unit 4B — Sampaguita Residences"
            />
          </div>

          {saveToast && (
            <span className="save-feedback-toast" role="status">
              {saveToast}
            </span>
          )}

          <button
            type="button"
            className="btn btn-shell"
            onClick={handleManualSaveConfirm}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save Month
          </button>

          <button
            type="button"
            className="btn btn-primary"
            disabled={!splitResult.isValid || exportingId !== null}
            onClick={handleExportCombined}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {exportingId === 'combined'
              ? 'Generating PDF…'
              : 'Export Combined PDF'}
          </button>
        </div>
      </header>

      <div className="workbench-layout">
        {/* Left History Rail */}
        <aside className="archive-rail" aria-label="Billing Month History">
          <div className="rail-header">
            <h2 className="rail-heading">Saved Billing Months</h2>
            <button
              type="button"
              className="btn-ghost-sm"
              onClick={handleCreateNewMonth}
            >
              + New Month
            </button>
          </div>

          <ul className="archive-list">
            {savedMonths.map((item) => {
              const parsedBill = parsePesosToCentavos(item.billAmountInput);
              const formattedBill =
                parsedBill.centavos !== null
                  ? formatCentavos(parsedBill.centavos)
                  : '₱0.00';
              const isSelected = item.id === activeRecord.id;
              const label = `${MONTH_NAMES[item.month - 1]} ${item.year}`;

              return (
                <li
                  key={item.id}
                  className={`archive-item ${isSelected ? 'is-active' : ''}`}
                >
                  <button
                    type="button"
                    className="archive-select-btn"
                    onClick={() => setActiveMonthId(item.id)}
                  >
                    <div className="archive-item-top">
                      <span className="archive-month-name">{label}</span>
                      <span className="archive-bill-amount">{formattedBill}</span>
                    </div>
                    <div className="archive-item-meta">
                      <span>
                        {item.tenants.length}{' '}
                        {item.tenants.length === 1 ? 'tenant' : 'tenants'}
                      </span>
                      <span>
                        {item.periodStart} – {item.periodEnd.slice(5)}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="archive-delete-btn"
                    onClick={() => handleDeleteMonth(item.id)}
                    aria-label={`Delete ${label}`}
                    title={`Delete ${label}`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="rail-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRestoreSampleData}
            >
              Load Sample Dataset (3 Tenants)
            </button>
          </div>
        </aside>

        {/* Main Calculation Workbench */}
        <main className="main-workspace">
          {/* 1. Billing Month Setup */}
          <section className="workspace-panel" aria-labelledby="setup-heading">
            <div className="section-header">
              <div>
                <h2 id="setup-heading" className="section-heading">
                  Billing Period &amp; Total Bill — {activeMonthTitle}
                </h2>
                <p className="section-note">
                  Enter the total peso bill from your electric utility statement.
                  Billing period defaults to the full calendar month.
                </p>
              </div>
              {isCustomPeriod && (
                <button
                  type="button"
                  className="btn-ghost-sm"
                  onClick={handleResetPeriodToFullMonth}
                >
                  Reset to Full Month ({defaultMonthBounds.start} –{' '}
                  {defaultMonthBounds.end})
                </button>
              )}
            </div>

            <div className="setup-grid">
              <div className="field-group">
                <div className="field-label-row">
                  <label htmlFor="billing-month-select" className="field-label">
                    Billing Month
                  </label>
                </div>
                <select
                  id="billing-month-select"
                  className="select-control"
                  value={activeRecord.month}
                  onChange={(e) =>
                    handleMonthOrYearChange(
                      Number(e.target.value),
                      activeRecord.year
                    )
                  }
                >
                  {MONTH_NAMES.map((mName, idx) => (
                    <option key={mName} value={idx + 1}>
                      {mName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <div className="field-label-row">
                  <label htmlFor="billing-year-input" className="field-label">
                    Billing Year
                  </label>
                </div>
                <input
                  id="billing-year-input"
                  type="number"
                  min={2000}
                  max={2100}
                  className="input-control tabular"
                  value={activeRecord.year}
                  onChange={(e) =>
                    handleMonthOrYearChange(
                      activeRecord.month,
                      Number.parseInt(e.target.value, 10)
                    )
                  }
                />
              </div>

              <div className="field-group">
                <div className="field-label-row">
                  <label htmlFor="bill-amount-input" className="field-label">
                    Total Bill Amount (₱)
                  </label>
                  <span className="field-hint">Utility total</span>
                </div>
                <div className="peso-input-wrapper">
                  <span className="peso-prefix" aria-hidden="true">
                    ₱
                  </span>
                  <input
                    id="bill-amount-input"
                    type="text"
                    inputMode="decimal"
                    className={`input-control ${
                      splitResult.fieldErrors.billAmount ? 'is-invalid' : ''
                    }`}
                    value={activeRecord.billAmountInput}
                    onChange={(e) =>
                      updateActiveRecord((prev) => ({
                        ...prev,
                        billAmountInput: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
                {splitResult.fieldErrors.billAmount && (
                  <p className="field-error-text" role="alert">
                    {splitResult.fieldErrors.billAmount}
                  </p>
                )}
              </div>

              <div className="field-group">
                <div className="field-label-row">
                  <span className="field-label">Billing Period Dates</span>
                  <span className="field-hint">
                    {splitResult.billingPeriodDays > 0
                      ? `${splitResult.billingPeriodDays} days`
                      : 'Invalid range'}
                  </span>
                </div>
                <div className="date-pair-grid">
                  <input
                    type="date"
                    aria-label="Billing Period Start Date"
                    className={`input-control tabular ${
                      splitResult.fieldErrors.periodDates ? 'is-invalid' : ''
                    }`}
                    value={activeRecord.periodStart}
                    onChange={(e) =>
                      updateActiveRecord((prev) => ({
                        ...prev,
                        periodStart: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="date"
                    aria-label="Billing Period End Date"
                    className={`input-control tabular ${
                      splitResult.fieldErrors.periodDates ? 'is-invalid' : ''
                    }`}
                    value={activeRecord.periodEnd}
                    onChange={(e) =>
                      updateActiveRecord((prev) => ({
                        ...prev,
                        periodEnd: e.target.value,
                      }))
                    }
                  />
                </div>
                {splitResult.fieldErrors.periodDates && (
                  <p className="field-error-text" role="alert">
                    {splitResult.fieldErrors.periodDates}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 2. Tenant Stays Editor */}
          <section className="workspace-panel" aria-labelledby="tenants-heading">
            <div className="section-header">
              <div>
                <h2 id="tenants-heading" className="section-heading">
                  Tenant Stays ({activeRecord.tenants.length})
                </h2>
                <p className="section-note">
                  Record inclusive stay dates (automatically clipped to{' '}
                  <span className="tabular">{activeRecord.periodStart}</span> –{' '}
                  <span className="tabular">{activeRecord.periodEnd}</span>) or
                  enter manual days stayed. One calendar day equals one stay day.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddTenant}
              >
                + Add Tenant
              </button>
            </div>

            <div className="tenant-roster">
              {activeRecord.tenants.map((tenant, index) => {
                const tCalc = splitResult.tenantResults[index];
                const rowError = splitResult.fieldErrors.byTenantId[tenant.id];

                return (
                  <div
                    key={tenant.id}
                    className={`tenant-row ${rowError ? 'has-error' : ''}`}
                  >
                    <div className="tenant-row-grid">
                      {/* Tenant Name */}
                      <div className="field-group">
                        <label
                          htmlFor={`tenant-name-${tenant.id}`}
                          className="field-label"
                        >
                          Tenant Name
                        </label>
                        <input
                          id={`tenant-name-${tenant.id}`}
                          type="text"
                          className={`input-control ${
                            !tenant.name.trim() ? 'is-invalid' : ''
                          }`}
                          value={tenant.name}
                          onChange={(e) =>
                            handleUpdateTenant(tenant.id, {
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter tenant name"
                        />
                      </div>

                      {/* Stay Entry Mode */}
                      <div className="field-group">
                        <span className="field-label">Stay Entry Method</span>
                        <div
                          className="mode-segmented"
                          role="group"
                          aria-label={`Stay entry method for ${tenant.name || 'tenant'}`}
                        >
                          <button
                            type="button"
                            className={`mode-segment-btn ${
                              tenant.mode === 'dates' ? 'is-selected' : ''
                            }`}
                            onClick={() =>
                              handleUpdateTenant(tenant.id, {
                                mode: 'dates' as StayInputMode,
                              })
                            }
                          >
                            Date Range
                          </button>
                          <button
                            type="button"
                            className={`mode-segment-btn ${
                              tenant.mode === 'manual' ? 'is-selected' : ''
                            }`}
                            onClick={() =>
                              handleUpdateTenant(tenant.id, {
                                mode: 'manual' as StayInputMode,
                                manualDays: String(tCalc?.daysStayed ?? 0),
                              })
                            }
                          >
                            Manual Days
                          </button>
                        </div>
                      </div>

                      {/* Stay Dates OR Manual Days Input */}
                      {tenant.mode === 'dates' ? (
                        <div className="field-group">
                          <div className="field-label-row">
                            <span className="field-label">
                              Stay Start &amp; End (Inclusive)
                            </span>
                          </div>
                          <div className="date-pair-grid">
                            <input
                              type="date"
                              aria-label={`Start date for ${tenant.name}`}
                              className={`input-control tabular ${
                                rowError ? 'is-invalid' : ''
                              }`}
                              value={tenant.startDate}
                              onChange={(e) =>
                                handleUpdateTenant(tenant.id, {
                                  startDate: e.target.value,
                                })
                              }
                            />
                            <input
                              type="date"
                              aria-label={`End date for ${tenant.name}`}
                              className={`input-control tabular ${
                                rowError ? 'is-invalid' : ''
                              }`}
                              value={tenant.endDate}
                              onChange={(e) =>
                                handleUpdateTenant(tenant.id, {
                                  endDate: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="field-group">
                          <label
                            htmlFor={`tenant-manual-${tenant.id}`}
                            className="field-label"
                          >
                            Manual Days Stayed
                          </label>
                          <input
                            id={`tenant-manual-${tenant.id}`}
                            type="number"
                            min={0}
                            max={366}
                            step={1}
                            className={`input-control tabular ${
                              rowError ? 'is-invalid' : ''
                            }`}
                            value={tenant.manualDays}
                            onChange={(e) =>
                              handleUpdateTenant(tenant.id, {
                                manualDays: e.target.value,
                              })
                            }
                            placeholder="e.g. 15"
                          />
                        </div>
                      )}

                      {/* Counted Days Readout */}
                      <div className="field-group">
                        <span className="field-label">Counted Stay</span>
                        <div className="stay-days-readout">
                          <span>{tCalc?.daysStayed ?? 0}</span>
                          <span className="field-hint">
                            {(tCalc?.daysStayed ?? 0) === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                      </div>

                      {/* Delete Tenant Action */}
                      <div className="field-group">
                        <button
                          type="button"
                          className="btn-danger-sm"
                          onClick={() => handleDeleteTenant(tenant.id)}
                          aria-label={`Remove ${tenant.name || 'tenant'}`}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>

                    {(rowError || tCalc?.wasClipped) && (
                      <div className="tenant-row-footnote">
                        {rowError ? (
                          <p className="field-error-text" role="alert">
                            {rowError}
                          </p>
                        ) : tCalc?.wasClipped ? (
                          <span className="clipped-badge">
                            {tCalc.clippedStart && tCalc.clippedEnd
                              ? `Clipped to billing period: ${tCalc.clippedStart} – ${tCalc.clippedEnd} (${tCalc.daysStayed} days counted)`
                              : 'Dates fall completely outside the billing period (0 days counted)'}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. Calculation & Split Output */}
          <section className="workspace-panel" aria-labelledby="results-heading">
            <div className="section-header">
              <div>
                <h2 id="results-heading" className="section-heading">
                  Bill Allocation &amp; Per-Tenant Shares
                </h2>
                <p className="section-note">
                  Vacant calendar days are ignored so 100% of the utility bill is
                  recovered across active tenant-days.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!splitResult.isValid || exportingId !== null}
                onClick={handleExportCombined}
              >
                Download Combined PDF Statement
              </button>
            </div>

            {!splitResult.isValid ? (
              <div className="validation-alert" role="alert">
                <h3 className="validation-alert-title">
                  Resolve the following before calculating shares:
                </h3>
                <ul className="validation-alert-list">
                  {splitResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                {/* Signature Move: Billing Period Occupancy Tick-Rail & Span Strip */}
                <div className="occupancy-strip-container">
                  <div className="occupancy-strip-header">
                    <span>
                      <strong>Billing Period Occupancy Schedule:</strong>{' '}
                      <span className="tabular">{activeRecord.periodStart}</span>{' '}
                      to <span className="tabular">{activeRecord.periodEnd}</span>{' '}
                      ({splitResult.billingPeriodDays} calendar days)
                    </span>
                    <span className="tabular">
                      Total Active Tenant-Days: {splitResult.totalTenantDays}
                    </span>
                  </div>

                  <div className="occupancy-ruler" aria-hidden="true">
                    <span>Tenant</span>
                    <div className="ruler-ticks">
                      <span>Day 1</span>
                      <span>
                        Day {Math.ceil(splitResult.billingPeriodDays / 2)}
                      </span>
                      <span>Day {splitResult.billingPeriodDays}</span>
                    </div>
                    <span style={{ textAlign: 'right' }}>Stay</span>
                  </div>

                  <div className="occupancy-tracks">
                    {splitResult.tenantResults.map((tCalc) => {
                      const barStyle = computeOccupancyBarStyle(tCalc);
                      return (
                        <div key={tCalc.tenantId} className="occupancy-track-row">
                          <span
                            className="occupancy-tenant-name"
                            title={tCalc.name}
                          >
                            {tCalc.name}
                          </span>
                          <div className="occupancy-bar-bed">
                            <div
                              className={`occupancy-bar-fill ${
                                tCalc.mode === 'manual' ? 'is-manual' : ''
                              }`}
                              style={barStyle}
                              title={`${tCalc.name}: ${tCalc.daysStayed} days`}
                            />
                          </div>
                          <span className="occupancy-day-count">
                            {tCalc.daysStayed}d
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Transparent Per-Day Rate & Centavo Reconciliation Bar */}
                <div className="formula-strip">
                  <div className="formula-equation">
                    <span>Per-Day Rate:</span>
                    <span className="formula-rate-highlight">
                      {formatCentavos(splitResult.perDayRateRoundedCentavos)} /
                      tenant-day
                    </span>
                    <span className="tabular">
                      ({formatCentavos(splitResult.totalBillCentavos)} ÷{' '}
                      {splitResult.totalTenantDays} total tenant-days)
                    </span>
                  </div>

                  <span className="reconciled-pill">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {splitResult.reconciliationDiffCentavos === 0
                      ? 'Exact centavo match (₱0.00 remainder)'
                      : `Reconciled (${
                          splitResult.reconciliationDiffCentavos > 0 ? '+' : ''
                        }${formatCentavos(
                          splitResult.reconciliationDiffCentavos
                        )} applied to largest share)`}
                  </span>
                </div>

                {/* Per-Tenant Split Table */}
                <div className="table-scroll-wrapper">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th scope="col">Tenant Name</th>
                        <th scope="col" className="col-num">
                          Days Stayed
                        </th>
                        <th scope="col" className="col-num">
                          Share Ratio
                        </th>
                        <th scope="col" className="col-num">
                          Per-Day Rate
                        </th>
                        <th scope="col" className="col-num">
                          Amount Due (₱)
                        </th>
                        <th scope="col" className="col-action">
                          Individual PDF
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {splitResult.tenantResults.map((tCalc) => (
                        <tr key={tCalc.tenantId}>
                          <td>
                            <div className="tenant-cell-primary">
                              {tCalc.name}
                            </div>
                            <div className="tenant-cell-sub tabular">
                              {tCalc.mode === 'manual'
                                ? 'Manual day entry'
                                : tCalc.clippedStart && tCalc.clippedEnd
                                  ? `${tCalc.clippedStart} to ${tCalc.clippedEnd}${
                                      tCalc.wasClipped ? ' (clipped)' : ''
                                    }`
                                  : 'Outside billing period'}
                            </div>
                          </td>
                          <td className="col-num">
                            {tCalc.daysStayed}{' '}
                            {tCalc.daysStayed === 1 ? 'day' : 'days'}
                          </td>
                          <td className="col-num">
                            {tCalc.daysStayed}/{splitResult.totalTenantDays} (
                            {tCalc.sharePercentage.toFixed(1)}%)
                          </td>
                          <td className="col-num">
                            {formatCentavos(
                              splitResult.perDayRateRoundedCentavos
                            )}
                          </td>
                          <td className="col-num">
                            <strong>
                              {formatCentavos(tCalc.finalShareCentavos)}
                            </strong>
                            {tCalc.adjustmentCentavos !== 0 && (
                              <span
                                className="adj-badge"
                                title="Centavo rounding remainder assigned to the tenant with the largest share"
                              >
                                {tCalc.adjustmentCentavos > 0 ? '+' : ''}
                                {formatCentavos(tCalc.adjustmentCentavos)} adj
                              </span>
                            )}
                          </td>
                          <td className="col-action">
                            <button
                              type="button"
                              className="btn-ghost-sm"
                              onClick={() => handleExportSingle(tCalc.tenantId)}
                              disabled={exportingId !== null}
                            >
                              {exportingId === tCalc.tenantId
                                ? 'Saving…'
                                : 'PDF Slip'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td>
                          Total Summary ({splitResult.tenantResults.length}{' '}
                          {splitResult.tenantResults.length === 1
                            ? 'tenant'
                            : 'tenants'}
                          )
                        </td>
                        <td className="col-num">
                          {splitResult.totalTenantDays} days
                        </td>
                        <td className="col-num">100.0%</td>
                        <td className="col-num">
                          {formatCentavos(
                            splitResult.perDayRateRoundedCentavos
                          )}
                          /day
                        </td>
                        <td className="col-num">
                          <div>
                            Shares: {formatCentavos(splitResult.totalSharesCentavos)}
                          </div>
                          <div style={{ fontSize: '0.78125rem', opacity: 0.9 }}>
                            Bill: {formatCentavos(splitResult.totalBillCentavos)}
                          </div>
                        </td>
                        <td className="col-action">Reconciled</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
