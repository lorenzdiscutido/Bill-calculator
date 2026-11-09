import styles from './App.module.css';
import { ArchiveRail } from './components/ArchiveRail';
import { BillingForm } from './components/BillingForm';
import { ResultsTable } from './components/ResultsTable';
import { TenantRoster } from './components/TenantRoster';
import { TopBar } from './components/TopBar';
import { useBillCalculator } from './hooks/useBillCalculator';

export default function App() {
  const { state, actions } = useBillCalculator();

  return (
    <div>
      <TopBar state={state} actions={actions} />

      <div className={styles.workbenchLayout}>
        <ArchiveRail state={state} actions={actions} />

        <main className={styles.mainWorkspace}>
          <BillingForm state={state} actions={actions} />

          <TenantRoster state={state} actions={actions} />

          <ResultsTable state={state} actions={actions} />
        </main>
      </div>
    </div>
  );
}
