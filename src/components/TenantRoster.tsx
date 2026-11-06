import { FormEvent } from 'react';
import {
  BillingMonthRecord,
  TenantCalculationResult,
  TenantStayInput,
  ValidationFieldErrors,
} from '../types';
import { TenantRow } from './TenantRow';

export interface TenantRosterProps {
  activeRecord: BillingMonthRecord;
  tenantResults: TenantCalculationResult[];
  fieldErrors: ValidationFieldErrors;
  quickTenantName: string;
  onQuickTenantNameChange: (name: string) => void;
  onQuickAddTenant: (e: FormEvent) => void;
  onAddTenant: () => void;
  onUpdateTenant: (tenantId: string, patch: Partial<TenantStayInput>) => void;
  onDeleteTenant: (tenantId: string) => void;
}

export function TenantRoster({
  activeRecord,
  tenantResults,
  fieldErrors,
  quickTenantName,
  onQuickTenantNameChange,
  onQuickAddTenant,
  onAddTenant,
  onUpdateTenant,
  onDeleteTenant,
}: TenantRosterProps) {
  return (
    <section className="workspace-panel" aria-labelledby="tenants-heading">
      <div className="section-header">
        <div>
          <h2 id="tenants-heading" className="section-heading">
            Tenant Stays ({activeRecord.tenants.length})
          </h2>
          <p className="section-note">
            Tenants are variable. Add as many tenants as stayed in the unit this
            month, with inclusive dates (clipped to{' '}
            <span className="tabular">{activeRecord.periodStart}</span> –{' '}
            <span className="tabular">{activeRecord.periodEnd}</span>) or manual
            day counts.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onAddTenant}
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
          + Add Tenant
        </button>
      </div>

      {/* Quick Add Tenant Form */}
      <form onSubmit={onQuickAddTenant} className="tenant-quick-add-form">
        <div className="quick-add-input-wrap">
          <span className="quick-add-icon" aria-hidden="true">
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
            className="input-control quick-add-input"
            placeholder="Enter tenant name (e.g. Juan Dela Cruz) and press Enter to add..."
            value={quickTenantName}
            onChange={(e) => onQuickTenantNameChange(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-secondary">
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
        <div className="tenant-empty-state">
          <div className="empty-state-icon" aria-hidden="true">
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
          <h3 className="empty-state-title">
            No tenants in this billing month yet
          </h3>
          <p className="empty-state-desc">
            Tenant occupancy is variable each month. Click the button below or
            enter a name above to add tenants who stayed in the unit.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onAddTenant}
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
            + Add First Tenant
          </button>
        </div>
      ) : (
        <>
          <div className="tenant-roster">
            {activeRecord.tenants.map((tenant, index) => (
              <TenantRow
                key={tenant.id}
                tenant={tenant}
                tenantCalculation={tenantResults[index]}
                rowError={fieldErrors.byTenantId[tenant.id]}
                onUpdateTenant={onUpdateTenant}
                onDeleteTenant={onDeleteTenant}
              />
            ))}
          </div>

          <div className="tenant-roster-footer">
            <button
              type="button"
              className="btn btn-secondary btn-add-tenant-wide"
              onClick={onAddTenant}
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
              + Add Another Tenant
            </button>
          </div>
        </>
      )}
    </section>
  );
}
