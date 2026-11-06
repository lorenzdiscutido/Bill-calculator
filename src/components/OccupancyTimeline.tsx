import { parseIsoDateToUtcMs } from '../calculator';
import { TenantCalculationResult } from '../types';
import styles from './OccupancyTimeline.module.css';

export interface OccupancyTimelineProps {
  periodStart: string;
  periodEnd: string;
  billingPeriodDays: number;
  totalTenantDays: number;
  tenantResults: TenantCalculationResult[];
}

function computeOccupancyBarStyle(
  tCalc: TenantCalculationResult,
  periodStart: string,
  billingPeriodDays: number
): { left: string; width: string } {
  const totalPeriodDays = Math.max(1, billingPeriodDays);
  if (tCalc.daysStayed <= 0) {
    return { left: '0%', width: '0%' };
  }

  if (
    tCalc.mode === 'dates' &&
    tCalc.clippedStart &&
    tCalc.clippedEnd
  ) {
    const periodStartMs = parseIsoDateToUtcMs(periodStart);
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

export function OccupancyTimeline({
  periodStart,
  periodEnd,
  billingPeriodDays,
  totalTenantDays,
  tenantResults,
}: OccupancyTimelineProps) {
  return (
    <div className={styles.occupancyStripContainer}>
      <div className={styles.occupancyStripHeader}>
        <span>
          <strong>Billing Period Occupancy Schedule:</strong>{' '}
          <span className="tabular">{periodStart}</span> to{' '}
          <span className="tabular">{periodEnd}</span> ({billingPeriodDays}{' '}
          calendar days)
        </span>
        <span className="tabular">
          Total Active Tenant-Days: {totalTenantDays}
        </span>
      </div>

      <div className={styles.occupancyRuler} aria-hidden="true">
        <span>Tenant</span>
        <div className={styles.rulerTicks}>
          <span>Day 1</span>
          <span>Day {Math.ceil(billingPeriodDays / 2)}</span>
          <span>Day {billingPeriodDays}</span>
        </div>
        <span style={{ textAlign: 'right' }}>Stay</span>
      </div>

      <div className={styles.occupancyTracks}>
        {tenantResults.map((tCalc) => {
          const barStyle = computeOccupancyBarStyle(
            tCalc,
            periodStart,
            billingPeriodDays
          );
          return (
            <div key={tCalc.tenantId} className={styles.occupancyTrackRow}>
              <span
                className={styles.occupancyTenantName}
                title={tCalc.name}
              >
                {tCalc.name}
              </span>
              <div className={styles.occupancyBarBed}>
                <div
                  className={`${styles.occupancyBarFill} ${
                    tCalc.mode === 'manual' ? styles.isManual : ''
                  }`}
                  style={barStyle}
                  title={`${tCalc.name}: ${tCalc.daysStayed} days`}
                />
              </div>
              <span className={styles.occupancyDayCount}>
                {tCalc.daysStayed}d
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
