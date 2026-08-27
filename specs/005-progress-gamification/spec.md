# Feature Specification: Sistem Progres dan Gamifikasi AksiCendekia

**Feature Branch**: `005-progress-gamification`

**Created**: 2026-08-27 | **Last Clarified**: 2026-08-27

**Status**: Clarified & Approved

**Input**: User description: "Sistem progres dan gamifikasi AksiCendekia. Mengonsumsi event dari Feature 004 dan mengubahnya menjadi progres yang terlihat siswa. Kebutuhan: 1. XP dan level: aturan perolehan XP per jawaban benar, bonus penyelesaian pelajaran, dan kurva level. Aturan disimpan sebagai konfigurasi, bukan angka tersebar di kode. 2. Streak harian: bertambah bila siswa menyelesaikan minimal satu sesi pada hari itu menurut zona waktu profil siswa. Reset bila terlewat. Desain menampilkan '5 Hari Beruntun!'. 3. Badge pencapaian: definisi badge berbasis kondisi (jumlah pelajaran selesai, panjang streak, akurasi, penuntasan mata pelajaran). Evaluasi badge berjalan saat event masuk, bukan lewat polling. 4. Power-up sesuai desain: Token Petunjuk dan Pembeku Waktu. Punya saldo per siswa, cara perolehan, dan mekanisme konsumsi saat sesi belajar berjalan. 5. Pembukaan pelajaran: menandai pelajaran berprasyarat menjadi terbuka ketika prasyarat terpenuhi. 6. Peta misi: API yang mengembalikan simpul-simpul pelajaran beserta status (selesai / sekarang / terbuka / terkunci) untuk merender tampilan Peta Misi. 7. Halaman Pencapaian: daftar badge diperoleh dan belum, progres per mata pelajaran, riwayat XP. Di luar cakupan: papan peringkat dan tantangan harian (Feature 006), notifikasi push, mata uang berbayar. Kriteria selesai: pemrosesan ulang event yang sama tidak menggandakan XP atau badge; streak dihitung benar untuk siswa di WIB, WITA, dan WIT; menghabiskan power-up di dua sesi bersamaan tidak menghasilkan saldo negatif."

---

## Executive Summary & Background Context

AksiCendekia adalah platform belajar bergamifikasi untuk siswa TK, SD, SMP, dan SMA. Setelah membangun Mesin Sesi Belajar (`004-learning-session-engine`), platform memerlukan **Sistem Progres dan Gamifikasi (Progress & Gamification System)** untuk mengolah seluruh aktivitas belajar siswa menjadi umpan balik progres visual yang memotivasi.

Fitur `005-progress-gamification` bertindak sebagai mesin gamifikasi utama yang mengonsumsi *Domain Events* dari `004-learning-session-engine` (seperti `learning.session.completed` dan `learning.session.question_answered`) secara asynchronous dan *idempotent*. Fitur ini mengelola **Poin Pengalaman (XP)** dan **Kurva Level** berbasis konfigurasi eksternal, kalkulasi **Streak Harian** presisi lintas zona waktu Indonesia (WIB, WITA, WIT) dengan proteksi **Pembeku Waktu (Streak Freeze)**, evaluasi **Badge Pencapaian** berbasis kondisi secara *event-driven* tanpa polling, inventaris & transaksi **Power-up** (Token Petunjuk dan Pembeku Waktu) dengan jaminan **Atomic Balance** bebas dari saldo negatif pada eksekusi konkuren, penegakan **Pembukaan Pelajaran Berprasyarat**, penyediaan API **Peta Misi** terstruktur (status: *selesai / sekarang / terbuka / terkunci*), serta penyajian **Halaman Pencapaian** komprehensif.

Fitur ini dirancang dengan mematuhi penuh **Konstitusi AksiCendekia Prinsip I (Kebebasan Belajar & Pengalaman Ramah Anak)**, **Prinsip II (Clean Architecture)**, **Prinsip IV (Keamanan & Anti-Race Condition Strict)**, **Prinsip VII (Perlindungan Data Anak & Otorisasi Relasional)**, dan **Prinsip VIII (Integritas Kurikulum)**.

---

## Clarifications

### Session 2026-08-27

- Q: Bagaimana menangani pemrosesan event ganda (*duplicate event delivery*) dari Outbox Event Feature 004 agar XP dan Badge tidak berganda? → A: Setiap event diproses melalui *Event Idempotency Handler* yang mencatat `event_id` ke dalam tabel `processed_event_logs`. Jika event dengan `event_id` yang sama masuk kembali, sistem langsung mengabaikan pemrosesan tanpa mengubah state data progres.
- Q: Bagaimana cara menentukan pergantian hari pada kalkulasi Streak Harian untuk siswa di WIB, WITA, dan WIT? → A: Sistem mengambil atribut `timezone` dari profil siswa (default: `Asia/Jakarta`). Saat event penyelesaian sesi tiba, timestamp UTC dikonversi ke tanggal kalender lokal siswa (`YYYY-MM-DD`). Jika tanggal kalender tersebut adalah hari berikutnya dari `last_active_date`, streak bertambah +1. Jika siswa absen 1 hari kalender lokal, sistem mengecek saldo *Pembeku Waktu* (Streak Freeze); jika tersedia dan aktif, freeze dikonsumsi dan streak dipertahankan; jika tidak ada, streak direset ke 1.
- Q: Bagaimana mencegah saldo Power-up menjadi negatif jika siswa membuka dua sesi belajar secara bersamaan dan menggunakan power-up pada milidetik yang sama? → A: Konsumsi power-up menggunakan perintah pembaruan database terisolasi dengan operasi atomik (`UPDATE student_powerups SET quantity = quantity - 1 WHERE student_id = ? AND powerup_type = ? AND quantity >= 1`) atau *Row-Level Lock* (`SELECT FOR UPDATE`). Jika baris tidak terupdate, request ditolak dengan status HTTP 400 (`INSUFFICIENT_POWERUP`).
- Q: Apa formula kurva level (XP per level) yang digunakan? → A: Kurva level menggunakan **Formula Eksponensial (`Required XP = 100 * Level^1.5`)**, memberikan tantangan perkembangan yang seimbang dan progresif pada level tinggi.
- Q: Bagaimana mekanisme konsumsi Pembeku Waktu (Streak Freeze)? → A: Dikonsumsi **secara otomatis oleh sistem** saat siswa absen 1 hari kalender lokal, selama siswa memiliki saldo `STREAK_FREEZE > 0`.
- Q: Bagaimana cara perolehan Power-up (Token Petunjuk & Pembeku Waktu)? → A: Diperoleh secara eksklusif sebagai **Hadiah Milestone** yang dikreditkan secara atomik saat Kenaikan Level (*Level Up*), pencapaian *Streak Milestone* (misal: 7, 14, 30 hari), atau pembukaan *Badge* tertentu.


---

## Clarified Architectural Decisions

1. **Arsitektur Konsumen Event & Idempotensi Strict**:
   - **Subscriber Domain Event**: Service gamifikasi mendengarkan event dari outbox Feature 004 (`learning.session.started`, `learning.session.question_answered`, `learning.session.completed`, `learning.session.expired`).
   - **Tabel Log Idempotensi (`processed_event_logs`)**: Menyimpan `event_id`, `event_type`, `aggregate_id`, dan `processed_at`. Pemrosesan ulang event yang sama dijamin 100% *idempotent* (XP, Level, Streak, dan Badge tidak akan dikalkulasi ulang).

2. **Mesin XP & Level Berbasis Konfigurasi Eksternal**:
   - **Pemisahan Aturan XP**: Nilai perolehan XP per jawaban benar (`xp_per_correct_answer`), bonus penyelesaian pelajaran (`xp_lesson_completion_bonus`), bonus skor sempurna 100% (`xp_perfect_score_bonus`), dan rumus/tabel ambang batas level (*level curve thresholds*) disimpan dalam file konfigurasi JSON (`gamification-config.json`) atau tabel konfigurasi backend, BUKAN di-hardcode di dalam logika kode program.
   - **Buku Besar Riwayat XP (`xp_transactions`)**: Setiap penambahan XP mencatat transaksi terstruktur berisi `student_id`, `amount`, `source` (`QUESTION_CORRECT`, `LESSON_BONUS`, `PERFECT_SCORE_BONUS`), `reference_id` (sessionId/lessonId), dan `created_at`.

3. **Mesin Streak Harian Lintas Zona Waktu (WIB, WITA, WIT)**:
   - **Konversi Zona Waktu Profil**: Mendukung 3 zona waktu Indonesia: `Asia/Jakarta` (WIB / UTC+7), `Asia/Makassar` (WITA / UTC+8), `Asia/Jayapura` (WIT / UTC+9).
   - **Penghitungan Tanggal Kalender Lokal**: Waktu `completed_at` (UTC) dipetakan ke tanggal lokal `YYYY-MM-DD` sesuai zona waktu siswa.
   - **Aturan Evaluasi Streak**:
     - *Hari yang Sama*: Jika sesi selesai pada tanggal lokal yang sama dengan `last_active_date`, streak tetap (tidak bertambah ganda pada hari yang sama, namun XP tetap diperoleh).
     - *Hari Berurutan (`last_active_date + 1 day`)*: Streak bertambah +1.
     - *Terlewat 1 Hari (`last_active_date + 2 days` atau lebih)*: Jika siswa memiliki power-up *Pembeku Waktu* (Streak Freeze) dalam kondisi aktif/tersedia, sistem mengonsumsi 1 token Streak Freeze, mempertahankan streak, dan memperbarui `last_active_date`. Jika tidak ada, streak di-reset menjadi 1.
   - **Tampilan UI**: Menyajikan string visual terformat seperti `"5 Hari Beruntun!"` beserta ikon api.

4. **Evaluator Badge Pencapaian Event-Driven**:
   - **Kondisi Badge Fleksibel**: Definisi badge disimpan dengan kriteria terstruktur, meliputi:
     - `LESSONS_COMPLETED`: Jumlah total pelajaran selesai (misal: 1, 10, 50 pelajaran).
     - `STREAK_LENGTH`: Panjang streak harian aktif (misal: 3, 7, 30 hari).
     - `ACCURACY_RATE`: Akurasi rata-rata minimum atas sejumlah sesi (misal: akurasi ≥ 90% pada 5 pelajaran).
     - `SUBJECT_COMPLETION`: Penuntasan 100% seluruh pelajaran dalam satu Mata Pelajaran.
   - **Evaluasi Real-Time**: Evaluator berjalan secara *event-driven* seketika event `learning.session.completed` masuk. Tidak ada *cron job polling* untuk pemberian badge.
   - **Penjaminan Ketersediaan Badge (`student_badges`)**: Relasi unik `(student_id, badge_id)` memastikan badge yang telah dibuka tidak pernah diberikan dua kali.

5. **Manajemen Power-Up & Atomisitas Saldo Konkuren**:
   - **Dua Tipe Power-Up**:
     - `HINT_TOKEN` (Token Petunjuk): Digunakan saat sesi belajar berlangsung untuk membuka petunjuk butir soal tanpa pengurangan poin atau penalti.
     - `STREAK_FREEZE` (Pembeku Waktu): Mengamankan streak harian ketika siswa tidak menyelesaikan sesi pada satu hari kalender.
   - **Proteksi Transaksi Atomik (Bebas Negative Balance)**: API konsumsi power-up (`POST /api/v1/powerups/consume`) mengeksekusi pembaruan saldo menggunakan query atomik SQL yang memverifikasi `quantity >= required_amount`. Jika dua sesi mencoba mengonsumsi power-up terakhir secara bersamaan, tepat satu transaksi yang akan berhasil, sedangkan transaksi kedua gagal dengan HTTP 400 Bad Request.

6. **API Peta Misi & Graf Pembukaan Pelajaran**:
   - **Resolusi Prasyarat Dynamic**: Mengaitkan prasyarat pelajaran dari Feature 003 (`LessonPrerequisite`) dengan progres penyelesaian siswa (`StudentLessonProgress`).
   - **Status Simpul Pelajaran (`GET /api/v1/curriculum/subjects/:subjectId/mission-map`)**:
     - `COMPLETED`: Pelajaran telah diselesaikan oleh siswa (skor dan tanggal tersimpan).
     - `CURRENT`: Pelajaran terbuka pertama yang belum diselesaikan (menjadi fokus utama belajar siswa).
     - `UNLOCKED`: Pelajaran yang seluruh prasyaratnya sudah terpenuhi, siap dikerjakan.
     - `LOCKED`: Pelajaran yang memiliki minimal satu prasyarat belum diselesaikan.

7. **Halaman Pencapaian Siswa**:
   - **API Dashboard Pencapaian (`GET /api/v1/students/achievements`)**: Mengembalikan daftar badge (diperoleh dengan `unlockedAt` vs belum diperoleh dengan persentase progres), statistik progres per mata pelajaran (% selesai dan total XP), serta riwayat transaksi XP terpaginasi.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Perhitungan XP, Level, & Idempotensi Event (Priority: P1)

Sebagai Siswa, saya ingin menerima Poin Pengalaman (XP) dan kenaikan Level sesuai aturan konfigurasi setiap kali menyelesaikan butir soal dan sesi belajar, di mana pemrosesan ulang event yang sama tidak pernah menggandakan XP saya, agar progres belajar saya tercatat secara akurat dan adil.

**Why this priority**: Merupakan inti dari sistem umpan balik gamifikasi. Tanpa XP dan level yang akurat serta aman dari akumulasi event ganda, progres belajar siswa tidak dapat terukur.

**Independent Test**:
1. Siswa menyelesaikan sesi belajar dengan 5 soal benar -> event `learning.session.completed` dikirim ke mesin gamifikasi.
2. Memverifikasi `student_progress` menambahkan XP sesuai rumus konfigurasi (`5 * xp_per_correct + bonus_completion`).
3. Mengirimkan ulang payload event yang sama dengan `event_id` yang persis sama -> backend mencatat log idempotensi dan TIDAK menambahkan XP atau level untuk kedua kalinya.
4. Memverifikasi log riwayat XP di `xp_transactions` hanya mencatat 1 kali transaksi.

**Acceptance Scenarios**:
1. **Given** event `learning.session.completed` masuk dengan 10 jawaban benar dan bonus penyelesaian, **When** konsumen event memproses payload, **Then** total XP siswa bertambah sesuai nilai konfigurasi eksternal (`gamification-config.json`) dan `XpTransaction` baru tercatat.
2. **Given** penambahan XP melampaui ambang batas kurva level berikutnya, **When** progres diperbarui, **Then** `level` siswa naik +1 dan event internal `student.level_up` dipicu.
3. **Given** event dengan `event_id` yang sudah pernah diproses dikirim ulang, **When** event konsumen menerima event tersebut, **Then** sistem mendeteksi keberadaan `event_id` di `processed_event_logs`, mengabaikan kalkulasi, dan tidak mengubah saldo XP/level siswa.

---

### User Story 2 - Streak Harian Lintas Zona Waktu & Pembeku Waktu (Priority: P1)

Sebagai Siswa di wilayah WIB, WITA, atau WIT, saya ingin streak harian saya bertambah setiap kali saya menyelesaikan minimal satu sesi belajar pada hari itu berdasarkan zona waktu lokal saya, serta terlindungi oleh Pembeku Waktu jika terlewat 1 hari, agar pencapaian streak saya selalu akurat dan adil.

**Why this priority**: Streak harian adalah mekanisme retensi dan kebiasaan belajar harian (*daily engagement habit*) utama bagi siswa.

**Independent Test**:
1. Siswa A di Jayapura (WIT / UTC+9) menyelesaikan sesi pada pukul 23:30 WIT (14:30 UTC) -> streak bertambah untuk tanggal lokal hari itu.
2. Pada pukul 00:30 WIT hari berikutnya (15:30 UTC hari sebelumnya), Siswa A menyelesaikan sesi lagi -> streak bertambah menjadi 2 Hari Beruntun.
3. Siswa B terlewat tidak belajar selama 1 hari lokal tetapi memiliki saldo 1 *Pembeku Waktu* -> saat sesi berikutnya diselesaikan, saldo *Pembeku Waktu* berkurang 1 dan streak Siswa B tidak di-reset ke 0/1.

**Acceptance Scenarios**:
1. **Given** siswa berkredensial zona waktu `Asia/Jayapura` (WIT), **When** menyelesaikan sesi belajar, **Then** kalkulasi tanggal kalender lokal dilakukan berdasarkan UTC+9 (BUKAN UTC server atau WIB).
2. **Given** siswa menyelesaikan sesi pertama pada suatu hari kalender lokal, **When** sesi selesai, **Then** `currentStreak` bertambah +1 dan tampilan UI menyajikan `"X Hari Beruntun!"`.
3. **Given** siswa tidak menyelesaikan sesi pada 1 hari kalender lokal penuh, **When** diperiksa pada hari berikutnya dan siswa memiliki `STREAK_FREEZE > 0`, **Then** 1 token `STREAK_FREEZE` otomatis dikonsumsi, pesan proteksi dicatat, dan streak siswa tidak reset.
4. **Given** siswa terlewat 1 hari lokal tanpa token `STREAK_FREEZE`, **When** sesi baru diselesaikan, **Then** `currentStreak` di-reset kembali menjadi 1.

---

### User Story 3 - Evaluasi Badge Event-Driven & Halaman Pencapaian (Priority: P1)

Sebagai Siswa, saya ingin badge pencapaian langsung diberikan seketika kondisi terpenuhi (tanpa menunggu cron job) dan dapat melihat seluruh koleksi badge serta progres mata pelajaran di Halaman Pencapaian, agar saya merasa dihargai atas pencapaian belajar saya.

**Why this priority**: Memberikan kepuasan instan (*instant gratification*) dan transparansi pencapaian bagi siswa.

**Independent Test**:
1. Siswa menyelesaikan pelajaran ke-10 yang menjadi syarat badge "Pembelajar Tekun" -> event `learning.session.completed` diproses.
2. Evaluator badge secara *real-time* mendeteksi jumlah pelajaran = 10 -> memunculkan badge baru di `student_badges`.
3. Membuka endpoint `GET /api/v1/students/achievements` -> memverifikasi badge "Pembelajar Tekun" berstatus `isUnlocked: true` dengan `unlockedAt` terisi.

**Acceptance Scenarios**:
1. **Given** event `learning.session.completed` diterima backend, **When** pemrosesan event berjalan, **Then** evaluator badge memeriksa seluruh definisi kondisi badge secara synchronously/in-process tanpa polling database berkala.
2. **Given** kondisi badge terpenuhi (misal: streak = 7 hari atau akurasi = 100%), **When** evaluasi selesai, **Then** entitas `StudentBadge` dibuat dan metadata badge tercatat.
3. **Given** siswa membuka Halaman Pencapaian via `GET /api/v1/students/achievements`, **When** response diterima, **Then** payload mengembalikan daftar badge yang sudah & belum didapat, persentase progres per mata pelajaran, dan riwayat XP terpaginasi.

---

### User Story 4 - Manajemen Power-Up & Proteksi Akses Konkuren Saldo (Priority: P1)

Sebagai Siswa, saya ingin memiliki saldo Power-up (Token Petunjuk & Pembeku Waktu) yang dapat diperoleh dan dikonsumsi saat belajar, di mana penggunaan bersamaan pada dua sesi parallel tidak pernah menyebabkan saldo menjadi negatif.

**Why this priority**: Mengingat siswa dapat membuka multiple tab atau perangkat, pencegahan *race condition* pada pemakaian power-up adalah syarat mutlak integritas data dan keamanan transaksi gamifikasi.

**Independent Test**:
1. Siswa memiliki saldo 1 Token Petunjuk (`HINT_TOKEN`).
2. Mengirimkan dua request bersamaan (`concurrent POST /api/v1/powerups/consume`) pada milidetik yang sama dari dua peramban berbeda.
3. Backend mengeksekusi atomic query `UPDATE student_powerups SET quantity = quantity - 1 WHERE quantity >= 1`.
4. Memverifikasi tepat 1 request mengembalikan `200 OK` (saldo menjadi 0) dan 1 request lainnya mengembalikan `400 Bad Request` (`INSUFFICIENT_POWERUP`). Saldo akhir di database adalah `0`, BUKAN `-1`.

**Acceptance Scenarios**:
1. **Given** siswa mendapatkan reward milestone, **When** reward diklaim/diterima, **Then** saldo `StudentPowerup` untuk tipe terkait bertambah secara atomik.
2. **Given** siswa menggunakan Token Petunjuk di dalam sesi belajar, **When** request `POST /api/v1/sessions/:id/hints` dipanggil dengan opsi mengonsumsi power-up, **Then** saldo `HINT_TOKEN` berkurang 1 dan petunjuk diberikan.
3. **Given** dua request konsumsi power-up tiba secara simultan saat saldo = 1, **When** query database dieksekusi, **Then** proteksi *row-level locking* / *conditional atomic update* memastikan saldo tidak pernah bernilai di bawah 0.

---

### User Story 5 - Pembukaan Pelajaran Berprasyarat & API Peta Misi (Priority: P1)

Sebagai Siswa, saya ingin melihat alur pembelajaran di Peta Misi dengan status visual yang jelas untuk setiap pelajaran (Selesai, Sekarang, Terbuka, Terkunci), di mana pelajaran berprasyarat otomatis terbuka begitu prasyaratnya saya selesaikan, agar jalur belajar saya terarah.

**Why this priority**: Peta Misi adalah antarmuka utama navigasi siswa dalam memilih pelajaran berikutnya.

**Independent Test**:
1. Pelajaran 2 mensyaratkan Pelajaran 1. Siswa belum mengerjakan Pelajaran 1.
2. Endpoint `GET /api/v1/curriculum/subjects/:subjectId/mission-map` mengembalikan Pelajaran 1 berstatus `CURRENT`/`UNLOCKED` dan Pelajaran 2 berstatus `LOCKED`.
3. Siswa menyelesaikan Pelajaran 1 -> event `learning.session.completed` diproses.
4. Memanggil ulang API Peta Misi -> Pelajaran 1 berstatus `COMPLETED` dan Pelajaran 2 otomatis berubah status menjadi `CURRENT`/`UNLOCKED`.

**Acceptance Scenarios**:
1. **Given** sebuah pelajaran memiliki prasyarat di `LessonPrerequisite`, **When** seluruh pelajaran prasyarat tersebut berstatus `COMPLETED` pada progres siswa, **Then** status pelajaran tersebut berubah dari `LOCKED` menjadi `UNLOCKED`.
2. **Given** siswa memanggil endpoint `GET /api/v1/curriculum/subjects/:subjectId/mission-map`, **When** response dikirim, **Then** backend mengembalikan daftar simpul pelajaran terurut beserta status sah (`COMPLETED`, `CURRENT`, `UNLOCKED`, `LOCKED`), skor terbaik, dan jumlah bintang/reward.
3. **Given** siswa mencoba memulai sesi pada pelajaran berstatus `LOCKED`, **When** request `POST /api/v1/sessions` dikirim, **Then** backend menolak dengan HTTP 403 Forbidden (`LESSON_LOCKED`).

---

### Edge Cases

- Apa yang terjadi jika event `learning.session.completed` masuk mendahului event `learning.session.question_answered` akibat keterlambatan antrean event? → System menggunakan `completed_at` timestamp dan `session_id` untuk memastikan agregasi XP akhir sesi independen terhadap urutan event jawaban.
- Apa yang terjadi jika siswa mengubah zona waktu profil di tengah hari? → Tanggal kalender lokal dihitung berdasarkan zona waktu profil siswa PADA SAAT event sesi selesai diproses.
- Bagaimana jika definisi kondisi badge diubah di kemudian hari? → Evaluator badge hanya mengevaluasi kondisi terkini pada event baru yang masuk; badge yang sudah terlanjur didapat siswa tidak akan ditarik kembali (*immutable grant*).
- Bagaimana jika konfigurasi XP diubah di server? → Perubahan konfigurasi XP hanya berlaku untuk sesi-sesi baru yang diselesaikan setelah waktu perubahan konfigurasi; riwayat transaksi XP lama tetap utuh.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistem MUST mengonsumsi event `learning.session.completed` dan `learning.session.question_answered` dari Feature 004 secara asynchronous via event consumer.
- **FR-002**: Sistem MUST menjamin idempotensi pemrosesan event dengan mencatat setiap `event_id` ke dalam tabel log idempotensi (`processed_event_logs`). Pemrosesan ulang event yang sama MUST diabaikan tanpa mengubah state progres.
- **FR-003**: Sistem MUST menyimpan seluruh aturan kalkulasi XP (XP per jawaban benar, bonus penyelesaian sesi, bonus skor sempurna 100%) dan kurva ambang batas level dalam file konfigurasi eksternal (`gamification-config.json`) atau tabel konfigurasi backend, BUKAN angka tersebar di kode.
- **FR-004**: Sistem MUST mencatat setiap mutasi XP ke dalam buku besar riwayat XP (`xp_transactions`) lengkap dengan `student_id`, `amount`, `source`, `reference_id`, dan timestamp UTC.
- **FR-005**: Sistem MUST menghitung kenaikan level siswa secara otomatis ketika total akumulasi XP mencapai atau melampaui ambang batas level berikutnya pada kurva level.
- **FR-006**: Sistem MUST menghitung streak harian siswa berdasarkan tanggal kalender lokal di zona waktu profil siswa (`Asia/Jakarta` untuk WIB, `Asia/Makassar` untuk WITA, `Asia/Jayapura` untuk WIT).
- **FR-007**: Sistem MUST menambah `currentStreak` +1 jika siswa menyelesaikan minimal satu sesi belajar pada hari kalender lokal berikutnya dari `last_active_date`.
- **FR-008**: Sistem MUST mengabaikan penambahan ganda streak jika siswa menyelesaikan lebih dari satu sesi belajar pada hari kalender lokal yang sama (streak bertambah maksimum +1 per hari kalender).
- **FR-009**: Jika siswa terlewat 1 hari kalender lokal tanpa menyelesaikan sesi, sistem MUST memeriksa saldo *Pembeku Waktu* (`STREAK_FREEZE`). Jika saldo > 0, sistem MUST mengonsumsi 1 token `STREAK_FREEZE` dan mempertahankan `currentStreak`.
- **FR-010**: Jika siswa terlewat 1 hari kalender lokal tanpa menyelesaikan sesi dan tidak memiliki saldo *Pembeku Waktu*, sistem MUST mereset `currentStreak` menjadi 1 pada sesi belajar berikutnya.
- **FR-011**: Sistem MUST menyajikan format string streak harian terformat (seperti `"5 Hari Beruntun!"`) untuk kebutuhan UI peramban.
- **FR-012**: Sistem MUST mengevaluasi syarat pencapaian badge secara *event-driven* seketika event sesi selesai masuk, BUKAN melalui proses *polling/cron job*.
- **FR-013**: Sistem MUST mendukung definisi kondisi badge berbasis: jumlah total pelajaran selesai, panjang streak harian aktif, tingkat akurasi rata-rata, dan penuntasan seluruh pelajaran dalam suatu mata pelajaran.
- **FR-014**: Sistem MUST mencatat badge yang telah dibuka ke dalam tabel `student_badges` dan menjamin satu badge hanya dibuka satu kali per siswa.
- **FR-015**: Sistem MUST mengelola dua tipe power-up: `HINT_TOKEN` (Token Petunjuk) dan `STREAK_FREEZE` (Pembeku Waktu).
- **FR-016**: Sistem MUST mencatat saldo power-up per siswa pada tabel `student_powerups`.
- **FR-017**: Endpoint konsumsi power-up (`POST /api/v1/powerups/consume`) MUST menggunakan operasi SQL atomik atau *row-level locking* (`quantity >= required`) untuk mencegah saldo negatif akibat eksekusi bersamaan (*concurrent execution*).
- **FR-018**: Sistem MUST mendukung perolehan power-up sebagai hadiah dari pencapaian milestone (kenaikan level, milestone streak, atau pembukaan badge tertentu).
- **FR-019**: Sistem MUST memeriksa seluruh prasyarat pelajaran (`LessonPrerequisite`) ketika siswa menyelesaikan suatu pelajaran. Jika seluruh prasyarat suatu pelajaran turunan terpenuhi, sistem MUST mengubah status progres pelajaran tersebut menjadi `UNLOCKED`.
- **FR-020**: Sistem MUST menyediakan endpoint API Peta Misi (`GET /api/v1/curriculum/subjects/:subjectId/mission-map`) yang mengembalikan graf simpul pelajaran lengkap dengan status sah: `COMPLETED`, `CURRENT`, `UNLOCKED`, atau `LOCKED`.
- **FR-021**: Sistem MUST menandai tepat satu pelajaran sebagai status `CURRENT` per jalur progres mata pelajaran (pelajaran terbuka pertama yang belum diselesaikan siswa).
- **FR-022**: Sistem MUST menyediakan endpoint Halaman Pencapaian (`GET /api/v1/students/achievements`) yang mengembalikan daftar seluruh badge (diperoleh & belum diperoleh beserta persentase progres), ringkasan progres per mata pelajaran, dan riwayat transaksi XP terpaginasi.
- **FR-023**: Endpoint progres dan gamifikasi MUST memeriksa relasi otorisasi relasional (hanya siswa bersangkutan, orang tua terverifikasi, atau guru kelas terkait) sesuai Konstitusi Prinsip VII (UU No. 27/2022 PDP).

---

### Key Entities

- **`StudentProgress`**: Menyimpan agregat status progres siswa (`student_id`, `total_xp`, `level`, `current_streak`, `longest_streak`, `last_active_date`, `timezone`, `updated_at`).
- **`XpTransaction`**: Catatan riwayat mutasi XP (`id`, `student_id`, `amount`, `source`, `reference_id`, `created_at`).
- **`StudentBadge`**: Catatan badge yang telah diperoleh siswa (`id`, `student_id`, `badge_id`, `unlocked_at`, `trigger_event_id`).
- **`BadgeDefinition`**: Metadata dan aturan kondisi badge (`id`, `code`, `name`, `description`, `icon_url`, `category`, `condition_type`, `condition_parameter`).
- **`StudentPowerup`**: Saldo inventaris power-up siswa (`id`, `student_id`, `powerup_type`, `quantity`, `updated_at`).
- **`PowerupTransaction`**: Catatan mutasi perolehan/konsumsi power-up (`id`, `student_id`, `powerup_type`, `action_type`, `amount`, `source`, `reference_id`, `created_at`).
- **`StudentLessonProgress`**: Catatan status progres siswa per pelajaran (`id`, `student_id`, `lesson_id`, `status`, `best_score`, `completed_at`, `attempts_count`).
- **`ProcessedEventLog`**: Log idempotensi pemrosesan event (`event_id`, `event_type`, `aggregate_id`, `processed_at`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Pemrosesan ulang event `learning.session.completed` yang sama 100 kali berturut-turut menghasilkan persis 1 kali penambahan XP, 1 kali pencatatan transaksi, dan 0 duplikasi badge (100% Idempotent).
- **SC-002**: Pengujian simulasi konsumsi power-up secara konkuren dari 10 thread/sesi bersamaan saat saldo = 1 menghasilkan tepat 1 transaksi berhasil dan 9 transaksi ditolak, dengan saldo akhir database tepat 0 (0% kasus saldo negatif).
- **SC-003**: Perhitungan streak harian untuk siswa di 3 zona waktu berbeda (WIB UTC+7, WITA UTC+8, WIT UTC+9) akurat 100% terhadap pergantian hari kalender lokal masing-masing zona waktu.
- **SC-004**: Evaluasi badge berjalan secara *event-driven* dengan waktu respon pemrosesan event < 100ms setelah event `learning.session.completed` diterima backend.
- **SC-005**: Endpoint API Peta Misi (`GET /api/v1/curriculum/subjects/:subjectId/mission-map`) mengembalikan seluruh simpul pelajaran dengan status yang valid (`COMPLETED`, `CURRENT`, `UNLOCKED`, `LOCKED`) dalam waktu respon < 150ms untuk mata pelajaran hingga 100 pelajaran.
- **SC-006**: Seluruh endpoint API progres dan gamifikasi memiliki cakupan pengujian (*test coverage*) minimal 80% (garis, fungsi, cabang, dan statement) sesuai Konstitusi Prinsip III.

---

## Assumptions

- **Integrasi Event Feature 004**: Menilai bahwa Feature 004 menerbitkan event terstruktur via Transactional Outbox Pattern dengan payload JSON yang memuat `event_id`, `session_id`, `student_id`, `lesson_id`, `score`, `correct_count`, `completed_at`.
- **Zona Waktu Profil Siswa**: Diasumsikan setiap profil siswa memiliki atribut `timezone` yang sah (default `Asia/Jakarta`). Jika tidak diisi, fallback otomatis ke `Asia/Jakarta`.
- **Tidak Ada Mata Uang Berbayar**: Saldo power-up murni diperoleh dari pencapaian aktivitas belajar (level-up, streak milestone, badge reward), tidak ada transaksi uang tunai atau in-app purchase.
- **Papan Peringkat & Tantangan Harian**: Papan peringkat (leaderboard) dan tantangan harian (daily quests) secara eksklusif berada di luar cakupan fitur ini dan akan ditangani oleh Feature 006.
