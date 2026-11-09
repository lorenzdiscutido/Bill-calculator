import { FormEvent } from 'react';
import {
  BillingMonthRecord,
  TenantCalculationResult,
  TenantStayInput,
  ValidationFieldErrors,
} from '../types';
import { TenantRow } from './TenantRow';
import styles from './TenantRoster.module.css';

export interface TenantRosterProps {
  state: {
    activeRecord: BillingMonthRecord;
    splitResult: {
      tenantResults: TenantCalculationResult[];
      fieldErrors: ValidationFieldErrors;
    };
    quickTenantName: string;
  };
  actions: {
    setQuickTenantName: (value: string) => void;
    quickAddTenant: (e: FormEvent) => void;
    addTenant: (nameOverride?: string) => void;
    updateTenant: (tenantId: string, patch: Partial<TenantStayInput>) => void;
    deleteTenant: (tenantId: string) => void;
  };
}

export function TenantRoster({ state, actions }: TenantRosterProps) {
  const { activeRecord, splitResult, quickTenantName } = state;
  const {
    setQuickTenantName,
    quickAddTenant,
    addTenant,
    updateTenant,
    deleteTenant,
  } = actions;

  const tenantResults = splitResult.tenantResults;
  const fieldErrors = splitResult.fieldErrors;

  return (
    <section className={styles.workspacePanel} aria-labelledby="tenants-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="tenants-heading" className={styles.sectionHeading}>
            Tenant Stays ({activeRecord.tenants.length})
          </h2>
          <p className={styles.sectionNote}>
            Tenants are variable. Add as many tenants as stayed in the unit this
            month, with inclusive dates (clipped to{' '}
            <span className="tabular">{activeRecord.periodStart}</span> –{' '}
            <span className="tabular">{activeRecord.periodEnd}</span>) or manual
            day counts.
          </p>
        </div>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => addTenant()}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Tenant
        </button>
      </div>

      {/* Quick Add Tenant Form */}
      <form onSubmit={quickAddTenant} className={styles.tenantQuickAddForm}>
        <div className={styles.quickAddInputWrap}>
          <span className={styles.quickAddIcon} aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <input
            type="text"
            className={`${styles.inputControl} ${styles.quickAddInput}`}
            placeholder="Enter tenant name (e.g. Juan Dela Cruz) and press Enter to add..."
            value={quickTenantName}
            onChange={(e) => setQuickTenantName(e.target.value)}
          />
        </div>
        <button type="submit" className={`${styles.btn} ${styles.btnSecondary}`}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Tenant
        </button>
      </form>

      {activeRecord.tenants.length === 0 ? (
        <div className={styles.tenantEmptyState}>
          <div className={styles.emptyStateIcon} aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3 className={styles.emptyStateTitle}>
            No tenants in this billing month yet
          </h3>
          <p className={styles.emptyStateDesc}>
            Tenant occupancy is variable each month. Click the button below or
            enter a name above to add tenants who stayed in the unit.
          </p>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => addTenant()}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add First Tenant
          </button>
        </div>
      ) : (
        <>
          <div className={styles.tenantRoster}>
            {activeRecord.tenants.map((tenant, index) => (
              <TenantRow
                key={tenant.id}
                tenant={tenant}
                tenantCalculation={tenantResults[index]}
                rowError={fieldErrors.byTenantId[tenant.id]}
                onUpdateTenant={updateTenant}
                onDeleteTenant={deleteTenant}
              />
            ))}
          </div>

          <div className={styles.tenantRosterFooter}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnAddTenantWide}`}
              onClick={() => addTenant()}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Another Tenant
            </button>
          </div>
        </>
      )}
    </section>
  );
}
