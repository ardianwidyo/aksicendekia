# Implementation Plan: Autentikasi dan Manajemen Akun Multi-Peran AksiCendekia

**Branch**: `002-auth-multi-role` | **Date**: 2026-08-27 | **Spec**: [specs/002-auth-multi-role/spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/002-auth-multi-role/spec.md)

**Input**: User prompt for `/speckit.plan`, Constitution v1.1.0, and `/specs/002-auth-multi-role/spec.md`.

---

## Summary

Membangun sistem autentikasi dan manajemen akun multi-peran (`SISWA`, `ORANG_TUA`, `GURU`, `ADMIN`) AksiCendekia berlandaskan **Konstitusi AksiCendekia v1.1.0** menggunakan stack **Fastify + Prisma ORM + PostgreSQL** di backend (`apps/api`) dan **Next.js App Router** (Feature 001 design system) di frontend (`apps/web`).

Sistem diimplementasikan secara **TDD (Test-Driven Development)** menggunakan **Vitest**, menerapkan skema Prisma yang presisi (`User`, `StudentProfile`, `ParentChildLink`, `ParentalConsent`, `Class`, `ClassEnrollment`, `RefreshToken`), otorisasi relasional berbentuk **Fastify `preHandler` hooks yang dapat dikomposisi (composable preHandlers)**, enkripsi kata sandi **Argon2id**, rotasi Refresh Token JWT dengan **Deteksi Penggunaan Ulang (Reuse Detection)** yang membekukan *family session*, penegakan persetujuan orang tua/wali bagi akun siswa < 18 tahun, Rate Limiting ketat pada endpoint sensitif via `@fastify/rate-limit`, validasi Zod tanpa tipe `any`, serta abstraksi pengiriman surel via interface `IEmailService` (implementasi `ConsoleEmailService` untuk lingkungan pengembangan).

---

## Architectural Principles & Strict Guidelines

1. **Prisma Database Schema**:
   - `User`: `id`, `email`, `passwordHash`, `role` (`SISWA`, `ORANG_TUA`, `GURU`, `ADMIN`), `status` (`PENDING_CONSENT`, `ACTIVE`, `SUSPENDED`), `created_at`, `updated_at`.
   - `StudentProfile`: `id`, `userId` (FK unique), `displayName`, `educationStage` (`TK`, `SD`, `SMP`, `SMA`), `gradeLevel` (1-12), `avatarId`, `birthDate`.
   - `ParentChildLink`: `id`, `parentId` (FK to User), `studentProfileId` (FK to StudentProfile), `created_at`.
   - `ParentalConsent`: `id`, `linkId` (FK to ParentChildLink), `consentedAt`, `verificationMethod` (`EMAIL_LINK`, `OTP_CODE`, `DIRECT_PARENT_DASHBOARD`), `consentVersion` (`v1.0`).
   - `Class`: `id`, `teacherId` (FK to User), `name`, `educationStage`, `classCode` (unique alfanumerik), `created_at`.
   - `ClassEnrollment`: `id`, `classId` (FK to Class), `studentProfileId` (FK to StudentProfile), `enrolledAt`.
   - `RefreshToken`: `id`, `userId` (FK to User), `tokenHash` (unique), `familyId`, `isRevoked`, `expiresAt`, `createdAt`.

2. **Otorisasi Relasional (Fastify Composable `preHandler` Hooks)**:
   - Dilarang keras menempatkan percabangan `if-else` otorisasi relasional secara berantakan di controller.
   - Otorisasi diimplementasikan sebagai Fastify `preHandler` middleware hooks independen yang dapat dikomposisi:
     - `requireAuth()`: Memverifikasi JWT Access Token (in-memory).
     - `requireConsentActive()`: Menolak siswa berstatus `PENDING_CONSENT` dari endpoint bisnis.
     - `requireRole(...roles)`: Memeriksa peran pengguna.
     - `requireStudentRelation({ getStudentId })`: Hook komposabel yang mengevaluasi relasi pemanggil (*self*, *linked parent with consent*, *enrolled class teacher*, *admin*). Returning 403 jika tidak sah.

3. **Defensive Validation & Zero Any Policy**:
   - Seluruh payload request (request body, params, query parameters) WAJIB divalidasi menggunakan Zod schemas.
   - Penggunaan tipe `any` DILARANG KERA5 (`"strict": true` & `@typescript-eslint/no-explicit-any`).

4. **Rate Limiting Ketat**:
   - Menerapkan `@fastify/rate-limit` pada endpoint `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/forgot-password`, dan `POST /api/v1/auth/reset-password` (maksimal 5 percobaan / 15 menit).

5. **Abstraksi Email Services**:
   - Menggunakan interface `IEmailService` (`sendConsentEmail()`, `sendPasswordResetEmail()`).
   - Implementasi awal: `ConsoleEmailService` (mencatat surel ke console log pada dev/test). Bebas dari dependensi vendor pihak ketiga.

6. **TDD Workflow & Mandatory Test Coverage**:
   - Tes tertulis terlebih dahulu (Vitest) sebelum kode fungsi utama dibuat (Red -> Green -> Refactor).
   - Kasus uji wajib:
     1. Penolakan akses bisnis untuk akun siswa berstatus `PENDING_CONSENT`.
     2. Isolasi data antar-kelas (Guru A menerima HTTP 403 saat mengakses data siswa di kelas milik Guru B).
     3. Deteksi penggunaan ulang Refresh Token (Pembatalan seluruh famili token `familyId`).

---

## Constitution Check (v1.1.0)

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Pass** - **Pasal I (Tech Stack Backend)**: Node.js + TypeScript strict mode + Fastify + PostgreSQL via Prisma ORM. Direct raw SQL / dynamic SQL string strictly forbidden.
- **Pass** - **Pasal II (Clean Architecture)**: Controllers (HTTP extraction) -> Services (pure business logic) -> Repositories (Prisma DB access). Composable Fastify `preHandler` hooks for authorization.
- **Pass** - **Pasal III (TDD & Quality Assurance - NON-NEGOTIABLE)**: Red-Green-Refactor cycle via Vitest first. Minimum 80% coverage threshold. Zero `any` types.
- **Pass** - **Pasal IV (Security & Defensive Design)**: Zod schemas for all input. Argon2id password hashing. Short-lived Access Token + HTTP-Only Secure Cookie Refresh Token rotation with reuse detection. Strict rate limiting on auth endpoints.
- **Pass** - **Pasal V (Frontend Stack)**: Next.js App Router + TypeScript + Tailwind CSS (PostCSS) + pnpm monorepo.
- **Pass** - **Pasal VI (Design System)**: Components from `@aksicendekia/ui` (Feature 001).
- **Pass** - **Pasal VII (Perlindungan Data Anak - NON-NEGOTIABLE)**: Siswa < 18 tahun diblokir dari endpoint bisnis jika `PENDING_CONSENT`. Data profil anonim tanpa nama lengkap publik/foto pribadi. Middleware otorisasi relasional.
- **Pass** - **Pasal VIII (i18n)**: Dictionary Bahasa Indonesia `packages/ui/src/locales/id.json`.
- **Pass** - **Pasal IX (Aksesibilitas)**: WCAG 2.1 AA (44x44px touch target, 4.5:1 text contrast).

---

## Project Structure & File Layout

```text
apps/
├── api/
│   ├── prisma/
│   │   ├── schema.prisma            # User, StudentProfile, ParentChildLink, ParentalConsent, Class, ClassEnrollment, RefreshToken
│   │   └── migrations/
│   └── src/
│       ├── common/
│       │   ├── email/
│       │   │   ├── email.interface.ts   # IEmailService interface
│       │   │   └── console-email.service.ts # ConsoleEmailService dev implementation
│       │   └── errors/
│       │       └── app-error.ts         # Custom AppErrors (400, 401, 403, 404, 429)
│       │
│       ├── middleware/
│       │   ├── authenticate.hook.ts         # Fastify preHandler: JWT token verification
│       │   ├── consent-gate.hook.ts         # Fastify preHandler: Block PENDING_CONSENT students
│       │   ├── rate-limit.config.ts         # Fastify rate limit setup for auth routes
│       │   └── relational-authz.hook.ts     # Composable Fastify preHandler for relational checks
│       │
│       └── modules/
│           ├── auth/
│           │   ├── auth.schema.ts      # Zod validation schemas
│           │   ├── auth.repository.ts  # Prisma queries for User & RefreshToken
│           │   ├── auth.service.ts     # Argon2id, JWT issuance, rotation, reuse detection
│           │   ├── auth.controller.ts  # Fastify HTTP handlers
│           │   └── __tests__/
│           │       └── auth-jwt-reuse.spec.ts # Mandatory Vitest: Token reuse detection test
│           │
│           ├── student/
│           │   ├── student.schema.ts    # Zod schemas for student profiles
│           │   ├── student.repository.ts# Prisma student profile persistence
│           │   ├── student.service.ts   # Age calculation & profile business logic
│           │   ├── student.controller.ts# Fastify student handlers
│           │   └── __tests__/
│           │       └── consent-gate.spec.ts # Mandatory Vitest: PENDING_CONSENT access block test
│           │
│           ├── parent/
│           │   ├── parent.schema.ts     # Zod schemas for parent & consent
│           │   ├── parent.repository.ts # ParentChildLink & ParentalConsent queries
│           │   ├── parent.service.ts    # Parent registration & consent approval (Link + OTP)
│           │   ├── parent.controller.ts # Fastify parent handlers
│           │   └── __tests__/
│           │       └── parent-consent.spec.ts # Parent consent Vitest test
│           │
│           └── class/
│               ├── class.schema.ts      # Zod schemas for Class & Enrollment
│               ├── class.repository.ts  # Prisma queries for Class & ClassEnrollment
│               ├── class.service.ts     # Class creation & classCode generator
│               ├── class.controller.ts  # Fastify class handlers
│               └── __tests__/
│                   └── class-isolation.spec.ts # Mandatory Vitest: Inter-class data isolation test
│
└── web/
    └── app/
        ├── (auth)/
        │   ├── register/page.tsx      # Multi-role registration form
        │   ├── login/page.tsx         # Login form
        │   ├── forgot-password/page.tsx # Password reset request form
        │   └── reset-password/page.tsx  # New password form
        ├── (student)/
        │   ├── onboarding/page.tsx    # Stage selection & preset avatar picker
        │   └── consent-status/page.tsx # Account status view for PENDING_CONSENT
        ├── (parent)/
        │   ├── consent/[token]/page.tsx # Parent consent verification (Link & OTP)
        │   └── children/page.tsx      # Parent child management dashboard
        └── (teacher)/
            └── classes/page.tsx       # Class creation & student roster page
```

---

## Detailed Implementation Steps

### Step 1: Prisma Database Migration (`apps/api/prisma/schema.prisma`)
- Write exact Prisma model definitions:
  - `enum Role { SISWA, ORANG_TUA, GURU, ADMIN }`
  - `enum AccountStatus { PENDING_CONSENT, ACTIVE, SUSPENDED }`
  - `enum EducationStage { TK, SD, SMP, SMA }`
  - `enum VerificationMethod { EMAIL_LINK, OTP_CODE, DIRECT_PARENT_DASHBOARD }`
  - `User`, `StudentProfile`, `ParentChildLink`, `ParentalConsent`, `Class`, `ClassEnrollment`, `RefreshToken`.
- Run Prisma migration (`npx prisma migrate dev`).

### Step 2: Email Service Abstraction (`apps/api/src/common/email/`)
- Define `IEmailService` interface with `sendParentConsentEmail()` and `sendPasswordResetEmail()`.
- Implement `ConsoleEmailService` for development logging.

### Step 3: Vitest TDD Test Suite Setup (Phase 1 Red Phase)
- **`auth-jwt-reuse.spec.ts`**:
  - Test login -> get Refresh Token -> refresh -> get new Refresh Token.
  - Submit old Refresh Token -> verify system revokes all tokens for `familyId` and returns 401.
- **`consent-gate.spec.ts`**:
  - Register student < 18 years old -> status `PENDING_CONSENT`.
  - Request protected student API endpoint -> verify Fastify returns 403 Consent Required.
  - Approve consent via parent -> status `ACTIVE` -> verify endpoint responds 200 OK.
- **`class-isolation.spec.ts`**:
  - Teacher A creates Class 1, Student X enrolls. Teacher B creates Class 2, Student Y enrolls.
  - Teacher B requests Student X data via `relationalAuthzHook` -> verify Fastify returns 403 Forbidden.

### Step 4: Fastify Composable `preHandler` Hooks & Modules
- Implement `authenticateHook` using `@fastify/jwt`.
- Implement `consentGateHook` checking `status !== 'PENDING_CONSENT'`.
- Implement `relationalAuthzHook` querying relation between caller user ID and target student profile ID (self, parent with active `ParentalConsent`, class teacher via `ClassEnrollment` -> `Class`, or admin).
- Implement Fastify rate limiter config (`@fastify/rate-limit`) for `/login`, `/register`, `/forgot-password`, `/reset-password`.

### Step 5: Modules (Auth, Student, Parent, Class)
- Write Zod validation schemas for all inputs (`auth.schema.ts`, `student.schema.ts`, `parent.schema.ts`, `class.schema.ts`).
- Implement Argon2id password hash service.
- Build Repositories, Services, and Controllers for each module adhering to Clean Architecture.

### Step 6: Frontend Next.js App Pages (`apps/web`)
- Integration with Feature 001 UI components (`@aksicendekia/ui`).
- Auth pages (`/login`, `/register`, `/forgot-password`, `/reset-password`).
- Student onboarding & consent status (`/onboarding`, `/consent-status`).
- Parent consent & child management (`/parent/consent/[token]`, `/parent/children`).
- Teacher class management (`/teacher/classes`).

---

## Verification Plan

### Automated Vitest Execution
- Run `pnpm --filter api test` to execute Vitest suites.
- Verify 100% pass on mandatory tests:
  1. `consent-gate.spec.ts` (PENDING_CONSENT 403 block).
  2. `class-isolation.spec.ts` (Inter-class 403 isolation).
  3. `auth-jwt-reuse.spec.ts` (Refresh token reuse family revocation).
- Enforce Vitest coverage threshold >= 80%.
- Run `pnpm typecheck` to confirm zero TypeScript compiler errors.
