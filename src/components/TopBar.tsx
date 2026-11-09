import { ActionPanel } from './ActionPanel';
import styles from './TopBar.module.css';

export interface TopBarProps {
  state: {
    unitName: string;
    saveToast: string | null;
    splitResult: { isValid: boolean };
    exportingId: string | null;
  };
  actions: {
    setUnitName: (value: string) => void;
    manualSaveConfirm: () => void;
    exportCombined: () => Promise<void> | void;
  };
}

export function TopBar({ state, actions }: TopBarProps) {
  const { unitName, saveToast, splitResult, exportingId } = state;
  const { setUnitName, manualSaveConfirm, exportCombined } = actions;

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarBrand}>
        <span className={styles.topbarBadge} aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </span>
        <div>
          <h1 className={styles.topbarTitle}>Monthly Electricity Bill Splitter</h1>
          <p className={styles.topbarSubtitle}>
            Single-meter apartment proration by tenant stay days (₱)
          </p>
        </div>
      </div>

      <div className={styles.topbarControls}>
        <div className={styles.unitSettingField}>
          <label htmlFor="unit-name-input" className={styles.unitSettingLabel}>
            Unit Label (PDF):
          </label>
          <input
            id="unit-name-input"
            type="text"
            className={styles.unitSettingInput}
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            placeholder="e.g. Unit 4B — Sampaguita Residences"
          />
        </div>

        {saveToast && (
          <span className={styles.saveFeedbackToast} role="status">
            {saveToast}
          </span>
        )}

        <ActionPanel
          variant="topbar"
          isValid={splitResult.isValid}
          exportingId={exportingId}
          onSaveMonth={manualSaveConfirm}
          onExportCombined={exportCombined}
        />
      </div>
    </header>
  );
}
