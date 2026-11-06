import { ArchiveRail } from './components/ArchiveRail';
import { BillingForm } from './components/BillingForm';
import { ResultsTable } from './components/ResultsTable';
import { TenantRoster } from './components/TenantRoster';
import { TopBar } from './components/TopBar';
import { useBillCalculator } from './hooks/useBillCalculator';

export default function App() {
  const {
    unitName,
    setUnitName,
    savedMonths,
    activeRecord,
    activeMonthTitle,
    splitResult,
    defaultMonthBounds,
    isCustomPeriod,
    saveToast,
    exportingId,
    quickTenantName,
    setQuickTenantName,
    mobileArchiveOpen,
    handleToggleMobileArchive,
    handleSelectMonth,
    handleMonthOrYearChange,
    handleBillAmountChange,
    handlePeriodStartChange,
    handlePeriodEndChange,
    handleResetPeriodToFullMonth,
    handleAddTenant,
    handleQuickAddTenant,
    handleUpdateTenant,
    handleDeleteTenant,
    handleCreateNewMonth,
    handleDeleteMonth,
    handleRestoreSampleData,
    handleManualSaveConfirm,
    handleExportCombined,
    handleExportSingle,
  } = useBillCalculator();

  return (
    <div>
      <TopBar
        unitName={unitName}
        onUnitNameChange={setUnitName}
        saveToast={saveToast}
        isValid={splitResult.isValid}
        exportingId={exportingId}
        onSaveMonth={handleManualSaveConfirm}
        onExportCombined={handleExportCombined}
      />

      <div className="workbench-layout">
        <ArchiveRail
          savedMonths={savedMonths}
          activeMonthId={activeRecord.id}
          activeMonthTitle={activeMonthTitle}
          mobileArchiveOpen={mobileArchiveOpen}
          onToggleMobileArchive={handleToggleMobileArchive}
          onSelectMonth={handleSelectMonth}
          onCreateNewMonth={handleCreateNewMonth}
          onDeleteMonth={handleDeleteMonth}
          onRestoreSampleData={handleRestoreSampleData}
        />

        <main className="main-workspace">
          <BillingForm
            activeRecord={activeRecord}
            activeMonthTitle={activeMonthTitle}
            isCustomPeriod={isCustomPeriod}
            defaultMonthBounds={defaultMonthBounds}
            billingPeriodDays={splitResult.billingPeriodDays}
            fieldErrors={splitResult.fieldErrors}
            onMonthOrYearChange={handleMonthOrYearChange}
            onBillAmountChange={handleBillAmountChange}
            onPeriodStartChange={handlePeriodStartChange}
            onPeriodEndChange={handlePeriodEndChange}
            onResetPeriodToFullMonth={handleResetPeriodToFullMonth}
          />

          <TenantRoster
            activeRecord={activeRecord}
            tenantResults={splitResult.tenantResults}
            fieldErrors={splitResult.fieldErrors}
            quickTenantName={quickTenantName}
            onQuickTenantNameChange={setQuickTenantName}
            onQuickAddTenant={handleQuickAddTenant}
            onAddTenant={() => handleAddTenant()}
            onUpdateTenant={handleUpdateTenant}
            onDeleteTenant={handleDeleteTenant}
          />

          <ResultsTable
            activeRecord={activeRecord}
            splitResult={splitResult}
            exportingId={exportingId}
            onExportCombined={handleExportCombined}
            onExportSingle={handleExportSingle}
          />
        </main>
      </div>
    </div>
  );
}
