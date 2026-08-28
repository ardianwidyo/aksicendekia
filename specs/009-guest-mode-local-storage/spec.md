# Feature Specification: Akses Mode Tamu Tanpa Login & Penyimpanan Progres Belajar Lokal

**Feature Branch**: `009-guest-mode-local-storage`

**Created**: 2026-08-28

**Status**: Clarified & Approved

**Last Clarified**: 2026-08-28

**Input**: User description: "Tolong buatkan fitur baru dimana aplikasi ini bisa dibuka tanpa memerlukan Login. Untuk progress data belajarnya bisa disimpan di memory local devices masing-masing"

---

## Executive Summary & Background Context

AksiCendekia adalah platform belajar bergamifikasi untuk siswa TK, SD, SMP, dan SMA. Sebelumnya, akses penuh dan pelacakan hasil belajar di platform bergantung pada autentikasi akun terdaftar (`002-auth-multi-role`), sesi server (`004-learning-session-engine`), dan layanan gamifikasi cloud (`005-progress-gamification`). Namun, bagi pengguna baru, anak-anak, atau institusi yang ingin mencoba tanpa hambatan registrasi (*zero barrier to entry*), kewajiban login sebelum belajar dapat menurunkan tingkat adopsi awal (*friction*).

Fitur `009-guest-mode-local-storage` menghadirkan **Mode Tamu (Guest Mode)** di mana seluruh materi pembelajaran kurikulum terbuka, latihan soal interaktif, dan mesin evaluasi belajar dapat diakses secara langsung tanpa memerlukan akun maupun login. Seluruh data progres belajar (XP yang diperoleh, streak harian lokal, riwayat sesi latihan/kuis, bab/modul yang diselesaikan, dan lencana lokal) dikelola dan disimpan secara persisten di **memori penyimpanan lokal perangkat klien (Local Storage / IndexedDB)**.

Selain memberikan kebebasan belajar instan yang ramah anak, fitur ini juga menyediakan mekanisme **Migrasi Progres ke Cloud (Seamless Account Upgrade)** ketika pengguna tamu di kemudian hari memutuskan untuk mendaftar/masuk akun resmi, serta **Manajemen Privasi Data Lokal** untuk perangkat yang digunakan bersama (misal: perangkat keluarga/sekolah).

---

---

## Clarification Session — 2026-08-28

- **Q1: Model akses konten kurikulum** → Konten disajikan via **endpoint API publik tanpa JWT** (`GET /api/v1/public/lessons/:id`). Backend hanya perlu melepas proteksi JWT dari rute-rute konten tertentu yang memang bersifat publik. Tidak ada static manifest atau bundle terpisah.
- **Q2: Penilaian jawaban di Mode Tamu** → **Penilaian dilakukan lokal di browser** (client-only). Klien menerima kunci jawaban sebagai bagian dari payload konten publik. Prinsip Anti-Cheat Feature 004 **tidak berlaku** di Mode Tamu karena tidak ada sesi server yang dipertaruhkan.
- **Q3: Batasan akses konten** → **Semua materi kurikulum terbuka penuh** tanpa batasan jenjang, mata pelajaran, atau jumlah sesi. Tidak ada freemium gating di Mode Tamu.
- **Q4: Alur onboarding pertama kali** → **Tidak ada onboarding wajib**. Pengguna langsung masuk ke halaman eksplorasi materi (`/explore`) dan dapat memfilter jenjang di sana. Nama panggilan/avatar bersifat opsional.
- **Q5: Badge lokal vs. cloud** → Badge lokal Mode Tamu adalah **subset dari badge cloud yang sama** (menggunakan ID badge yang identik dari Feature 005). Setelah migrasi akun, badge yang sudah di-unlock lokal diterapkan ke akun cloud.
- **Q6: Routing untuk pengguna dengan JWT valid** → Halaman root (`/`) **selalu merender halaman beranda publik** dengan dua tombol: *"Mulai Belajar Langsung"* dan *"Masuk ke Akun"*. Tidak ada redirect otomatis. Pengguna yang sudah login dapat menekan "Masuk ke Akun" untuk masuk ke dasbor mereka.

---

## Clarified Architectural Decisions

1. **Strategi Abstraksi Penyimpanan Lokal Klien (Storage Adapter Pattern)**:
   - Akses data progres belajar menggunakan interface `IProgressStorageRepository` di lapisan client-side (`apps/web/lib/storage`).
   - Implementasi utama menggunakan **IndexedDB** (via wrapper terstruktur) untuk skalabilitas riwayat sesi berukuran besar, dengan fallback otomatis ke **LocalStorage** (dengan skema terenkapsulasi dan berversi).
   - Skema data lokal menyertakan `schema_version` (dimulai dari v1) untuk mendukung migrasi struktur data lokal di masa mendatang tanpa menghapus capaian pengguna.

2. **Evaluator Sesi & Gamifikasi Lokal (Standalone Client Engine)**:
   - Pada Mode Tamu, komputasi penambahan XP, status penyelesaian modul, dan perhitungan streak harian dieksekusi secara lokal di sisi peramban menggunakan modul domain logika murni (`apps/web/lib/gamification/local-engine.ts`).
   - Materi dan bank soal kurikulum berstatus `PUBLISHED` disajikan via **endpoint API publik tanpa JWT** (`GET /api/v1/public/lessons/:id`, `GET /api/v1/public/exercises/:id`). Payload konten publik menyertakan kunci jawaban karena penilaian dilakukan lokal di browser.
   - Seluruh jenjang (TK, SD, SMP, SMA) dan seluruh mata pelajaran terbuka penuh untuk Mode Tamu tanpa batasan sesi atau konten.
   - **Anti-Cheat tidak berlaku di Mode Tamu** karena tidak ada sesi server yang dipertaruhkan — trade-off ini disadari dan diterima.

3. **Strategi Migrasi & Penggabungan Akun (Cloud Sync on Login/Register)**:
   - Ketika pengguna tamu melakukan Registrasi (`/register`) atau Login (`/login`), antarmuka mendeteksi adanya data `GuestProgressState` lokal.
   - Sistem menampilkan dialog konfirmasi ramah: *"Apakah kamu ingin menyimpan progres belajarmu ke akun barumu?"*.
   - Jika disetujui, payload progres lokal divalidasi ke backend (`POST /api/v1/sync/guest-progress`) dengan aturan pencegahan manipulasi (validasi batas wajar XP & streak) lalu digabungkan (*merged*) ke database akun siswa terdaftar. Setelah sukses, penyimpanan lokal tamu dibersihkan atau ditandai telah termigrasi.

4. **Degradasi Anggun untuk Fitur Khusus Server (Graceful Gating)**:
   - Fitur-fitur yang membutuhkan sinkronisasi multi-pengguna (Papan Peringkat Kelas, Tantangan Antar-Siswa, Dasbor Guru/Orang Tua, Langganan Pro Berbayar) menampilkan *call-to-action* (CTA) edukatif yang ramah anak untuk mendaftar, tanpa memblokir atau merusak pengalaman belajar di modul materi reguler.

5. **Kepatuhan Privasi & Perlindungan Data Anak (Prinsip VII)**:
   - Mode Tamu secara inheren menerapkan *Zero Data Collection* di server karena seluruh data identitas lokal (nama samaran, avatar lokal) dan progres hanya berada di perangkat pengguna.
   - Tidak ada cookie pelacak atau transmisi data pribadi ke backend selama pengguna berada dalam Mode Tamu.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Akses Belajar Instan Tanpa Login (Priority: P1)

Sebagai pengguna baru atau siswa, saya ingin langsung membuka aplikasi AksiCendekia, memilih jenjang sekolah (TK/SD/SMP/SMA), dan langsung mulai belajar serta mengerjakan soal latihan tanpa perlu mendaftar atau memasukkan email/kata sandi, agar saya dapat belajar dengan cepat dan tanpa hambatan.

**Why this priority**: Menghilangkan friksi pendaftaran di awal merupakan nilai utama dari permintaan fitur ini (*zero barrier entry*). Menjamin anak dapat langsung merasakan pengalaman belajar interaktif.

**Independent Test**:
1. Pengguna membuka URL utama aplikasi (`/`) dalam status *fresh session* (tanpa cookie JWT auth).
2. Sistem menyambut dengan antarmuka eksplorasi belajar dan opsi cepat: *"Mulai Belajar Langsung"* atau *"Masuk ke Akun"*.
3. Memilih *"Mulai Belajar Langsung"* membawa pengguna ke katalog materi dan sesi latihan aktif tanpa memicu pengalihan (*redirect*) ke `/login`.

**Acceptance Scenarios**:

1. **Given** pengguna membuka aplikasi pertama kali tanpa sesi login, **When** berada di halaman beranda atau memilih mata pelajaran, **Then** aplikasi menampilkan katalog materi dan mengizinkan siswa memilih topik belajar secara langsung.
2. **Given** pengguna dalam Mode Tamu memilih modul latihan soal, **When** sesi belajar dimulai, **Then** antarmuka menyajikan soal, menerima jawaban, dan memberikan umpan balik interaktif secara normal.
3. **Given** pengguna menavigasi seluruh materi publik, **When** berpindah-pindah antar menu belajar, **Then** tidak ada modal pemblokir (*blocking paywall/login gate*) yang memaksa pengguna membuat akun untuk melanjutkan latihan reguler.

---

### User Story 2 - Penyimpanan & Pelacakan Progres Belajar Lokal (Priority: P1)

Sebagai siswa yang belajar dalam Mode Tamu, saya ingin capaian belajar saya (XP yang diraih, streak belajar harian, modul yang sudah selesai, dan riwayat skor latihan) tetap tersimpan di perangkat saya meskipun peramban ditutup atau dimuat ulang, agar progres belajar saya tidak hilang.

**Why this priority**: Inti dari fungsionalitas yang diminta: data hasil belajar harus persisten di memori lokal perangkat masing-masing pengguna tanpa memerlukan akun cloud.

**Independent Test**:
1. Siswa menyelesaikan sesi latihan matematika dalam Mode Tamu dan mendapatkan 50 XP serta menandai 1 modul selesai.
2. Peramban ditutup sepenuhnya atau halaman di-*refresh*.
3. Ketika aplikasi dibuka kembali, dasbor lokal tetap menampilkan akumulasi 50 XP, status modul selesai (tanda centang hijau), dan streak hari ke-1 aktif.

**Acceptance Scenarios**:

1. **Given** pengguna tamu menyelesaikan sebuah butir soal atau sesi latihan, **When** layar hasil ditampilkan, **Then** sistem memperbarui state lokal di `IndexedDB`/`LocalStorage` dengan penambahan XP, pencatatan waktu latihan, dan penyelesaian subtopik.
2. **Given** pengguna tamu kembali ke aplikasi pada hari berikutnya, **When** membuka aplikasi dan menyelesaikan latihan, **Then** streak harian lokal bertambah menjadi 2 hari berturut-turut.
3. **Given** pengguna tamu sedang di tengah-tengah sesi belajar lalu menutup tab/peramban, **When** membuka kembali halaman latihan tersebut, **Then** sistem memulihkan (*resume*) sesi lokal yang belum selesai.

---

### User Story 3 - Personalisasi Profil Lokal Ramah Anak (Priority: P2)

Sebagai siswa Mode Tamu, saya ingin dapat memilih nama panggilan samaran (nickname) dan memilih avatar karakter favorit yang tersimpan secara lokal, agar pengalaman belajar terasa menyenangkan dan personal tanpa perlu membagikan data identitas pribadi.

**Why this priority**: Meningkatkan keterikatan emosional anak dengan karakter belajar AksiCendekia sambil menjaga kepatuhan privasi (Prinsip VII).

**Independent Test**:
1. Siswa tamu memilih karakter avatar "Kancil Pintar" dan mengetikkan nama "Budi".
2. Nama dan avatar tersebut muncul pada header/profil lokal perangkat.
3. Seluruh data identitas lokal disimpan di storage klien tanpa dikirim ke server.

**Acceptance Scenarios**:

1. **Given** pengguna tamu berada di layar beranda atau pengaturan lokal, **When** memilih avatar dari daftar preset bawaan dan memasukkan nama panggilan, **Then** profil lokal diperbarui seketika dan tersimpan di storage perangkat.
2. **Given** perangkat dibuka kembali, **When** dasbor dimuat, **Then** ucapan selamat datang menampilkan nama panggilan dan avatar lokal yang telah dipilih sebelumnya.

---

### User Story 4 - Migrasi Progres Lokal ke Akun Terdaftar (Priority: P2)

Sebagai siswa Mode Tamu yang kemudian memutuskan untuk membuat akun resmi (atau masuk ke akun terdaftar), saya ingin seluruh progres belajar lokal yang sudah saya kumpulkan dipindahkan secara otomatis ke akun cloud saya, sehingga saya tidak perlu mengulang materi dari awal.

**Why this priority**: Menjembatani pengalaman tamu ke ekosistem penuh AksiCendekia tanpa membuat jerih payah belajar anak terbuang sia-sia (*conversion with continuity*).

**Independent Test**:
1. Pengguna memiliki 200 XP dan 3 modul selesai di storage lokal tamu.
2. Pengguna menekan tombol "Simpan Akun / Daftar" dan menyelesaikan pendaftaran akun Siswa baru.
3. Sistem mengirimkan payload progres lokal ke endpoint sinkronisasi backend dan mencatat riwayat ke database server.
4. Setelah login berhasil, profil cloud siswa memiliki total 200 XP dan 3 modul selesai, serta storage lokal tamu dibersihkan dengan aman.

**Acceptance Scenarios**:

1. **Given** terdapat progres belajar di storage lokal tamu, **When** pengguna berhasil mendaftar akun baru atau login, **Then** sistem mendeteksi keberadaan progres lokal dan menawarkan opsi migrasi data ke akun.
2. **Given** pengguna menyetujui migrasi data, **When** proses sinkronisasi selesai, **Then** backend mengintegrasikan XP, riwayat latihan, dan pencapaian lokal ke akun database, lalu mengembalikan status sukses.
3. **Given** pengguna memilih untuk tidak menggabungkan data (misal: masuk dengan akun lain milik kakaknya), **When** opsi "Mulai dengan data akun cloud" dipilih, **Then** aplikasi memuat data akun cloud tanpa menimpa progres yang sudah ada di cloud.

---

### User Story 5 - Manajemen & Reset Data Lokal Perangkat Bersama (Priority: P3)

Sebagai pengguna yang berbagi perangkat (misal komputer sekolah atau tablet keluarga dengan saudara), saya ingin memiliki tombol untuk mereset/menghapus data progres lokal tamu, agar orang lain dapat mulai belajar dari awal dengan data yang bersih.

**Why this priority**: Mendukung skenario nyata di Indonesia di mana satu gawai digunakan bersama oleh beberapa anak dalam satu keluarga atau kelas.

**Independent Test**:
1. Pengguna membuka menu "Pengaturan Belajar Lokal".
2. Menekan tombol "Reset Progres Lokal" dengan konfirmasi dialog pencegah salah tekan.
3. Seluruh kunci storage lokal terkait progres tamu dikosongkan dan aplikasi kembali ke kondisi awal (*fresh state*).

**Acceptance Scenarios**:

1. **Given** pengguna tamu berada di menu pengaturan lokal, **When** menekan tombol "Reset Progres Lokal" dan mengonfirmasi tindakan, **Then** sistem menghapus seluruh data sesi, XP, dan streak lokal dari storage peramban.
2. **Given** progres lokal telah direset, **When** pengguna kembali ke beranda, **Then** tampilan menunjukkan 0 XP, streak kosong, dan semua modul kembali berstatus belum dimulai.

---

## Edge Cases & Error Scenarios

1. **Penyimpanan Lokal Penuh / Kuota Terlampaui (Storage Quota Exceeded)**:
   - Jika `localStorage` atau `IndexedDB` mencapai batas kapasitas browser, sistem secara otomatis melakukan pembersihan log riwayat sesi lama (*pruning oldest detailed logs*) sambil tetap mempertahankan agregat penting (total XP, level, status selesai modul, dan streak).
2. **Mode Penyamaran (Incognito / Private Browsing)**:
   - Ketika browser berada dalam mode penyamaran di mana storage lokal bersifat sementara (*ephemeral*), aplikasi mendeteksi hal tersebut dan menampilkan *banner info* ramah: *"Kamu sedang menggunakan Mode Penyamaran. Progres belajarmu akan hilang saat jendela browser ditutup. Daftar akun gratis untuk menyimpan progres permanen."*
3. **Pembersihan Cache / Storage Browser oleh Pengguna**:
   - Jika pengguna menghapus data browser, aplikasi menangani ketiadaan data lokal secara elegan dengan menginisialisasi state awal baru tanpa menimbulkan error *null reference* atau *crash*.
4. **Data Lokal Rusak / Format JSON Tidak Valid**:
   - Sistem membungkus pembacaan storage dengan validasi Zod (`GuestProgressSchema`). Jika skema tidak valid atau rusak, sistem mencadangkan data mentah yang rusak dan mengembalikan state aman (*safe default fallback*).
5. **Konflik Sinkronisasi Saat Migrasi ke Akun Lama**:
   - Jika akun cloud yang di-login sudah memiliki progres belajar tersendiri, sistem menerapkan strategi penggabungan cerdas (*intelligent merge*): mengambil status penyelesaian modul tertinggi dan menjumlahkan delta XP yang sah.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistem MUST mengizinkan seluruh halaman beranda, katalog kurikulum, materi pelajaran, dan sesi latihan reguler dibuka tanpa mewajibkan autentikasi atau token JWT.
- **FR-002**: Sistem MUST menginisialisasi identitas tamu lokal (`guest_id` berbasis UUID v4) yang disimpan di storage lokal perangkat saat pertama kali dibuka.
- **FR-003**: Sistem MUST menyimpan seluruh data progres belajar tamu di memori lokal klien (`IndexedDB` dengan fallback `LocalStorage`).
- **FR-004**: Data progres lokal MUST mencakup minimal: `total_xp`, `current_level`, `daily_streak` (beserta tanggal aktivitas terakhir), `completed_lesson_ids`, `completed_module_ids`, dan `session_history`.
- **FR-005**: Sistem MUST menyediakan mekanisme penilaian dan perhitungan XP lokal instan setelah siswa tamu menyelesaikan suatu butir soal atau sesi latihan.
- **FR-006**: Sistem MUST memvalidasi struktur data lokal saat dimuat menggunakan skema Zod (`GuestProgressStateSchema`).
- **FR-007**: Sistem MUST mendukung penyimpanan profil lokal minimalis: `display_name` samaran dan `avatar_id` dari daftar preset internal.
- **FR-008**: Sistem MUST menyediakan tombol dan dialog konfirmasi untuk mereset atau menghapus seluruh data progres lokal tamu atas permintaan pengguna.
- **FR-009**: Sistem MUST mendeteksi keberadaan progres tamu lokal ketika pengguna melakukan navigasi ke alur Registrasi (`/register`) atau Login (`/login`).
- **FR-010**: Sistem MUST menyediakan opsi migrasi (*merge*) data progres lokal ke akun terdaftar melalui endpoint API `POST /api/v1/sync/guest-progress`.
- **FR-011**: Backend MUST memvalidasi batas kewajaran payload migrasi progres tamu (misal: rasio XP per sesi) sebelum menggabungkannya ke profil siswa di database untuk mencegah manipulasi.
- **FR-012**: Sistem MUST menampilkan pesan atau indikator status non-intrusif pada bilah navigasi yang menandakan pengguna sedang belajar dalam "Mode Tamu (Lokal)".
- **FR-013**: Fitur yang memerlukan otorisasi multi-peran atau sinkronisasi jaringan (Papan Peringkat Kelas, Dasbor Guru/Wali, Tantangan Kelas) MUST menampilkan kartu edukasi/CTA pendaftaran tanpa memblokir navigasi materi belajar.
- **FR-014**: Seluruh teks antarmuka dan pesan status Mode Tamu WAJIB menggunakan layer internasionalisasi (i18n) Bahasa Indonesia.
- **FR-015**: Desain antarmuka Mode Tamu WAJIB menggunakan token warna, tipografi, dan komponen taktil dari `packages/design-tokens` dan `packages/ui` sesuai tema jenjang yang dipilih.
- **FR-016**: Komponen tombol dan interaksi pada Mode Tamu WAJIB memenuhi standar aksesibilitas WCAG 2.1 AA (area sentuh minimal 44x44px dan rasio kontras memadai).

---

### Key Entities & Data Contracts

#### 1. Entity: `GuestProgressState` (Client-Side Storage)
- **`guest_id`**: String (UUID v4 unik per instalasi browser/perangkat).
- **`schema_version`**: Integer (versi struktur data lokal, misal `1`).
- **`profile`**: Object
  - `display_name`: String (nama panggilan lokal, default: "Siswa Hebat").
  - `education_stage`: Enum (`TK`, `SD`, `SMP`, `SMA`).
  - `grade_level`: Integer (1–12).
  - `avatar_id`: String (identifikasi avatar preset bawaan).
- **`gamification`**: Object
  - `total_xp`: Integer (akumulasi XP lokal).
  - `current_level`: Integer.
  - `streak`: Object (`current_streak`, `longest_streak`, `last_activity_date`).
  - `unlocked_badges`: Array of Strings (`badge_id`).
- **`curriculum_progress`**: Object
  - `completed_lessons`: Array of Strings (`lesson_id`).
  - `completed_modules`: Array of Strings (`module_id`).
  - `lesson_scores`: Record<lesson_id, { best_score: number, attempts: number, last_completed_at: string }>.
- **`recent_sessions`**: Array of `GuestSessionRecord` (maksimal 20 sesi terakhir untuk efisiensi memori).

#### 2. DTO: `GuestSyncPayload` (Client-to-Server Migration)
- **`guest_id`**: UUID string.
- **`client_calculated_xp`**: Integer.
- **`streak_count`**: Integer.
- **`completed_lesson_records`**: Array of `{ lesson_id: string, score: number, completed_at: string, time_spent_seconds: number }`.
- **`unlocked_badge_ids`**: Array of String.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (Zero Friction Onboarding)**: 100% pengguna baru dapat membuka aplikasi dan menyelesaikan soal latihan pertama dalam waktu kurang dari 30 detik tanpa menghadapi *form input* login atau registrasi wajib.
- **SC-002 (Data Persistence Reliability)**: 99.9% data progres belajar lokal (XP, modul selesai, streak) tetap terbaca dengan benar setelah peramban ditutup dan dibuka kembali.
- **SC-003 (Storage Quota Efficiency)**: Penggunaan ruang penyimpanan lokal untuk 100 sesi belajar tidak melebihi 2 MB di memori peramban klien.
- **SC-004 (Seamless Migration Success)**: Tingkat keberhasilan migrasi data lokal ke akun terdaftar mencapai minimal 98% tanpa adanya laporan kehilangan XP atau modul yang sudah diselesaikan.
- **SC-005 (Accessibility & Visual Compliance)**: Seluruh halaman dan modal Mode Tamu mencapai 100% kepatuhan WCAG 2.1 AA (target sentuh 44x44px dan navigasi keyboard penuh).

---

## Assumptions

- **Ketersediaan Storage Peramban**: Pengguna menggunakan peramban modern yang mendukung `localStorage` atau `IndexedDB` (Chrome, Safari, Firefox, Edge, Android WebView).
- **Konten Kurikulum Terbuka**: Materi pelajaran dasar dan butir soal latihan umum tersedia secara publik untuk disajikan ke klien tanpa memerlukan otorisasi peran khusus.
- **Satu Profil Tamu Aktif per Peramban**: Dalam satu peramban/profil browser, terdapat satu instance state tamu aktif. Jika bergantian pengguna, pengguna dapat menggunakan fitur "Reset Progres" atau mendaftarkan akun masing-masing.
- **Penyimpanan Lokal Bukan Penyimpanan Permanen Anti-Hapus**: Pengguna memahami bahwa membersihkan cache browser secara menyeluruh akan menghapus data tamu lokal kecuali telah dimigrasikan ke akun cloud.

---

## Constitutional Alignment

- **Prinsip I & VII (Ramah Anak & Perlindungan Data Pribadi)**: Mode Tamu mengedepankan privasi tertinggi dengan *Zero Server Collection* data pribadi anak selama belajar sebelum pembuatan akun resmi dengan izin wali.
- **Prinsip II & V (Clean Architecture & Next.js Monorepo)**: Logika storage lokal diisolasi di balik abstraction repository layer (`apps/web/lib/storage`), dan komponen UI menggunakan `packages/ui` serta Next.js App Router.
- **Prinsip III (Test-Driven Development)**: Logika penyimpanan lokal, penambahan XP lokal, mitigasi kuota penuh, dan deserialisasi schema Zod wajib diuji dengan Vitest dengan cakupan coverage > 80%.
- **Prinsip VI (Design System)**: Seluruh tampilan Mode Tamu (banner tamu, seleksi jenjang, modal migrasi, tombol reset) menggunakan token dari `packages/design-tokens` dan `design/DESIGN.md`.
- **Prinsip VIII & IX (i18n & Aksesibilitas)**: Seluruh string teks UI menggunakan layer lokalisasi Bahasa Indonesia dan memenuhi standar target sentuh minimum 44x44px.
