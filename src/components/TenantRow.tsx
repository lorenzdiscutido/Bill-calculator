import {
  StayInputMode,
  TenantCalculationResult,
  TenantStayInput,
} from '../types';
import styles from './TenantRow.module.css';

export interface TenantRowProps {
  tenant: TenantStayInput;
  tenantCalculation?: TenantCalculationResult;
  rowError?: string;
  onUpdateTenant: (tenantId: string, patch: Partial<TenantStayInput>) => void;
  onDeleteTenant: (tenantId: string) => void;
}

export function TenantRow({
  tenant,
  tenantCalculation: tCalc,
  rowError,
  onUpdateTenant,
  onDeleteTenant,
}: TenantRowProps) {
  return (
    <div className={`${styles.tenantRow} ${rowError ? styles.hasError : ''}`}>
      <div className={styles.tenantRowGrid}>
        {/* Tenant Name */}
        <div className={`${styles.fieldGroup} ${styles.fieldGroupName}`}>
          <label
            htmlFor={`tenant-name-${tenant.id}`}
            className={styles.fieldLabel}
          >
            Tenant Name
          </label>
          <input
            id={`tenant-name-${tenant.id}`}
            type="text"
            className={`${styles.inputControl} ${
              !tenant.name.trim() ? styles.isInvalid : ''
            }`}
            value={tenant.name}
            onChange={(e) =>
              onUpdateTenant(tenant.id, {
                name: e.target.value,
              })
            }
            placeholder="Enter tenant name"
          />
        </div>

        {/* Stay Entry Mode */}
        <div className={`${styles.fieldGroup} ${styles.fieldGroupMode}`}>
          <span className={styles.fieldLabel}>Stay Entry Method</span>
          <div
            className={styles.modeSegmented}
            role="group"
            aria-label={`Stay entry method for ${tenant.name || 'tenant'}`}
          >
            <button
              type="button"
              className={`${styles.modeSegmentBtn} ${
                tenant.mode === 'dates' ? styles.isSelected : ''
              }`}
              onClick={() =>
                onUpdateTenant(tenant.id, {
                  mode: 'dates' as StayInputMode,
                })
              }
            >
              Date Range
            </button>
            <button
              type="button"
              className={`${styles.modeSegmentBtn} ${
                tenant.mode === 'manual' ? styles.isSelected : ''
              }`}
              onClick={() =>
                onUpdateTenant(tenant.id, {
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
          <div className={`${styles.fieldGroup} ${styles.fieldGroupDates}`}>
            <div className={styles.fieldLabelRow}>
              <span className={styles.fieldLabel}>
                Stay Start &amp; End (Inclusive)
              </span>
            </div>
            <div className={styles.datePairGrid}>
              <div className={styles.dateInputWrap}>
                <span className={styles.dateInputLabel}>Check-in</span>
                <input
                  type="date"
                  aria-label={`Start date for ${tenant.name}`}
                  className={`${styles.inputControl} tabular ${
                    rowError ? styles.isInvalid : ''
                  }`}
                  value={tenant.startDate}
                  onChange={(e) =>
                    onUpdateTenant(tenant.id, {
                      startDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className={styles.dateInputWrap}>
                <span className={styles.dateInputLabel}>Check-out</span>
                <input
                  type="date"
                  aria-label={`End date for ${tenant.name}`}
                  className={`${styles.inputControl} tabular ${
                    rowError ? styles.isInvalid : ''
                  }`}
                  value={tenant.endDate}
                  onChange={(e) =>
                    onUpdateTenant(tenant.id, {
                      endDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        ) : (
          <div className={`${styles.fieldGroup} ${styles.fieldGroupManual}`}>
            <label
              htmlFor={`tenant-manual-${tenant.id}`}
              className={styles.fieldLabel}
            >
              Manual Days Stayed
            </label>
            <input
              id={`tenant-manual-${tenant.id}`}
              type="number"
              min={0}
              max={366}
              step={1}
              className={`${styles.inputControl} tabular ${
                rowError ? styles.isInvalid : ''
              }`}
              value={tenant.manualDays}
              onChange={(e) =>
                onUpdateTenant(tenant.id, {
                  manualDays: e.target.value,
                })
              }
              placeholder="e.g. 15"
            />
          </div>
        )}

        {/* Counted Days Readout */}
        <div className={`${styles.fieldGroup} ${styles.fieldGroupDays}`}>
          <span className={styles.fieldLabel}>Counted Stay</span>
          <div className={styles.stayDaysReadout}>
            <span>{tCalc?.daysStayed ?? 0}</span>
            <span className={styles.fieldHint}>
              {(tCalc?.daysStayed ?? 0) === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        {/* Delete Tenant Action */}
        <div className={`${styles.fieldGroup} ${styles.fieldGroupAction}`}>
          <button
            type="button"
            className={styles.btnDangerSm}
            onClick={() => onDeleteTenant(tenant.id)}
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
        <div className={styles.tenantRowFootnote}>
          {rowError ? (
            <p className={styles.fieldErrorText} role="alert">
              {rowError}
            </p>
          ) : tCalc?.wasClipped ? (
            <span className={styles.clippedBadge}>
              {tCalc.clippedStart && tCalc.clippedEnd
                ? `Clipped to billing period: ${tCalc.clippedStart} – ${tCalc.clippedEnd} (${tCalc.daysStayed} days counted)`
                : 'Dates fall completely outside the billing period (0 days counted)'}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
