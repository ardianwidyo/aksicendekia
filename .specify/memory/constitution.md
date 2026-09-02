<!--
Sync Impact Report (2026-09-02):
- Version change: 1.1.0 → 1.2.0
- Bump rationale: MINOR. Larangan hotlink pihak ketiga TETAP berlaku sebagai aturan default;
  amandemen ini menambahkan satu pengecualian sempit dan berkondisi untuk video edukasi tersemat,
  plus kewajiban baru (muat-atas-permintaan, mode privasi, registri sematan, gate publikasi).
  Tidak ada prinsip yang dihapus atau dilonggarkan tanpa kompensasi kewajiban baru, sehingga
  ini bukan MAJOR.
- Modified Principles:
  - VI. Design System sebagai Sumber Tunggal — cakupan self-hosted diperluas eksplisit ke animasi,
    font, dan berkas media; ditambah "Pengecualian Tunggal — Video Edukasi Tersemat" dengan 6 syarat
    kumulatif dan batas tegas bahwa pengecualian tidak meluas ke jenis aset lain maupun penyedia lain.
  - VII. Perlindungan Data Anak — ditambah larangan eksplisit atas pelacak, analitik, piksel, dan
    iklan bertarget pihak ketiga pada seluruh halaman menghadap anak termasuk jalur tamu.
- Added Sections:
  - Development Workflow & Quality Gates → "Embedded Media Gate" (gate publikasi untuk pelajaran
    yang memuat sematan pihak ketiga).
- Modified Sections:
  - Technical Stack & Infrastructure → baris Design Tokens & Assets merujuk pengecualian Prinsip VI.
- Removed Sections: None
- Driven by: specs/011-sd-math-focus (FR-016, FR-016a–d, FR-035a, FR-039)
- Follow-up TODOs: None

Sync Impact Report (arsip):
- Version change: 1.0.0 → 1.1.0
- Modified Principles: N/A
- Added Principles:
  - V. Frontend Stack & Struktur (Next.js App Router, TypeScript strict mode, Tailwind CSS via PostCSS, shadcn/ui, pnpm workspace monorepo)
  - VI. Design System sebagai Sumber Tunggal (packages/design-tokens derived from design/DESIGN.md, anti-hardcoding, level-based theming TK/SD/SMP/SMA, self-hosted assets)
  - VII. Perlindungan Data Anak (NON-NEGOTIABLE) (UU No. 27/2022 parental consent, data minimization, anonymous public profiles, blocked open chat, relational authorization checks)
  - VIII. Integritas Konten Kurikulum (Kurikulum Merdeka mapping, draft->review->published workflow, mandatory i18n layer)
  - IX. Aksesibilitas (WCAG 2.1 level AA, 44x44px touch targets, full keyboard navigation, 4.5:1 text contrast)
- Added Sections: None
- Modified Sections:
  - Technical Stack & Infrastructure (Added frontend stack, monorepo structure, UI packages, design tokens, asset hosting)
  - Development Workflow & Quality Gates (Added accessibility gate and curriculum content review gate)
- Removed Sections: None
- Follow-up TODOs: None
-->

# Aksi Cendekia Constitution

## Core Principles

### I. Technology Stack & Core Foundations
The Aksi Cendekia backend MUST be built exclusively using **Node.js** with **TypeScript** configured in strict mode. **Fastify** SHALL be used as the primary HTTP framework for high performance and low latency. Data persistence MUST be managed via **PostgreSQL** using **Prisma ORM** as the type-safe schema and query interface. Direct raw database queries without Prisma context or unsafe dynamic SQL string concatenation are strictly forbidden.

### II. Clean Architecture & Layer Separation
The codebase MUST strictly adhere to Clean Architecture principles, enforcing clear separation of concerns across distinct layers:
- **Controllers**: Responsible strictly for HTTP request extraction, invoking input validation, formatting HTTP responses, and setting status codes. Controllers MUST NOT contain business logic or database access logic.
- **Services**: Encapsulate pure business logic, domain rules, and application workflows. Services MUST be agnostic of HTTP frameworks (Fastify request/reply objects) and MUST NOT perform direct database operations.
- **Repositories**: Encapsulate data access, persistence logic, and database operations using Prisma ORM. Repositories MUST expose domain entities or data transfer objects (DTOs) to Services.

Cross-layer dependency violations (e.g., Controllers accessing Prisma directly or Services referencing HTTP-specific objects) are strictly prohibited.

### III. Test-Driven Development & Quality Assurance (NON-NEGOTIABLE)
Test-Driven Development (TDD) is MANDATORY for all feature implementation, refactoring, and bug fixes.
- The Red-Green-Refactor cycle MUST be strictly enforced: automated tests written using **Vitest** first → user/requirement alignment → test failure verified → code written to pass → refactor.
- Minimum automated test coverage threshold is **80%** across lines, functions, branches, and statements. PRs or builds with test coverage under 80% MUST be automatically blocked.
- TypeScript strict mode MUST be enabled (`"strict": true` in `tsconfig.json`). Explicit or implicit usage of `any` type is strictly forbidden (`@typescript-eslint/no-explicit-any`).

### IV. Security & Defensive Design
Every API endpoint exposed by Aksi Cendekia MUST enforce strict security controls at the entry point:
- **Input Validation**: ALL incoming request payloads (params, query parameters, headers, body) MUST be validated and parsed using **Zod** schemas before execution reaches controllers or services.
- **Authentication & Authorization**: Protected endpoints MUST enforce JSON Web Token (**JWT**) verification. Token signing and verification MUST use secure secrets/keys.
- **Rate Limiting**: Rate limiting MUST be enabled globally and configured per endpoint using Fastify rate-limiting middleware to guard against brute-force attacks and abuse.

### V. Frontend Stack & Struktur
Frontend WAJIB Next.js App Router + TypeScript strict mode + Tailwind CSS (build-time via PostCSS) + shadcn/ui. CDN Tailwind (cdn.tailwindcss.com) DILARANG di environment apa pun. Repo berbentuk monorepo pnpm workspace: apps/web, apps/api, packages/ui, packages/design-tokens. Komponen UI bersama WAJIB tinggal di packages/ui dan diimpor, tidak boleh diduplikasi per-aplikasi.

### VI. Design System sebagai Sumber Tunggal
Seluruh token visual (warna, tipografi, radius, spacing) WAJIB berasal dari packages/design-tokens yang diturunkan dari design/DESIGN.md. Nilai hex, ukuran font, atau spacing yang di-hardcode di dalam komponen DILARANG. Sistem WAJIB mendukung theming per jenjang (TK, SD, SMP, SMA) melalui pergantian token, bukan melalui percabangan komponen. Aset gambar, animasi, font, dan berkas media WAJIB dilayani dari storage milik sendiri; hotlink ke domain pihak ketiga DILARANG.

**Pengecualian Tunggal — Video Edukasi Tersemat.** Video edukasi dari platform pihak ketiga (mis. YouTube) BOLEH disematkan sebagai materi penguat, dan HANYA jika seluruh syarat berikut terpenuhi secara kumulatif:

1. **Bukan satu-satunya sumber makna.** Setiap konsep yang disampaikan lewat video tersemat WAJIB juga tersedia dalam aset self-hosted (animasi, ilustrasi, atau teks). Pelajaran WAJIB tetap dapat diselesaikan secara utuh ketika sematan gagal dimuat, diblokir jaringan, atau dihapus penerbitnya.
2. **Muat-atas-permintaan.** Sematan DILARANG dimuat saat halaman dirender. Sebelum pengguna menekan tombol putar, halaman WAJIB menampilkan pratinjau statis yang di-host sendiri dan TIDAK BOLEH melakukan permintaan jaringan apa pun ke domain penyedia.
3. **Mode privasi.** Sematan WAJIB memakai varian tanpa-cookie/privacy-enhanced dari penyedia, dan DILARANG memuat skrip analitik, piksel pelacak, atau iklan bertarget.
4. **Tanpa data pengguna.** Sematan DILARANG menerima identitas, data profil, atau data kemajuan belajar pengguna. Prinsip VII tetap berlaku penuh.
5. **Terdaftar dan tertinjau.** Setiap video tersemat WAJIB tercatat metadatanya (penerbit, judul, URL, tanggal verifikasi, peninjau) dan WAJIB melewati tinjauan kelayakan isi manusia sesuai Prinsip VIII sebelum berstatus `published`.
6. **Sematan, bukan salinan.** Video pihak ketiga WAJIB disajikan melalui pemutar sematan resmi penerbitnya. Mengunduh ulang, menyalin, atau meng-host ulang berkasnya DILARANG.

Pengecualian ini berlaku KHUSUS untuk video edukasi. Ia TIDAK memperluas izin ke gambar, animasi, font, stylesheet, skrip, atau jenis aset lain — seluruhnya tetap WAJIB self-hosted. Setiap penyedia sematan baru di luar YouTube WAJIB melewati amandemen konstitusi tersendiri.

### VII. Perlindungan Data Anak (NON-NEGOTIABLE)
Platform ini melayani pengguna di bawah umur, maka:
- Pemrosesan data pengguna di bawah 18 tahun WAJIB memiliki persetujuan orang tua/wali yang terekam, sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
- Prinsip minimalisasi data: hanya kumpulkan field yang punya justifikasi fungsional tertulis di spec. Data biometrik dan lokasi presisi DILARANG.
- Profil publik siswa (papan peringkat) WAJIB memakai nama tampilan, TIDAK BOLEH menampilkan nama lengkap, sekolah, umur, atau foto asli secara default.
- Fitur komunikasi bebas antar-pengguna DILARANG kecuali melalui spec terpisah dengan moderasi.
- Pelacak, analitik, piksel, dan iklan bertarget pihak ketiga DILARANG pada seluruh halaman yang menghadap anak, termasuk jalur tamu tanpa login. Satu-satunya koneksi pihak ketiga yang diizinkan adalah pemutar video tersemat sesuai pengecualian pada Prinsip VI, dan hanya setelah pengguna secara sengaja menekan putar.
- Endpoint yang mengembalikan data siswa WAJIB memeriksa relasi otorisasi (siswa itu sendiri, orang tua terverifikasi, atau guru pada kelas terkait), bukan sekadar validitas JWT.

### VIII. Integritas Konten Kurikulum
Seluruh materi dan butir soal WAJIB terpetakan ke Kurikulum Merdeka: jenjang, fase, mata pelajaran, capaian pembelajaran. Konten WAJIB melalui status review (draft → review → published); hanya konten berstatus published yang boleh disajikan ke siswa. Bahasa antarmuka default Bahasa Indonesia; seluruh string UI WAJIB melalui layer i18n, tidak boleh literal di komponen.

### IX. Aksesibilitas
Antarmuka WAJIB memenuhi WCAG 2.1 level AA. Target sentuh minimum 44x44px. Seluruh alur inti WAJIB dapat diselesaikan dengan keyboard. Rasio kontras teks minimum 4.5:1.

## Technical Stack & Infrastructure

- **Repository Architecture**: Monorepo with `pnpm` workspace (`apps/web`, `apps/api`, `packages/ui`, `packages/design-tokens`).
- **Frontend Stack**: Next.js (App Router), TypeScript (Strict Mode enabled), Tailwind CSS (Build-time via PostCSS), shadcn/ui. (Tailwind CDN is strictly forbidden).
- **Backend Stack**: Node.js (LTS), TypeScript (Strict Mode enabled), Fastify framework.
- **Database & Persistence**: PostgreSQL with Prisma ORM.
- **Design Tokens & Assets**: `packages/design-tokens` derived from `design/DESIGN.md` providing level-based theming (TK, SD, SMP, SMA). Self-hosted media and asset storage (no third-party hotlinking), with the single narrow exception for click-to-load, privacy-mode educational video embeds defined in Principle VI.
- **Schema Validation**: Zod.
- **Security & Auth**: JWT (JSON Web Tokens), Fastify Rate Limiting, Relational Authorization Checks, UU No. 27/2022 PDP Compliance.
- **Testing Suite**: Vitest with v8/c8 coverage runner.

## Development Workflow & Quality Gates

- **TDD Workflow**: Test first → Fail → Code → Pass → Refactor.
- **Code Coverage Gate**: Minimum 80% coverage enforced on all test runs.
- **Type Checking**: Zero TypeScript compiler (`tsc`) errors allowed in build and CI pipeline.
- **Linting & Formatting**: Strict ESLint & Prettier execution preventing `any` types and unhandled promise rejections.
- **Accessibility Gate**: Interface compliance verified against WCAG 2.1 level AA standards (minimum touch target 44x44px, full keyboard accessibility, 4.5:1 text contrast ratio).
- **Content Review Gate**: Curriculum content strictly gated by review workflow status transition (`draft` → `review` → `published`). Only published content served to students.
- **Embedded Media Gate**: Any lesson containing a third-party video embed MUST prove, before reaching `published`, that: the lesson remains completable with the embed blocked; no network request reaches the provider before an explicit play action; the privacy-mode embed variant is used; no user data is passed to the embed; and the embed is registered with publisher, URL, verification date, and human reviewer. Failing any one of these blocks publication.

## Governance

1. **Supremacy**: This Constitution supersedes all informal conventions, individual preferences, or ad-hoc architectural decisions.
2. **Compliance**: All Pull Requests and commits MUST comply with these principles. Code reviews MUST verify adherence to TDD, Clean Architecture layer separation, 80%+ coverage, Zod validation, JWT auth, rate limiting, accessibility standards, child data protection, curriculum mapping, and design token usage.
3. **Amendments**: Amendments to this document require explicit team review, a documented rationale, and a version increment. Any amendment that grants an exception to an existing prohibition MUST state the exception's scope boundary explicitly and MUST attach compensating obligations; open-ended exceptions are not permitted.
4. **Versioning Policy**:
   - **MAJOR**: Removal or incompatible restructuring of core principles or governance rules.
   - **MINOR**: Addition of new tech stack requirements, expanded quality standards, or architecture principles.
   - **PATCH**: Clarification of wording, typos, or minor formatting adjustments.

**Version**: 1.2.0 | **Ratified**: 2026-08-26 | **Last Amended**: 2026-09-02
