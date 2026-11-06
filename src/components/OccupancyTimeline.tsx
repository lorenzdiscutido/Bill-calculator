import { parseIsoDateToUtcMs } from '../calculator';
import { TenantCalculationResult } from '../types';

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
    <div className="occupancy-strip-container">
      <div className="occupancy-strip-header">
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

      <div className="occupancy-ruler" aria-hidden="true">
        <span>Tenant</span>
        <div className="ruler-ticks">
          <span>Day 1</span>
          <span>Day {Math.ceil(billingPeriodDays / 2)}</span>
          <span>Day {billingPeriodDays}</span>
        </div>
        <span style={{ textAlign: 'right' }}>Stay</span>
      </div>

      <div className="occupancy-tracks">
        {tenantResults.map((tCalc) => {
          const barStyle = computeOccupancyBarStyle(
            tCalc,
            periodStart,
            billingPeriodDays
          );
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
              <span className="occupancy-day-count">{tCalc.daysStayed}d</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
