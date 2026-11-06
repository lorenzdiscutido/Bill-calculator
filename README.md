# Monthly Electricity Bill Splitter

A local-first web application for splitting a single apartment unit's monthly Philippine Peso (`₱`) electricity bill among tenants in proportion to the number of days each tenant stayed during the billing period.

## Features

1. **Billing Month Setup**
   - Choose a billing month and year.
   - Enter the total utility bill in Philippine Pesos (`₱1,234.56`).
   - Billing period start and end dates default to the first and last calendar day of the selected month and can be customized as needed.

2. **Tenant Stays**
   - Add, edit, and remove tenants for any billing month.
   - Choose between **Date Range** (inclusive calendar days, automatically clipped to the billing period) or **Manual Days** for quick entry.
   - Supports mid-month move-ins and move-outs; dates outside the billing period are ignored.

3. **Centavo-Exact Calculation**
   - All money arithmetic uses integer centavos (`1 peso = 100 centavos`) internally to avoid IEEE-754 floating-point errors.
   - Computes `total_tenant_days`, transparent `per_day_rate = total_bill / total_tenant_days`, and each tenant's share `(tenant_days / total_tenant_days) × total_bill`.
   - Applies deterministic **round-half-up** to 2 decimal places and assigns any leftover centavo difference (`±₱0.01`) to the tenant with the largest share so rounded shares always add up to the exact total bill.
   - Recovers 100% of the bill across active tenant-days even when the unit has vacant days.

4. **PDF Export (Combined & Per-Tenant)**
   - **Combined Unit Statement PDF:** Includes the configurable unit name/label, billing month and period, total bill, per-tenant breakdown table, per-day rate formula, reconciliation note, and generated date.
   - **Individual Tenant PDF Slip:** Generates a standalone statement voucher for any single tenant.

5. **Local History & Preloaded Sample Dataset**
   - Automatically saves billing months and the unit name setting in browser `localStorage`.
   - Preloads **October 2026** (`₱5,480.00` across 3 tenants with full-month, mid-month move-in, and early move-out stay dates) so you can test calculations and PDF exports right away.

## How to Run

### Prerequisites
- Node.js 18+ and npm

### 1. Install dependencies
```bash
npm install
```

### 2. Start the development server
```bash
npm run dev
```
Open the local URL printed by Vite (typically `http://localhost:5173`) in your browser.

### 3. Run unit tests
```bash
npm test
```

### 4. Build for production
```bash
npm run build
npm run preview
```
