import { ActionPanel } from './ActionPanel';

export interface TopBarProps {
  unitName: string;
  onUnitNameChange: (value: string) => void;
  saveToast: string | null;
  isValid: boolean;
  exportingId: string | null;
  onSaveMonth: () => void;
  onExportCombined: () => void;
}

export function TopBar({
  unitName,
  onUnitNameChange,
  saveToast,
  isValid,
  exportingId,
  onSaveMonth,
  onExportCombined,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-badge" aria-hidden="true">
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
          <h1 className="topbar-title">Monthly Electricity Bill Splitter</h1>
          <p className="topbar-subtitle">
            Single-meter apartment proration by tenant stay days (₱)
          </p>
        </div>
      </div>

      <div className="topbar-controls">
        <div className="unit-setting-field">
          <label htmlFor="unit-name-input" className="unit-setting-label">
            Unit Label (PDF):
          </label>
          <input
            id="unit-name-input"
            type="text"
            className="unit-setting-input"
            value={unitName}
            onChange={(e) => onUnitNameChange(e.target.value)}
            placeholder="e.g. Unit 4B — Sampaguita Residences"
          />
        </div>

        {saveToast && (
          <span className="save-feedback-toast" role="status">
            {saveToast}
          </span>
        )}

        <ActionPanel
          variant="topbar"
          isValid={isValid}
          exportingId={exportingId}
          onSaveMonth={onSaveMonth}
          onExportCombined={onExportCombined}
        />
      </div>
    </header>
  );
}
