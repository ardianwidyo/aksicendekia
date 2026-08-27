# Implementation Plan: Mesin Sesi Belajar AksiCendekia — Inti Produk

**Branch**: `004-learning-session-engine` | **Date**: 2026-08-27 | **Spec**: [specs/004-learning-session-engine/spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/004-learning-session-engine/spec.md)

**Input**: User prompt for `/speckit.plan`, Constitution v1.1.0, and `/specs/004-learning-session-engine/spec.md`.

---

## Summary

Membangun Mesin Sesi Belajar AksiCendekia (*Learning Session Engine*) sebagai inti interaktif dari pengalaman belajar siswa berlandaskan **Konstitusi AksiCendekia v1.1.0** (Prinsip I, II, IV, V, VI, VIII, IX) menggunakan stack **Fastify + Prisma ORM + PostgreSQL** di backend (`apps/api`) dan **Next.js App Router** (Feature 001 design system & `@aksicendekia/ui`) di frontend (`apps/web`).

Sistem diimplementasikan secara **TDD (Test-Driven Development)** menggunakan **Vitest**, menerapkan skema database Prisma (`LearningSession`, `SessionQuestionOrder`, `SessionAnswer`, `OutboxEvent`), inisialisasi sesi terkontrol di server (*server-driven composition*), penyajikan soal sekuensial dengan jaminan **Zero Key Answer Leakage (Anti-Cheat Strict)**, penilaian jawaban di server dengan dukungan **Algoritma Normalisasi Teks Isian Singkat**, umpan balik visual taktil (*"depress"* button) & tema warna **Emerald (`#00855b`)** sesuai `DESIGN.md`, manajemen status jeda/lanjutkan (*pause/resume*) & kedaluwarsa otomatis 24 jam (*auto-expire*), Layar Hasil evaluasi akhir dengan perlindungan *double-completion guard*, publikasi **Domain Events terstruktur** (`started`, `question_answered`, `completed`, `expired`) via Transactional Outbox Pattern untuk Feature 005, serta API pembacaan riwayat sesi belajar per siswa.

---

## Technical Context

- **Language/Version**: TypeScript 5.4+ (Strict Mode enabled).
- **Backend Stack**: Node.js (LTS), Fastify, Prisma ORM (v5.22.0), Zod schema validation.
- **Frontend Stack**: Next.js App Router (v14.2), Tailwind CSS, `@aksicendekia/ui`.
- **Database & Storage**: PostgreSQL via Prisma ORM (`apps/api/prisma/schema.prisma`).
- **Testing**: Vitest (`pnpm --filter api test`).
- **Target Platform**: Node.js HTTP Service & Modern Web Browsers.
- **Performance Goals**: Penilaian jawaban & penyajian soal mengembalikan respons < 150ms (p95).
- **Constraints**: Minimum coverage **80%** di backend; Zero `any` types; Zero key answer leakage; Client score inputs 100% ignored; Single-event completion idempotency.

---

## Constitution Check (v1.1.0)

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Pass** - **Prinsip I (Tech Stack Backend)**: Node.js + TypeScript strict mode + Fastify + PostgreSQL via Prisma ORM. Direct raw SQL / dynamic SQL string strictly forbidden.
- **Pass** - **Prinsip II (Clean Architecture)**: Controllers (`session.controller.ts`) -> Services (`session.service.ts`) -> Repositories (`session.repository.ts`).
- **Pass** - **Prinsip III (TDD & Quality Assurance)**: Red-Green-Refactor cycle via Vitest. Minimum 80% coverage threshold. Zero `any` types.
- **Pass** - **Prinsip IV (Security & Defensive Design)**: Zod schemas (`session.schema.ts`) for all incoming request payloads. Role authorization (`requireRole('SISWA')`). `Idempotency-Key` header enforcement.
- **Pass** - **Prinsip V (Frontend Stack)**: Next.js App Router + TypeScript + Tailwind CSS (PostCSS) + pnpm monorepo.
- **Pass** - **Prinsip VI (Design System)**: Tactile UI buttons with "depress" effect (shadow disappears & 2px Y-translation) and Emerald (`#00855b`) success color per `DESIGN.md`.
- **Pass** - **Prinsip VII (Perlindungan Data Anak)**: Data profil anonim. Relational authorization checks for student session access.
- **Pass** - **Prinsip VIII (Integritas Konten Kurikulum)**: Sesi hanya dapat dibuka dari pelajaran berstatus `PUBLISHED` yang sudah terbuka (`is_locked: false`).
- **Pass** - **Prinsip IX (Aksesibilitas)**: Antarmuka Sesi Belajar memenuhi WCAG 2.1 AA (target sentuh minimum 44x44px, kontras 4.5:1, navigasi penuh via keyboard).

---

## Project Structure & File Layout

```text
specs/004-learning-session-engine/
├── plan.md              # Plan implementation overview
├── research.md          # Phase 0 technical decisions
├── data-model.md        # Phase 1 Prisma schema & DTO definitions
├── quickstart.md        # Phase 1 validation scenario guide
└── contracts/
    ├── http-api.md      # REST API contracts
    └── domain-events.md # Event JSON schemas for Feature 005

apps/
├── api/
│   ├── prisma/
│   │   └── schema.prisma              # LearningSession, SessionQuestionOrder, SessionAnswer, OutboxEvent
│   └── src/
│       ├── app.ts                     # Fastify route registration for learning sessions
│       └── modules/
│           └── session/
│               ├── session.schema.ts       # Zod validation schemas
│               ├── session.repository.ts   # Prisma DB operations
│               ├── session.service.ts      # Server grading, Zero-leakage DTO mapping, Expiration & Outbox logic
│               ├── session.controller.ts   # Fastify HTTP handlers
│               └── __tests__/
│                   └── session.test.ts     # Vitest unit & integration tests
│
└── web/
    └── app/
        └── (student)/
            └── session/
                ├── [id]/
                │   ├── page.tsx           # Active Learning Session UI (Sequential question presenter)
                │   └── summary/
                │       └── page.tsx       # Completion Results Screen (Score, breakdown, retake/next)
                └── history/
                    └── page.tsx           # Student Session History list view
```

---

## Implementation Details

### 1. Database Schema (`schema.prisma`)
- Enums: `SessionStatus` (`IN_PROGRESS`, `PAUSED`, `COMPLETED`, `EXPIRED`).
- Models:
  - `LearningSession`: Track student session progress, scores, durations, and expiration timestamps (`expiresAt`).
  - `SessionQuestionOrder`: Preserve server-shuffled question sequence.
  - `SessionAnswer`: Persist student submissions with idempotency protection.
  - `OutboxEvent`: Transactional Outbox table for Domain Events publication.

### 2. Service Layer Logic (`session.service.ts`)
- **`createSession(studentId, lessonId)`**: Validates lesson availability, shuffles published questions, creates `LearningSession`, and writes `learning.session.started` event to Outbox.
- **`submitAnswer(studentId, sessionId, input, idempotencyKey)`**: Evaluates student answer using exact/case-insensitive/normalized match algorithms, computes correctness, persists `SessionAnswer`, updates session index, and writes `learning.session.question_answered` event to Outbox.
- **`completeSession(studentId, sessionId)`**: Computes final percentage score, marks status `COMPLETED`, and writes `learning.session.completed` event to Outbox (guaranteed idempotent).
- **`getHint(studentId, sessionId, questionId)`**: Returns next available hint for active question and tracks usage count.

### 3. Frontend Tactile UX (`apps/web`)
- Custom option component implementing physical "push-button" feedback per `DESIGN.md`:
  ```css
  .tactile-button {
    border-bottom: 4px solid var(--color-primary-dark);
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }
  .tactile-button:active, .tactile-button.selected {
    transform: translateY(2px);
    border-bottom-width: 2px;
  }
  ```
- Visual feedback styling: Correct options highlight with Emerald (`#00855b`), incorrect options with Rose (`#ba1a1a`).

---

## Verification Plan

### Automated Tests
- Backend Unit & Integration Suite (`Vitest`):
  `pnpm --filter api test apps/api/src/modules/session/__tests__/session.test.ts`
- Monorepo Typecheck:
  `pnpm check`

### Manual Verification
- Execute validation scenarios documented in [`quickstart.md`](file:///d:/Source%20Code/Personal/aksicendekia/specs/004-learning-session-engine/quickstart.md).
