import { MONTH_NAMES } from '../calculator';
import { BillingMonthRecord, ValidationFieldErrors } from '../types';

export interface BillingFormProps {
  activeRecord: BillingMonthRecord;
  activeMonthTitle: string;
  isCustomPeriod: boolean;
  defaultMonthBounds: { start: string; end: string; daysInMonth: number };
  billingPeriodDays: number;
  fieldErrors: ValidationFieldErrors;
  onMonthOrYearChange: (newMonth: number, newYear: number) => void;
  onBillAmountChange: (billAmountInput: string) => void;
  onPeriodStartChange: (periodStart: string) => void;
  onPeriodEndChange: (periodEnd: string) => void;
  onResetPeriodToFullMonth: () => void;
}

export function BillingForm({
  activeRecord,
  activeMonthTitle,
  isCustomPeriod,
  defaultMonthBounds,
  billingPeriodDays,
  fieldErrors,
  onMonthOrYearChange,
  onBillAmountChange,
  onPeriodStartChange,
  onPeriodEndChange,
  onResetPeriodToFullMonth,
}: BillingFormProps) {
  return (
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
            onClick={onResetPeriodToFullMonth}
          >
            Reset to Full Month ({defaultMonthBounds.start} –{' '}
            {defaultMonthBounds.end})
          </button>
        )}
      </div>

      <div className="setup-grid">
        <div className="field-group field-group-month">
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
              onMonthOrYearChange(
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

        <div className="field-group field-group-year">
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
              onMonthOrYearChange(
                activeRecord.month,
                Number.parseInt(e.target.value, 10)
              )
            }
          />
        </div>

        <div className="field-group field-group-bill">
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
                fieldErrors.billAmount ? 'is-invalid' : ''
              }`}
              value={activeRecord.billAmountInput}
              onChange={(e) => onBillAmountChange(e.target.value)}
              placeholder="0.00"
            />
          </div>
          {fieldErrors.billAmount && (
            <p className="field-error-text" role="alert">
              {fieldErrors.billAmount}
            </p>
          )}
        </div>

        <div className="field-group field-group-period">
          <div className="field-label-row">
            <span className="field-label">Billing Period Dates</span>
            <span className="field-hint">
              {billingPeriodDays > 0
                ? `${billingPeriodDays} days`
                : 'Invalid range'}
            </span>
          </div>
          <div className="date-pair-grid">
            <div className="date-input-wrap">
              <span className="date-input-label">Start Date</span>
              <input
                type="date"
                aria-label="Billing Period Start Date"
                className={`input-control tabular ${
                  fieldErrors.periodDates ? 'is-invalid' : ''
                }`}
                value={activeRecord.periodStart}
                onChange={(e) => onPeriodStartChange(e.target.value)}
              />
            </div>
            <div className="date-input-wrap">
              <span className="date-input-label">End Date</span>
              <input
                type="date"
                aria-label="Billing Period End Date"
                className={`input-control tabular ${
                  fieldErrors.periodDates ? 'is-invalid' : ''
                }`}
                value={activeRecord.periodEnd}
                onChange={(e) => onPeriodEndChange(e.target.value)}
              />
            </div>
          </div>
          {fieldErrors.periodDates && (
            <p className="field-error-text" role="alert">
              {fieldErrors.periodDates}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
