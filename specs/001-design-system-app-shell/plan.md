# Implementation Plan: Design System & App Shell

**Branch**: `main` | **Date**: 2026-08-26 | **Spec**: [specs/001-design-system-app-shell/spec.md](spec.md)

**Input**: Feature specification from `/specs/001-design-system-app-shell/spec.md`

## Summary

Build the visual foundation and responsive App Shell for AksiCendekia within a `pnpm` workspace monorepo. This feature establishes `packages/design-tokens` as the single source of truth (automatically extracted from `design/DESIGN.md` via a Node.js generator script), `packages/ui` as the shared component library (containing Interactive Cards, Progress Bars, Achievement Badges, Tactile 3D Buttons, Level Selectors, Mascot Bubbles, and the App Shell), and `apps/web` for serving the App Shell and an internal Component Catalog page (`/catalog`). Theming across 4 grade levels (TK, SD, SMP, SMA) is driven exclusively by root `data-jenjang` attribute CSS variable swapping with zero component duplication.

---

## Technical Context

- **Language/Version**: TypeScript 5.x (Strict mode enabled `"strict": true`).
- **Primary Frameworks**: Next.js (App Router, v14+), React 18+, Tailwind CSS (build-time via PostCSS), shadcn/ui.
- **Monorepo Manager**: `pnpm` workspaces (`apps/web`, `apps/api`, `packages/ui`, `packages/design-tokens`).
- **Iconography**: `lucide-react` (zero CDN font dependency).
- **Fonts**: `next/font/google` (`Quicksand`, `Inter`, `Montserrat` self-hosted at build-time).
- **Internationalization**: Lightweight i18n provider (`id` default, `en` secondary).
- **Testing Suite**: Vitest with `@testing-library/react`.
- **Target Viewports**: 375px (Mobile 4-column grid) to 1440px (Desktop 12-column grid, max 1200px container).
- **Accessibility Target**: WCAG 2.1 Level AA (min 44x44px touch targets, min 4.5:1 text contrast, full keyboard navigation).

---

## Constitution Check

*GATE: Must pass before implementation. Evaluated against Constitution v1.1.0.*

| Constitution Principle | Requirement | Plan Compliance Status |
|---|---|---|
| **Principle I: Tech Stack** | TypeScript strict mode, clean modularity | **PASS**: Full TS strict mode enabled across monorepo packages. |
| **Principle III: TDD & Coverage** | 80%+ test coverage gate, Vitest runner | **PASS**: Vitest configured in `packages/ui` for unit & component accessibility testing. |
| **Principle V: Frontend Stack & Monorepo** | Next.js App Router, Tailwind CSS (PostCSS), shadcn/ui, `packages/ui`, `pnpm` workspace. CDN Tailwind strictly forbidden. | **PASS**: Full monorepo structure with Next.js App Router, build-time Tailwind CSS via PostCSS, and zero CDN links. |
| **Principle VI: Design System Single Source** | `packages/design-tokens` derived from `design/DESIGN.md`. Anti-hardcoding. `data-jenjang` root attribute theming. Self-hosted assets. | **PASS**: Token generator script converts `design/DESIGN.md` into CSS variables. Root `data-jenjang` handles 4-level theme swaps. Local assets only. |
| **Principle VII: Child Data Protection** | Data minimization, anonymous public profile defaults | **PASS**: App Shell user profile preview uses display names only. No PII collected. |
| **Principle VIII: Curriculum Content & i18n** | i18n layer mandatory, Bahasa Indonesia default, zero literal JSX strings | **PASS**: All UI text externalized into i18n dictionary resources (`id` & `en`). |
| **Principle IX: Accessibility** | WCAG 2.1 level AA (min 44x44px touch targets, 4.5:1 text contrast, keyboard nav) | **PASS**: All interactive components enforce min 44x44px target size, high-contrast focus rings, and screen-reader semantics. |

---

## Project Structure

### Documentation (`specs/001-design-system-app-shell/`)

```text
specs/001-design-system-app-shell/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this document)
├── research.md          # Technical research & decisions (Phase 0)
├── data-model.md        # Data models & component props schema (Phase 1)
├── quickstart.md        # Runnable verification guide (Phase 1)
├── contracts/           # Component & Token contracts (Phase 1)
│   ├── ui-components.md # UI primitives specifications
│   └── theme-tokens.md  # CSS Custom Properties schema
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (`d:\Source Code\Personal\aksicendekia\`)

```text
packages/
├── design-tokens/
│   ├── scripts/
│   │   └── generate-tokens.mjs  # Parser script extracting tokens from design/DESIGN.md
│   ├── src/
│   │   ├── tokens.css          # Generated CSS variables & [data-jenjang] rules
│   │   └── index.ts            # Exported TS token types & constants
│   └── package.json
│
└── ui/
    ├── src/
    │   ├── components/
    │   │   ├── card.tsx                # Interactive Card primitive
    │   │   ├── progress-bar.tsx        # Pill-shaped gradient progress bar
    │   │   ├── achievement-badge.tsx   # Gold coin sunburst badge
    │   │   ├── button.tsx              # Tactile 3D push-button & Ghost button
    │   │   ├── level-selector.tsx      # Grade level selector tile
    │   │   ├── mascot-speech-bubble.tsx# Speech bubble with pointer
    │   │   └── app-shell.tsx           # Sidebar, topbar, & container layout
    │   ├── providers/
    │   │   ├── theme-provider.tsx      # Manages data-jenjang DOM attribute
    │   │   └── i18n-provider.tsx       # Manages id/en locale state
    │   └── locales/
    │       ├── id.json                 # Bahasa Indonesia strings
    │       └── en.json                 # English strings
    ├── tailwind.config.js              # Consumes CSS custom properties
    └── package.json

apps/
└── web/
    ├── app/
    │   ├── layout.tsx                  # Root layout (next/font & providers)
    │   ├── page.tsx                    # App Shell homepage demo
    │   ├── catalog/
    │   │   └── page.tsx                # Internal Component Catalog page
    │   └── globals.css                 # Imports packages/design-tokens/src/tokens.css
    ├── public/
    │   └── assets/                     # Self-hosted mascot SVGs & avatar assets
    └── package.json
```

---

## Complexity Tracking

*No constitution violations or unjustified architectural complexities exist. All design choices strictly align with Constitution v1.1.0.*
