import styles from './ActionPanel.module.css';

export interface ActionPanelProps {
  variant?: 'topbar' | 'results-header';
  isValid: boolean;
  exportingId: string | null;
  onSaveMonth?: () => void;
  onExportCombined: () => void;
}

export function ActionPanel({
  variant = 'topbar',
  isValid,
  exportingId,
  onSaveMonth,
  onExportCombined,
}: ActionPanelProps) {
  if (variant === 'results-header') {
    return (
      <button
        type="button"
        className={`${styles.btn} ${styles.btnPrimary} ${styles.resultsHeaderBtn}`}
        disabled={!isValid || exportingId !== null}
        onClick={onExportCombined}
      >
        Download Combined PDF Statement
      </button>
    );
  }

  return (
    <div className={styles.topbarBtnGroup}>
      {onSaveMonth && (
        <button
          type="button"
          className={`${styles.btn} ${styles.btnShell}`}
          onClick={onSaveMonth}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          Save Month
        </button>
      )}

      <button
        type="button"
        className={`${styles.btn} ${styles.btnPrimary}`}
        disabled={!isValid || exportingId !== null}
        onClick={onExportCombined}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {exportingId === 'combined'
          ? 'Generating PDF…'
          : 'Export Combined PDF'}
      </button>
    </div>
  );
}
