# Tasks: Design System dan App Shell AksiCendekia

**Input**: Design documents from `specs/001-design-system-app-shell/` (`spec.md`, `plan.md`)

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Initialize pnpm monorepo structure with `@aksicendekia/design-tokens`, `@aksicendekia/ui`, and `apps/web`
- [x] T002 Configure `packages/design-tokens/scripts/generate-tokens.mjs` generator to extract 47 M3 color tokens, radius, and spacing from `design/DESIGN.md` into `tokens.css` and `tokens.json`
- [x] T003 [P] Configure Tailwind CSS (`tailwind.config.js`) in `packages/ui` and `apps/web` to consume CSS Custom Properties

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Define root `data-jenjang` attribute selectors (`tk`, `sd`, `smp`, `sma`) and `[data-shell="professional"]` font override in `packages/design-tokens/src/tokens.css`
- [x] T005 Setup Next.js Google Font loaders (`Quicksand`, `Inter`, `Montserrat`) in `apps/web/app/layout.tsx`
- [x] T006 Implement `ThemeProvider` (`data-jenjang` manager) and `I18nProvider` (dictionary manager) in `packages/ui/src/providers/`
- [x] T007 Setup `packages/ui/src/locales/id.json` with 100% Bahasa Indonesia string dictionary

---

## Phase 3: User Story 1 - Pengalaman Siswa (Student Shell & Gamifikasi) (Priority: P1) 🎯 MVP

**Goal**: Deliver gamified student learning shell and Group A play components with 3D tactile buttons, level selector, and streak top bar.

- [x] T008 [P] [US1] Create `InteractiveCard` component with soft shadow and 3D hover/active states in `packages/ui/src/components/card.tsx`
- [x] T009 [P] [US1] Create `ProgressBar` component with pill shape and primary-to-success gradient in `packages/ui/src/components/progress-bar.tsx`
- [x] T010 [P] [US1] Create `AchievementBadge` component with 4px gold border and inner sunburst in `packages/ui/src/components/achievement-badge.tsx`
- [x] T011 [P] [US1] Create `ButtonPrimary` (3D tactile 4px bottom border) and `GhostButton` in `packages/ui/src/components/button.tsx`
- [x] T012 [P] [US1] Create `LevelSelector` component for TK/SD/SMP/SMA in `packages/ui/src/components/level-selector.tsx`
- [x] T013 [P] [US1] Create `MascotSpeechBubble` component with rounded bubble and pointer in `packages/ui/src/components/mascot-speech-bubble.tsx`
- [x] T014 [US1] Create `StudentShell` component with sidebar drawer, grade selector, streak indicator, and language switcher in `packages/ui/src/shells/StudentShell.tsx`

---

## Phase 4: User Story 2 - Pengalaman Pengguna Profesional & Font Override (Priority: P1)

**Goal**: Deliver high-density top navigation shell for CMS Admin, Teachers, and Parents with Inter typography override.

- [x] T015 [US2] Implement `ProfessionalShell` component with `data-shell="professional"` scope font override in `packages/ui/src/shells/ProfessionalShell.tsx`
- [x] T016 [US2] Integrate role switcher badge, quick search, notification bell, and compact navigation links into `ProfessionalShell`

---

## Phase 5: User Story 3 - Penanganan State Universal Komponen Data (Priority: P2)

**Goal**: Implement Skeleton Loader, Empty State, and Error State natively on all Group C data components.

- [x] T017 [P] [US3] Create `SkeletonState` pulse animation component in `packages/ui/src/components/states/SkeletonState.tsx`
- [x] T018 [P] [US3] Create `EmptyState` component with illustration, description, and action button in `packages/ui/src/components/states/EmptyState.tsx`
- [x] T019 [P] [US3] Create `ErrorState` component with warning icon and retry button in `packages/ui/src/components/states/ErrorState.tsx`
- [x] T020 [US3] Create `DataTable` component with sortable columns, pagination, and native 3-state support in `packages/ui/src/components/data/DataTable.tsx`
- [x] T021 [US3] Create `Tabs` component with accessible tablist and 3-state support in `packages/ui/src/components/data/Tabs.tsx`
- [x] T022 [US3] Create `DropdownMenu` component with action items, dividers, and 3-state support in `packages/ui/src/components/data/DropdownMenu.tsx`
- [x] T023 [US3] Create `StatCard` component with trend indicators and 3-state support in `packages/ui/src/components/data/StatCard.tsx`
- [x] T024 [US3] Create `ChartWrapper` component with 3-state support in `packages/ui/src/components/data/ChartWrapper.tsx`
- [x] T025 [US3] Create `FileDropzone` component with drag & drop upload, file list, and 3-state support in `packages/ui/src/components/data/FileDropzone.tsx`

---

## Phase 6: User Story 4 - Form Primitives & Kepatuhan Aksesibilitas (Priority: P2)

**Goal**: Deliver accessible form controls with error states, password visibility toggle, modal dialogs, toasts, and alerts.

- [x] T026 [P] [US4] Create `TextInput` and `PasswordInput` (visibility toggle) in `packages/ui/src/components/forms/`
- [x] T027 [P] [US4] Create `Select`, `Checkbox` (44x44px target), `RadioGroup`, and `FormField` wrapper in `packages/ui/src/components/forms/`
- [x] T028 [P] [US4] Create `Modal` dialog component with backdrop click, ESC handler, and focus trap in `packages/ui/src/components/forms/Modal.tsx`
- [x] T029 [P] [US4] Create `Toast` auto-dismiss notification and `Alert` banner box in `packages/ui/src/components/forms/`

---

## Phase 7: User Story 5 - Layer i18n & Katalog Komponen Internal (Priority: P3)

**Goal**: Provide component showcase page at `/catalog` and `/design-system` with 100% Bahasa Indonesia UI strings.

- [x] T030 [US5] Externalize all UI component strings into `packages/ui/src/locales/id.json`
- [x] T031 [US5] Create Component Catalog Showcase page in `apps/web/app/catalog/page.tsx` displaying tokens, components A/B/C, state switcher, and viewport preview (375px & 1440px)
- [x] T032 [US5] Create alias route `apps/web/app/design-system/page.tsx` linking to catalog showcase

---

## Phase 8: Polish & Build Verification

- [x] T033 Verify TypeScript strict mode compilation across packages (`npx pnpm --filter @aksicendekia/ui lint`)
- [x] T034 Verify Next.js App Router production build (`npx pnpm --filter web build`) with 0 errors
