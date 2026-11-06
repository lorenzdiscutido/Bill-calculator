import { MONTH_NAMES } from '../calculator';
import { BillingMonthRecord, ValidationFieldErrors } from '../types';
import styles from './BillingForm.module.css';

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
    <section className={styles.workspacePanel} aria-labelledby="setup-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="setup-heading" className={styles.sectionHeading}>
            Billing Period &amp; Total Bill — {activeMonthTitle}
          </h2>
          <p className={styles.sectionNote}>
            Enter the total peso bill from your electric utility statement.
            Billing period defaults to the full calendar month.
          </p>
        </div>
        {isCustomPeriod && (
          <button
            type="button"
            className={styles.btnGhostSm}
            onClick={onResetPeriodToFullMonth}
          >
            Reset to Full Month ({defaultMonthBounds.start} –{' '}
            {defaultMonthBounds.end})
          </button>
        )}
      </div>

      <div className={styles.setupGrid}>
        <div className={`${styles.fieldGroup} ${styles.fieldGroupMonth}`}>
          <div className={styles.fieldLabelRow}>
            <label htmlFor="billing-month-select" className={styles.fieldLabel}>
              Billing Month
            </label>
          </div>
          <select
            id="billing-month-select"
            className={styles.selectControl}
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

        <div className={`${styles.fieldGroup} ${styles.fieldGroupYear}`}>
          <div className={styles.fieldLabelRow}>
            <label htmlFor="billing-year-input" className={styles.fieldLabel}>
              Billing Year
            </label>
          </div>
          <input
            id="billing-year-input"
            type="number"
            min={2000}
            max={2100}
            className={`${styles.inputControl} tabular`}
            value={activeRecord.year}
            onChange={(e) =>
              onMonthOrYearChange(
                activeRecord.month,
                Number.parseInt(e.target.value, 10)
              )
            }
          />
        </div>

        <div className={`${styles.fieldGroup} ${styles.fieldGroupBill}`}>
          <div className={styles.fieldLabelRow}>
            <label htmlFor="bill-amount-input" className={styles.fieldLabel}>
              Total Bill Amount (₱)
            </label>
            <span className={styles.fieldHint}>Utility total</span>
          </div>
          <div className={styles.pesoInputWrapper}>
            <span className={styles.pesoPrefix} aria-hidden="true">
              ₱
            </span>
            <input
              id="bill-amount-input"
              type="text"
              inputMode="decimal"
              className={`${styles.inputControl} ${
                fieldErrors.billAmount ? styles.isInvalid : ''
              }`}
              value={activeRecord.billAmountInput}
              onChange={(e) => onBillAmountChange(e.target.value)}
              placeholder="0.00"
            />
          </div>
          {fieldErrors.billAmount && (
            <p className={styles.fieldErrorText} role="alert">
              {fieldErrors.billAmount}
            </p>
          )}
        </div>

        <div className={`${styles.fieldGroup} ${styles.fieldGroupPeriod}`}>
          <div className={styles.fieldLabelRow}>
            <span className={styles.fieldLabel}>Billing Period Dates</span>
            <span
              className={`${styles.periodDurationBadge} ${
                billingPeriodDays <= 0 ? styles.periodInvalidBadge : ''
              }`}
            >
              {billingPeriodDays > 0
                ? `${billingPeriodDays} days`
                : 'Invalid range'}
            </span>
          </div>
          <div className={styles.datePairGrid}>
            <div className={styles.dateInputWrap}>
              <span className={styles.dateInputLabel}>Start Date</span>
              <input
                type="date"
                aria-label="Billing Period Start Date"
                className={`${styles.inputControl} tabular ${
                  fieldErrors.periodDates ? styles.isInvalid : ''
                }`}
                value={activeRecord.periodStart}
                onChange={(e) => onPeriodStartChange(e.target.value)}
              />
            </div>
            <div className={styles.dateInputWrap}>
              <span className={styles.dateInputLabel}>End Date</span>
              <input
                type="date"
                aria-label="Billing Period End Date"
                className={`${styles.inputControl} tabular ${
                  fieldErrors.periodDates ? styles.isInvalid : ''
                }`}
                value={activeRecord.periodEnd}
                onChange={(e) => onPeriodEndChange(e.target.value)}
              />
            </div>
          </div>
          {fieldErrors.periodDates && (
            <p className={styles.fieldErrorText} role="alert">
              {fieldErrors.periodDates}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
