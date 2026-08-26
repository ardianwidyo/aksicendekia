# Tasks: Design System & App Shell

**Input**: Design documents from `/specs/001-design-system-app-shell/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`

---

## Phase 1: Setup (Shared Monorepo Infrastructure)

**Purpose**: Monorepo initialization and workspace structure

- [X] T001 Initialize monorepo workspace configuration in `pnpm-workspace.yaml` and root `package.json`
- [X] T002 Set up `@aksicendekia/design-tokens` package structure in `packages/design-tokens/package.json` and `packages/design-tokens/tsconfig.json`
- [X] T003 [P] Set up `@aksicendekia/ui` package structure in `packages/ui/package.json`, `packages/ui/tsconfig.json`, and `packages/ui/tailwind.config.js`
- [X] T004 [P] Set up `apps/web` Next.js App Router application in `apps/web/package.json`, `apps/web/tsconfig.json`, and `apps/web/next.config.mjs`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and token generator that MUST be complete before ANY UI component work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create design token generator script in `packages/design-tokens/scripts/generate-tokens.mjs` to extract YAML tokens from `design/DESIGN.md` into `packages/design-tokens/src/tokens.css`
- [X] T006 [P] Create TypeScript token exports in `packages/design-tokens/src/index.ts`
- [X] T007 [P] Create `ThemeProvider` React context in `packages/ui/src/providers/theme-provider.tsx` for toggling root `data-jenjang` DOM attribute (`tk`, `sd`, `smp`, `sma`)
- [X] T008 [P] Create `I18nProvider` React context and locale dictionaries in `packages/ui/src/providers/i18n-provider.tsx` and `packages/ui/src/locales/id.json`
- [X] T009 Set up Root Layout in `apps/web/app/layout.tsx` importing local fonts via `next/font/google` (`Quicksand`, `Inter`, `Montserrat`) and wrapping providers
- [X] T010 Import generated tokens CSS into `apps/web/app/globals.css`

**Checkpoint**: Foundation ready - design tokens generated, fonts loaded, and theme/i18n providers active.

---

## Phase 3: User Story 1 - Multi-Level Theme & Component Showcase (Priority: P1) 🎯 MVP

**Goal**: Build core UI component primitives in `packages/ui` and an internal Component Catalog page (`/catalog`) in `apps/web` to demonstrate theme switching and component rendering across TK, SD, SMP, SMA without component duplication.

**Independent Test**: Navigate to `http://localhost:3000/catalog`, switch themes between TK, SD, SMP, SMA, and verify tactile button depression, progress bar gradient, gold badges, interactive cards, level selectors, and speech bubbles.

### Implementation for User Story 1

- [X] T011 [P] [US1] Create Interactive Card component in `packages/ui/src/components/card.tsx`
- [X] T012 [P] [US1] Create Progress Bar component with pill-shaped ends & primary-to-success gradient fill in `packages/ui/src/components/progress-bar.tsx`
- [X] T013 [P] [US1] Create Achievement Badge component with gold secondary border & sunburst pattern in `packages/ui/src/components/achievement-badge.tsx`
- [X] T014 [P] [US1] Create Primary 3D Tactile Button & Ghost Button with 4px bottom border in `packages/ui/src/components/button.tsx`
- [X] T015 [P] [US1] Create Mascot Speech Bubble component with triangular pointer in `packages/ui/src/components/mascot-speech-bubble.tsx`
- [X] T016 [P] [US1] Create Grade Level Selector tile component in `packages/ui/src/components/level-selector.tsx`
- [X] T017 [US1] Export all UI component primitives in `packages/ui/src/index.ts`
- [X] T018 [US1] Build internal Component Catalog page in `apps/web/app/catalog/page.tsx` displaying all components across TK, SD, SMP, and SMA themes

**Checkpoint**: User Story 1 (MVP) complete and independently testable at `http://localhost:3000/catalog`.

---

## Phase 4: User Story 2 - Responsive App Shell & Navigation (Priority: P2)

**Goal**: Build the responsive App Shell layout (Sidebar, Top Bar, Content area) in `packages/ui` and integrate into `apps/web/app/page.tsx`.

**Independent Test**: View `http://localhost:3000` at 375px mobile and 1440px desktop viewports, testing drawer toggles, level switching, and streak display.

### Implementation for User Story 2

- [X] T019 [P] [US2] Create Sidebar navigation component with grade level selector tile & Pro CTA in `packages/ui/src/components/sidebar.tsx`
- [X] T020 [P] [US2] Create Top Bar header component with streak indicator & language switcher in `packages/ui/src/components/topbar.tsx`
- [X] T021 [US2] Assemble responsive App Shell layout container in `packages/ui/src/components/app-shell.tsx` enforcing 4-column mobile & 12-column desktop grid
- [X] T022 [US2] Wire App Shell homepage demo in `apps/web/app/page.tsx`

**Checkpoint**: User Story 2 complete and independently testable across screen sizes.

---

## Phase 5: User Story 3 - Internationalization (i18n) & Localized UI Strings (Priority: P3)

**Goal**: Ensure 100% of UI strings in App Shell, Navigation, Level Selector, and Component Catalog consume i18n translation keys.

**Independent Test**: Toggle language selector in Top Bar between Bahasa Indonesia (`id`) and English (`en`), confirming zero hardcoded string literals in components.

### Implementation for User Story 3

- [X] T023 [P] [US3] Complete Bahasa Indonesia translation dictionary in `packages/ui/src/locales/id.json`
- [X] T024 [P] [US3] Complete English translation dictionary in `packages/ui/src/locales/en.json`
- [X] T025 [US3] Wire `useI18n` hook across all components in `packages/ui/src/components/` to replace string literals with locale keys

**Checkpoint**: User Story 3 complete with multi-language support active.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Asset self-hosting, WCAG 2.1 AA accessibility verification, and quickstart execution

- [X] T026 [P] Add self-hosted mascot SVG illustrations in `apps/web/public/assets/mascots/` and `packages/ui/src/assets/`
- [X] T027 [P] Verify WCAG 2.1 AA keyboard focus rings, touch targets (>=44x44px), and text contrast across all 4 themes
- [X] T028 Execute full quickstart validation scenarios documented in `specs/001-design-system-app-shell/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - **BLOCKS** all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion.
- **User Story 2 (Phase 4)**: Depends on Foundational completion & User Story 1 component primitives.
- **User Story 3 (Phase 5)**: Depends on User Story 1 & 2 components.
- **Polish (Phase 6)**: Depends on all user stories complete.

---

## Parallel Execution Opportunities

- **Phase 1**: T003 (`packages/ui`) and T004 (`apps/web`) can run in parallel.
- **Phase 2**: T006 (token exports), T007 (ThemeProvider), and T008 (I18nProvider) can run in parallel.
- **Phase 3 (US1)**: T011 (Card), T012 (ProgressBar), T013 (Badge), T014 (Button), T015 (MascotBubble), T016 (LevelSelector) can all run in parallel.
- **Phase 4 (US2)**: T019 (Sidebar) and T020 (TopBar) can run in parallel.
- **Phase 5 (US3)**: T023 (`id.json`) and T024 (`en.json`) can run in parallel.
