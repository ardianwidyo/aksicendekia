# Implementation Plan: Model Konten Kurikulum Merdeka & Admin CMS AksiCendekia

**Branch**: `003-content-curriculum-cms` | **Date**: 2026-08-27 | **Spec**: [specs/003-content-curriculum-cms/spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/003-content-curriculum-cms/spec.md)

**Input**: User prompt for `/speckit.plan`, Constitution v1.1.0, and `/specs/003-content-curriculum-cms/spec.md`.

---

## Summary

Membangun Model Konten Kurikulum Merdeka yang terstruktur dan Portal Admin CMS AksiCendekia berlandaskan **Konstitusi AksiCendekia v1.1.0** (Prinsip VIII: Integritas Konten Kurikulum) menggunakan stack **Fastify + Prisma ORM + PostgreSQL** di backend (`apps/api`) dan **Next.js App Router** (Feature 001 design system & `@aksicendekia/ui`) di frontend (`apps/web`).

Sistem diimplementasikan secara **TDD (Test-Driven Development)** menggunakan **Vitest**, menerapkan skema Prisma yang presisi (`Subject`, `Unit`, `Lesson`, `LessonPrerequisite`, `QuestionItem`, `QuestionHint`, `StudentLessonProgress`), alur status konten (`DRAFT` → `REVIEW` → `PUBLISHED` → `ARCHIVED`) dengan **Immutable Versioning** (copy-on-write draft revision), **Validasi Siklus Prasyarat Pelajaran (DAG Cycle Detection)**, tiga tipe butir soal interaktif (Pilihan Ganda, Isian Singkat dengan pencocokan toleran `NORMALIZED`, dan Mencocokkan Pasangan) beserta petunjuk bertingkat dan pembahasan, **Impor Massal CSV 500 Baris** dengan laporan kesalahan presisi per baris, **API Baca Siswa Terisolasi** yang menjamin zero-leakage konten non-`PUBLISHED` dan penyembunyian total (0 item) `butir_soal` pada pelajaran terkunci, serta **Pembenihan Data (Seed Data)** lengkap 90 butir soal untuk SD, SMP, dan SMA.

---

## Technical Context

- **Language/Version**: TypeScript 5.4+ (Strict Mode enabled).
- **Backend Stack**: Node.js (LTS), Fastify, Prisma ORM (v5.22.0), Zod schema validation.
- **Frontend Stack**: Next.js App Router (v14.2), Tailwind CSS, `@aksicendekia/ui`.
- **Database & Storage**: PostgreSQL via Prisma ORM (`apps/api/prisma/schema.prisma`).
- **Testing**: Vitest (`pnpm --filter api test`).
- **Target Platform**: Node.js HTTP Service & Modern Web Browsers.
- **Performance Goals**: Impor massal CSV 500 baris diproses dalam < 5 detik; API baca siswa mengembalikan respons < 100ms.
- **Constraints**: Minimum coverage **80%** di backend; Zero `any` types; Konten `PUBLISHED` bersifat immutable; Zero-leakage konten non-PUBLISHED dan butir soal terkunci.

---

## Constitution Check (v1.1.0)

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Pass** - **Prinsip I (Tech Stack Backend)**: Node.js + TypeScript strict mode + Fastify + PostgreSQL via Prisma ORM. Direct raw SQL / dynamic SQL string strictly forbidden.
- **Pass** - **Prinsip II (Clean Architecture)**: Controllers (`curriculum.controller.ts`) -> Services (`curriculum.service.ts`, `csv-import.service.ts`) -> Repositories (`curriculum.repository.ts`).
- **Pass** - **Prinsip III (TDD & Quality Assurance)**: Red-Green-Refactor cycle via Vitest. Minimum 80% coverage threshold. Zero `any` types.
- **Pass** - **Prinsip IV (Security & Defensive Design)**: Zod schemas (`curriculum.schema.ts`) for all incoming request payloads. Role authorization (`requireAdmin` for CMS endpoints).
- **Pass** - **Prinsip V (Frontend Stack)**: Next.js App Router + TypeScript + Tailwind CSS (PostCSS) + pnpm monorepo.
- **Pass** - **Prinsip VI (Design System)**: Components imported from `@aksicendekia/ui`.
- **Pass** - **Prinsip VII (Perlindungan Data Anak)**: Data profil anonim. API siswa mengisolasi data dan membuang kunci jawaban / butir soal pada pelajaran terkunci.
- **Pass** - **Prinsip VIII (Integritas Konten Kurikulum - MANDATORY)**: Hirarki Kurikulum Merdeka (Jenjang, Fase A–F, Matpel, CP, Durasi, Kesulitan). Alur status `DRAFT` → `REVIEW` → `PUBLISHED` → `ARCHIVED`. Hanya `PUBLISHED` disajikan ke siswa.
- **Pass** - **Prinsip IX (Aksesibilitas)**: Antarmuka Admin CMS memenuhi WCAG 2.1 AA (touch target minimum 44x44px, kontras 4.5:1).

---

## Project Structure & File Layout

```text
apps/
├── api/
│   ├── prisma/
│   │   ├── schema.prisma              # Subject, Unit, Lesson, LessonPrerequisite, QuestionItem, QuestionHint, StudentLessonProgress
│   │   └── seed.ts                    # Seed 90 questions for SD, SMP, SMA (All PUBLISHED)
│   └── src/
│       ├── app.ts                     # Fastify app initialization & curriculum route registration
│       ├── common/
│       │   └── errors/
│       │       └── app-error.ts       # BadRequestError, NotFoundError, ConflictError, ForbiddenError
│       └── modules/
│           └── curriculum/
│               ├── curriculum.schema.ts       # Zod schemas for Subject, Unit, Lesson, QuestionItem, Status, CSV import
│               ├── curriculum.repository.ts   # Prisma ORM data access layer
│               ├── csv-import.service.ts      # CSV parser & batch 500-row validator & error reporter
│               ├── curriculum.service.ts      # DAG cycle check, Immutable versioning, Lock enforcement, Student APIs
│               ├── curriculum.controller.ts   # Fastify HTTP handlers (Admin & Student endpoints)
│               └── __tests__/
│                   └── curriculum.test.ts     # Vitest unit & integration test suite (8 tests)
│
└── web/
    └── app/
        └── (admin)/
            └── admin/
                └── curriculum/
                    └── page.tsx       # Admin CMS Portal UI (Hierarchy Manager, Question Editor, Live Preview, CSV Modal)
```

---

## Implementation Details

### 1. Data Schema & Enums (`schema.prisma`)
- Enums: `CurriculumPhase`, `ContentStatus`, `DifficultyLevel`, `QuestionType`, `MatchingMode`.
- Models:
  - `Subject`: `id`, `code` (unique), `name`, `educationStage`, `phase`, `status`, `version`.
  - `Unit`: `id`, `subjectId`, `title`, `description`, `orderIndex`, `status`.
  - `Lesson`: `id`, `unitId`, `title`, `summary`, `learningObjective`, `educationStage`, `phase`, `difficultyLevel`, `estimatedDurationMinutes`, `orderIndex`, `status`, `version`, `parentVersionId`.
  - `LessonPrerequisite`: `lessonId`, `prerequisiteLessonId` (Composite PK).
  - `QuestionItem`: `id`, `lessonId`, `questionType`, `promptText`, `contentPayload` (JSON), `explanation`, `orderIndex`, `status`.
  - `QuestionHint`: `id`, `questionItemId`, `stepOrder`, `hintText`.
  - `StudentLessonProgress`: `id`, `studentProfileId`, `lessonId`, `isCompleted`, `completedAt`.

### 2. Immutable Content Versioning Algorithm
- Saat Admin mengedit entitas `PUBLISHED`:
  - System membuat record draf baru (`version = version + 1`, `status = DRAFT`, `parentVersionId = current.id`).
  - Output yang dikembalikan adalah record draf baru.
- Saat draf baru beralih status ke `PUBLISHED`:
  - Record induk (`parentVersionId`) otomatis diubah statusnya menjadi `ARCHIVED`.

### 3. DAG Prerequisite Cycle Detection
- Memeriksa граф dependensi prasyarat antar-pelajaran.
- Menggunakan traversal Depth-First Search (DFS) / Stack untuk memverifikasi apakah penambahan link `A -> B` akan membuat rute dari `B` kembali ke `A`.
- Jika terdeteksi siklus, API melempar `BadRequestError("Terdeteksi siklus prasyarat antar-pelajaran")`.

### 4. CSV Mass Import Processing (500+ Rows)
- Automatic delimiter detection (`,` vs `;`).
- Validasi Zod pada setiap baris CSV (order_index, question_type, prompt_text, content_payload_json, hints_json).
- Mengumpulkan seluruh kesalahan baris dalam array `errors: [{ row, column, message }]`.
- Jika `errors.length === 0`, menjalankan `$transaction` tunggal untuk memasukkan seluruh `QuestionItem` dan `QuestionHint`.

### 5. Student Read API Security & Lock Enforcement
- `listSubjectsForStudent(stage)`: HANYA mengembalikan `Subject` berstatus `PUBLISHED`.
- `listLessonsForUnitForStudent(studentProfileId, unitId)`: Menghitung status `isLocked` berdasarkan rekaman progress prasyarat siswa.
- `getLessonDetailForStudent(studentProfileId, lessonId)`:
  - Jika `isLocked === true`: Mengembalikan status `"LOCKED"`, `isLocked: true`, dan **WAJIB membuang `questionItems: []` (0 items)**.
  - Jika `isLocked === false`: Mengembalikan metadata dan array `questionItems` berstatus `PUBLISHED`.

### 6. Anti-Cheat & Security Protections (Feature Boundaries & Assessment Engine)
- **100% Server-Side Evaluation**: Peramban Web (`apps/web`) dilarang menerima/menyimpan `isCorrect` boolean atau string `acceptedAnswers`. Seluruh evaluasi kuis/soal diproses strictly di backend (`apps/api`).
- **Idempotency Key Enforcement**: Endpoint submit (`POST /api/v1/assessments/submit`) wajib menyertakan header `Idempotency-Key` (UUIDv4). Memproses submisi secara atomic dan mengembalikan respons yang sama jika dikirim ulang.
- **Per-Session Rate Limiting**: Batas waktu minimal antar-submisi 2 detik per `sessionId` via Fastify rate limiter untuk memblokir bot / automated payload script.

---

## Complexity Tracking

| Violation / Complexity | Why Needed | Simpler Alternative Rejected Because |
|------------------------|------------|--------------------------------------|
| **Immutable Versioning (Copy-on-write)** | Mencegah kerusakan materi/soal yang sedang dikerjakan siswa aktif di Feature 004 saat Admin mengedit materi terbitan. | Overwriting *in-place* akan merusak sesi ujian/belajar siswa secara live. |
| **DAG Cycle Detection (DFS)** | Mencegah kunci permanen (*deadlock*) di mana dua pelajaran saling mensyaratkan satu sama lain. | Tanpa validasi DAG, siswa tidak akan pernah bisa membuka pelajaran yang saling mengunci. |
| **Pencocokan Toleran (`NORMALIZED`)** | Mengakomodasi variasi pengetikan siswa (huruf kapital, spasi ganda, titik koma) tanpa menyalahkan jawaban benar. | Matching `EXACT` string terlalu kaku untuk anak-anak (misal: "jakarta" disalahkan karena tidak kapital). |
