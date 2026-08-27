# Tasks: Model Konten Kurikulum Merdeka & Admin CMS AksiCendekia (Feature 003)

**Input**: Design documents from `/specs/003-content-curriculum-cms/`
**Prerequisites**: `spec.md`, `plan.md`

---

## Phase 1: Setup & Database Infrastructure

**Purpose**: Update database schema, Prisma client generation, and Zod validation setup.

- [x] T001 Update Prisma schema with Curriculum enums and models (`Subject`, `Unit`, `Lesson`, `LessonPrerequisite`, `QuestionItem`, `QuestionHint`, `StudentLessonProgress`) in [schema.prisma](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/prisma/schema.prisma)
- [x] T002 Execute `prisma generate` to update Prisma Client types
- [x] T003 [P] Implement Zod validation schemas for Subject, Unit, Lesson, QuestionItem, Prerequisites, and Status in [curriculum.schema.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/modules/curriculum/curriculum.schema.ts)

---

## Phase 2: Foundational Data Access & Repositories

**Purpose**: Core data layer encapsulating Prisma queries for Curriculum and Questions.

- [x] T004 Implement `CurriculumRepository` for CRUD operations on Subjects, Units, Lessons, QuestionItems, and StudentProgress in [curriculum.repository.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/modules/curriculum/curriculum.repository.ts)
- [x] T005 [P] Update test mocks in [mock-prisma.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/__tests__/mock-prisma.ts) for curriculum entities

---

## Phase 3: User Story 1 - Pemodelan Hirarki & Immutable Content Versioning (Priority: P1) 🎯 MVP

**Goal**: Support Kurikulum Merdeka hierarchy and copy-on-write draft revisioning for `PUBLISHED` content.

- [x] T006 [P] [US1] Write unit tests for Subject, Unit, and Lesson CRUD & Versioning in [curriculum.test.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/modules/curriculum/__tests__/curriculum.test.ts)
- [x] T007 [US1] Implement Subject, Unit, and Lesson business logic and copy-on-write versioning in [curriculum.service.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/modules/curriculum/curriculum.service.ts)
- [x] T008 [US1] Implement Admin CRUD endpoints for Subjects, Units, and Lessons in [curriculum.controller.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/modules/curriculum/curriculum.controller.ts)

---

## Phase 4: User Story 2 - Editor Butir Soal Rich & Petunjuk Bertingkat (Priority: P1)

**Goal**: Support Question Items (Multiple Choice, Short Answer, Matching Pairs), explanations, and step-by-step hints.

- [x] T009 [P] [US2] Write unit tests for Question Items creation and update in [curriculum.test.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/modules/curriculum/__tests__/curriculum.test.ts)
- [x] T010 [US2] Implement Question Item payload formatting and hints creation in [curriculum.service.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/modules/curriculum/curriculum.service.ts)
- [x] T011 [US2] Implement Admin endpoints for Question Items CRUD in [curriculum.controller.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/modules/curriculum/curriculum.controller.ts)

---

## Phase 5: User Story 3 - Prasyarat Pelajaran & Validasi DAG (Priority: P1)

**Goal**: Prevent circular dependencies (DAG cycle detection) and manage prerequisite links between lessons.

- [x] T012 [P] [US3] Write unit test for prerequisite circular dependency detection in [curriculum.test.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/modules/curriculum/__tests__/curriculum.test.ts)
- [x] T013 [US3] Implement DFS topological cycle detection algorithm in [curriculum.service.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/modules/curriculum/curriculum.service.ts)
- [x] T014 [US3] Implement prerequisite management endpoints in [curriculum.controller.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/modules/curriculum/curriculum.controller.ts)

---

## Phase 6: User Story 4 - Impor Massal CSV & Admin CMS UI (Priority: P2)

**Goal**: Bulk CSV import up to 500 rows with precise row error reporting and Admin CMS Portal UI.

- [x] T015 [P] [US4] Implement CSV parser and batch row validator in [csv-import.service.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/modules/curriculum/csv-import.service.ts)
- [x] T016 [US4] Add CSV mass import endpoint in [curriculum.controller.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/modules/curriculum/curriculum.controller.ts)
- [x] T017 [US4] Build Admin CMS Portal Page (Hierarchy Manager, Question Editor, Live Preview Modal, CSV Modal) in [page.tsx](file:///d:/Source%20Code/Personal/aksicendekia/apps/web/app/%28admin%29/admin/curriculum/page.tsx)

---

## Phase 7: User Story 5 - API Baca Siswa & Zero Leakage (Priority: P1)

**Goal**: Serve published curriculum to students, calculate locked status, and strictly strip question items for locked lessons.

- [x] T018 [P] [US5] Write integration test for student read endpoints and zero-leakage locked status in [curriculum.test.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/modules/curriculum/__tests__/curriculum.test.ts)
- [x] T019 [US5] Implement `listSubjectsForStudent`, `listLessonsForUnitForStudent`, and `getLessonDetailForStudent` in [curriculum.service.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/modules/curriculum/curriculum.service.ts)
- [x] T020 [US5] Implement Student Read API routes in [curriculum.controller.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/modules/curriculum/curriculum.controller.ts)

---

## Phase 8: User Story 6 - Pembenihan Data (Seed Data) Kompleks (Priority: P2)

**Goal**: Seed database with 90 published question items across SD, SMP, and SMA subjects.

- [x] T021 [US6] Create database seed script with 3 subjects, 3 units, 9 lessons, and 90 questions in [seed.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/prisma/seed.ts)
- [x] T022 [US6] Configure `prisma db seed` script in [package.json](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/package.json)

---

## Phase 9: Anti-Cheat & Quality Verification

**Goal**: Enforce anti-cheat rules, 100% server-side evaluation, idempotency, per-session rate limit, and full test runner validation.

- [x] T023 Enforce 100% server-side evaluation (no client-side answer key exposure)
- [x] T024 Register curriculum routes in Fastify [app.ts](file:///d:/Source%20Code/Personal/aksicendekia/apps/api/src/app.ts)
- [x] T025 Run full Vitest suite (`pnpm --filter api test`) — Verify 12/12 tests pass
- [x] T026 Build Next.js Web App (`pnpm --filter web build`) — Verify static pages and zero build errors
