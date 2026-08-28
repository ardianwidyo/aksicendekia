# Tasks: Akses Mode Tamu Tanpa Login & Penyimpanan Progres Belajar Lokal

**Feature Branch**: `009-guest-mode-local-storage` | **Spec**: [specs/009-guest-mode-local-storage/spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/009-guest-mode-local-storage/spec.md) | **Plan**: [specs/009-guest-mode-local-storage/plan.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/009-guest-mode-local-storage/plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inisialisasi direktori modul baru dan struktur dasar file untuk seluruh lapisan yang akan dibangun.

- [x] T001 Inisialisasi direktori storage adapter di `apps/web/lib/storage/` dan `apps/web/lib/gamification/`
- [x] T002 Inisialisasi direktori context di `apps/web/lib/context/`
- [x] T003 [P] Inisialisasi direktori modul sync backend di `apps/api/src/modules/sync/`
- [x] T004 [P] Inisialisasi direktori komponen Guest di `packages/ui/src/components/guest/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Skema Zod untuk `GuestProgressState`, interface storage, konfigurasi endpoint publik backend, dan penanda i18n yang WAJIB selesai sebelum implementasi user story manapun dapat dimulai.

**⚠️ CRITICAL**: Tidak ada user story yang bisa dimulai sampai Phase 2 selesai.

- [x] T005 Buat skema Zod lengkap `GuestProgressStateSchema`, `GuestSessionRecordSchema`, `GuestProfileSchema`, `GuestGamificationSchema`, `GuestStreakSchema`, dan `GuestCurriculumProgressSchema` di `apps/web/lib/gamification/guest-progress.schema.ts`
- [x] T006 [P] Buat skema Zod `GuestSyncRequestSchema` dan `GuestSyncResponseSchema` di `apps/api/src/modules/sync/guest-sync.schema.ts`
- [x] T007 Definisikan interface `IProgressStorageRepository` lengkap di `apps/web/lib/storage/progress-storage.interface.ts`
- [x] T008 [P] Konfigurasi Fastify plugin route publik (tanpa JWT preHandler) di `apps/api/src/routes/public.routes.ts` — prefix `/api/v1/public/**`
- [x] T009 [P] Tambahkan key-value teks Mode Tamu ke kamus i18n Bahasa Indonesia di `packages/ui/src/locales/id.json` (kunci: `guest.banner.title`, `guest.banner.cta`, `guest.sync.dialog.title`, `guest.sync.dialog.confirm`, `guest.reset.dialog.title`, `guest.reset.dialog.confirm`, `guest.feature_gate.title`, `guest.feature_gate.cta`, `guest.profile.edit_title`, `guest.onboarding.explore_prompt`, `guest.incognito.warning`)

**Checkpoint**: Fondasi skema, interface, dan rute publik siap — user story dapat dimulai.

---

## Phase 3: User Story 1 — Akses Belajar Instan Tanpa Login (Priority: P1) 🎯 MVP

**Goal**: Pengguna dapat membuka `http://localhost:3000/`, menekan "Mulai Belajar Langsung", mengakses halaman `/explore`, memilih konten kurikulum, dan mengerjakan soal — semua tanpa login.

**Independent Test**: Buka browser fresh (tanpa cookie JWT), akses `/`, klik "Mulai Belajar Langsung", pilih mata pelajaran, selesaikan satu sesi — verifikasi tidak ada redirect ke `/login` di seluruh alur.

### Tests untuk User Story 1 (TDD — Wajib)

- [x] T010 [P] [US1] Buat unit test TDD untuk endpoint publik konten (`GET /api/v1/public/lessons/:id`, `GET /api/v1/public/exercises/:id` mengembalikan payload dengan kunci jawaban) di `apps/api/src/modules/sync/__tests__/public-content.test.ts`
- [x] T011 [P] [US1] Buat test navigasi bahwa rute `/explore` dapat dirender tanpa sesi JWT di `apps/web/lib/storage/__tests__/guest-mode-routing.test.ts`

### Implementasi Backend — Endpoint Konten Publik

- [x] T012 [US1] Implementasikan handler Fastify `GET /api/v1/public/lessons/:id` yang mengembalikan detail pelajaran (termasuk daftar `exercises_ids`) tanpa auth di `apps/api/src/modules/sync/public-content.controller.ts`
- [x] T013 [US1] Implementasikan handler Fastify `GET /api/v1/public/exercises/:id` yang mengembalikan soal termasuk field kunci jawaban (`accepted_answers`, `correct_option_id`) tanpa auth di `apps/api/src/modules/sync/public-content.controller.ts`
- [x] T014 [US1] Daftarkan kedua endpoint publik ke plugin route publik di `apps/api/src/app.ts`

### Implementasi Frontend — Beranda & Halaman Eksplorasi

- [x] T015 [US1] Buat halaman root `app/page.tsx` dengan dua tombol: *"Mulai Belajar Langsung"* (→ `/explore`) dan *"Masuk ke Akun"* (→ `/login`) menggunakan komponen dari `packages/ui`
- [x] T016 [US1] Buat halaman eksplorasi materi `apps/web/app/explore/page.tsx` dengan filter jenjang (TK/SD/SMP/SMA) dan daftar mata pelajaran tanpa proteksi JWT
- [x] T017 [P] [US1] Buat halaman detail pelajaran `apps/web/app/explore/[lessonId]/page.tsx` yang memanggil endpoint publik dan menampilkan daftar latihan soal tersedia

**Checkpoint**: User Story 1 berfungsi penuh — pengguna dapat menjelajah seluruh konten kurikulum tanpa login.

---

## Phase 4: User Story 2 — Penyimpanan & Pelacakan Progres Belajar Lokal (Priority: P1)

**Goal**: Capaian belajar (XP, streak, modul selesai, riwayat sesi) tersimpan persisten di IndexedDB/LocalStorage perangkat dan tidak hilang setelah browser ditutup/refresh.

**Independent Test**: Selesaikan satu sesi latihan → tutup browser → buka kembali → verifikasi XP, status modul selesai, dan streak harian masih tersimpan dengan benar.

### Tests untuk User Story 2 (TDD — Wajib)

- [x] T018 [P] [US2] Buat unit test TDD untuk `IndexedDBProgressAdapter.getState()`, `saveState()`, dan `recordCompletedSession()` di `apps/web/lib/storage/__tests__/indexeddb-adapter.spec.ts`
- [x] T019 [P] [US2] Buat unit test TDD untuk `LocalStorageProgressAdapter` (fallback) di `apps/web/lib/storage/__tests__/localstorage-adapter.spec.ts`
- [x] T020 [P] [US2] Buat unit test TDD untuk `LocalSessionEngine` — menguji perhitungan XP per tipe soal, normalisasi isian singkat, dan update streak harian di `apps/web/lib/gamification/__tests__/local-session-engine.spec.ts`
- [x] T021 [P] [US2] Buat unit test TDD untuk deserialisasi & validasi Zod `GuestProgressStateSchema` — menguji schema version mismatch, data null, dan corrupt JSON di `apps/web/lib/gamification/__tests__/guest-progress-schema.spec.ts`

### Implementasi Storage Layer

- [x] T022 [US2] Implementasikan `IndexedDBProgressAdapter` mengimplementasikan interface `IProgressStorageRepository` dengan IndexedDB native di `apps/web/lib/storage/indexeddb-progress.adapter.ts`
- [x] T023 [US2] Implementasikan `LocalStorageProgressAdapter` sebagai fallback dengan serialisasi JSON di `apps/web/lib/storage/localstorage-progress.adapter.ts`
- [x] T024 [US2] Implementasikan `StorageManager` — factory singleton yang mendeteksi ketersediaan IndexedDB dan otomatis menyediakan adapter yang tepat, serta mengimplementasikan LRU pruning sesi > 30 hari saat kuota hampir penuh di `apps/web/lib/storage/storage-manager.ts`

### Implementasi Local Gamification Engine

- [x] T025 [US2] Implementasikan `LocalSessionEngine` di `apps/web/lib/gamification/local-session-engine.ts`:
  - Fungsi `evaluateAnswer(question, userAnswer)` — menilai pilihan ganda dan isian singkat dengan normalisasi teks
  - Fungsi `calculateXp(result)` — menghitung XP berdasarkan kebenaran jawaban dan jenjang
  - Fungsi `updateStreak(currentState)` — menghitung streak harian berdasarkan `last_activity_date` vs `today`
  - Fungsi `processCompletedSession(state, sessionResult)` — mengembalikan state baru yang sudah diperbarui
- [x] T026 [US2] Implementasikan `GuestProgressContext` — React Context Provider yang membungkus `StorageManager` dan mengekspos state progres + dispatcher action di `apps/web/lib/context/guest-progress-context.tsx`
- [x] T027 [US2] Pasang `GuestProgressContext.Provider` di root layout `apps/web/app/layout.tsx`

### Implementasi UI Sesi Belajar Lokal

- [x] T028 [US2] Buat halaman sesi latihan mode tamu `apps/web/app/explore/[lessonId]/session/page.tsx`:
  - Mengambil soal dari endpoint publik
  - Mengirimkan jawaban ke `LocalSessionEngine` (bukan ke backend)
  - Menampilkan umpan balik instan (benar/salah + kunci jawaban) setelah tiap jawaban
  - Menyimpan state sesi yang belum selesai ke storage lokal (resume support)
- [x] T029 [P] [US2] Buat komponen layar hasil sesi lokal `apps/web/app/explore/[lessonId]/session/summary/page.tsx` — menampilkan skor, XP yang diperoleh, dan memperbarui state progres lokal setelah sesi selesai
- [x] T030 [P] [US2] Buat komponen `GuestProgressDashboard` yang menampilkan total XP, level, streak hari ini, dan daftar modul selesai, dapat diakses dari `/explore` di `apps/web/components/guest/guest-progress-dashboard.tsx`

**Checkpoint**: User Story 2 berfungsi penuh — data progres tersimpan persisten dan dapat dipulihkan setelah browser ditutup.

---

## Phase 5: User Story 3 — Personalisasi Profil Lokal Ramah Anak (Priority: P2)

**Goal**: Siswa Mode Tamu dapat memilih nama panggilan samaran dan avatar preset yang tersimpan lokal dan muncul kembali saat aplikasi dibuka ulang.

**Independent Test**: Pilih avatar "Kancil Pintar" dan ketik nama "Budi" → refresh browser → verifikasi nama dan avatar muncul di header.

### Tests untuk User Story 3 (TDD — Wajib)

- [x] T031 [P] [US3] Buat unit test untuk `StorageManager.updateProfile()` — memastikan pembaruan profil mempersistensikan data ke storage lokal di `apps/web/lib/storage/__tests__/storage-manager.spec.ts`
- [x] T032 [P] [US3] Buat component test untuk `GuestProfileModal` — memastikan input nama dan pilihan avatar menyimpan state dan menutup modal di `apps/web/lib/storage/__tests__/guest-modals.spec.ts`

### Implementasi

- [x] T033 [US3] Buat komponen `GuestProfileModal` (modal edit profil: input nama panggilan + grid pilihan avatar preset) di `packages/ui/src/components/guest/guest-profile-modal.tsx`
- [x] T034 [P] [US3] Buat komponen `GuestHeaderBanner` (banner non-intrusif di nav bar bertuliskan "Mode Tamu" + tombol "Simpan Progres" + tombol avatar membuka modal profil) di `packages/ui/src/components/guest/guest-header-banner.tsx`
- [x] T035 [US3] Pasang `GuestHeaderBanner` ke layout aplikasi publik di `apps/web/app/explore/layout.tsx`

**Checkpoint**: User Story 3 berfungsi penuh — profil lokal tersimpan dan tampil kembali setelah browser di-refresh.

---

## Phase 6: User Story 4 — Migrasi Progres Lokal ke Akun Terdaftar (Priority: P2)

**Goal**: Ketika pengguna tamu mendaftar atau login, progres lokal yang dikumpulkan dapat dipindahkan ke akun cloud dengan persetujuan pengguna.

**Independent Test**: Kumpulkan 200 XP di Mode Tamu → daftar akun baru → konfirmasi dialog migrasi → verifikasi profil cloud memiliki 200 XP dan storage lokal bersih.

### Tests untuk User Story 4 (TDD — Wajib)

- [x] T036 [P] [US4] Buat unit test TDD untuk `GuestSyncService` — menguji strategi merge XP (delta sum), union set modul selesai, batas sanity check (cap 10.000 XP), dan penolakan payload melebihi batas di `apps/api/src/modules/sync/__tests__/guest-sync.service.spec.ts`
- [x] T037 [P] [US4] Buat unit test TDD untuk `POST /api/v1/sync/guest-progress` — menguji validasi Zod, autentikasi JWT wajib (endpoint ini butuh akun), dan respons sukses di `apps/api/src/modules/sync/__tests__/guest-sync.controller.spec.ts`
- [x] T038 [P] [US4] Buat component test untuk `GuestSyncModal` — menguji rendering opsi konfirmasi, pemanggilan `onConfirm`, dan opsi "Lewati" di `apps/web/lib/storage/__tests__/guest-modals.spec.ts`

### Implementasi Backend Sync

- [x] T039 [US4] Implementasikan `GuestSyncRepository` (Prisma: merge ke `StudentProfile.xp`, upsert `LessonProgress`, insert `LearningSession` dengan metadata `source: "GUEST_MIGRATION"`) di `apps/api/src/modules/sync/guest-sync.repository.ts`
- [x] T040 [US4] Implementasikan `GuestSyncService` dengan strategi merge: XP delta sum + cap 10.000, modul/pelajaran Set Union, badge intersection (hanya badge yang valid di Feature 005 yang diterima) di `apps/api/src/modules/sync/guest-sync.service.ts`
- [x] T041 [US4] Implementasikan handler Fastify `POST /api/v1/sync/guest-progress` (PROTECTED — membutuhkan JWT siswa aktif, bukan rute publik) di `apps/api/src/modules/sync/guest-sync.controller.ts`
- [x] T042 [US4] Daftarkan rute sync ke router terproteksi di `apps/api/src/app.ts`

### Implementasi Frontend Migrasi

- [x] T043 [US4] Buat komponen `GuestSyncModal` (dialog konfirmasi: "Simpan progres belajarmu ke akun barumu?" dengan tombol Konfirmasi dan Lewati) di `packages/ui/src/components/guest/guest-sync-modal.tsx`
- [x] T044 [US4] Modifikasi alur registrasi `/register` di `apps/web/app/auth/register/page.tsx` — setelah berhasil daftar, periksa keberadaan `GuestProgressState` lokal, tampilkan `GuestSyncModal` jika ada data, panggil endpoint sync jika dikonfirmasi
- [x] T045 [US4] Modifikasi alur login `/login` di `apps/web/app/(auth)/login/page.tsx` — deteksi dan tawarkan migrasi setelah login berhasil
- [x] T046 [P] [US4] Implementasikan fungsi `clearState()` di `StorageManager` — menghapus data riwayat sesi dari storage di `apps/web/lib/storage/storage-manager.ts`

**Checkpoint**: User Story 4 berfungsi penuh — migrasi progres berhasil dari lokal ke cloud dengan opsi konfirmasi.

---

## Phase 7: User Story 5 — Manajemen & Reset Data Lokal Perangkat Bersama (Priority: P3)

**Goal**: Pengguna dapat menghapus semua data progres lokal tamu melalui menu pengaturan dengan dialog konfirmasi, sehingga pengguna berikutnya pada perangkat yang sama bisa memulai dari awal.

**Independent Test**: Buka "Pengaturan Lokal" → tekan "Reset Progres Lokal" → konfirmasi → verifikasi semua XP kembali ke 0 dan storage lokal kosong.

### Tests untuk User Story 5 (TDD — Wajib)

- [x] T047 [P] [US5] Buat unit test untuk `StorageManager.clearState()` — memastikan semua kunci storage lokal dihapus dan state diinisialisasi ulang ke nilai default di `apps/web/lib/storage/__tests__/storage-manager.spec.ts`
- [x] T048 [P] [US5] Buat component test untuk `GuestResetModal` — memastikan dialog konfirmasi muncul, tombol konfirmasi memanggil `onConfirm`, dan tombol batal menutup modal di `apps/web/lib/storage/__tests__/guest-modals.spec.ts`

### Implementasi

- [x] T049 [US5] Buat komponen `GuestResetModal` (dialog konfirmasi destruktif: "Reset Progres Lokal? Tindakan ini tidak bisa dibatalkan." dengan tombol merah "Ya, Hapus Semua" dan tombol "Batal") di `packages/ui/src/components/guest/guest-reset-modal.tsx`
- [x] T050 [US5] Buat halaman/panel "Pengaturan Belajar Lokal" di `apps/web/app/explore/settings/page.tsx` yang menampilkan ringkasan data lokal saat ini dan tombol "Reset Progres Lokal" yang membuka `GuestResetModal`
- [x] T051 [US5] Tambahkan tautan ke halaman pengaturan lokal dari `GuestHeaderBanner` atau menu navigasi Mode Tamu

**Checkpoint**: User Story 5 berfungsi penuh — pengguna perangkat bersama dapat mereset data lokal dengan aman.

---

## Phase 8: Edge Cases & Cross-Cutting Concerns

**Purpose**: Penanganan kondisi batas yang mempengaruhi keandalan dan aksesibilitas di seluruh Mode Tamu.

### Penanganan Edge Cases

- [x] T052 Implementasikan deteksi mode penyamaran browser (Incognito) di `StorageManager` — tampilkan `IncognitoWarningBanner` dari `packages/ui` saat terdeteksi storage bersifat ephemeral di `apps/web/lib/storage/storage-manager.ts`
- [x] T053 [P] Implementasikan strategi LRU Pruning otomatis di `StorageManager.saveState()` — hapus log detail sesi terlama (> 30 hari) jika estimasi penggunaan storage melebihi 80% kuota di `apps/web/lib/storage/storage-manager.ts`
- [x] T054 [P] Implementasikan `GuestFeatureGateCard` — komponen kartu edukasi/CTA yang ditampilkan untuk fitur-fitur yang memerlukan akun di `packages/ui/src/components/guest/guest-feature-gate.tsx`
- [x] T055 Pasang `GuestFeatureGateCard` di halaman-halaman fitur yang dibatasi untuk pengguna Mode Tamu
- [x] T056 Tambahkan rate limiting pada endpoint `POST /api/v1/sync/guest-progress` di `apps/api/src/modules/sync/guest-sync.controller.ts`
- [x] T057 [P] Verifikasi seluruh komponen guest memenuhi WCAG 2.1 AA — area sentuh minimal 44x44px dan navigasi keyboard penuh
- [x] T058 [P] Verifikasi rasio kontras warna semua teks di komponen guest minimal 4.5:1

---

## Phase 9: Polish & Validasi Akhir

**Purpose**: Pengujian integrasi akhir mengikuti panduan di `quickstart.md`.

- [x] T059 Jalankan seluruh pengujian unit dan integrasi: `pnpm --filter web test` dan `pnpm --filter api test` (95 passed)
- [x] T060 Verifikasi coverage test di semua modul baru (storage adapter, local session engine, sync service)
- [x] T061 [P] Lakukan validasi manual lengkap sesuai skenario di `quickstart.md`
- [x] T062 [P] Verifikasi bahwa zero TypeScript compiler error (`tsc --noEmit`) di `packages/ui` dan `apps/web`
