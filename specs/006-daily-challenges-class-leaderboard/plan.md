# Implementation Plan: Tantangan Harian dan Papan Peringkat Kelas AksiCendekia

**Branch**: `006-daily-challenges-class-leaderboard` | **Date**: 2026-08-27 | **Spec**: [spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/006-daily-challenges-class-leaderboard/spec.md)

---

## Executive Summary

Membangun **Tantangan Harian dan Papan Peringkat Kelas AksiCendekia** (`006-daily-challenges-class-leaderboard`) untuk menyediakan fitur motivasi harian dan kompetisi ramah anak di lingkup kelas. 

Sistem diimplementasikan secara **Test-Driven Development (TDD)** menggunakan **Vitest** dan **Fastify + Prisma ORM + PostgreSQL** di backend (`apps/api`) serta **Next.js App Router** di frontend (`apps/web`).

Fitur ini mengelola:
1. **Tantangan Harian Otomatis**: Generator 1 tantangan per jenjang (`TK`, `SD`, `SMP`, `SMA`) per hari dari butir soal `PUBLISHED`, pelacakan progres live, dan klaim hadiah atomik idempotent.
2. **Papan Peringkat Kelas Mingguan**: Agregasi XP mingguan khusus kelas siswa, reset Senin 00:00:00 waktu lokal, dilengkapi *pinned current student rank* jika siswa di luar Top 10.
3. **Perlindungan Data Anak & Privasi**: Kebijakan *data minimization* tanpa nama lengkap, sekolah, umur, atau foto asli, opsi *opt-out* visibilitas siswa, dan *Parental Lock* dari akun orang tua.

---

## Technical Context

- **Language/Version**: TypeScript 5.4+ (Strict Mode enabled).
- **Backend Stack**: Node.js (LTS), Fastify, Prisma ORM, Zod schema validation.
- **Frontend Stack**: Next.js App Router (v14.2), Tailwind CSS, `@aksicendekia/ui`, `@aksicendekia/design-tokens`.
- **Database & Storage**: PostgreSQL via Prisma ORM (`apps/api/prisma/schema.prisma`).
- **Testing Suite**: Vitest (`pnpm --filter api test`).
- **Target Platform**: Node.js HTTP Service & Modern Web Browsers.
- **Performance Goals**: Response API Leaderboard & Daily Challenge < 150ms (p95).
- **Constraints**: Minimum coverage **80%** di backend; Zero `any` types; 100% Privacy Protection & Child Data Safety.

---

## Constitution Check (v1.1.0)

- **Pass** - **Prinsip I (Tech Stack Backend)**: Node.js + TypeScript strict mode + Fastify + PostgreSQL via Prisma ORM.
- **Pass** - **Prinsip II (Clean Architecture)**: Controllers -> Services -> Repositories separation.
- **Pass** - **Prinsip III (TDD & Quality Assurance)**: TDD workflow via Vitest. Minimum 80% coverage threshold enforced.
- **Pass** - **Prinsip IV (Security & Defensive Design)**: Validasi Zod & JWT Auth + Relational Checks.
- **Pass** - **Prinsip V (Frontend Stack)**: Next.js App Router + Tailwind CSS via PostCSS + pnpm monorepo.
- **Pass** - **Prinsip VI (Design System & Theming)**: Menggunakan token visual dari `packages/design-tokens`.
- **Pass** - **Prinsip VII (Perlindungan Data Anak)**: Papan peringkat anonim, tidak ada nama lengkap/sekolah/foto asli, opt-out tersembunyi 100% dari API lain, Parental lock.
- **Pass** - **Prinsip VIII (Integritas Konten Kurikulum)**: Soal tantangan harian wajib berstatus `PUBLISHED`.
- **Pass** - **Prinsip IX (Aksesibilitas)**: Antarmuka memenuhi WCAG 2.1 AA (target sentuh 44x44px, navigasi keyboard penuh, kontras 4.5:1).

---

## Project Structure & File Layout

```text
specs/006-daily-challenges-class-leaderboard/
├── plan.md              # Document plan ini
├── research.md          # Keputusan arsitektur & riset teknis
├── data-model.md        # Prisma schema & DTO definitions
├── quickstart.md        # Panduan verifikasi lokal & test cases
└── contracts/
    └── http-api.md      # REST API specification

apps/
├── api/
│   ├── prisma/
│   │   └── schema.prisma                  # DailyChallenge, StudentDailyChallenge, StudentPrivacySetting
│   └── src/
│       ├── app.ts                         # Registrasi Fastify routes
│       └── modules/
│           ├── daily-challenge/
│           │   ├── daily-challenge.schema.ts      # Zod validation schemas
│           │   ├── daily-challenge.repository.ts  # Prisma database layer
│           │   ├── daily-challenge.service.ts     # Business logic, generator & reward claim
│           │   ├── daily-challenge.controller.ts  # HTTP Handlers
│           │   └── __tests__/
│           │       └── daily-challenge.test.ts    # TDD Vitest suite
│           │
│           └── leaderboard/
│               ├── leaderboard.schema.ts          # Zod validation schemas
│               ├── leaderboard.repository.ts      # Prisma query Top 10 + Pinned rank
│               ├── leaderboard.service.ts         # Business logic & Privacy filtering
│               ├── leaderboard.controller.ts      # HTTP Handlers
│               └── __tests__/
│                   ├── class-leaderboard.test.ts  # Leaderboard TDD Vitest suite
│                   └── privacy-setting.test.ts    # Privacy & Parental Lock test suite
│
└── web/
    └── app/
        └── (student)/
            └── leaderboard/
                └── page.tsx                       # Tampilan Papan Peringkat Kelas & Tantangan Harian
```

---

## Implementation Phases & Deliverables

### Phase 1: Database Migration & Schema Setup
- Menambahkan model `DailyChallenge`, `StudentDailyChallenge`, dan `StudentPrivacySetting` ke `apps/api/prisma/schema.prisma`.
- Menjalankan `prisma migrate dev`.

### Phase 2: Backend Module Development (TDD)
- **Daily Challenge Module**:
  - Generator tantangan harian per jenjang berbasis soal `PUBLISHED`.
  - Service pelacakan progres & transaksi klaim atomik.
  - Test suite `daily-challenge.test.ts`.
- **Leaderboard & Privacy Module**:
  - Repository query agregasi XP mingguan Top 10 + Pinned student rank.
  - Service penapisan data privasi anonim & filter `is_hidden_from_leaderboard`.
  - Service Parental Lock untuk penolakan 403 Forbidden.
  - Test suite `class-leaderboard.test.ts` & `privacy-setting.test.ts`.

### Phase 3: Frontend Interface Assembly
- Komponen Papan Peringkat Kelas & Tantangan Harian di Next.js App Router (`apps/web/app/(student)/leaderboard/page.tsx`).
- Pengaturan visibilitas dan tampilan modal Parental Lock.
