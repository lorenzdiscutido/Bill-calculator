# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
delegated: React 19 + TypeScript + Vite + Vitest + jsPDF + jspdf-autotable (user delegated stack selection in the brief: "Use any lightweight stack you think is best (e.g. React + Vite, or plain HTML/JS). Use a client-side PDF library such as jsPDF or pdf-lib... Before building, briefly confirm your plan and stack choice, then proceed.")

## Users
- **Primary user:** Apartment unit owner / landlord in the Philippines managing a single multi-tenant residential unit with one shared Meralco / electric utility meter.
- **Situation & job:** Once a month, when the utility bill arrives, the owner enters the total peso bill amount and records each tenant's occupancy days (via move-in/move-out dates or manual day count) to fairly calculate and export each tenant's exact peso share down to the centavo.

## Product Purpose
- **What it does:** Splits a single monthly electricity bill in Philippine Pesos (₱) among tenants proportionally based on the number of calendar days each tenant stayed in the unit during the billing period.
- **Why it exists:** Eliminates manual spreadsheet math, floating-point rounding discrepancies, mid-month move-in date counting errors, and formatting chores when presenting transparent billing statements to tenants.
- **What success means:** The rounded tenant shares always sum to the exact total bill down to the centavo (`₱1,234.56`), the per-day rate is clearly shown, past months are preserved locally for auditing or re-exporting, and clean combined or individual PDF statements can be generated in one click.

## Positioning
- **Unique mechanism:** Occupancy-day proportional proration using integer centavo arithmetic with deterministic round-half-up and largest-share remainder reconciliation, paired with inclusive billing-period date clipping and instant PDF statement generation—all local-first with zero backend or account setup.

## Operating Context
- Single apartment unit, one electric meter, one monthly bill in Philippine Pesos (`₱`).
- No kWh sub-metering or tiered tariff math needed—strictly peso total divided across active tenant-days.
- Used on both desktop and mobile phone browsers (often shared with tenants via messaging apps as PDF statements).
- All data persists locally in browser `localStorage`.

## Capabilities and Constraints
- **Billing month setup:** Select billing month and year, enter total bill in pesos (`₱`), optional custom billing period start/end dates (defaulting to first and last calendar day of the chosen month).
- **Tenant stays:** Add, edit, and remove tenants for the active month; choose either inclusive date range (automatically clipped to the billing period) or manual days stayed; 1 calendar day = 1 stay day.
- **Calculation engine:** Integer centavos internally; `total_tenant_days = sum(tenant_days)`; `per_day_rate = total_bill / total_tenant_days`; `share = (tenant_days / total_tenant_days) * total_bill` rounded half-up to 2 decimal places, with any leftover centavo difference assigned to the tenant with the largest share; vacant days are absorbed by active tenant-days so 100% of the bill is recovered.
- **Validation:** Clear validation states for empty/invalid/negative bill amounts, zero tenants, zero total tenant-days, and end dates earlier than start dates.
- **Output & PDF export:** Per-tenant breakdown table (name, days stayed, per-day rate, amount due in `₱`) plus summary footer row (total days, total bill, sum of shares); client-side PDF export for a combined unit statement and individual tenant slips, including unit name/label, billing month, total bill, per-day rate, and generated date.
- **History & Settings:** Local persistence of billing months with ability to switch, reopen, edit, save, and delete past months; configurable unit name/label for PDF headers; preloaded sample dataset (1 month, 3 tenants with varied stay dates).

## Evidence on Hand
- Sample dataset specified by brief: one billing month with 3 tenants having different stay dates (including full-month and mid-month move-in/out scenarios) preloaded on first launch.
- No external commercial claims, testimonials, or third-party integrations.

## Product Principles
1. **Centavo-Exact Transparency:** Every peso and centavo is accounted for using integer arithmetic; tenants and owners can immediately verify the per-day rate, stay window, and exact reconciliation.
2. **Fast Monthly Ritual:** Entering a bill, adjusting tenant dates, and exporting PDF slips should take under a minute on either phone or desktop.
3. **Local & Self-Contained:** Zero login, zero server dependencies—everything runs deterministically in the browser with reliable `localStorage` history and unit-tested math.
