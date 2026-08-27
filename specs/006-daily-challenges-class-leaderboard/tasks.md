# Implementation Tasks: Tantangan Harian dan Papan Peringkat Kelas AksiCendekia

**Feature Branch**: `006-daily-challenges-class-leaderboard`
**Spec**: [spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/006-daily-challenges-class-leaderboard/spec.md)
**Plan**: [plan.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/006-daily-challenges-class-leaderboard/plan.md)

---

## Phase 1: Database Migration & Schema Setup

- [x] **T-001**: Perbarui `apps/api/prisma/schema.prisma` dengan menambahkan model `DailyChallenge`, `StudentDailyChallenge`, dan `StudentPrivacySetting` serta enum `ChallengeTargetType` dan `ChallengeStatus`.
- [x] **T-002**: Jalankan `pnpm --filter api exec prisma migrate dev --name add_daily_challenges_and_privacy_settings` untuk membuat migrasi database PostgreSQL.

---

## Phase 2: Backend Daily Challenge Module (TDD)

- [x] **T-003**: Buat Zod Schema `daily-challenge.schema.ts` di `apps/api/src/modules/daily-challenge/` untuk validasi HTTP request & response payload.
- [x] **T-004**: Tulis unit & integration test `daily-challenge.test.ts` (Vitest) mencakup:
  - Generator 1 tantangan per jenjang (`TK`, `SD`, `SMP`, `SMA`) dari soal berstatus `PUBLISHED`.
  - Pelacakan progres Tantangan Harian.
  - Transaksi klaim atomik (klaim pertama sukses, klaim kedua gagal 400 `REWARD_ALREADY_CLAIMED`).
- [x] **T-005**: Buat `daily-challenge.repository.ts` untuk interaksi Prisma database.
- [x] **T-006**: Buat `daily-challenge.service.ts` berisi logika bisnis generator tantangan harian, pelacakan progres, dan pemrosesan klaim atomik.
- [x] **T-007**: Buat `daily-challenge.controller.ts` dan registrasikan Fastify routes `GET /api/v1/daily-challenges/today` dan `POST /api/v1/daily-challenges/:id/claim`.

---

## Phase 3: Backend Class Leaderboard & Privacy Module (TDD)

- [x] **T-008**: Buat Zod Schema `leaderboard.schema.ts` di `apps/api/src/modules/leaderboard/`.
- [x] **T-009**: Tulis unit & integration test `class-leaderboard.test.ts` dan `privacy-setting.test.ts` (Vitest) mencakup:
  - Aggregasi XP mingguan Top 10 + Pinned current student rank.
  - Penapisan data sensitif (memastikan 0% kebocoran nama lengkap, sekolah, umur, atau foto asli).
  - Penapisan siswa tersembunyi (`is_hidden_from_leaderboard = true`) dari API siswa lain.
  - Penolakan 403 Forbidden ketika siswa mengubah privasi saat Parental Lock aktif.
- [x] **T-010**: Buat `leaderboard.repository.ts` yang mengeksekusi query agregasi XP mingguan khusus kelas siswa.
- [x] **T-011**: Buat `leaderboard.service.ts` yang memproses anonimisasi profil siswa, penapisan opt-out, dan verifikasi Parental Lock.
- [x] **T-012**: Buat `leaderboard.controller.ts` dan registrasikan Fastify routes:
  - `GET /api/v1/classes/:classId/leaderboard`
  - `GET /api/v1/students/me/privacy`
  - `PATCH /api/v1/students/me/privacy`
  - `PATCH /api/v1/parents/students/:studentId/privacy-lock`

---

## Phase 4: Frontend UI Integration & Accessibility

- [x] **T-013**: Buat komponen Tantangan Harian & Papan Peringkat Kelas pada `apps/web/app/(student)/leaderboard/page.tsx` menggunakan `@aksicendekia/ui` dan `@aksicendekia/design-tokens`.
- [x] **T-014**: Hubungkan frontend ke REST API backend (`/api/v1/daily-challenges/today` dan `/api/v1/classes/:classId/leaderboard`).
- [x] **T-015**: Tambahkan toggle pengaturan privasi visibilitas papan peringkat dan modal indikator Parental Lock.
- [x] **T-016**: Verifikasi aksesibilitas WCAG 2.1 Level AA (target sentuh 44x44px, navigasi keyboard penuh, kontras warna 4.5:1).

---

## Phase 5: Verification & End-to-End Validation

- [x] **T-017**: Jalankan seluruh test suite `pnpm --filter api test` dan pastikan coverage $\ge 80\%$ tanpa TypeScript errors.
- [x] **T-018**: Lakukan verifikasi manual skenario edge case (double claim attempt, parental lock enforcement, opt-out visibility filtering).
