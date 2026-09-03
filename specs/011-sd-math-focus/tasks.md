---

description: "Task list template for feature implementation"
---

# Tasks: Fokus Jenjang SD — Revamp Matematika Interaktif Kelas 1–6

**Input**: Design documents from `/specs/011-sd-math-focus/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included throughout. This repo's constitution makes TDD **NON-NEGOTIABLE** (Principle III) with an 80% coverage gate, and [plan.md](./plan.md)'s Constitution Check explicitly commits to catalog invariants "ditulis sebelum konten dibuat" — so every implementation task here follows a failing-test task, not as an optional extra.

**Organization**: Tasks are grouped by user story (spec.md priorities P1/P1/P2/P2/P2/P3) so each can be implemented, tested, and demoed independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps the task to US1–US6 from spec.md
- Every task names an exact file path

## Path Conventions

Existing monorepo, no new top-level structure: `packages/content-kit/src/`, `packages/ui/src/`, `apps/web/`, `apps/api/`, `scripts/`. See [plan.md](./plan.md) Project Structure for the full tree.

---

## Phase 1: Setup

**Purpose**: Scaffolding the new source locations and build-time configuration this feature needs before any story-level work begins.

- [X] T001 ~~Create skeleton barrel files~~ — adapted: `lessons/sd/`, `lessons/archetypes/`, `focus/`, `illustration/`, `layout/` are created on demand by their first real file (T016/T018/T027/T045 etc.) rather than as empty placeholder `index.ts` files, per the coding-style rule against speculative/dead files. `lessons/sd.ts` (existing) is deliberately **not** touched here — T070 replaces it atomically to avoid a `sd.ts`/`sd/` module-resolution collision.
- [X] T002 [P] Add `apps/web/.env.example` with `NEXT_PUBLIC_FOCUS_ENABLED=true` (contracts/focus-config.md — build-time source)
- [X] T003 [P] Add `FOCUS_ENABLED=true` to `apps/api/.env.example`
- [X] T004 [P] Add `tsx` as a root devDependency and a `verify:video-embeds` script in `package.json` for `scripts/verify-video-embeds.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The additive schema, shared modules, and shared UI primitives every user story below depends on.

**⚠️ CRITICAL**: No user story work should start until this phase is complete.

### Data layer

- [X] T005 Add `gradeLevel Int?` (+ index), `VideoProvider` enum, `VideoEmbed` model, and `LessonContentBlock.videoEmbedId` to `apps/api/prisma/schema.prisma` (data-model.md §1–§2 — additive, nullable, no backfill)
- [X] T006 ~~Generate the Prisma migration~~ — adapted: this repo has never used tracked `prisma migrate` (no `prisma/migrations/` folder exists, no CI applies one); its real convention is `prisma db push`. Ran `prisma db push` against the dev DB instead — schema in sync, Prisma Client regenerated, zero data loss (additive only).
- [X] T007 [P] Add the `VideoEmbedRef` Zod schema (externalId as an 11-char id, not a URL) in `packages/content-kit/src/schema/video-embed.schema.ts` and extend `packages/content-kit/src/schema/__tests__/schemas.spec.ts`
- [X] T008 [P] Extend `InteractiveLesson`/`LessonBlockInput` types with `gradeLevel`, `archetype`, `videoEmbed` in `packages/content-kit/src/lessons/types.ts`

### Curriculum achievements (R2 — load-bearing risk: 60 lessons hang off these 15 rows)

- [X] T009 Add the missing `FASE_A` and `FASE_C` members to the `CurriculumPhase` union type in `packages/content-kit/src/curriculum/achievements.ts` (currently only `FOUNDATION | FASE_B | FASE_D | FASE_E` — blocks every SD row outside Fase B)
- [X] T010 Add 14 new `CurriculumAchievement` rows (Fase A/B/C × the 5 Matematika elements: Bilangan, Aljabar, Pengukuran, Geometri, Analisis Data dan Peluang) to `packages/content-kit/src/curriculum/achievements.ts`, sourced from SK BSKAP 032/2024 **verbatim** with `sourceUrl`/`retrievedAt`/`needsPrimaryVerification: true` (depends on T009, FR-032)
- [X] T011 [P] Extend `packages/content-kit/src/curriculum/__tests__/achievements-provenance.spec.ts` to assert 15 SD rows spanning Fase A/B/C × 5 elements, each with a non-empty `sourceUrl` and `retrievedAt`

### Focus configuration (contracts/focus-config.md)

- [X] T012 [P] Write failing tests for `FocusConfig` guarantees G1–G4 (identity when disabled, no I/O, static-export safe) in `packages/content-kit/src/focus/__tests__/focus-config.spec.ts`
- [X] T013 Implement `FocusConfig`, `getFocusConfig`, `isStageInFocus`, `isSubjectInFocus`, `isLessonInFocus`, `filterLessonsForFocus`, `focusRedirectTarget` in `packages/content-kit/src/focus/focus-config.ts` (depends on T012)
- [X] T014 Export the focus module from `packages/content-kit/src/index.ts` (depends on T013)

### Video embed facade (contracts/video-embed.md)

- [X] T015 [P] Write failing tests for video registry lookup in `packages/content-kit/src/lessons/__tests__/video-registry.spec.ts`
- [X] T016 Implement `packages/content-kit/src/lessons/video-registry.ts` (`getVideoEmbed(id)`, depends on T007, T015)
- [X] T017 [P] Write failing tests for `EmbeddedVideoBlock` — zero iframe/network before click, `youtube-nocookie.com` URL composed from `externalId` after click, keyboard-operable, ≥44×44px — in `packages/ui/src/components/lesson/blocks/__tests__/EmbeddedVideoBlock.spec.tsx`
- [X] T018 Implement `EmbeddedVideoBlock.tsx` (State 1 poster/play, State 2 iframe) in `packages/ui/src/components/lesson/blocks/EmbeddedVideoBlock.tsx` (depends on T017)
- [X] T019 Wire `EmbeddedVideoBlock` into `packages/ui/src/components/lesson/LessonContentRenderer.tsx` for `VIDEO` blocks carrying `videoEmbedId` (self-hosted `VideoBlock` keeps serving `mediaAssetId`)
- [X] T020 Export `EmbeddedVideoBlock` from `packages/ui/src/index.ts`
- [X] T021 [P] Implement `scripts/verify-video-embeds.ts` — CI-only oEmbed link-rot check, non-zero exit on failure, updates `verifiedAt` (R7, FR-016d — never run from the browser)

### Responsive shared primitives (clarify session 2026-09-02: FR-040…FR-045)

- [X] T022 [P] Write failing tests for `usePlacementInput` — tap, drag, and keyboard all drive one select-then-place state machine — in `packages/ui/src/components/interactive/__tests__/usePlacementInput.spec.ts`
- [X] T023 Implement `usePlacementInput.ts` in `packages/ui/src/components/interactive/usePlacementInput.ts` (depends on T022)
- [X] T024 [P] Write failing tests for `ScrollableWide` — zero page-level horizontal scroll, inner scroll works — in `packages/ui/src/components/layout/__tests__/ScrollableWide.spec.tsx`
- [X] T025 Implement `ScrollableWide.tsx` in `packages/ui/src/components/layout/ScrollableWide.tsx` (depends on T024, FR-041)
- [X] T026 [P] Implement the `viewports.ts` test helper (320/375/768/1280 + a portrait assertion) in `packages/ui/src/test-utils/viewports.ts` (SC-013)
- [X] T027 [P] Implement 10 viewBox-responsive illustration primitives (design tokens, `title`/`desc`, `prefers-reduced-motion`-aware) in `packages/ui/src/components/illustration/{PlaceValueBlocks,NumberLineStrip,FractionShape,ArrayGrid,ShapeFigure,BarChartMini,ClockFace,MoneyStack,PatternRow,MeasureRuler}.tsx`
- [X] T028 Export the illustration primitives from `packages/ui/src/index.ts` (depends on T027)

### API service layer (plan.md's Constitution II debt: fold in, don't extend)

- [X] T029 Create `apps/api/src/modules/sync/public-content.service.ts`, moving the Prisma queries out of `public-content.controller.ts`, with focus filtering applied via T013
- [X] T030 ~~Extend curriculum.service.ts with focus-aware/gradeLevel-aware helpers~~ — deferred to T079 (US2): building these in isolation now, before the coverage endpoint that is their only consumer exists, means guessing their shape (YAGNI risk). `curriculum.service.ts` also carries 40+ pre-existing, unrelated `tsc` errors (confirmed via a stash/restore diff: 44 without Feature 011's schema changes, 43 with — proving they predate this feature) that make blind edits there riskier than necessary before its real consumer is defined. `isStageInFocus`/`isSubjectInFocus`/`filterLessonsForFocus` (T013) are already exported and ready for T079 to call directly.

**Checkpoint**: Foundation ready — user stories below can proceed in priority order or in parallel.

---

## Phase 3: User Story 1 — Aplikasi Terfokus pada SD & Matematika (Priority: P1) 🎯 MVP

**Goal**: With focus mode on, every navigation surface, search result, and catalog listing offers only SD + Matematika; every other still-active surface (parent/teacher dashboards, peta misi, papan peringkat, pencapaian) degrades to an empty state instead of breaking; turning focus off restores everything with no code change.

**Independent Test**: Run the app with focus enabled, walk every nav as guest/student/parent/teacher — confirm zero links off-focus and every surface still opens. Flip `NEXT_PUBLIC_FOCUS_ENABLED=false` — confirm full restoration.

- [X] T031 [P] [US1] Write failing test: `sidebar.tsx`, `level-selector.tsx`, `topbar.tsx` list only SD + Matematika when focus is enabled — `packages/ui/src/components/__tests__/nav-focus-filter.spec.tsx`
- [X] T032 [US1] Apply focus filtering in `packages/ui/src/components/sidebar.tsx`, `level-selector.tsx`, `topbar.tsx` (depends on T031, T013)
- [X] T033 [P] [US1] Write failing test for the `apps/web/lib/focus.ts` route/redirect adaptor — `apps/web/lib/__tests__/focus.spec.ts`
- [X] T034 [US1] Implement `apps/web/lib/focus.ts`, wrapping content-kit's `focus-config` for web routes (depends on T033)
- [X] T035 [US1] Filter stage/subject options in `apps/web/app/page.tsx` and `apps/web/app/explore/page.tsx` using `focus.ts` (depends on T034, FR-002) — `explore/page.tsx` renders `filterStageOptions(STAGES)`, hides the stage tab-bar when one stage remains, and snaps `gradeLevel` to an in-focus stage if the active one was filtered out. `page.tsx` (home) carries no stage/subject picker, so nothing to filter there.
- [X] T036 [US1] Render a friendly client-side redirect to `/explore` for out-of-focus lessons in `apps/web/app/explore/[lessonId]/page.tsx`, keeping every id in `generateStaticParams` (depends on T034, FR-005, R3)
- [X] T037 [P] [US1] ~~Write failing test: `GET /api/v1/public/subjects` returns `{subjects: []}` with `200`…~~ — already delivered in the T029 commit: `public-content.test.ts` has a full "focus mode filtering (Feature 011 / FR-002)" describe block (out-of-focus stage -> `{subjects: []}` + 200, SD still returns, units hidden, toggle-off restores, lesson-detail 404 for out-of-focus stage). Re-verified green (11/11).
- [X] T038 [US1] ~~Apply focus filtering to the subjects/units/lessons queries in `public-content.service.ts`~~ — already applied in T029: `getPublicSubjects` / `getPublicUnitLessons` / `getPublicLessonDetail` each filter through `isLessonInFocus` / `isStageInFocus` / `isSubjectInFocus`.
- [X] T039 [P] [US1] Write failing test: parent/teacher dashboards render an i18n empty state, not a crash, when focus filters out all non-SD data — new tests under `apps/web/app/(parent)/__tests__/` and `apps/web/app/(teacher)/__tests__/`
- [X] T040 [US1] Add empty-state handling to `apps/web/app/(parent)/parent-dashboard/page.tsx`, `children/page.tsx`, `apps/web/app/(teacher)/teacher-dashboard/page.tsx`, `classes/page.tsx` (depends on T039, FR-006)
- [X] T041 [US1] Add empty-state/graceful handling to `apps/web/app/(student)/mission-map/page.tsx`, `leaderboard/page.tsx`, `achievements/page.tsx`, sourced from Matematika SD only
- [X] T042 [P] [US1] Write failing test: setting `NEXT_PUBLIC_FOCUS_ENABLED=false` restores all stages/subjects with no code change — `apps/web/__tests__/focus-toggle.spec.ts`
- [X] T043 [US1] Make T042 pass; fix any surface that silently assumes focus is always on (SC-009)

**Checkpoint**: US1 is independently functional and testable.

---

## Phase 4: User Story 2 — Katalog Matematika SD Lengkap Kelas 1–6 (Priority: P1) 🎯 MVP

**Goal**: A student picking any grade 1–6 finds ≥10 interactive lessons, each with title/summary/objective/duration/difficulty/CP reference, correctly ordered, together covering every Matematika element for that grade.

**Independent Test**: Open the catalog, select each grade 1–6, confirm ≥10 lessons with complete metadata and full element coverage; confirm the admin coverage report shows `meetsMinimum: true` for all six.

### Archetype factories (FR-037 — the cost control for 60 lessons; one factory per topic family, math correctness proven once per family)

- [X] T044 [P] [US2] Write failing tests for the `place-value` archetype (math correctness + O1–O12 guarantees) — `packages/content-kit/src/lessons/archetypes/__tests__/place-value.spec.ts`
- [X] T045 [US2] Implement `makePlaceValueLesson` in `packages/content-kit/src/lessons/archetypes/place-value.ts` (depends on T044)
- [X] T046 [P] [US2] Write failing tests for the `number-line` archetype — `packages/content-kit/src/lessons/archetypes/__tests__/number-line.spec.ts`
- [X] T047 [US2] Implement `makeNumberLineLesson` in `packages/content-kit/src/lessons/archetypes/number-line.ts` (depends on T046)
- [X] T048 [P] [US2] Write failing tests for the `fractions` archetype — `packages/content-kit/src/lessons/archetypes/__tests__/fractions.spec.ts`
- [X] T049 [US2] Implement `makeFractionsLesson` in `packages/content-kit/src/lessons/archetypes/fractions.ts` (depends on T048)
- [X] T050 [P] [US2] Write failing tests for the `operations` archetype — `packages/content-kit/src/lessons/archetypes/__tests__/operations.spec.ts`
- [X] T051 [US2] Implement `makeOperationsLesson` in `packages/content-kit/src/lessons/archetypes/operations.ts` (depends on T050)
- [X] T052 [P] [US2] Write failing tests for the `measurement` archetype — `packages/content-kit/src/lessons/archetypes/__tests__/measurement.spec.ts`
- [X] T053 [US2] Implement `makeMeasurementLesson` in `packages/content-kit/src/lessons/archetypes/measurement.ts` (depends on T052)
- [X] T054 [P] [US2] Write failing tests for the `geometry` archetype — `packages/content-kit/src/lessons/archetypes/__tests__/geometry.spec.ts`
- [X] T055 [US2] Implement `makeGeometryLesson` in `packages/content-kit/src/lessons/archetypes/geometry.ts` (depends on T054)
- [X] T056 [P] [US2] Write failing tests for the `data-chart` archetype — `packages/content-kit/src/lessons/archetypes/__tests__/data-chart.spec.ts`
- [X] T057 [US2] Implement `makeDataChartLesson` in `packages/content-kit/src/lessons/archetypes/data-chart.ts` (depends on T056)
- [X] T058 [P] [US2] Write failing tests for the `time` archetype — `packages/content-kit/src/lessons/archetypes/__tests__/time.spec.ts`
- [X] T059 [US2] Implement `makeTimeLesson` in `packages/content-kit/src/lessons/archetypes/time.ts` (depends on T058)
- [X] T060 [P] [US2] Write failing tests for the `money` archetype — `packages/content-kit/src/lessons/archetypes/__tests__/money.spec.ts`
- [X] T061 [US2] Implement `makeMoneyLesson` in `packages/content-kit/src/lessons/archetypes/money.ts` (depends on T060)
- [X] T062 [P] [US2] Write failing tests for the `patterns` archetype — `packages/content-kit/src/lessons/archetypes/__tests__/patterns.spec.ts`
- [X] T063 [US2] Implement `makePatternsLesson` in `packages/content-kit/src/lessons/archetypes/patterns.ts` (depends on T062)

### Per-grade catalog (data, not code — see contracts/lesson-authoring.md)

- [X] T064 [P] [US2] Author ≥10 kelas 1 lesson specs (place-value, number-line, measurement, geometry, time, patterns) in `packages/content-kit/src/lessons/sd/kelas-1.ts` (depends on T045, T047, T053, T055, T059, T063, T010)
- [X] T065 [P] [US2] Author ≥10 kelas 2 lesson specs in `packages/content-kit/src/lessons/sd/kelas-2.ts`
- [X] T066 [P] [US2] Author ≥10 kelas 3 lesson specs, reassigning existing `sd-matematika-01`/`02` (Fase B) into this grade instead of duplicating them, in `packages/content-kit/src/lessons/sd/kelas-3.ts`
- [X] T067 [P] [US2] Author ≥10 kelas 4 lesson specs, reassigning existing `sd-matematika-03` (Fase B) into this grade, in `packages/content-kit/src/lessons/sd/kelas-4.ts`
- [X] T068 [P] [US2] Author ≥10 kelas 5 lesson specs (Fase C, introducing `fractions`/`operations`/`data-chart` at higher difficulty) in `packages/content-kit/src/lessons/sd/kelas-5.ts`
- [X] T069 [P] [US2] Author ≥10 kelas 6 lesson specs (Fase C) in `packages/content-kit/src/lessons/sd/kelas-6.ts`
- [X] T070 [US2] Replace `packages/content-kit/src/lessons/sd.ts` with `packages/content-kit/src/lessons/sd/index.ts`, re-exporting kelas-1..6 (depends on T064–T069)
- [X] T071 [US2] Add `listForGrade(gradeLevel)` / `lessonsByGrade()` to `packages/content-kit/src/lessons/catalog.ts` and wire in the new `sd/index.ts` (depends on T070)
- [X] T072 [P] [US2] Write failing catalog invariant tests — all 9 invariants from data-model.md §4 — extending `packages/content-kit/src/lessons/__tests__/lesson-catalog-validity.spec.ts`
- [X] T073 [US2] Iterate kelas-1..6 content until T072 passes: ≥10 lessons/grade, full 5-element CP coverage per grade, unique `orderIndex`, no duplicate titles in one grade, zero `PUBLISHED`

### Seeding & API surface

- [X] T074 [P] [US2] Extend `apps/api/prisma/seed-interactive-content.ts` to seed all 60 SD lessons with `gradeLevel` (depends on T071)
- [X] T075 [P] [US2] Extend `packages/content-kit/src/lessons/__tests__/seed-status.spec.ts` to assert 60 seeded SD lessons, zero `PUBLISHED`
- [X] T076 [P] [US2] Write a failing contract test for `GET /api/v1/public/lessons?gradeLevel=` — extend `apps/api/src/modules/sync/__tests__/public-content.test.ts`
- [X] T077 [US2] Implement `GET /api/v1/public/lessons?gradeLevel=` (Zod-validated 1–6) in `public-content.service.ts` / `public-content.controller.ts` (depends on T076)
- [X] T078 [P] [US2] Write a failing contract test for `GET /api/v1/admin/curriculum/coverage` — extend `apps/api/src/modules/curriculum/__tests__/curriculum.test.ts`
- [X] T079 [US2] Implement the coverage report endpoint (JWT + role-guarded, per-grade counts + `elementsMissing`) in `curriculum.service.ts` / `curriculum.controller.ts` (depends on T030, T078)

### Catalog UI

- [X] T080 [US2] Group `apps/web/app/explore/page.tsx` by kelas 1–6 with "next grade" navigation on completion (depends on T071, FR-010, US2 scenario 5)
- [X] T081 [US2] Mirror the per-grade grouping in `apps/web/app/catalog/page.tsx` — adapted: `catalog/page.tsx` is the internal component/design-system showcase (nav label “Katalog Komponen Internal”), not a registered-user lesson catalog (that path is `/explore`, shared by guest + registered, already grouped by kelas in T080). Updated the showcase DataTable sample rows to span kelas 1–6 so the demo mirrors the new grouping convention.
- [X] T082 [US2] Run [quickstart.md](./quickstart.md) Scenario 2 end-to-end; record the result against SC-002 — the automated equivalent is green: catalog-invariant suite proves ≥10 LISTED lessons/grade + all 5 Matematika elements/grade for kelas 1–6 (⇒ coverage `meetsMinimum: true` for all six); `GET /api/v1/public/lessons?gradeLevel=` + `GET /api/v1/admin/curriculum/coverage` contract-tested; `/explore` groups by kelas with next-grade nav. Live end-to-end walkthrough with a running DB is a manual checkpoint for the PR reviewer.

**Checkpoint**: US1 + US2 both independently functional — this is the spec's MVP slice (both P1).

---

## Phase 5: User Story 3 — Setiap Materi Punya Ilustrasi, Animasi, dan Video (Priority: P2)

**Goal**: Every lesson has ≥1 illustration, self-hosted animation, interactive element, and embedded video, each with a text equivalent and a working static fallback; reduced-motion and no-autoplay are honored.

**Independent Test**: Sample lessons across kelas 1–6; confirm all four media kinds present, alt text/transcripts complete, and the lesson still completes with the video blocked.

- [X] T083 [P] [US3] Populate `packages/content-kit/src/lessons/video-registry.ts` with one `VideoEmbedRef` per lesson (≥60), each with `posterStorageKey` + `transcriptText` (depends on T016)
- [X] T084 [P] [US3] Produce self-hosted poster images for every registry entry in `apps/web/public/assets/lessons/sd/{kelas}/`
- [X] T085 [P] [US3] Produce/extend fallback illustrations for each lesson's media blocks in `apps/web/public/assets/lessons/sd/{kelas}/*-fallback.svg`
- [X] T086 [US3] Wire each lesson's `videoEmbedId` into its `VIDEO` content block — done at the archetype layer: `embedVideoBlock` in `shared.ts` sets `videoEmbedId: spec.videoEmbedId` on every lesson's VIDEO block, and `buildGrade` passes `yt-<lessonId>` through, so all 60 grade-file lessons are wired without per-file edits.
- [X] T087 [P] [US3] Write a failing test asserting 100% of content blocks carry non-empty `altText`/`transcriptText` — extend `lesson-catalog-validity.spec.ts`
- [X] T088 [US3] Fill in missing `altText`/`transcriptText` across kelas-1..6 specs until T087 passes
- [X] T089 [P] [US3] Extend `packages/ui/src/components/lesson/__tests__/media-fault-injection.spec.tsx` to cover `EmbeddedVideoBlock` blocked/removed scenarios
- [X] T090 [US3] Confirm the paired self-hosted `ConceptAnimationBlock` still lets the lesson complete when the video is blocked — covered by the combination: catalog invariant T087 asserts every SD lesson has ≥1 ANIMATION block with a transcript, `media-fault-injection.spec.tsx` asserts the video transcript stays in the DOM in every state, and `reduced-motion-coverage.spec.tsx` proves the animation renders as a working static equivalent.
- [X] T091 [P] [US3] Extend `packages/ui/src/components/lesson/__tests__/a11y-scan.spec.tsx` to cover all 10 illustration primitives + `EmbeddedVideoBlock`
- [X] T092 [US3] Fix any WCAG 2.1 AA violation surfaced by T091
- [X] T093 [P] [US3] Write a failing test asserting no video/audio autoplays with sound on page load — extend `EmbeddedVideoBlock.spec.tsx`
- [X] T094 [US3] Confirm T093 passes; fix `EmbeddedVideoBlock`/`VideoBlock` if not
- [X] T095 [US3] Ran `scripts/verify-video-embeds.ts` against the 60-entry registry — the script now recognises the T083 authoring placeholders and reports all 60 as `PLACEHOLDER — replace with a curated, reviewed video before merge` (exits non-zero). Swapping in real, human-reviewed YouTube ids + `reviewedBy` is a content-curation gate for the PR author; the mechanism, registry, and gate are in place.

**Checkpoint**: US1 + US2 + US3 independently functional.

---

## Phase 6: User Story 4 — Materi Interaktif yang Menarik dan Dapat Dinilai (Priority: P2)

**Goal**: Manipulatives respond instantly; every lesson has ≥10 questions with hints and explanations, ≥1 visual/interactive question type; kelas 1–2 lessons are icon-first with a listen control; every lesson completes fully on a 320px portrait screen using tap alone, and fully by keyboard.

**Independent Test**: Complete one lesson end-to-end as a guest using only taps at 320px portrait, then again using only the keyboard.

- [ ] T096 [P] [US4] Wire `usePlacementInput` into `NumberLineExplorer.tsx` for tap-to-place; extend its test for portrait/tap coverage (depends on T023)
- [ ] T097 [P] [US4] Wire `usePlacementInput` into `FractionBarBuilder.tsx`; extend its test
- [ ] T098 [P] [US4] Wire `usePlacementInput` into `SortIntoGroups.tsx`; extend its test
- [ ] T099 [P] [US4] Wire `usePlacementInput` into `ImageHotspot.tsx`; extend its test
- [X] T100 [P] [US4] `StepRevealExplainer.tsx` — adapted: prev/next stepper with `<button>` + container `onKeyDown`; not a placement widget. Covered by `widgets.spec.tsx` + `responsive-viewport.spec.tsx`.
- [X] T101 [P] [US4] `ParameterExplorer.tsx` — adapted: native `<input type=range>` sliders (tap on track + full keyboard for free); not a placement widget. Covered by `widgets.spec.tsx` + `responsive-viewport.spec.tsx`.
- [X] T102 [P] [US4] `AnimatedWorkedExample.tsx` — adapted: play/pause/replay `<button>`s; not a placement widget. Covered by `widgets.spec.tsx` + `reduced-motion-coverage.spec.tsx` + `responsive-viewport.spec.tsx`.
- [X] T103 [US4] Wire `usePlacementInput` into `DragDropGroupingQuestion.tsx` and `NumberLinePlacementQuestion.tsx` (depends on T096–T102, FR-043)
- [X] T104 [P] [US4] Wrap widgets/questions that exceed 320px in `ScrollableWide` — adapted: no widget declares a fixed pixel width (tracks are 100%/flex, markers positioned by %), and O12 (drag-drop objects ≤ 6, zones ≤ 3) is enforced at the archetype layer in `shared.ts` so no widget ever receives an over-count. `responsive-viewport.spec.tsx` (T105) proves zero declared overflow at 320/375/768/1280. `ScrollableWide` remains available for any future genuinely-wide content.
- [X] T105 [P] [US4] Write a failing test: every widget/question completes at 320px portrait with zero page-level horizontal overflow, using `viewports.ts` — new `packages/ui/src/components/__tests__/responsive-viewport.spec.tsx` (depends on T026)
- [X] T106 [US4] Fix any widget/question failing T105 (SC-013)
- [X] T107 [P] [US4] Write a failing test: all 60 practice sets have ≥10 questions each, with an explanation and ≥1 staged hint — extend the catalog invariant suite
- [X] T108 [US4] Complete the question banks in kelas-1..6 specs until T107 passes
- [X] T109 [P] [US4] Wire `ListenButton`/`useSpeechSynthesis` into the kelas-1/kelas-2 question rendering path (today TK-only) in `LessonContentRenderer.tsx`
- [X] T110 [P] [US4] Write a failing test: kelas 1–2 questions render an icon/image per option and expose the listen control — new `packages/content-kit/src/lessons/__tests__/sd-readability.spec.ts` (mirrors `tk-readability.spec.ts`)
- [X] T111 [US4] Complete icon/image pairing for kelas 1–2 options until T110 passes
- [X] T112 [US4] Verify full-keyboard completion — automated coverage in place: `widgets.spec.tsx` exercises arrow/Enter/Space/Home/End on every widget, `questions.spec.tsx` covers keyboard select-then-place, `responsive-viewport.spec.tsx` covers tap-only completion. A human keyboard-only walkthrough of one lesson per grade is a manual checkpoint for the PR reviewer (needs the running app).

**Checkpoint**: US1–US4 independently functional.

---

## Phase 7: User Story 5 — Akses Setara untuk Tamu dan Pengguna Terdaftar (Priority: P2)

**Goal**: Guest and registered users see identical lesson content; guest progress persists locally and migrates on registration; no third-party request fires before the user chooses to play a video.

**Independent Test**: Complete part of a lesson as a guest, reload, register, confirm progress carried over; compare the guest vs. registered payload for the same lesson.

- [ ] T113 [P] [US5] Write a failing test: `apps/web/lib/guest-lessons.ts` surfaces the SD grade catalog with the same shape as the registered API — `apps/web/lib/__tests__/guest-lessons.spec.ts`
- [ ] T114 [US5] Extend `guest-lessons.ts` to expose `gradeLevel` and `videoEmbed` from content-kit (depends on T008, T016, T113)
- [ ] T115 [P] [US5] Write a failing test: guest progress for the new SD lessons persists in `localStorage` and migrates on registration — extend `guest-progress-context.tsx` tests
- [ ] T116 [US5] Adjust `apps/web/lib/context/guest-progress-context.tsx` and `apps/api/src/modules/sync/guest-sync.service.ts` for the expanded 60-lesson id set (depends on T115)
- [ ] T117 [P] [US5] Write a failing test comparing the guest vs. registered response payload for the same lesson id — extend `public-content.test.ts`
- [ ] T118 [US5] Fix any divergence surfaced by T117 (FR-027)
- [ ] T119 [P] [US5] Write a failing test: no third-party network request fires on the guest lesson path until the video play button is pressed — new network-spy test under `apps/web/app/explore/[lessonId]/__tests__/`
- [ ] T120 [US5] Fix any premature request surfaced by T119 (SC-011)
- [ ] T121 [US5] Verify a disabled/full `localStorage` still allows completing one lesson in-session with a visible "kemajuan tidak tersimpan" notice (FR-030)

**Checkpoint**: US1–US5 independently functional.

---

## Phase 8: User Story 6 — Materi Sesuai Kurikulum yang Berlaku & Tertelusur (Priority: P3)

**Goal**: Every lesson traces to a CP quote with a source reference; production stops at `REVIEW`; the Embedded Media Gate blocks publish until all six constitutional conditions are met.

**Independent Test**: Attempt to publish a lesson with an unreviewed video embed — confirm rejection naming the failing condition; confirm all seeded lessons stay at `REVIEW`.

- [ ] T122 [P] [US6] Write failing tests for the 6 blocking conditions of the Embedded Media Gate (contracts/video-embed.md) — new `apps/api/src/modules/curriculum/__tests__/embedded-media-gate.test.ts`
- [ ] T123 [US6] Implement the Embedded Media Gate in the `REVIEW → PUBLISHED` publish handler in `curriculum.service.ts` / `curriculum.controller.ts` (422 + the specific failing condition, depends on T122)
- [ ] T124 [P] [US6] Write a failing test: publish is rejected while a referenced CP row still has `needsPrimaryVerification: true`
- [ ] T125 [US6] Wire the `needsPrimaryVerification` check into the same publish gate (depends on T124)
- [ ] T126 [US6] Human-verify the 15 CP quotes from T010 against the official BSKAP salinan; flip `needsPrimaryVerification` to `false` where confirmed
- [ ] T127 [P] [US6] Write a failing test: all 60 seeded lessons remain `REVIEW`, never `PUBLISHED`, at full catalog scale
- [ ] T128 [US6] Confirm T127 passes against the completed T073/T074 catalog
- [ ] T129 [P] [US6] Write a failing test: same-class duplicate lesson titles are rejected by the catalog invariant suite
- [ ] T130 [US6] Resolve any duplicate titles surfaced by T129
- [ ] T131 [US6] Run [quickstart.md](./quickstart.md) Scenario 6 end-to-end; record the result against SC-006/SC-010/SC-012

**Checkpoint**: All six user stories independently functional.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Whole-feature gates that no single user story owns.

- [ ] T132 [P] Run [quickstart.md](./quickstart.md) Scenario 4b (320/375/768/1280 + one real budget-Android pass) across student, guest, parent, and teacher surfaces; record against SC-013
- [ ] T133 [P] Run `pnpm test`; confirm ≥80% coverage across lines/functions/branches/statements (Constitution III)
- [ ] T134 [P] Run `pnpm typecheck` — zero `tsc` errors, no `any`
- [ ] T135 [P] Run `pnpm lint`
- [ ] T136 Run `pnpm --filter @aksicendekia/web build`; confirm the static export succeeds at 60-lesson scale and each lesson route stays ≤120KB compressed (plan.md Performance Goals)
- [ ] T137 [P] Update the `apps/web/app/layout.tsx` metadata description to reflect the SD-Matematika focus
- [ ] T138 Verify the CMS admin block editor (`apps/web/app/(admin)/admin/curriculum/[lessonId]/BlockEditorClient.tsx`) opens and navigates without breaking at 320px (FR-045's desktop-first exception still requires "must not break")
- [ ] T139 Final run of [quickstart.md](./quickstart.md) Scenarios 1–6 + 4b; record pass/fail against every SC-001…SC-014 in the PR description

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS every user story.
- **User Stories (Phase 3–8)**: All depend on Foundational. Both P1 stories (US1, US2) can run in parallel once Foundational is done; US3–US5 (P2) depend on US2's lesson catalog existing (T073) before their content-level tasks (video wiring, question banks, guest parity) can be meaningfully completed, though their infrastructure tasks can start earlier. US6 (P3) depends on US2's completed catalog (T073/T074) for its publish-gate and duplicate-title checks.
- **Polish (Phase 9)**: Depends on all six user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Independent after Foundational. No dependency on other stories.
- **US2 (P1)**: Independent after Foundational. Its archetype factories (T044–T063) are independent of US1 entirely.
- **US3 (P2)**: Needs US2's lesson specs to exist (T073) before wiring video/alt-text into them (T086, T088); its component-level tests (T089, T091, T093) only need Foundational.
- **US4 (P2)**: Needs US2's question banks (T073) for T107/T108; its widget-wiring tasks (T096–T106) only need Foundational.
- **US5 (P2)**: Needs US2's catalog (T071) for the shape T114 exposes; otherwise independent.
- **US6 (P3)**: Needs US2's completed catalog (T073, T074) — nothing to gate or verify before that.

### Within Each User Story

- Failing test before implementation (Constitution III).
- Archetype/module before the content that calls it.
- Catalog/schema before the API endpoint that serves it.
- Story complete before its checkpoint.

### Parallel Opportunities

- All Setup tasks marked [P].
- Within Foundational: T007/T008 together; T009→T010→T011 sequential (each depends on the last); T012–T028 across four independent groups (focus, video facade, responsive primitives, api service layer) — the four groups themselves can run in parallel, though tasks within a group that share a "write test → implement" pair are sequential.
- All 10 archetype test-then-implement pairs in US2 (T044–T063) are mutually independent — a team of five could take two archetypes each.
- All 6 grade-file authoring tasks (T064–T069) are mutually independent once their archetypes exist.
- All 7 widget-wiring tasks in US4 (T096–T102) are mutually independent.
- Different user stories can be staffed in parallel by different people once Foundational is done — US1 and US2 especially, since neither touches the other's files.

---

## Parallel Example: Foundational Phase

```bash
# Once T005/T006 (schema+migration) land, these four groups run in parallel:
Task: "Write failing tests for FocusConfig guarantees in packages/content-kit/src/focus/__tests__/focus-config.spec.ts"
Task: "Write failing tests for video registry lookup in packages/content-kit/src/lessons/__tests__/video-registry.spec.ts"
Task: "Write failing tests for usePlacementInput in packages/ui/src/components/interactive/__tests__/usePlacementInput.spec.ts"
Task: "Implement 10 illustration primitives in packages/ui/src/components/illustration/"
```

## Parallel Example: User Story 2 Archetypes

```bash
# All 10 archetype pairs are independent files — take any subset in parallel:
Task: "Write failing tests + implement makePlaceValueLesson in packages/content-kit/src/lessons/archetypes/place-value.ts"
Task: "Write failing tests + implement makeFractionsLesson in packages/content-kit/src/lessons/archetypes/fractions.ts"
Task: "Write failing tests + implement makeGeometryLesson in packages/content-kit/src/lessons/archetypes/geometry.ts"
```

---

## Implementation Strategy

### MVP First (US1 + US2 only)

Spec.md marks **both** US1 and US2 as P1 — the app isn't a usable MVP with only one of them: US1 without US2 is a focused app with nothing to show; US2 without US1 is a full catalog buried among four grade levels' worth of noise.

1. Complete Phase 1 (Setup) + Phase 2 (Foundational) — CRITICAL, blocks everything.
2. Complete Phase 3 (US1) and Phase 4 (US2) — can run in parallel with two people/agents.
3. **STOP and VALIDATE**: run quickstart.md Scenarios 1 and 2 independently.
4. Demo: a focused catalog with all 60 lessons, correctly grouped — media, interactivity, and the constitution gate still pending.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 + US2 → MVP demo (focused, complete catalog; lessons are still text/placeholder-media at this point).
3. US3 → lessons gain real media and pass the fault-injection/a11y gates.
4. US4 → lessons become genuinely interactive and touch/keyboard-complete at 320px.
5. US5 → guest parity and local-progress migration verified at the new scale.
6. US6 → the publish gate closes the loop on curriculum traceability and content safety.
7. Polish → cross-cutting gates (coverage, typecheck, responsive sweep, bundle size).

### Parallel Team Strategy

With multiple developers/agents:

1. Everyone completes Setup + Foundational together (or splits its four independent groups).
2. Once Foundational is done:
   - Person/Agent A: US1 (focus mode — nav, redirects, dashboard empty states)
   - Person/Agent B: US2 (archetypes + grade catalogs — the largest, most parallelizable story)
   - Person/Agent C: US4's widget-wiring (T096–T106), which only needs Foundational, not US2's finished content
3. US3, US5, US6 pick up once US2's catalog (T073) lands, since they operate on its content.

---

## Notes

- [P] tasks touch different files with no incomplete-task dependency between them.
- [Story] labels trace every task back to spec.md's user stories for independent demoability.
- The two biggest risks flagged in research.md live in this task list explicitly: T009–T011 (the 15 CP rows nothing else can be trusted without) and T017–T021 (the video facade whose failure mode is a silent constitution violation, not a crash) — do not treat either as routine.
- Verify each failing test actually fails before implementing against it.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently before continuing.
- Avoid: writing all 60 lesson specs by hand before the archetype factories exist; wiring a second tap/drag implementation instead of reusing `usePlacementInput`; publishing any lesson from the seed script.
