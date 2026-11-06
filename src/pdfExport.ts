import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCentavos, MONTH_NAMES } from './calculator';
import {
  BillingMonthRecord,
  BillSplitResult,
  TenantCalculationResult,
} from './types';

let cachedFontBase64: {
  regular?: string;
  bold?: string;
} = {};

async function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function registerUnicodeFont(doc: jsPDF): Promise<string> {
  try {
    if (!cachedFontBase64.regular || !cachedFontBase64.bold) {
      const [regRes, boldRes] = await Promise.all([
        fetch('/fonts/JetBrainsMono-Regular.ttf'),
        fetch('/fonts/JetBrainsMono-SemiBold.ttf'),
      ]);
      if (regRes.ok && boldRes.ok) {
        const [regBuf, boldBuf] = await Promise.all([
          regRes.arrayBuffer(),
          boldRes.arrayBuffer(),
        ]);
        cachedFontBase64.regular = await arrayBufferToBase64(regBuf);
        cachedFontBase64.bold = await arrayBufferToBase64(boldBuf);
      }
    }

    if (cachedFontBase64.regular && cachedFontBase64.bold) {
      doc.addFileToVFS('JetBrainsMono-Regular.ttf', cachedFontBase64.regular);
      doc.addFont('JetBrainsMono-Regular.ttf', 'JetBrainsMono', 'normal');
      doc.addFileToVFS('JetBrainsMono-SemiBold.ttf', cachedFontBase64.bold);
      doc.addFont('JetBrainsMono-SemiBold.ttf', 'JetBrainsMono', 'bold');
      return 'JetBrainsMono';
    }
  } catch {
    // Fallback to standard font if fetch is unavailable in test environment
  }
  return 'helvetica';
}

function formatGeneratedTimestamp(date = new Date()): string {
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function sanitizeFilename(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function describeTenantStay(t: TenantCalculationResult): string {
  if (t.mode === 'manual') {
    return 'Manual day count';
  }
  if (t.clippedStart && t.clippedEnd) {
    return t.wasClipped
      ? `${t.clippedStart} to ${t.clippedEnd} (clipped)`
      : `${t.clippedStart} to ${t.clippedEnd}`;
  }
  return `${t.rawStartDate ?? ''} to ${t.rawEndDate ?? ''} (outside period)`;
}

export async function exportCombinedBillPdf(
  record: BillingMonthRecord,
  split: BillSplitResult,
  unitName: string
): Promise<void> {
  if (!split.isValid) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const fontName = await registerUnicodeFont(doc);
  const formatMoney = (centavos: number) => {
    const formatted = formatCentavos(centavos);
    return fontName === 'helvetica' ? formatted.replace('₱', 'PHP ') : formatted;
  };

  const monthLabel = `${MONTH_NAMES[record.month - 1]} ${record.year}`;
  const cleanUnitName = unitName.trim() || 'Apartment Unit';
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(22, 27, 34); // #161B22
  doc.rect(0, 0, pageWidth, 108, 'F');

  doc.setFont(fontName, 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(cleanUnitName, 40, 42);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 206, 214);
  doc.text('MONTHLY ELECTRICITY BILL ALLOCATION STATEMENT', 40, 62);
  doc.text(
    `Billing Month: ${monthLabel}  |  Period: ${record.periodStart} to ${record.periodEnd} (${split.billingPeriodDays} calendar days)`,
    40,
    82
  );

  // Total Bill Pill on Right of Header
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 206, 214);
  doc.text('TOTAL ELECTRICITY BILL', pageWidth - 40, 42, { align: 'right' });

  doc.setFont(fontName, 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 180, 120);
  doc.text(formatMoney(split.totalBillCentavos), pageWidth - 40, 68, {
    align: 'right',
  });

  // Per-Tenant Breakdown Table
  const perDayText = `${formatMoney(split.perDayRateRoundedCentavos)}/day`;

  const bodyRows = split.tenantResults.map((t) => {
    const adjNote =
      t.adjustmentCentavos !== 0
        ? ` (${t.adjustmentCentavos > 0 ? '+' : ''}${formatMoney(t.adjustmentCentavos)} adj)`
        : '';
    return [
      t.name,
      describeTenantStay(t),
      `${t.daysStayed} ${t.daysStayed === 1 ? 'day' : 'days'}`,
      `${t.sharePercentage.toFixed(1)}%`,
      perDayText,
      `${formatMoney(t.finalShareCentavos)}${adjNote}`,
    ];
  });

  autoTable(doc, {
    startY: 132,
    margin: { left: 40, right: 40 },
    head: [
      [
        'Tenant Name',
        'Stay Period / Entry',
        'Days Stayed',
        'Share %',
        'Per-Day Rate',
        'Amount Due',
      ],
    ],
    body: bodyRows,
    foot: [
      [
        'TOTAL RECONCILED',
        `${split.tenantResults.length} ${split.tenantResults.length === 1 ? 'tenant' : 'tenants'}`,
        `${split.totalTenantDays} tenant-days`,
        '100.0%',
        perDayText,
        formatMoney(split.totalSharesCentavos),
      ],
    ],
    styles: {
      font: fontName,
      fontSize: 9.5,
      cellPadding: 8,
      textColor: [24, 29, 36],
      lineColor: [216, 222, 228],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [36, 43, 53],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [240, 246, 242],
      textColor: [20, 108, 67],
      fontStyle: 'bold',
    },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? 320;

  // Transparency & Formula Footer Block
  const boxY = finalY + 24;
  doc.setFillColor(246, 245, 240);
  doc.setDrawColor(216, 222, 228);
  doc.rect(40, boxY, pageWidth - 80, 86, 'FD');

  doc.setFont(fontName, 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(24, 29, 36);
  doc.text('CALCULATION & TRANSPARENCY SUMMARY', 54, boxY + 22);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(64, 72, 84);
  doc.text(
    `Per-Day Rate: ${formatMoney(split.perDayRateRoundedCentavos)} per tenant-day (${formatMoney(split.totalBillCentavos)} total bill ÷ ${split.totalTenantDays} total tenant-days)`,
    54,
    boxY + 40
  );
  doc.text(
    `Rounding Rule: Round-half-up to 2 decimal places. ${
      split.reconciliationDiffCentavos === 0
        ? 'No leftover centavo adjustment required.'
        : `Leftover ${split.reconciliationDiffCentavos > 0 ? '+' : ''}${formatMoney(split.reconciliationDiffCentavos)} centavo assigned to the largest share.`
    }`,
    54,
    boxY + 56
  );
  doc.text(
    `Generated Date: ${formatGeneratedTimestamp()}`,
    54,
    boxY + 72
  );

  const fileSlug = sanitizeFilename(`${cleanUnitName}-${monthLabel}-electricity-bill`);
  doc.save(`${fileSlug || 'electricity-bill-split'}.pdf`);
}

export async function exportSingleTenantPdf(
  record: BillingMonthRecord,
  split: BillSplitResult,
  tenant: TenantCalculationResult,
  unitName: string
): Promise<void> {
  if (!split.isValid) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const fontName = await registerUnicodeFont(doc);
  const formatMoney = (centavos: number) => {
    const formatted = formatCentavos(centavos);
    return fontName === 'helvetica' ? formatted.replace('₱', 'PHP ') : formatted;
  };

  const monthLabel = `${MONTH_NAMES[record.month - 1]} ${record.year}`;
  const cleanUnitName = unitName.trim() || 'Apartment Unit';
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(22, 27, 34);
  doc.rect(0, 0, pageWidth, 104, 'F');

  doc.setFont(fontName, 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(cleanUnitName, 40, 40);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 206, 214);
  doc.text(`INDIVIDUAL TENANT ELECTRICITY VOUCHER — ${monthLabel.toUpperCase()}`, 40, 60);
  doc.text(
    `Billing Period: ${record.periodStart} to ${record.periodEnd}`,
    40,
    78
  );

  doc.setFont(fontName, 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 180, 120);
  doc.text(formatMoney(tenant.finalShareCentavos), pageWidth - 40, 62, {
    align: 'right',
  });
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 206, 214);
  doc.text('AMOUNT DUE', pageWidth - 40, 42, { align: 'right' });

  autoTable(doc, {
    startY: 130,
    margin: { left: 40, right: 40 },
    head: [['Field', 'Details']],
    body: [
      ['Tenant Name', tenant.name],
      ['Billing Month', monthLabel],
      ['Unit Billing Period', `${record.periodStart} to ${record.periodEnd} (${split.billingPeriodDays} days)`],
      ['Recorded Stay Window', describeTenantStay(tenant)],
      ['Tenant Days Stayed', `${tenant.daysStayed} ${tenant.daysStayed === 1 ? 'day' : 'days'}`],
      ['Total Unit Tenant-Days', `${split.totalTenantDays} tenant-days across ${split.tenantResults.length} tenants`],
      ['Total Unit Electricity Bill', formatMoney(split.totalBillCentavos)],
      ['Per-Day Rate', `${formatMoney(split.perDayRateRoundedCentavos)} / tenant-day`],
      ['Proportional Share Ratio', `${tenant.daysStayed} / ${split.totalTenantDays} (${tenant.sharePercentage.toFixed(2)}%)`],
      [
        'Centavo Rounding Adjustment',
        tenant.adjustmentCentavos === 0
          ? 'None (₱0.00)'
          : `${tenant.adjustmentCentavos > 0 ? '+' : ''}${formatMoney(tenant.adjustmentCentavos)} (largest share reconciliation)`,
      ],
      ['TOTAL AMOUNT DUE', formatMoney(tenant.finalShareCentavos)],
    ],
    styles: {
      font: fontName,
      fontSize: 10,
      cellPadding: 9,
      textColor: [24, 29, 36],
      lineColor: [216, 222, 228],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [36, 43, 53],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 190 },
    },
  });

  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY ?? 380;

  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 98, 110);
  doc.text(
    `Generated Date: ${formatGeneratedTimestamp()}  |  Unit: ${cleanUnitName}`,
    40,
    finalY + 28
  );

  const fileSlug = sanitizeFilename(
    `${cleanUnitName}-${monthLabel}-${tenant.name}-electricity-slip`
  );
  doc.save(`${fileSlug || 'tenant-electricity-slip'}.pdf`);
}
