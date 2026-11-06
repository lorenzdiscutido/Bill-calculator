import {
  StayInputMode,
  TenantCalculationResult,
  TenantStayInput,
} from '../types';

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
    <div className={`tenant-row ${rowError ? 'has-error' : ''}`}>
      <div className="tenant-row-grid">
        {/* Tenant Name */}
        <div className="field-group field-group-name">
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
              onUpdateTenant(tenant.id, {
                name: e.target.value,
              })
            }
            placeholder="Enter tenant name"
          />
        </div>

        {/* Stay Entry Mode */}
        <div className="field-group field-group-mode">
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
                onUpdateTenant(tenant.id, {
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
          <div className="field-group field-group-dates">
            <div className="field-label-row">
              <span className="field-label">
                Stay Start &amp; End (Inclusive)
              </span>
            </div>
            <div className="date-pair-grid">
              <div className="date-input-wrap">
                <span className="date-input-label">Check-in</span>
                <input
                  type="date"
                  aria-label={`Start date for ${tenant.name}`}
                  className={`input-control tabular ${
                    rowError ? 'is-invalid' : ''
                  }`}
                  value={tenant.startDate}
                  onChange={(e) =>
                    onUpdateTenant(tenant.id, {
                      startDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="date-input-wrap">
                <span className="date-input-label">Check-out</span>
                <input
                  type="date"
                  aria-label={`End date for ${tenant.name}`}
                  className={`input-control tabular ${
                    rowError ? 'is-invalid' : ''
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
          <div className="field-group field-group-manual">
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
                onUpdateTenant(tenant.id, {
                  manualDays: e.target.value,
                })
              }
              placeholder="e.g. 15"
            />
          </div>
        )}

        {/* Counted Days Readout */}
        <div className="field-group field-group-days">
          <span className="field-label">Counted Stay</span>
          <div className="stay-days-readout">
            <span>{tCalc?.daysStayed ?? 0}</span>
            <span className="field-hint">
              {(tCalc?.daysStayed ?? 0) === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        {/* Delete Tenant Action */}
        <div className="field-group field-group-action">
          <button
            type="button"
            className="btn-danger-sm"
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
}
