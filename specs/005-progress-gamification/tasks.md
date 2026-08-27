# Tasks: Sistem Progres dan Gamifikasi AksiCendekia

**Feature Branch**: `005-progress-gamification` | **Spec**: [spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/005-progress-gamification/spec.md) | **Plan**: [plan.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/005-progress-gamification/plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inisialisasi struktur modul backend, modul frontend, dan file konfigurasi gamifikasi.

- [ ] T001 Inisialisasi direktori modul backend di `apps/api/src/modules/progress/`
- [ ] T002 Inisialisasi direktori frontend Next.js App Router di `apps/web/app/(student)/mission-map/` dan `apps/web/app/(student)/achievements/`
- [ ] T003 [P] Buat file konfigurasi aturan XP & kurva level eksponensial di `apps/api/src/config/gamification-config.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Skema Prisma, migrasi database, Zod schemas, DTOs, repository layer, dan config service yang WAJIB selesai sebelum implementasi user story.

- [ ] T004 Tambahkan model Prisma `StudentProgress`, `XpTransaction`, `BadgeDefinition`, `StudentBadge`, `StudentPowerup`, `PowerupTransaction`, `StudentLessonProgress`, dan `ProcessedEventLog` serta Enum (`ProgressStatus`, `PowerupType`, `PowerupAction`, `XpSourceType`, `BadgeCategory`) pada `apps/api/prisma/schema.prisma`
- [ ] T005 Jalankan migrasi basis data Prisma `pnpm --filter api prisma migrate dev --name init_progress_gamification`
- [ ] T006 [P] Buat skema validasi Zod `consumePowerupSchema` & `missionMapQuerySchema` pada `apps/api/src/modules/progress/progress.schema.ts`
- [ ] T007 [P] Buat antarmuka DTO `MissionMapNodeDTO`, `AchievementBadgeDTO`, `SubjectProgressSummaryDTO`, dan `StudentAchievementDashboardDTO` pada `apps/api/src/modules/progress/progress.dto.ts`
- [ ] T008 Implementasikan kelas akses data database `ProgressRepository` pada `apps/api/src/modules/progress/progress.repository.ts`
- [ ] T009 Implementasikan layanan pemuat konfigurasi `GamificationConfigService` pada `apps/api/src/modules/progress/gamification-config.service.ts`

**Checkpoint**: Skema database dan fondasi backend siap — pekerjaan user story dapat dimulai.

---

## Phase 3: User Story 1 - Konsumsi Event Sesi Belajar & Perhitungan XP/Level Idempotent (Priority: P1) 🎯 MVP Core

**Goal**: Mesin gamifikasi mengonsumsi event `learning.session.completed` dari Feature 004 secara asynchronous, menghitung perolehan XP dan Kenaikan Level eksponensial ($100 \times L^{1.5}$) secara akurat, dan mencatat log idempotensi agar pemrosesan event ganda tidak menggandakan XP.

**Independent Test**: Pengujian Vitest memverifikasi bahwa pengiriman event `learning.session.completed` 2x dengan `eventId` yang sama hanya menghasilkan 1x transaksi XP di `xp_transactions` dan 0 penambahan XP pada pemrosesan kedua.

### Tests for User Story 1 (TDD - Mandatory)

- [ ] T010 [P] [US1] Buat unit test TDD untuk pemrosesan event outbox & log idempotensi `ProcessedEventLog` pada `apps/api/src/modules/progress/__tests__/gamification-event.test.ts`
- [ ] T011 [P] [US1] Buat unit test TDD untuk kalkulasi XP, transaksi XP, dan kenaikan level eksponensial pada `apps/api/src/modules/progress/__tests__/xp-level.test.ts`

### Implementation for User Story 1

- [ ] T012 [US1] Implementasikan handler pengecekan idempotensi event `EventIdempotencyHandler` pada `apps/api/src/modules/progress/event-idempotency.handler.ts`
- [ ] T013 [US1] Implementasikan metode kalkulasi XP, pencatatan transaksi XP, dan kenaikan level eksponensial pada `apps/api/src/modules/progress/gamification.service.ts`
- [ ] T014 [US1] Daftarkan subscriber event dari outbox Feature 004 ke `GamificationService` pada `apps/api/src/app.ts`

**Checkpoint**: User Story 1 selesai — event diserap secara idempotent, XP dan level siswa terupdate akurat.

---

## Phase 4: User Story 2 - Streak Harian Multi-Timezone & Proteksi Pembeku Waktu (Priority: P1)

**Goal**: Perhitungan streak harian bertambah saat siswa menyelesaikan minimal 1 sesi pada hari kalender lokal siswa (WIB, WITA, WIT). Jika siswa absen 1 hari kalender lokal, token `STREAK_FREEZE` otomatis dikonsumsi untuk mempertahankan streak.

**Independent Test**: Siswa di Jayapura (WIT / UTC+9) menyelesaikan sesi pada 23:30 WIT lalu 00:30 WIT hari berikutnya -> `currentStreak` bertambah 2. Siswa terlewat 1 hari dengan saldo `STREAK_FREEZE` = 1 -> `STREAK_FREEZE` berkurang menjadi 0 dan `currentStreak` tidak reset.

### Tests for User Story 2 (TDD - Mandatory)

- [ ] T015 [P] [US2] Buat unit test TDD untuk konversi zona waktu kalender lokal (WIB, WITA, WIT), evaluasi streak, dan konsumsi otomatis `STREAK_FREEZE` pada `apps/api/src/modules/progress/__tests__/streak-timezone.test.ts`

### Implementation for User Story 2

- [ ] T016 [US2] Implementasikan utilitas konversi timestamp UTC ke tanggal kalender lokal `YYYY-MM-DD` (`Asia/Jakarta`, `Asia/Makassar`, `Asia/Jayapura`) pada `apps/api/src/modules/progress/timezone.util.ts`
- [ ] T017 [US2] Implementasikan logika evaluasi streak harian, proteksi konsumsi otomatis `STREAK_FREEZE`, dan pembuatan string visual terformat `"5 Hari Beruntun!"` pada `apps/api/src/modules/progress/gamification.service.ts`

**Checkpoint**: User Story 2 selesai — streak harian multi-timezone dan proteksi Pembeku Waktu berfungsi 100%.

---

## Phase 5: User Story 3 - Evaluasi Badge Event-Driven & Halaman Pencapaian (Priority: P1)

**Goal**: Evaluasi syarat pencapaian badge berjalan secara *event-driven* seketika event masuk, dan Halaman Pencapaian menyajikan seluruh badge (diperoleh & belum diperoleh), progres mata pelajaran, serta riwayat XP terpaginasi.

**Independent Test**: Menyelesaikan pelajaran ke-10 yang memenuhi badge "Pembelajar Tekun" -> `StudentBadge` baru langsung dibuat. Endpoint `GET /api/v1/students/achievements` mengembalikan badge tersebut dengan `isUnlocked: true`.

### Tests for User Story 3 (TDD - Mandatory)

- [ ] T018 [P] [US3] Buat unit test TDD untuk evaluator badge real-time dan endpoint dashboard pencapaian pada `apps/api/src/modules/progress/__tests__/badge-evaluator.test.ts`

### Implementation for User Story 3

- [ ] T019 [US3] Implementasikan evaluator badge berbasis kondisi (`LESSONS_COMPLETED`, `STREAK_LENGTH`, `ACCURACY_RATE`, `SUBJECT_COMPLETION`) pada `apps/api/src/modules/progress/badge.evaluator.ts`
- [ ] T020 [US3] Implementasikan HTTP Controller & Service endpoint `GET /api/v1/students/achievements` pada `apps/api/src/modules/progress/progress.controller.ts` & `progress.service.ts`
- [ ] T021 [P] [US3] Buat antarmuka UI Halaman Pencapaian Siswa (Grid Badge, Banner Streak, XP Progress Bar, Saldo Powerup) pada `apps/web/app/(student)/achievements/page.tsx`

**Checkpoint**: User Story 3 selesai — badge terevaluasi real-time dan Halaman Pencapaian siswa tampil komprehensif.

---

## Phase 6: User Story 4 - Manajemen Power-Up & Proteksi Akses Konkuren Saldo (Priority: P1)

**Goal**: Saldo power-up (Token Petunjuk & Pembeku Waktu) dikreditkan pada milestone reward dan dikonsumsi via API `POST /api/v1/powerups/consume` dengan pembaruan atomik SQL untuk mencegah saldo negatif.

**Independent Test**: Mengirimkan 10 request bersamaan `POST /api/v1/powerups/consume` saat saldo = 1 -> tepat 1 request berhasil (`200 OK`) dan 9 request ditolak (`400 Bad Request`), dengan saldo akhir di database tepat 0.

### Tests for User Story 4 (TDD - Mandatory)

- [ ] T022 [P] [US4] Buat integration test TDD untuk konsumsi power-up atomik & zero negative balance pada `apps/api/src/modules/progress/__tests__/powerup-concurrency.test.ts`

### Implementation for User Story 4

- [ ] T023 [US4] Implementasikan metode pembaruan atomik saldo power-up (`UPDATE student_powerups SET quantity = quantity - 1 WHERE quantity >= amount`) pada `apps/api/src/modules/progress/progress.repository.ts`
- [ ] T024 [US4] Implementasikan HTTP Controller endpoint `POST /api/v1/powerups/consume` pada `apps/api/src/modules/progress/progress.controller.ts`
- [ ] T025 [US4] Implementasikan pengkreditan milestone rewards (power-up gratis saat kenaikan level & streak milestone) pada `apps/api/src/modules/progress/gamification.service.ts`

**Checkpoint**: User Story 4 selesai — transaksi power-up terproteksi atomik tanpa risiko saldo negatif.

---

## Phase 7: User Story 5 - Pembukaan Pelajaran Berprasyarat & API Peta Misi (Priority: P1)

**Goal**: Pelajaran berprasyarat otomatis berubah menjadi `UNLOCKED` ketika prasyarat terpenuhi, dan API `GET /api/v1/curriculum/subjects/:subjectId/mission-map` mengembalikan graf simpul pelajaran dengan status visual yang valid (`COMPLETED`, `CURRENT`, `UNLOCKED`, `LOCKED`).

**Independent Test**: Menyelesaikan Pelajaran 1 (prasyarat Pelajaran 2) -> Pelajaran 2 otomatis berubah status menjadi `CURRENT`/`UNLOCKED` pada payload API Peta Misi.

### Tests for User Story 5 (TDD - Mandatory)

- [ ] T026 [P] [US5] Buat integration test TDD untuk resolusi status simpul Peta Misi & pembukaan prasyarat pada `apps/api/src/modules/progress/__tests__/mission-map.test.ts`

### Implementation for User Story 5

- [ ] T027 [US5] Implementasikan algoritma pencocokan status simpul Peta Misi (`COMPLETED`, `CURRENT`, `UNLOCKED`, `LOCKED`) pada `apps/api/src/modules/progress/mission-map.resolver.ts`
- [ ] T028 [US5] Implementasikan HTTP Controller endpoint `GET /api/v1/curriculum/subjects/:subjectId/mission-map` pada `apps/api/src/modules/progress/progress.controller.ts`
- [ ] T029 [P] [US5] Buat antarmuka UI Halaman Peta Misi Interaktif dengan node visual taktil (`COMPLETED`, `CURRENT`, `UNLOCKED`, `LOCKED`) pada `apps/web/app/(student)/mission-map/page.tsx`

**Checkpoint**: User Story 5 selesai — Peta Misi terrender interaktif dan alur prasyarat terbuka otomatis.

---

## Phase 8: Polish, Security & Cross-Cutting Concerns

**Purpose**: Penegakan otorisasi relasional, kepatuhan WCAG 2.1 AA, dan verifikasi akhir.

- [ ] T030 [P] Implementasikan penegakan otorisasi relasional (Prinsip VII PDP Compliance - siswa bersangkutan / orang tua / guru kelas) pada `apps/api/src/modules/progress/progress.controller.ts`
- [ ] T031 [P] Verifikasi aksesibilitas WCAG 2.1 AA (target sentuh 44x44px, navigasi keyboard penuh, kontras 4.5:1) pada `apps/web/app/(student)/achievements/page.tsx` dan `mission-map/page.tsx`
- [ ] T032 Jalankan suite pengujian Vitest `pnpm --filter api test -- progress-gamification` dan pastikan coverage >= 80%
- [ ] T033 Jalankan verifikasi manual panduan `quickstart.md` end-to-end.
