# Theme Tokens Contract: `packages/design-tokens`

**Feature**: Design System & App Shell (`specs/001-design-system-app-shell`)
**Date**: 2026-08-26

## Overview

`packages/design-tokens` is the single source of truth for design system tokens in AksiCendekia. It exposes CSS custom property declarations derived from `design/DESIGN.md`.

---

## 1. CSS Custom Property Names & Roles

### Color Tokens (M3 Schema)
- `--color-surface`: Main surface background
- `--color-surface-container`: Elevated card surface
- `--color-surface-container-high`: Interactive hover surface
- `--color-on-surface`: Primary body text color
- `--color-on-surface-variant`: Muted text color
- `--color-outline`: Divider & standard border color
- `--color-outline-variant`: Subtle card border color
- `--color-primary`: Main brand & action color
- `--color-on-primary`: Text on primary button
- `--color-primary-container`: Soft primary container background
- `--color-secondary`: Gamification & reward accent (Amber/Gold)
- `--color-on-secondary`: Text on secondary button
- `--color-tertiary`: Success emerald color
- `--color-error`: Error red color

### Typography Tokens
- `--font-heading`: Heading font family (`Quicksand` default, `Montserrat` for SMA)
- `--font-body`: Body font family (`Inter`)

### Typography Scale Tokens
- `--font-size-display-lg`: `48px` (Line height: `56px`, Weight: `700`)
- `--font-size-headline-lg`: `32px` (Line height: `40px`, Weight: `700`)
- `--font-size-title-md`: `24px` (Line height: `32px`, Weight: `600`)
- `--font-size-body-lg`: `18px` (Line height: `28px`, Weight: `400`)
- `--font-size-body-md`: `16px` (Line height: `24px`, Weight: `400`)
- `--font-size-label-sm`: `12px` (Line height: `16px`, Weight: `600`)

### Radius Tokens
- `--radius-sm`: `0.25rem` (4px)
- `--radius-default`: `0.5rem` (8px)
- `--radius-md`: `0.75rem` (12px)
- `--radius-lg`: `1rem` (16px)
- `--radius-xl`: `1.5rem` (24px)
- `--radius-full`: `9999px`

### Spacing Tokens (8px System)
- `--spacing-xs`: `4px`
- `--spacing-base`: `8px`
- `--spacing-sm`: `12px`
- `--spacing-md`: `24px`
- `--spacing-lg`: `48px`
- `--spacing-xl`: `64px`
- `--spacing-container-max`: `1200px`
- `--spacing-gutter`: `20px`

---

## 2. Grade Level Token Overrides

```css
/* Base Root Default (SD Fallback) */
:root {
  --color-background: #f8f9ff;
  --color-surface: #ffffff;
  --color-primary: #0058be;
  --color-secondary: #fea619;
  --color-tertiary: #00855b;
  --font-heading: var(--font-quicksand), sans-serif;
  --font-body: var(--font-inter), sans-serif;
}

/* TK (Foundational): Soft Pastels, Low Anxiety */
[data-jenjang="tk"] {
  --color-background: #fff8fa;
  --color-surface: #ffffff;
  --color-primary: #ff7eac;
  --color-secondary: #ffb84d;
  --color-tertiary: #4edea3;
  --font-heading: var(--font-quicksand), sans-serif;
}

/* SD (Elementary): High Saturation Primary Colors */
[data-jenjang="sd"] {
  --color-background: #f8f9ff;
  --color-surface: #ffffff;
  --color-primary: #0058be;
  --color-secondary: #fea619;
  --color-tertiary: #00855b;
  --font-heading: var(--font-quicksand), sans-serif;
}

/* SMP (Junior High): Jewel Tones (Teal / Purple) */
[data-jenjang="smp"] {
  --color-background: #f5f3ff;
  --color-surface: #ffffff;
  --color-primary: #00855b;
  --color-secondary: #8b5cf6;
  --color-tertiary: #00855b;
  --font-heading: var(--font-quicksand), sans-serif;
}

/* SMA (Senior High): Dark Mode & Neon Accents */
[data-jenjang="sma"] {
  --color-background: #0b121e;
  --color-surface: #152238;
  --color-surface-container: #1e2d4a;
  --color-on-surface: #f1f5f9;
  --color-on-surface-variant: #94a3b8;
  --color-primary: #00e699;
  --color-secondary: #ccff00;
  --color-tertiary: #00e699;
  --font-heading: var(--font-montserrat), sans-serif;
}
```
