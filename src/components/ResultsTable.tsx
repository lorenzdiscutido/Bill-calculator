import { formatCentavos } from '../calculator';
import { BillingMonthRecord, BillSplitResult } from '../types';
import { ActionPanel } from './ActionPanel';
import { OccupancyTimeline } from './OccupancyTimeline';
import styles from './ResultsTable.module.css';

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
    <section className={styles.workspacePanel} aria-labelledby="results-heading">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="results-heading" className={styles.sectionHeading}>
            Bill Allocation &amp; Per-Tenant Shares
          </h2>
          <p className={styles.sectionNote}>
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
        <div className={styles.validationAlert} role="alert">
          <h3 className={styles.validationAlertTitle}>
            Resolve the following before calculating shares:
          </h3>
          <ul className={styles.validationAlertList}>
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
          <div className={styles.formulaStrip}>
            <div className={styles.formulaEquation}>
              <span>Per-Day Rate:</span>
              <span className={styles.formulaRateHighlight}>
                {formatCentavos(splitResult.perDayRateRoundedCentavos)} /
                tenant-day
              </span>
              <span className="tabular">
                ({formatCentavos(splitResult.totalBillCentavos)} ÷{' '}
                {splitResult.totalTenantDays} total tenant-days)
              </span>
            </div>

            <span className={styles.reconciledPill}>
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
          <div className={styles.tableScrollWrapper}>
            <div className={styles.tableScrollHint} aria-hidden="true">
              <span>Swipe horizontally to view full table &rarr;</span>
            </div>
            <table className={styles.resultsTable}>
              <thead>
                <tr>
                  <th scope="col">Tenant Name</th>
                  <th scope="col" className={styles.colNum}>
                    Days Stayed
                  </th>
                  <th scope="col" className={styles.colNum}>
                    Share Ratio
                  </th>
                  <th scope="col" className={styles.colNum}>
                    Per-Day Rate
                  </th>
                  <th scope="col" className={styles.colNum}>
                    Amount Due (₱)
                  </th>
                  <th scope="col" className={styles.colAction}>
                    Individual PDF
                  </th>
                </tr>
              </thead>
              <tbody>
                {splitResult.tenantResults.map((tCalc) => (
                  <tr key={tCalc.tenantId}>
                    <td>
                      <div className={styles.tenantCellPrimary}>
                        {tCalc.name}
                      </div>
                      <div className={`${styles.tenantCellSub} tabular`}>
                        {tCalc.mode === 'manual'
                          ? 'Manual day entry'
                          : tCalc.clippedStart && tCalc.clippedEnd
                            ? `${tCalc.clippedStart} to ${tCalc.clippedEnd}${
                                tCalc.wasClipped ? ' (clipped)' : ''
                              }`
                            : 'Outside billing period'}
                      </div>
                    </td>
                    <td className={styles.colNum}>
                      {tCalc.daysStayed}{' '}
                      {tCalc.daysStayed === 1 ? 'day' : 'days'}
                    </td>
                    <td className={styles.colNum}>
                      {tCalc.daysStayed}/{splitResult.totalTenantDays} (
                      {tCalc.sharePercentage.toFixed(1)}%)
                    </td>
                    <td className={styles.colNum}>
                      {formatCentavos(splitResult.perDayRateRoundedCentavos)}
                    </td>
                    <td className={styles.colNum}>
                      <strong>
                        {formatCentavos(tCalc.finalShareCentavos)}
                      </strong>
                      {tCalc.adjustmentCentavos !== 0 && (
                        <span
                          className={styles.adjBadge}
                          title="Centavo rounding remainder assigned to the tenant with the largest share"
                        >
                          {tCalc.adjustmentCentavos > 0 ? '+' : ''}
                          {formatCentavos(tCalc.adjustmentCentavos)} adj
                        </span>
                      )}
                    </td>
                    <td className={styles.colAction}>
                      <button
                        type="button"
                        className={styles.btnGhostSm}
                        onClick={() => onExportSingle(tCalc.tenantId)}
                        disabled={exportingId !== null}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="12" y1="18" x2="12" y2="12" />
                          <polyline points="9 15 12 18 15 15" />
                        </svg>
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
                  <td className={styles.colNum}>
                    {splitResult.totalTenantDays} days
                  </td>
                  <td className={styles.colNum}>100.0%</td>
                  <td className={styles.colNum}>
                    {formatCentavos(splitResult.perDayRateRoundedCentavos)}
                    /day
                  </td>
                  <td className={styles.colNum}>
                    <div>
                      Shares: {formatCentavos(splitResult.totalSharesCentavos)}
                    </div>
                    <div style={{ fontSize: '0.78125rem', opacity: 0.9 }}>
                      Bill: {formatCentavos(splitResult.totalBillCentavos)}
                    </div>
                  </td>
                  <td className={styles.colAction}>Reconciled</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
