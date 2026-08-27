# Tasks: Autentikasi dan Manajemen Akun Multi-Peran AksiCendekia

**Input**: Design documents from `specs/002-auth-multi-role/` (`spec.md`, `plan.md`) and user instructions for `/speckit.plan`.

---

## Phase 1: Setup & Database Schema (Prisma DB Models)

- [x] T001 Define exact Prisma DB models (`User`, `StudentProfile`, `ParentChildLink`, `ParentalConsent`, `Class`, `ClassEnrollment`, `RefreshToken`) in `apps/api/prisma/schema.prisma`
- [x] T002 Execute Prisma migrations and generate type-safe Prisma client (`pnpm --filter api prisma migrate dev`)
- [x] T003 Implement `IEmailService` interface and `ConsoleEmailService` logger implementation in `apps/api/src/common/email/`

---

## Phase 2: User Story 1 - Registrasi, Login Email+Password, & Rotasi JWT (Priority: P1) 🎯 MVP

**Goal**: Deliver email+password authentication with Argon2id hash, short-lived Access Token JWT (in-memory), HTTP-Only Secure Cookie Refresh Token, Fastify Rate-limiting (5 failed / 15m), and Refresh Token Reuse Detection via TDD.

- [x] T004 [P] [US1] Create Argon2id password hash service (`apps/api/src/modules/auth/argon2.service.ts`)
- [x] T005 [P] [US1] Create Zod schemas for all Auth body, params, query inputs with zero `any` (`apps/api/src/modules/auth/auth.schema.ts`)
- [x] T006 [P] [US1] Create Auth Repository for Prisma database transactions (`apps/api/src/modules/auth/auth.repository.ts`)
- [x] T007 [US1] Configure Fastify Rate Limiting middleware (5 attempts per 15 mins for `/login`, `/register`, `/forgot-password`, `/reset-password`) in `apps/api/src/middleware/rate-limit.config.ts`
- [x] T008 [US1] Implement Auth Service with JWT issuance, Refresh Token rotation, and Token Reuse Detection (`apps/api/src/modules/auth/auth.service.ts`)
- [x] T009 [US1] Implement Auth Controller for register, login, refresh, and logout endpoints (`apps/api/src/modules/auth/auth.controller.ts`)
- [x] T010 [US1] Write mandatory Vitest TDD test for Refresh Token Reuse Detection (`apps/api/src/modules/auth/__tests__/auth-jwt-reuse.spec.ts`)
- [x] T011 [US1] Create Login & Registration UI pages using Feature 001 components (`apps/web/app/(auth)/login/page.tsx`, `apps/web/app/(auth)/register/page.tsx`)

---

## Phase 3: User Story 2 - Perlindungan Data Anak & Persetujuan Orang Tua (Priority: P1)

**Goal**: Enforce UU PDP No. 27/2022 & Constitution Principle VII parental consent for student accounts < 18 years old. Block `PENDING_CONSENT` accounts from business endpoints via composable Fastify `preHandler` hooks.

- [x] T012 [P] [US2] Implement age calculation helper and `consentGateHook` preHandler (`apps/api/src/middleware/consent-gate.hook.ts`)
- [x] T013 [P] [US2] Create Parent Service & Repository for `ParentChildLink` and `ParentalConsent` with Email Link & 6-digit OTP code support (`apps/api/src/modules/parent/parent.service.ts`)
- [x] T014 [US2] Implement Parent-driven registration flow (parent creates child account with automatic active consent)
- [x] T015 [US2] Implement Student-driven registration flow (student enters parent email -> status `PENDING_CONSENT` -> send approval link + 6-digit OTP via `IEmailService`)
- [x] T016 [US2] Write mandatory Vitest TDD test for `PENDING_CONSENT` access rejection (`apps/api/src/modules/student/__tests__/consent-gate.spec.ts`)
- [x] T017 [US2] Create Parent Consent Verification UI page (`apps/web/app/(parent)/consent/[token]/page.tsx`) and Parent Child Management Dashboard (`apps/web/app/(parent)/children/page.tsx`)
- [x] T018 [US2] Create Student Account Status view for `PENDING_CONSENT` accounts (`apps/web/app/(student)/consent-status/page.tsx`)

---

## Phase 4: User Story 3 - Profil Minimalis Siswa & Anonimitas Publik (Priority: P2)

**Goal**: Deliver student profile management restricting public fields to display name, education stage, grade level, and preset avatar ID. Strictly forbid sensitive personal data or photo uploads.

- [x] T019 [P] [US3] Create Zod schemas and Student Repository for profile operations (`apps/api/src/modules/student/student.schema.ts`, `apps/api/src/modules/student/student.repository.ts`)
- [x] T020 [US3] Implement Student Service & Controller for getting and updating minimal student profiles (`apps/api/src/modules/student/student.service.ts`, `apps/api/src/modules/student/student.controller.ts`)
- [x] T021 [US3] Write Vitest tests verifying 0% exposure of full names, phone numbers, or photo upload endpoints (`apps/api/src/modules/student/__tests__/student-profile.spec.ts`)
- [x] T022 [US3] Create Student Onboarding UI page for stage selection (TK/SD/SMP/SMA) & preset avatar picker (`apps/web/app/(student)/onboarding/page.tsx`)

---

## Phase 5: User Story 4 - Manajemen Kelas Guru & Otorisasi Berbasis Relasi (Priority: P2)

**Goal**: Enable teachers to create classes (`Class`) and issue unique class codes (`classCode`), and enforce composable Fastify `preHandler` Relational Authorization Middleware across student data endpoints.

- [x] T023 [P] [US4] Create Class Service & Repository for generating unique 6-8 char alphanumeric `classCode` and student `ClassEnrollment` (`apps/api/src/modules/class/class.service.ts`)
- [x] T024 [P] [US4] Implement composable Fastify `preHandler` hook `relationalAuthzHook` (`apps/api/src/middleware/relational-authz.hook.ts`) evaluating caller relation (Self, Linked Parent, Class Teacher, Admin)
- [x] T025 [US4] Implement Class Controller endpoints for creation, joining, and listing roster (`apps/api/src/modules/class/class.controller.ts`)
- [x] T026 [US4] Write mandatory Vitest TDD test for inter-class data isolation (Teacher B receives HTTP 403 when accessing Teacher A's student data) in `apps/api/src/modules/class/__tests__/class-isolation.spec.ts`
- [x] T027 [US4] Create Teacher Class Creation & Roster Management UI page (`apps/web/app/(teacher)/classes/page.tsx`)

---

## Phase 6: User Story 5 - Pemulihan Akun via Reset Password Email & Onboarding UI (Priority: P3)

**Goal**: Provide one-time token password reset workflow via email abstraction `IEmailService` (rate-limited 5 attempts / 15m) and complete frontend integration.

- [x] T028 [P] [US5] Implement One-Time Token generator for Password Reset (`apps/api/src/modules/auth/password-reset.service.ts`)
- [x] T029 [US5] Implement forgot-password & reset-password API endpoints (`POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`)
- [x] T030 [US5] Create Forgot Password & Reset Password UI pages (`apps/web/app/(auth)/forgot-password/page.tsx`, `apps/web/app/(auth)/reset-password/page.tsx`)
- [x] T031 [US5] Externalize all new UI strings into i18n dictionary (`packages/ui/src/locales/id.json`)

---

## Phase 7: Polish & Build Verification

- [x] T032 Verify TypeScript strict mode compilation across all apps and packages (`pnpm typecheck`) with zero `any`
- [x] T033 Verify Vitest automated test suite coverage gate >= 80% (`pnpm --filter api test:coverage`)
- [x] T034 Verify Next.js App Router production build (`pnpm --filter web build`) with zero errors
