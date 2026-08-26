# Quickstart & Verification Guide: Design System & App Shell

**Feature**: Design System & App Shell (`specs/001-design-system-app-shell`)
**Date**: 2026-08-26

## 1. Prerequisites & Installation

Ensure `pnpm` (v8 or v9) and Node.js LTS (>=20) are installed.

```bash
# Clone and enter workspace root
cd "d:\Source Code\Personal\aksicendekia"

# Install monorepo dependencies across apps and packages
pnpm install
```

---

## 2. Generate Design Tokens

Run the token generator script to extract design tokens from `design/DESIGN.md` into `packages/design-tokens/src/tokens.css`.

```bash
# Generate tokens from design/DESIGN.md
pnpm --filter @aksicendekia/design-tokens build
```

**Verification**: Confirm that `packages/design-tokens/src/tokens.css` contains `:root` variables as well as `[data-jenjang="tk"]`, `[data-jenjang="sd"]`, `[data-jenjang="smp"]`, and `[data-jenjang="sma"]` custom property definitions.

---

## 3. Run Local Development Server

Launch the Next.js App Router application.

```bash
# Start dev server for apps/web
pnpm dev
```

Open your browser to `http://localhost:3000`.

---

## 4. Verification Scenarios

### Scenario A: Internal Component Catalog Route (`http://localhost:3000/catalog`)
1. Navigate to `http://localhost:3000/catalog`.
2. Observe the catalog layout rendering all core component primitives:
   - **Interactive Card**
   - **Progress Bar** (pill-shaped gradient)
   - **Achievement Badge** (gold sunburst)
   - **Primary Button** (4px bottom border tactile depress)
   - **Ghost Button**
   - **Level Selector**
   - **Mascot Speech Bubble**

### Scenario B: Grade-Level Theme Swapping
1. Click the Grade Level buttons (TK, SD, SMP, SMA) in the catalog header or sidebar.
2. Verify that the root DOM element updates to `<html data-jenjang="sd">` (or `tk`, `smp`, `sma`).
3. Verify visual theme transitions:
   - **TK**: Soft pastels.
   - **SD**: High-saturation primary azure/amber.
   - **SMP**: Jewel tones (teal/purple).
   - **SMA**: Dark mode with neon lime accents & Montserrat headings.
4. Verify that zero component files use conditional `if (jenjang === 'tk')` branching classes.

### Scenario C: Responsive Viewports (375px & 1440px)
1. Open Chrome DevTools (`F12` -> Toggle Device Toolbar).
2. Set screen width to **375px** (Mobile):
   - Confirm 4-column grid layout with 16px margins.
   - Confirm sidebar collapses into accessible mobile menu drawer.
3. Set screen width to **1440px** (Desktop):
   - Confirm 12-column grid layout with 1200px max container width.
   - Confirm persistent sidebar navigation.

### Scenario D: i18n Language Toggle
1. Click the Language Switcher button in the top bar.
2. Toggle between **Bahasa Indonesia (`id`)** and **English (`en`)**.
3. Confirm all UI text strings (navigation, catalog labels, button text) update instantly without hardcoded string literals in JSX.

### Scenario E: Accessibility & Keyboard Navigation (WCAG 2.1 AA)
1. Press `Tab` to navigate through interactive components.
2. Confirm a high-contrast focus ring appears on all focused buttons, inputs, and tiles.
3. Press `Enter` or `Space` to activate buttons and level selector tiles.
4. Verify that all interactive hit targets measure at least 44x44px.
