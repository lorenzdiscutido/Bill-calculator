---
name: Monthly Electricity Bill Splitter
description: Precision Philippine residential utility proration workbench by tenant stay days
colors:
  bg-ground: "#f5f3ee"
  bg-ground-subtle: "#ebe7df"
  bg-surface: "#ffffff"
  bg-surface-hover: "#faf9f6"
  bg-surface-active: "#fdf6f0"
  bg-shell: "#161b22"
  bg-shell-elevated: "#212832"
  text-primary: "#161b22"
  text-secondary: "#3f4854"
  text-placeholder: "#586270"
  text-on-shell: "#f5f3ee"
  text-on-shell-muted: "#c2cad4"
  accent-copper: "#b84d11"
  accent-copper-hover: "#9a3e0b"
  accent-copper-tint: "#fceee6"
  state-reconciled: "#11613b"
  state-reconciled-bg: "#eaf5ef"
  state-error: "#a81f15"
  state-error-bg: "#fdf0ef"
  state-warning: "#8a4b08"
  state-warning-bg: "#fef6eb"
  border-hairline: "#d4dae1"
  border-strong: "#adb6c2"
  border-shell: "#323c4a"
typography:
  headline:
    fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  subhead:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  title:
    fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.84375rem"
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
  meta:
    fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.78125rem"
    fontWeight: 400
    lineHeight: 1.4
  micro:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  xs: "2px"
  inner: "3px"
  sm: "4px"
  md: "6px"
spacing:
  xs: "0.375rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.accent-copper}"
    textColor: "{colors.bg-surface}"
    rounded: "{rounded.sm}"
    padding: "0 0.875rem"
    height: "2.375rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-copper-hover}"
  button-secondary:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "0 0.875rem"
    height: "2.375rem"
  input-control:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "0 0.75rem"
    height: "2.5rem"
  workspace-panel:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "1.25rem 1.5rem"
---

# Design System: Monthly Electricity Bill Splitter

## Overview

**Creative North Star: "The Submeter Schedule & Occupancy Ledger"**

Built for an apartment owner reconciling a single monthly Philippine peso (`₱`) utility statement across multiple tenants, the visual system draws from electrical submeter directories and accountant voucher books. It pairs a deep breaker-slate structural header and stepped archive rail with crisp white work panels set on a warm anodized alabaster ground. Every numerical figure—peso amounts, day counts, per-day rates, and centavo remainder adjustments—is set in tabular monospace so columns align to the pixel.

The interface rejects decorative SaaS stat-card grids, gradient text, glass blur, and eyebrow kickers. Visual energy is reserved for operational clarity: an interactive occupancy tick-rail and span strip plots each tenant's clipped stay window across the days of the billing month, and a semantic emerald verification bar confirms that rounded tenant shares sum to the exact total bill down to the centavo.

**Key Characteristics:**
- **Dark-Shell / Warm-Paper Contrast:** Deep Breaker Slate (`#161b22`) anchors the top utility bar and table headers, while Warm Anodized Alabaster (`#f5f3ee`) and Crisp Voucher Paper (`#ffffff`) carry form editing and tabular review.
- **Tabular Peso Discipline:** All currency values (`₱1,234.56`), date bounds (`YYYY-MM-DD`), day counts, and share ratios use self-hosted `JetBrains Mono` with `font-variant-numeric: tabular-nums`.
- **Proportional Occupancy Visualization:** A horizontal day-tick ruler (`Day 1` to `End`) renders each tenant's clipped stay range as a live Copper-Amber track above the results table.
- **Unmistakable Semantic States:** Emerald (`#11613b`) confirms centavo reconciliation, Amber (`#8a4b08`) flags billing-period date clipping, and Vermilion (`#a81f15`) marks validation errors directly on the offending field.

## Colors

The palette balances industrial breaker-panel slate and warm ledger paper with functional copper, emerald, and vermilion semantic states.

### Primary
- **Circuit Copper** (`#b84d11`): Primary operational CTAs (Combined PDF export), active archive month indicator, focused field outlines,occupancy timeline bars for date-range stays, and centavo adjustment badges.
- **Deep Copper Hover** (`#9a3e0b`): Hover state for primary operational buttons.
- **Copper Tint** (`#fceee6`): Subtle fill for centavo rounding adjustment badges (`+₱0.01 adj` / `-₱0.01 adj`).

### Secondary
- **Reconciled Emerald** (`#11613b`): Text and icon color for verified total reconciliation rows and confirmation pills.
- **Reconciled Emerald Surface** (`#eaf5ef`): Background fill for the table summary footer (`tfoot`) and reconciliation status pill.

### Tertiary
- **Errata Vermilion** (`#a81f15`): Validation error text, invalid input borders, and destructive action labels.
- **Clipping Amber** (`#8a4b08`): Inline notice badge when a tenant's move-in or move-out date is automatically clipped to the billing period.

### Neutral
- **Anodized Alabaster** (`#f5f3ee`): Primary page background ground (`--bg-ground`) and inset readout cells.
- **Archive Sand** (`#ebe7df`): Secondary neutral layer (`--bg-ground-subtle`) for the left billing history rail.
- **Voucher Paper** (`#ffffff`): Elevated work panels, tenant rows, and form inputs (`--bg-surface`).
- **Breaker Slate** (`#161b22`): Primary ink color (`--text-primary`), top application bar, and results table header background (`--bg-shell`).
- **Slate Elevated** (`#212832`): Top-bar unit setting field container and manual-mode occupancy bars (`--bg-shell-elevated`).
- **Graphite Secondary** (`#3f4854`): Supporting notes, metadata, and formula descriptions (`--text-secondary`, `8.9:1` contrast on paper).
- **Hairline Slate** (`#d4dae1`): Uniform `1px` structural borders across panels, table cells, and tenant rows (`--border-hairline`).

### Named Rules
**The Semantic Emerald Rule.** Emerald (`#11613b` on `#eaf5ef`) is reserved exclusively for verified mathematical reconciliation (when rounded tenant shares equal the exact total bill) and save confirmations—never for general navigation or decorative badges.

**The Uniform Hairline Rule.** All containers, rows, callouts, and alerts use uniform `1px solid` borders (`#d4dae1` at rest, `#b84d11` on active/focus, `#a81f15` on error). Never use thick (`>1px`) left or right accent stripes.

## Typography

**Display & UI Font:** `Public Sans` (self-hosted TTF, weights `400`, `600`, `700`, with system sans fallback)
**Tabular & Data Font:** `JetBrains Mono` (self-hosted TTF, weights `400`, `600`, with monospace fallback)

**Character:** `Public Sans` provides a neutral, high-legibility civic and administrative voice for headings, labels, and form controls, while `JetBrains Mono` locks every peso figure, date string, day count, and division formula onto a strict tabular grid.

### Hierarchy
- **Headline** (`700`, `1.125rem`, `1.25` line-height, `-0.015em` tracking): Application title and primary workspace panel headings (`h1`, `h2`).
- **Title** (`700`, `0.9375rem`, `1.4` line-height): Archive rail heading, month cards, and alert titles.
- **Body** (`400`, `0.9375rem`, `1.5` line-height): Standard table cells, select controls, and section guidance.
- **Label** (`600`, `0.84375rem`, `1.4` line-height): Form field labels, table column headers, and action buttons.
- **Tabular Data** (`600`, `0.9375rem`, `1.5` line-height, `font-variant-numeric: tabular-nums`): Peso inputs, currency readouts (`₱1,234.56`), date inputs, day counts, and share percentages.

### Named Rules
**The Fixed Operational Scale Rule.** Typography uses a fixed `rem` scale (`0.75rem` to `1.125rem`) rather than fluid `clamp()` sizing so controls and data tables maintain consistent density across desktop and mobile viewports.

**The No-Kicker Rule.** Headings (`h1`, `h2`, `h3`) carry their own hierarchy without small uppercase eyebrow or kicker labels above them.

## Layout

The application uses a structural two-zone operational layout below a full-width `4.25rem` dark slate top bar:
- **Desktop (`> 860px`):** A `2-column` CSS Grid (`18.5rem minmax(0, 1fr)`) pairing the persistent left Archive Rail (`padding: 1.25rem 1rem`) with the Main Calculation Workbench (`padding: 1.5rem 2rem 2.5rem 2rem`, `max-width: 74rem`).
- **Billing Setup Grid:** A `4-column` grid (`repeat(4, minmax(0, 1fr))`, `gap: 1rem`) that steps down to `2 columns` at `≤ 1080px` and `1 column` at `≤ 600px`.
- **Tenant Roster Grid:** A `5-column` aligned row (`minmax(11rem, 1.3fr) 11.5rem minmax(15rem, 2fr) 7.5rem auto`, `gap: 0.875rem`) keeping name, entry mode toggle, date pair / manual input, counted days badge, and remove button on a single horizontal baseline on desktop, collapsing cleanly to stacked fields on mobile (`≤ 600px`).

## Elevation & Depth

Depth is communicated primarily through surface luminance contrast (`#ffffff` panels over `#f5f3ee` ground and `#ebe7df` archive rail) reinforced by `1px` hairline borders and subtle offset shadows.

### Shadow Vocabulary
- **Panel Rest Shadow** (`box-shadow: 0 2px 6px rgba(22, 27, 34, 0.06)`): Applied to `.workspace-panel` containers and the active archive month card.
- **Focus Ring Shadow** (`box-shadow: 0 2px 8px rgba(184, 77, 17, 0.14)`): Applied alongside the `#b84d11` border when form inputs or selects receive focus.

### Named Rules
**The Offset-Blur Depth Rule.** Shadows always carry a vertical offset (`2px`) and soft blur (`6px–8px`), never zero-offset colored glows or hard neobrutalist block shadows.

## Shapes

Corners are crisp and utilitarian to match printed statements and hardware schedules:
- **Small Control Radius** (`4px`): Buttons, inputs, selects, segmented mode toggles, archive items, and status badges.
- **Panel Container Radius** (`6px`): Primary `.workspace-panel` sections.
- **Occupancy Track Bars** (`2px–3px`): Inner horizontal bars inside the occupancy schedule ruler.

## Components

### Buttons
- **Shape:** Crisp rounded rectangle (`4px` radius, `2.375rem` height, `0 0.875rem` horizontal padding).
- **Primary (`.btn-primary`):** Circuit Copper (`#b84d11`) background with white (`#ffffff`) bold label; transitions in `150ms ease-out` to Deep Copper (`#9a3e0b`) on hover.
- **Secondary (`.btn-secondary`):** Voucher Paper (`#ffffff`) background with `1px solid #adb6c2` border and `#161b22` text; shifts to `#f5f3ee` background with `#161b22` border on hover.
- **Shell Action (`.btn-shell`):** Slate Elevated (`#212832`) background with `1px solid #323c4a` border for secondary actions inside the dark top bar.

### Inputs / Fields
- **Style:** `2.5rem` height, `0 0.75rem` padding, `#ffffff` background, `1px solid #adb6c2` border, `4px` radius. Peso inputs include a fixed `₱` prefix in `JetBrains Mono`.
- **Focus:** Border shifts to Circuit Copper (`#b84d11`) with `0 2px 8px rgba(184, 77, 17, 0.14)` shadow.
- **Error (`.is-invalid`):** Border shifts to Errata Vermilion (`#a81f15`) with `#fdf0ef` background tint and an inline `#a81f15` error message below.

### Cards / Containers
- **Corner Style:** `6px` radius on `.workspace-panel` sections; `4px` radius on `.tenant-row` items.
- **Background:** Voucher Paper (`#ffffff`) over Anodized Alabaster (`#f5f3ee`).
- **Shadow Strategy:** `0 2px 6px rgba(22, 27, 34, 0.06)` on primary panels; flat `1px solid #d4dae1` on nested tenant rows, shifting to `#fdf6f0` with `#b84d11` border on `:focus-within`.

### Navigation (Saved Billing Months Rail)
- **Style:** Vertical stepped list of saved months in the left rail (`#ebe7df` ground). Each item displays the billing month name in bold `Public Sans`, the total bill in `JetBrains Mono`, tenant count, date range, and an inline delete button separated by a `1px` vertical hairline.
- **Active State:** Warm tint (`#fdf6f0`) with a `1px solid #b84d11` border and copper month title.

### Billing Period Occupancy Schedule (`Signature Component`)
- **Structure:** A 3-column horizontal timeline (`10.5rem minmax(0, 1fr) 4.75rem`) directly above the results table, headed by a `Day 1 … Mid … End` tick ruler.
- **Behavior:** Plots each tenant's stay window across a 10%-gridded track bed (`1.125rem` height). Date-range stays position their `left` offset and `width` proportionally to their clipped calendar start/end dates in Circuit Copper (`#b84d11`), while manual day counts render from the left edge in Slate Elevated (`#212832`), animating smoothly (`180ms cubic-bezier(0.16, 1, 0.3, 1)`) as dates or day counts change.

## Do's and Don'ts

### Do:
- **Do** format every Philippine peso value with the `₱` sign, thousands commas, and exactly two decimal places (`₱1,234.56`) using `JetBrains Mono` (`tabular-nums`).
- **Do** surface any largest-share centavo rounding adjustment (`+₱0.01` or `-₱0.01`) as an explicit inline badge next to the reconciled tenant's amount due.
- **Do** keep all interactive form inputs at a consistent `2.5rem` (`40px`) height so multi-column rows align cleanly.

### Don't:
- **Don't** place small uppercase kickers or eyebrows above section headings.
- **Don't** use floating-point arithmetic for currency division; always compute shares in integer centavos with deterministic round-half-up.
- **Don't** use thick (`>1px`) colored `border-left` or `border-right` stripes on cards, rows, or validation alerts.
