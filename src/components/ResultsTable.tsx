import { formatCentavos } from '../calculator';
import { BillingMonthRecord, BillSplitResult } from '../types';
import { ActionPanel } from './ActionPanel';
import { OccupancyTimeline } from './OccupancyTimeline';

export interface ResultsTableProps {
  activeRecord: BillingMonthRecord;
  splitResult: BillSplitResult;
  exportingId: string | null;
  onExportCombined: () => void;
  onExportSingle: (tenantId: string) => void;
}

export function ResultsTable({
  activeRecord,
  splitResult,
  exportingId,
  onExportCombined,
  onExportSingle,
}: ResultsTableProps) {
  return (
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
        <ActionPanel
          variant="results-header"
          isValid={splitResult.isValid}
          exportingId={exportingId}
          onExportCombined={onExportCombined}
        />
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
          <OccupancyTimeline
            periodStart={activeRecord.periodStart}
            periodEnd={activeRecord.periodEnd}
            billingPeriodDays={splitResult.billingPeriodDays}
            totalTenantDays={splitResult.totalTenantDays}
            tenantResults={splitResult.tenantResults}
          />

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
            <div className="table-scroll-hint" aria-hidden="true">
              <span>Swipe horizontally to view full table &rarr;</span>
            </div>
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
                      <div className="tenant-cell-primary">{tCalc.name}</div>
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
                      {formatCentavos(splitResult.perDayRateRoundedCentavos)}
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
                        onClick={() => onExportSingle(tCalc.tenantId)}
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
                    {formatCentavos(splitResult.perDayRateRoundedCentavos)}
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
  );
}
