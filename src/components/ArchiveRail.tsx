import { formatCentavos, MONTH_NAMES, parsePesosToCentavos } from '../calculator';
import { BillingMonthRecord } from '../types';

export interface ArchiveRailProps {
  savedMonths: BillingMonthRecord[];
  activeMonthId: string;
  activeMonthTitle: string;
  mobileArchiveOpen: boolean;
  onToggleMobileArchive: () => void;
  onSelectMonth: (monthId: string) => void;
  onCreateNewMonth: () => void;
  onDeleteMonth: (monthId: string) => void;
  onRestoreSampleData: () => void;
}

export function ArchiveRail({
  savedMonths,
  activeMonthId,
  activeMonthTitle,
  mobileArchiveOpen,
  onToggleMobileArchive,
  onSelectMonth,
  onCreateNewMonth,
  onDeleteMonth,
  onRestoreSampleData,
}: ArchiveRailProps) {
  return (
    <aside className="archive-rail" aria-label="Billing Month History">
      <div className="rail-header">
        <div>
          <h2 className="rail-heading">
            Saved Billing Months ({savedMonths.length})
          </h2>
          <span className="rail-active-indicator">
            Current: {activeMonthTitle}
          </span>
        </div>
        <div className="rail-header-btns">
          <button
            type="button"
            className="btn-ghost-sm"
            onClick={onCreateNewMonth}
          >
            + New Month
          </button>
          <button
            type="button"
            className="btn-ghost-sm mobile-history-toggle"
            onClick={onToggleMobileArchive}
            aria-expanded={mobileArchiveOpen}
          >
            {mobileArchiveOpen ? 'Hide History ▲' : 'Past Months ▼'}
          </button>
        </div>
      </div>

      <div
        className={`archive-collapsible-content ${
          mobileArchiveOpen ? 'is-open' : ''
        }`}
      >
        <ul className="archive-list">
          {savedMonths.map((item) => {
            const parsedBill = parsePesosToCentavos(item.billAmountInput);
            const formattedBill =
              parsedBill.centavos !== null
                ? formatCentavos(parsedBill.centavos)
                : '₱0.00';
            const isSelected = item.id === activeMonthId;
            const label = `${MONTH_NAMES[item.month - 1]} ${item.year}`;

            return (
              <li
                key={item.id}
                className={`archive-item ${isSelected ? 'is-active' : ''}`}
              >
                <button
                  type="button"
                  className="archive-select-btn"
                  onClick={() => onSelectMonth(item.id)}
                >
                  <div className="archive-item-top">
                    <span className="archive-month-name">{label}</span>
                    <span className="archive-bill-amount">{formattedBill}</span>
                  </div>
                  <div className="archive-item-meta">
                    <span>
                      {item.tenants.length}{' '}
                      {item.tenants.length === 1 ? 'tenant' : 'tenants'}
                    </span>
                    <span>
                      {item.periodStart} – {item.periodEnd.slice(5)}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  className="archive-delete-btn"
                  onClick={() => onDeleteMonth(item.id)}
                  aria-label={`Delete ${label}`}
                  title={`Delete ${label}`}
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
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="rail-footer">
          <button
            type="button"
            className="btn btn-secondary btn-full-width"
            onClick={onRestoreSampleData}
          >
            Load Sample Dataset (3 Tenants)
          </button>
        </div>
      </div>
    </aside>
  );
}
