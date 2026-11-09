import { formatCentavos, MONTH_NAMES, parsePesosToCentavos } from '../calculator';
import { BillingMonthRecord } from '../types';
import styles from './ArchiveRail.module.css';

export interface ArchiveRailProps {
  state: {
    savedMonths: BillingMonthRecord[];
    activeRecord: BillingMonthRecord;
    activeMonthTitle: string;
    mobileArchiveOpen: boolean;
  };
  actions: {
    toggleMobileArchive: () => void;
    selectMonth: (monthId: string) => void;
    createNewMonth: () => void;
    deleteMonth: (monthId: string) => void;
    restoreSampleData: () => void;
  };
}

export function ArchiveRail({ state, actions }: ArchiveRailProps) {
  const { savedMonths, activeRecord, activeMonthTitle, mobileArchiveOpen } =
    state;
  const {
    toggleMobileArchive,
    selectMonth,
    createNewMonth,
    deleteMonth,
    restoreSampleData,
  } = actions;

  const activeMonthId = activeRecord.id;

  return (
    <aside className={styles.archiveRail} aria-label="Billing Month History">
      <div className={styles.railHeader}>
        <div>
          <h2 className={styles.railHeading}>
            Saved Billing Months ({savedMonths.length})
          </h2>
          <span className={styles.railActiveIndicator}>
            Current: {activeMonthTitle}
          </span>
        </div>
        <div className={styles.railHeaderBtns}>
          <button
            type="button"
            className={styles.btnGhostSm}
            onClick={createNewMonth}
          >
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
            New Month
          </button>
          <button
            type="button"
            className={`${styles.btnGhostSm} ${styles.mobileHistoryToggle}`}
            onClick={toggleMobileArchive}
            aria-expanded={mobileArchiveOpen}
          >
            {mobileArchiveOpen ? 'Hide History ▲' : 'Past Months ▼'}
          </button>
        </div>
      </div>

      <div
        className={`${styles.archiveCollapsibleContent} ${
          mobileArchiveOpen ? styles.isOpen : ''
        }`}
      >
        <ul className={styles.archiveList}>
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
                className={`${styles.archiveItem} ${
                  isSelected ? styles.isActive : ''
                }`}
              >
                <button
                  type="button"
                  className={styles.archiveSelectBtn}
                  onClick={() => selectMonth(item.id)}
                >
                  <div className={styles.archiveItemTop}>
                    <div className={styles.archiveMonthTitleWrap}>
                      {isSelected && (
                        <span
                          className={styles.activeIndicatorDot}
                          aria-label="Currently active month"
                          title="Currently active month"
                        />
                      )}
                      <span className={styles.archiveMonthName}>{label}</span>
                    </div>
                    <span className={styles.archiveBillAmount}>
                      {formattedBill}
                    </span>
                  </div>
                  <div className={styles.archiveItemMeta}>
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
                  className={styles.archiveDeleteBtn}
                  onClick={() => deleteMonth(item.id)}
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

        <div className={styles.railFooter}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnFullWidth}`}
            onClick={restoreSampleData}
          >
            Load Sample Dataset (3 Tenants)
          </button>
        </div>
      </div>
    </aside>
  );
}
