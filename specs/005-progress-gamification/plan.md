# Implementation Plan: Sistem Progres dan Gamifikasi AksiCendekia

**Branch**: `005-progress-gamification` | **Date**: 2026-08-27 | **Spec**: [spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/005-progress-gamification/spec.md)

**Input**: User prompt for `/speckit.plan`, Constitution v1.1.0, and `/specs/005-progress-gamification/spec.md`.

---

## Summary

Membangun **Sistem Progres dan Gamifikasi AksiCendekia** (`005-progress-gamification`) sebagai mesin gamifikasi utama yang mengonsumsi *Domain Events* dari `004-learning-session-engine` secara *asynchronous* dan *idempotent*. 

Sistem diimplementasikan secara **Test-Driven Development (TDD)** menggunakan **Vitest** dan **Fastify + Prisma ORM + PostgreSQL** di backend (`apps/api`) serta **Next.js App Router** di frontend (`apps/web`).

Fitur ini mengelola:
1. **XP & Kurva Level Eksponensial**: Aturan perolehan XP dan kurva level ($100 \times L^{1.5}$) disimpan pada file konfigurasi eksternal (`gamification-config.json`).
2. **Kalkulasi Streak Harian Multi-Timezone**: Menghitung pergantian hari kalender lokal siswa (WIB, WITA, WIT) dengan proteksi konsumsi **Pembeku Waktu** (`STREAK_FREEZE`) otomatis.
3. **Evaluator Badge Event-Driven**: Evaluasi syarat badge (*Lessons Completed, Streak Length, Accuracy Rate, Subject Completion*) secara real-time tanpa polling.
4. **Inventaris Power-Up & Proteksi Atomik**: Transaksi *Token Petunjuk* dan *Pembeku Waktu* menggunakan query atomik SQL (`UPDATE ... WHERE quantity >= amount`) bebas dari saldo negatif pada eksekusi konkuren.
5. **Pembukaan Pelajaran & API Peta Misi**: Resolusi graf prasyarat pelajaran (`COMPLETED`, `CURRENT`, `UNLOCKED`, `LOCKED`).
6. **Halaman Pencapaian Siswa**: Dashboard visual pencapaian badge, progres per mata pelajaran, dan riwayat transaksi XP.

---

## Technical Context

- **Language/Version**: TypeScript 5.4+ (Strict Mode enabled).
- **Backend Stack**: Node.js (LTS), Fastify, Prisma ORM (v5.22.0), Zod schema validation.
- **Frontend Stack**: Next.js App Router (v14.2), Tailwind CSS, `@aksicendekia/ui`, `@aksicendekia/design-tokens`.
- **Database & Storage**: PostgreSQL via Prisma ORM (`apps/api/prisma/schema.prisma`).
- **Testing Suite**: Vitest (`pnpm --filter api test`).
- **Target Platform**: Node.js HTTP Service & Modern Web Browsers.
- **Performance Goals**: Response API Peta Misi & Halaman Pencapaian < 150ms (p95); Pemrosesan event outbox < 100ms.
- **Constraints**: Minimum coverage **80%** di backend; Zero `any` types; 100% Event Idempotency; Zero Negative Balance pada saldo power-up.

---

## Constitution Check (v1.1.0)

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Pass** - **Prinsip I (Tech Stack Backend)**: Node.js + TypeScript strict mode + Fastify + PostgreSQL via Prisma ORM. Direct raw SQL string concatenation strictly forbidden.
- **Pass** - **Prinsip II (Clean Architecture)**: Controllers (`progress.controller.ts`) -> Services (`progress.service.ts`, `gamification.service.ts`) -> Repositories (`progress.repository.ts`).
- **Pass** - **Prinsip III (TDD & Quality Assurance)**: TDD workflow via Vitest. Minimum 80% coverage threshold enforced. Zero `any` types allowed.
- **Pass** - **Prinsip IV (Security & Defensive Design)**: Validasi Zod (`progress.schema.ts`). Autentikasi JWT & kontrol otorisasi relasional (`requireRole('SISWA')`).
- **Pass** - **Prinsip V (Frontend Stack)**: Next.js App Router + TypeScript strict mode + Tailwind CSS via PostCSS + pnpm monorepo.
- **Pass** - **Prinsip VI (Design System & Theming)**: Menggunakan token visual dari `packages/design-tokens` (termasuk warna jenjang TK, SD, SMP, SMA dan Tactile UI).
- **Pass** - **Prinsip VII (Perlindungan Data Anak)**: Penegakan otorisasi relasional (siswa itu sendiri, orang tua terverifikasi, atau guru kelas) pada API progres.
- **Pass** - **Prinsip VIII (Integ integritas Konten Kurikulum)**: Peta Misi hanya menyajikan pelajaran Kurikulum Merdeka berstatus `PUBLISHED`.
- **Pass** - **Prinsip IX (Aksesibilitas)**: Halaman Pencapaian & Peta Misi memenuhi WCAG 2.1 AA (target sentuh 44x44px, navigasi keyboard penuh, kontras 4.5:1).

---

## Project Structure & File Layout

```text
specs/005-progress-gamification/
├── plan.md              # Document plan ini
├── research.md          # Keputusan arsitektur & riset teknis
├── data-model.md        # Prisma schema & DTO definitions
├── quickstart.md        # Panduan verifikasi lokal & test cases
└── contracts/
    ├── http-api.md      # REST API specification untuk Progress & Gamification
    └── event-consumer.md# Kontrak pemrosesan event dari Feature 004

apps/
├── api/
├── prisma/
│   └── schema.prisma                  # StudentProgress, XpTransaction, BadgeDefinition, StudentBadge, StudentPowerup, PowerupTransaction, StudentLessonProgress, ProcessedEventLog
└── src/
    ├── config/
    │   └── gamification-config.json   # Aturan XP & Kurva Level eksponensial
    ├── app.ts                         # Registrasi Fastify routes & event subscribers
    └── modules/
        └── progress/
            ├── progress.schema.ts      # Zod validation schemas
            ├── progress.repository.ts  # Database persistence layer via Prisma
            ├── gamification.service.ts # Event consumer, XP, level, streak, badge, powerup logic
            ├── progress.service.ts     # Business logic untuk Peta Misi & Halaman Pencapaian
            ├── progress.controller.ts  # HTTP Route Handlers
            └── __tests__/
                ├── gamification-event.test.ts # Test idempotensi & kalkulasi event
                ├── streak-timezone.test.ts   # Test streak WIB, WITA, WIT & Freeze
                ├── powerup-concurrency.test.ts# Test atomic update & zero negative balance
                └── mission-map.test.ts       # Test graf status peta misi
│
└── web/
    └── app/
        └── (student)/
            ├── mission-map/
            │   └── page.tsx           # Tampilan Peta Misi Interaktif (Node status COMPLETED/CURRENT/UNLOCKED/LOCKED)
            └── achievements/
                └── page.tsx           # Halaman Pencapaian Siswa (Badges, Subject Progress, XP History, Powerup Balances)
```

---

## Implementation Phases & Deliverables

### Phase 1: Database Migration & Config Setup
- Buat model database baru di `apps/api/prisma/schema.prisma` (`StudentProgress`, `XpTransaction`, `BadgeDefinition`, `StudentBadge`, `StudentPowerup`, `PowerupTransaction`, `StudentLessonProgress`, `ProcessedEventLog`).
- Buat file `apps/api/src/config/gamification-config.json` dan seeder data awal badge (`badge_definitions`).

### Phase 2: Core Gamification Engine (TDD Backend)
- Implementasikan `ProcessedEventLog` idempotency middleware/handler.
- Implementasikan kalkulasi XP & Level eksponensial di `gamification.service.ts`.
- Implementasikan mesin kalkulasi streak harian multi-timezone (`Asia/Jakarta`, `Asia/Makassar`, `Asia/Jayapura`) & konsumsi otomatis `STREAK_FREEZE`.
- Implementasikan evaluator badge event-driven berbasis kriteria.
- Implementasikan transaksi power-up atomik (`UPDATE ... WHERE quantity >= amount`).

### Phase 3: Mission Map & Prerequisites Engine
- Implementasikan algoritma resolusi status simpul Peta Misi di `progress.service.ts`.
- Buat endpoint HTTP `GET /api/v1/curriculum/subjects/:subjectId/mission-map`.
- Implementasikan pembukaan prasyarat otomatis saat sesi pelajaran selesai.

### Phase 4: Achievements Dashboard & REST API
- Buat endpoint `GET /api/v1/students/achievements`.
- Buat endpoint `POST /api/v1/powerups/consume`.
- Tambahkan penegakan otorisasi relasional (Prinsip VII PDP compliance).

### Phase 5: Frontend UI Components (`apps/web`)
- Buat Halaman Peta Misi (`apps/web/app/(student)/mission-map/page.tsx`) dengan visualisasi simpul taktil (`@aksicendekia/ui`).
- Buat Halaman Pencapaian (`apps/web/app/(student)/achievements/page.tsx`) menyajikan badge grid, streak banner ("5 Hari Beruntun!"), progress bar XP, dan riwayat transaksi.
- Verifikasi aksesibilitas WCAG 2.1 AA.

---

## Verification Plan

### Automated Tests
- `pnpm --filter api test -- progress-gamification` (Vitest coverage threshold >= 80%).
- Sub-suite tests:
  1. `gamification-event.test.ts`: Kirim event ganda -> pastikan idempotensi 100%.
  2. `streak-timezone.test.ts`: Uji batas tanggal jam 23:59 vs 00:01 di WIB, WITA, WIT.
  3. `powerup-concurrency.test.ts`: 10 request konsumsi simultan saat saldo = 1 -> pastikan saldo akhir = 0.
  4. `mission-map.test.ts`: Verifikasi resolusi status simpul berprasyarat.

### Manual Verification
- Login sebagai Siswa -> Selesaikan sesi belajar pada Pelajaran 1 -> Buka Peta Misi -> Verifikasi Pelajaran 1 berstatus `COMPLETED` dan Pelajaran 2 otomatis `CURRENT`/`UNLOCKED`.
- Buka Halaman Pencapaian -> Verifikasi tampilan "1 Hari Beruntun!", XP bertambah, dan badge milestone pertama terbuka.
