# Tasks: Mesin Sesi Belajar AksiCendekia — Inti Produk

**Feature Branch**: `004-learning-session-engine` | **Spec**: [specs/004-learning-session-engine/spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/004-learning-session-engine/spec.md) | **Plan**: [specs/004-learning-session-engine/plan.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/004-learning-session-engine/plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inisialisasi struktur file dan modul sesi belajar pada monorepo `apps/api` dan `apps/web`.

- [x] T001 Inisialisasi direktori modul backend di `apps/api/src/modules/session/`
- [x] T002 Inisialisasi direktori frontend Next.js App Router di `apps/web/app/(student)/session/`
- [x] T003 [P] Konfigurasi eksekusi pengujian modul sesi pada `apps/api/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Skema basis data Prisma, migrasi database, skema Zod, repository dasar, dan pembantu Outbox Event yang WAJIB selesai sebelum implementasi user story.

- [x] T004 Tambahkan model Prisma `LearningSession`, `SessionQuestionOrder`, `SessionAnswer`, dan `OutboxEvent` serta enum `SessionStatus` pada `apps/api/prisma/schema.prisma`
- [x] T005 Jalankan migrasi basis data Prisma `pnpm --filter api prisma migrate dev --name add_learning_session_engine`
- [x] T006 [P] Buat skema validasi Zod `createSessionSchema`, `submitAnswerSchema`, dan `getHintSchema` pada `apps/api/src/modules/session/session.schema.ts`
- [x] T007 [P] Buat antarmuka DTO terisolasi `ClientQuestionDTO` dan `AnswerEvaluationResultDTO` pada `apps/api/src/modules/session/session.dto.ts`
- [x] T008 Implementasikan pembantu transaksi Outbox Event `OutboxPublisher` pada `apps/api/src/common/events/outbox-publisher.ts`
- [x] T009 Implementasikan akses data database `SessionRepository` pada `apps/api/src/modules/session/session.repository.ts`

**Checkpoint**: Skema database dan fondasi backend siap — pekerjaan user story dapat dimulai.

---

## Phase 3: User Story 1 - Inisialisasi Sesi Belajar & Penyajian Soal Sekuensial Aman (Priority: P1) 🎯 MVP Core

**Goal**: Siswa dapat memilih pelajaran yang terbuka dan memulai sesi belajar, di mana server menyusun urutan butir soal dan menyajikannya satu per satu secara sekuensial dengan jaminan Zero Key Answer Leakage (kunci jawaban & pembahasan di-strip dari DTO).

**Independent Test**: Pengujian Vitest memverifikasi bahwa endpoint `POST /api/v1/sessions` dan `GET /api/v1/sessions/:id` mengembalikan `ClientQuestionDTO` yang **TIDAK MEMUAT** `correct_option_id`, `accepted_answers`, `matching_pairs`, atau `explanation`.

### Tests for User Story 1 (TDD - Mandatory)

- [x] T010 [P] [US1] Buat unit test TDD untuk inisialisasi sesi & Zero Key Answer Leakage pada `apps/api/src/modules/session/__tests__/session-init.test.ts`

### Implementation for User Story 1

- [x] T011 [US1] Implementasikan fungsi pemetaan DTO `toClientQuestionDTO` (stripping answer keys & explanations) pada `apps/api/src/modules/session/session.dto.ts`
- [x] T012 [US1] Implementasikan fungsi `createSession` dan `getActiveQuestion` pada `apps/api/src/modules/session/session.service.ts`
- [x] T013 [US1] Implementasikan HTTP Controller endpoint `POST /api/v1/sessions` dan `GET /api/v1/sessions/:id` pada `apps/api/src/modules/session/session.controller.ts`
- [x] T014 [US1] Daftarkan rute Fastify sesi belajar pada `apps/api/src/app.ts`
- [x] T015 [P] [US1] Buat antarmuka UI komponen penyaji soal sekuensial pada `apps/web/app/(student)/session/[id]/page.tsx`

**Checkpoint**: User Story 1 berfungsi penuh — sesi belajar dapat diinisialisasi dan soal disajikan secara aman tanpa kebocoran kunci jawaban.

---

## Phase 4: User Story 2 - Penilaian Server, Tolerance Matching Isian Singkat, & Feedback Visual Taktil (Priority: P1)

**Goal**: Jawaban siswa dinilai 100% di backend (termasuk pencocokan `NORMALIZED` untuk Isian Singkat), memberikan umpan balik instan + pembahasan, petunjuk bertingkat, serta UI taktil ("depress" button, Emerald `#00855b` untuk jawaban benar).

**Independent Test**: Submisi jawaban `"  pancasila  "` untuk kunci `"Pancasila"` mode `NORMALIZED` mengembalikan `is_correct: true` beserta pembahasan. Tombol UI memperlihatkan efek visual taktil.

### Tests for User Story 2 (TDD - Mandatory)

- [x] T016 [P] [US2] Buat unit test TDD untuk algoritma penilaian `MULTIPLE_CHOICE`, `SHORT_ANSWER` (mode `EXACT`, `CASE_INSENSITIVE`, `NORMALIZED`), dan `MATCHING_PAIRS` pada `apps/api/src/modules/session/__tests__/session-grading.test.ts`
- [x] T017 [P] [US2] Buat unit test TDD untuk endpoint submisi jawaban & idempotency pada `apps/api/src/modules/session/__tests__/session-answer.test.ts`

### Implementation for User Story 2

- [x] T018 [US2] Implementasikan fungsi normalisasi teks `normalizeAnswerText` dan penilai butir soal `gradeQuestion` pada `apps/api/src/modules/session/session-grader.ts`
- [x] T019 [US2] Implementasikan metode `submitAnswer` dengan penegakan `Idempotency-Key` pada `apps/api/src/modules/session/session.service.ts`
- [x] T020 [US2] Implementasikan metode `getHint` untuk petunjuk bertingkat pada `apps/api/src/modules/session/session.service.ts`
- [x] T021 [US2] Implementasikan HTTP Controller endpoint `POST /api/v1/sessions/:id/answers` dan `POST /api/v1/sessions/:id/hints` pada `apps/api/src/modules/session/session.controller.ts`
- [x] T022 [P] [US2] Buat komponen tombol pilihan jawaban taktil (`TactileOptionButton`) dengan efek "depress" dan highlight warna Emerald/Rose pada `packages/ui/src/components/tactile-option-button.tsx`
- [x] T023 [US2] Hubungkan submisi jawaban & petunjuk bertingkat pada UI sesi belajar di `apps/web/app/(student)/session/[id]/page.tsx`

**Checkpoint**: User Story 2 selesai — penilaian server, toleransi isian singkat, dan feedback taktil berjalan lancar.

---

## Phase 5: User Story 4 - Layar Hasil Belajar & Anti-Double Completion Guard (Priority: P1)

**Goal**: Menyelesaikan sesi (`COMPLETED`), menampilkan ringkasan skor (0-100%), jumlah benar/salah, total durasi pengerjaan, ulasan soal salah, tombol "Ulangi" & "Lanjut", serta penegakan idempotensi penyelesaian ganda.

**Independent Test**: Endpoint `POST /api/v1/sessions/:id/complete` menghitung skor persentase secara akurat dan memanggilnya ulang bersifat idempotent tanpa mengubah skor atau menerbitkan event ganda.

### Tests for User Story 4 (TDD - Mandatory)

- [x] T024 [P] [US4] Buat unit test TDD untuk penyelesaian sesi & double completion guard pada `apps/api/src/modules/session/__tests__/session-complete.test.ts`

### Implementation for User Story 4

- [x] T025 [US4] Implementasikan metode `completeSession` dengan kalkulasi persentase skor dan idempotent guard pada `apps/api/src/modules/session/session.service.ts`
- [x] T026 [US4] Implementasikan HTTP Controller endpoint `POST /api/v1/sessions/:id/complete` pada `apps/api/src/modules/session/session.controller.ts`
- [x] T027 [P] [US4] Buat halaman Layar Hasil Belajar (`SessionSummaryView`) dengan skor, ringkasan salah, dan aksi Ulangi/Lanjut pada `apps/web/app/(student)/session/[id]/summary/page.tsx`

**Checkpoint**: User Story 4 selesai — layar hasil belajar dan perlindungan penyelesaian ganda terverifikasi.

---

## Phase 6: User Story 5 - Transactional Outbox Event Publisher (Priority: P1)

**Goal**: Backend menerbitkan 4 Domain Events terstruktur (`started`, `question_answered`, `completed`, `expired`) ke tabel `outbox_events` via Transactional Outbox Pattern untuk dikonsumsi Feature 005.

**Independent Test**: Memverifikasi bahwa setiap aksi (buat sesi, jawab, selesai, expired) menulis record JSON ke tabel `outbox_events` dalam satu transaksi Prisma atomik.

### Tests for User Story 5 (TDD - Mandatory)

- [x] T028 [P] [US5] Buat unit test TDD untuk penulisan Domain Events ke tabel Outbox pada `apps/api/src/modules/session/__tests__/session-events.test.ts`

### Implementation for User Story 5

- [x] T029 [US5] Integrasikan penerbitan event `learning.session.started`, `learning.session.question_answered`, `learning.session.completed`, dan `learning.session.expired` pada `apps/api/src/modules/session/session.service.ts`

**Checkpoint**: User Story 5 selesai — seluruh event terstruktur ditulis dengan aman ke Outbox.

---

## Phase 7: User Story 3 - Jeda Sesi, Lanjutkan, & Auto-Expire 24 Jam (Priority: P2)

**Goal**: Siswa dapat menjeda (`PAUSED`) dan melanjutkan (`IN_PROGRESS`) sesi belajar. Sesi tanpa aktivitas > 24 jam otomatis kedaluwarsa (`EXPIRED`) via lazy check & background cleanup job.

**Independent Test**: Endpoint `pause` dan `resume` mengubah status sesi. Sesi dengan timestamp `expiresAt` di masa lalu ditolak dengan HTTP 409 Conflict dan status berubah menjadi `EXPIRED`.

### Tests for User Story 3 (TDD - Mandatory)

- [x] T030 [P] [US3] Buat unit test TDD untuk pause/resume dan 24h auto-expire pada `apps/api/src/modules/session/__tests__/session-lifecycle.test.ts`

### Implementation for User Story 3

- [x] T031 [US3] Implementasikan metode `pauseSession` dan `resumeSession` pada `apps/api/src/modules/session/session.service.ts`
- [x] T032 [US3] Implementasikan penanganan lazy check `checkSessionExpiration` dan tugas pembersihan latar belakang (*background cleanup cron*) pada `apps/api/src/modules/session/session-expiration.job.ts`
- [x] T033 [US3] Implementasikan HTTP Controller endpoint `POST /api/v1/sessions/:id/pause` dan `POST /api/v1/sessions/:id/resume` pada `apps/api/src/modules/session/session.controller.ts`
- [x] T034 [P] [US3] Tambahkan tombol "Jeda" dan dialog konfirmasi pada UI sesi belajar di `apps/web/app/(student)/session/[id]/page.tsx`

**Checkpoint**: User Story 3 selesai — siklus pause, resume, dan kedaluwarsa 24 jam teruji.

---

## Phase 8: User Story 6 - Pembacaan Riwayat Sesi Belajar Siswa (Priority: P2)

**Goal**: Siswa dapat melihat daftar riwayat sesi belajar terdahulu beserta rincian skor dan ulasan jawaban.

**Independent Test**: Endpoint `GET /api/v1/students/me/sessions` mengembalikan daftar paginasi sesi belajar siswa (status `COMPLETED` dan `EXPIRED`).

### Tests for User Story 6 (TDD - Mandatory)

- [x] T035 [P] [US6] Buat unit test TDD untuk API riwayat sesi belajar pada `apps/api/src/modules/session/__tests__/session-history.test.ts`

### Implementation for User Story 6

- [x] T036 [US6] Implementasikan metode `getStudentSessionHistory` dan `getSessionHistoryDetail` pada `apps/api/src/modules/session/session.service.ts`
- [x] T037 [US6] Implementasikan HTTP Controller endpoint `GET /api/v1/students/me/sessions` dan `GET /api/v1/sessions/:id/history` pada `apps/api/src/modules/session/session.controller.ts`
- [x] T038 [P] [US6] Buat antarmuka UI Riwayat Sesi Belajar Siswa pada `apps/web/app/(student)/session/history/page.tsx`

**Checkpoint**: User Story 6 selesai — riwayat sesi belajar siswa dapat dibaca ulang.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Verifikasi akhir coverage test backend (>= 80%), typecheck monorepo, audit aksesibilitas, dan pengujian skenario quickstart.

- [x] T039 Jalankan pengujian cakupan kode backend `pnpm --filter api test:coverage` dan pastikan coverage >= 80%
- [x] T040 [P] Jalankan pemeriksaan tipe TypeScript monorepo `pnpm check` dan pastikan zero compiler errors
- [x] T041 Evaluasi kepatuhan antarmuka UI terhadap WCAG 2.1 AA (target sentuh 44x44px & kontras teks 4.5:1)
- [x] T042 Jalankan skenario verifikasi manual pada `specs/004-learning-session-engine/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Tanpa dependensi — dapat dimulai langsung.
- **Foundational (Phase 2)**: Bergantung pada Setup — **MENJADI PRASYARAT (BLOCKING)** untuk seluruh User Story.
- **User Stories (Phase 3–8)**: Semuanya bergantung pada selesainya Phase 2 (Foundational).
  - Urutan Pilihan: **Phase 3 (US1)** ➔ **Phase 4 (US2)** ➔ **Phase 5 (US4)** ➔ **Phase 6 (US5)** ➔ **Phase 7 (US3)** ➔ **Phase 8 (US6)**.
- **Polish (Phase 9)**: Bergantung pada selesainya seluruh User Story.

---

## Parallel Opportunities

```bash
# Pengujian TDD & Model DTO/Zod (Phase 2):
Task T006: Zod Schemas di apps/api/src/modules/session/session.schema.ts
Task T007: DTOs di apps/api/src/modules/session/session.dto.ts

# Komponen UI Frontend (Dapat dikerjakan bersamaan dengan backend):
Task T015 [US1]: UI Penyaji Soal di apps/web/app/(student)/session/[id]/page.tsx
Task T022 [US2]: TactileOptionButton di packages/ui/src/components/tactile-option-button.tsx
Task T027 [US4]: SessionSummaryView di apps/web/app/(student)/session/[id]/summary/page.tsx
Task T038 [US6]: UI Riwayat Belajar di apps/web/app/(student)/session/history/page.tsx
```

---

## Implementation Strategy

### MVP First Scope
1. Complete **Phase 1: Setup** & **Phase 2: Foundational**.
2. Complete **Phase 3: User Story 1** (Inisialisasi Sesi & Penyajian Soal).
3. Complete **Phase 4: User Story 2** (Penilaian Server & Feedback Taktil).
4. Complete **Phase 5: User Story 4** (Layar Hasil Belajar).
5. **STOP and VALIDATE**: Jalankan skenario `quickstart.md` untuk menguji MVP Sesi Belajar.
