# Implementation Plan: Akses Mode Tamu Tanpa Login & Penyimpanan Progres Belajar Lokal

**Branch**: `009-guest-mode-local-storage` | **Date**: 2026-08-28 | **Spec**: [specs/009-guest-mode-local-storage/spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/009-guest-mode-local-storage/spec.md)

**Input**: User prompt for `/speckit.plan`, Constitution v1.1.0, and `/specs/009-guest-mode-local-storage/spec.md`.

---

## Summary

Mengimplementasikan **Akses Mode Tamu (Zero-Barrier Guest Mode)** dan **Sistem Penyimpanan Progres Belajar Lokal di Sisi Klien** pada platform AksiCendekia berlandaskan **Konstitusi AksiCendekia v1.1.0**.

Sistem dirancang dengan arsitektur **Storage Adapter Pattern** berbasis interface `IProgressStorageRepository` di frontend Next.js App Router (`apps/web`), menggunakan **IndexedDB** sebagai mesin penyimpanan utama untuk skalabilitas dan efisiensi memori dengan fallback otomatis ke **LocalStorage**. Evaluasi sesi belajar dan perhitungan capaian gamifikasi (XP, level, streak harian lokal, badge lokal) dieksekusi secara instan dan independen di sisi peramban.

Fitur ini juga mencakup mekanisme **Migrasi Progres ke Cloud (Seamless Account Upgrade)** melalui endpoint backend Fastify `POST /api/v1/sync/guest-progress` (`apps/api`) yang dilengkapi validasi Zod ketat dan aturan pencegahan manipulasi data (*sanity checks*), serta dialog *Graceful Gating* yang ramah anak untuk fitur-fitur yang memerlukan akun terdaftar.

---

## Architectural Principles & Strict Guidelines

1. **Storage Adapter Pattern & Schema Versioning**:
   - `IProgressStorageRepository` mengabstraksikan penyimpanan data lokal.
   - `IndexedDBProgressAdapter` (primer) & `LocalStorageProgressAdapter` (sekunder/fallback).
   - Validasi penuh terhadap seluruh payload pembacaan/penulisan storage menggunakan skema Zod `GuestProgressStateSchema` dengan metadata `schema_version: 1`.
   - Mengimplementasikan pembersihan otomatis (*LRU Pruning*) untuk log detail sesi yang telah lewat dari 30 hari jika kuota browser mendekati batas.

2. **Mesin Sesi & Gamifikasi Lokal (Standalone Client Engine)**:
   - `LocalSessionEngine` di `apps/web/lib/gamification/local-engine.ts` mengevaluasi submisi butir soal, melakukan normalisasi teks toleran untuk isian singkat, dan menghitung XP serta streak harian lokal.
   - **Konten kurikulum (materi + bank soal) disajikan via endpoint publik tanpa JWT**: `GET /api/v1/public/lessons/:id` dan `GET /api/v1/public/exercises/:id`. Payload menyertakan kunci jawaban (`accepted_answers`) karena penilaian dilakukan sepenuhnya di sisi browser.
   - Seluruh jenjang (TK, SD, SMP, SMA) dan semua mata pelajaran terbuka penuh. Tidak ada freemium gating.
   - Perhitungan berjalan 100% di browser, mendukung skenario internet lambat/offline.

3. **Transisi & Sinkronisasi Akun (Cloud Migration)**:
   - Endpoint Fastify `POST /api/v1/sync/guest-progress` di `apps/api/src/modules/sync/guest-sync.controller.ts`.
   - Menerapkan *Sanity Rate-Limiting*: maksimal 500 XP per sesi latihan atau 10.000 XP total per permintaan migrasi.
   - Integrasi langsung ke Prisma ORM (`StudentProfile`, `UserGamification`, `LearningSession`, `LessonProgress`) dalam satu transaksi database atomik (`prisma.$transaction`).

4. **Kepatuhan Privasi & Perlindungan Data Anak (Prinsip VII)**:
   - *Zero Server Data Collection* selama pengguna berada dalam Mode Tamu.
   - Profil lokal hanya berupa nama samaran (*display nickname*) dan preset avatar bawaan platform. Dilarang meminta informasi identitas pribadi (nama lengkap, kontak, email) sebelum pendaftaran resmi dengan persetujuan orang tua.

5. **Aksesibilitas & Tactile Design System**:
   - Seluruh komponen interaksi (banner tamu, seleksi jenjang, modal migrasi, tombol reset) menggunakan token visual dari `packages/design-tokens` dan pustaka komponen `packages/ui`.
   - Memenuhi standar WCAG 2.1 AA (area sentuh minimal 44x44px dan rasio kontras warna minimal 4.5:1).
   - Semua teks antarmuka menggunakan layer lokalisasi i18n Bahasa Indonesia (`packages/ui/src/locales/id.json`).

6. **TDD Workflow & Mandatory Test Coverage**:
   - Mengikuti siklus Red-Green-Refactor menggunakan **Vitest**.
   - Cakupan pengujian minimal **80%** untuk lapisan storage adapter, local gamification engine, komponen UI migrasi, dan controller backend sync.

---

## Constitution Check (v1.1.0)

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Pass** - **Pasal I (Tech Stack Backend)**: Fastify + Node.js + TypeScript strict mode + Prisma ORM + PostgreSQL untuk modul sync backend.
- **Pass** - **Pasal II (Clean Architecture)**: Controllers (HTTP extraction) -> Services (business logic & merge strategy) -> Repositories (Prisma DB access).
- **Pass** - **Pasal III (TDD & Quality Assurance - NON-NEGOTIABLE)**: Red-Green-Refactor cycle via Vitest. Cakupan pengujian minimal 80%. Zero `any` types.
- **Pass** - **Pasal IV (Security & Defensive Design)**: Validasi Zod pada seluruh request/response payload dan local storage state. Rate limiting pada endpoint sync.
- **Pass** - **Pasal V (Frontend Stack)**: Next.js App Router + TypeScript strict mode + Tailwind CSS via PostCSS + pnpm monorepo workspace.
- **Pass** - **Pasal VI (Design System)**: Komponen dan token tema jenjang (TK, SD, SMP, SMA) bersumber dari `packages/design-tokens` dan `packages/ui`.
- **Pass** - **Pasal VII (Perlindungan Data Anak - NON-NEGOTIABLE)**: Zero Server Data Collection di Mode Tamu. Profil lokal anonim.
- **Pass** - **Pasal VIII (Integritas Konten Kurikulum & i18n)**: Konten kurikulum berstatus `PUBLISHED`, seluruh string UI terintegrasi ke dictionary i18n Bahasa Indonesia.
- **Pass** - **Pasal IX (Aksesibilitas)**: Standar WCAG 2.1 AA (44x44px touch target, navigasi keyboard penuh, kontras teks 4.5:1).

---

## Project Structure & File Layout

```text
apps/
├── api/
│   └── src/
│       └── modules/
│           └── sync/
│               ├── guest-sync.schema.ts         # Zod validation schema untuk sync request & response
│               ├── guest-sync.repository.ts     # Prisma ORM operations (merge XP, sessions, progress)
│               ├── guest-sync.service.ts        # Business logic: sanity checks, XP capping, union merging
│               ├── guest-sync.controller.ts     # Fastify route handler: POST /api/v1/sync/guest-progress
│               └── __tests__/
│                   ├── guest-sync.service.spec.ts
│                   └── guest-sync.controller.spec.ts
│
├── web/
│   └── lib/
│       ├── storage/
│       │   ├── progress-storage.interface.ts   # Interface IProgressStorageRepository
│       │   ├── indexeddb-progress.adapter.ts   # Implementasi IndexedDB adapter
│       │   ├── localstorage-progress.adapter.ts# Implementasi LocalStorage adapter fallback
│       │   ├── storage-manager.ts              # Factory & Auto-detection singleton
│       │   └── __tests__/
│       │       ├── storage-manager.spec.ts
│       │       └── storage-adapter.spec.ts
│       │
│       ├── gamification/
│       │   ├── guest-progress.schema.ts        # Zod schema untuk local state & entities
│       │   ├── local-session-engine.ts         # Offline/Guest session evaluator, XP calculation, streak
│       │   └── __tests__/
│       │       └── local-session-engine.spec.ts
│       │
│       └── context/
│           ├── guest-progress-context.tsx      # React Context Provider untuk state progres lokal
│           └── __tests__/
│               └── guest-progress-context.spec.tsx
│
packages/
├── design-tokens/                              # Token warna jenjang TK/SD/SMP/SMA, radius, spacing
└── ui/
    ├── src/
    │   ├── components/
    │   │   ├── guest/
    │   │   │   ├── guest-header-banner.tsx     # Banner indikator Mode Tamu & tombol Simpan Progres
    │   │   │   ├── guest-profile-modal.tsx     # Modal ubah nickname & avatar lokal
    │   │   │   ├── guest-sync-modal.tsx        # Modal konfirmasi migrasi progres saat login/register
    │   │   │   ├── guest-reset-modal.tsx       # Dialog konfirmasi reset data lokal
    │   │   │   └── guest-feature-gate.tsx      # Kartu edukasi/CTA ramah anak untuk fitur cloud
    │   │   └── __tests__/
    │   └── locales/
    │       └── id.json                         # Key-value translation strings Bahasa Indonesia
```

---

## Complexity Tracking

> **Semua prinsip arsitektur Konstitusi v1.1.0 terpenuhi tanpa pelanggaran.**

| Modul / Komponen | Kebutuhan Solusi | Alasan Pemilihan Arsitektur |
|---|---|---|
| Storage Adapter Pattern | Dukungan multi-backend storage lokal di browser | Mengizinkan transisi transparan antara `IndexedDB` (performa tinggi) dan `LocalStorage` (fallback kompatibilitas universal) tanpa mengubah kode UI. |
| Standalone Client Gamification Engine | Perhitungan XP & streak tanpa login/internet | Logika domain murni yang dapat diuji secara terisolasi tanpa memerlukan dependensi server atau koneksi database. |
| Backend Sanity Check on Sync | Penggabungan data lokal ke akun terdaftar | Mencegah eksploitasi perusakan skor atau manipulasi client-side saat sinkronisasi data progres. |
