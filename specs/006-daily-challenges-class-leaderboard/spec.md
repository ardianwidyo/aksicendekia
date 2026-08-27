# Feature Specification: Tantangan Harian dan Papan Peringkat Kelas AksiCendekia

**Feature Branch**: `006-daily-challenges-class-leaderboard`

**Created**: 2026-08-27 | **Last Clarified**: 2026-08-27

**Status**: Draft

**Input**: User description: "Tantangan Harian dan Papan Peringkat Kelas AksiCendekia. Kebutuhan: 1. Tantangan Harian: satu tantangan per jenjang per hari, dibuat otomatis dari butir soal berstatus PUBLISHED. Contoh di desain: 'Selesaikan 10 soal cerita dalam 5 menit'. Menampilkan progres berjalan (6/10) dan hadiah penyelesaian. 2. Papan Peringkat Kelas: peringkat berdasarkan XP dalam periode berjalan (mingguan, reset Senin 00:00 waktu lokal siswa). Menampilkan nama tampilan dan XP saja. Posisi siswa sendiri selalu terlihat meski di luar 10 besar. 3. Ruang lingkup papan peringkat terbatas pada kelas siswa tersebut. TIDAK ADA papan peringkat global lintas sekolah. 4. Siswa dapat menyembunyikan diri dari papan peringkat lewat pengaturan; orang tua dapat mengunci pengaturan itu. Di luar cakupan: pertemanan, pesan antar-siswa, papan peringkat global, turnamen antar-sekolah. Kriteria selesai: papan peringkat tidak pernah mengembalikan nama lengkap, sekolah, umur, atau foto asli; siswa yang menyembunyikan diri tidak muncul di respons API mana pun milik siswa lain; tantangan harian yang sama tidak dapat diklaim hadiahnya dua kali."

---

## Executive Summary & Background Context

AksiCendekia adalah platform pembelajaran bergamifikasi untuk siswa TK, SD, SMP, dan SMA. Menyusul keberhasilan implementasi **Sistem Progres dan Gamifikasi** (`005-progress-gamification`), platform memerlukan komponen motivasi harian dan sosial kelas yang aman bagi anak: **Tantangan Harian dan Papan Peringkat Kelas (Daily Challenges & Class Leaderboard)**.

Fitur `006-daily-challenges-class-leaderboard` menghadirkan dua pilar utama engagement:
1. **Tantangan Harian (Daily Challenges)**: Generator otomatis yang memilih butir soal berstatus `PUBLISHED` dari Kurikulum Merdeka (Feature 003) untuk menyusun 1 tantangan per jenjang pendidikan (TK, SD, SMP, SMA) per hari kalender. Siswa dapat melacak progres penyelesaian tantangan secara real-time (contoh: 6/10 soal) dan mengklaim hadiah (XP/Power-up) dengan jaminan *Idempotent & Atomic Reward Claiming* yang tidak dapat diklaim dua kali.
2. **Papan Peringkat Kelas (Class Leaderboard)**: Papan peringkat mingguan (reset setiap hari Senin pukul 00:00 waktu lokal siswa) yang menghitung total perolehan XP mingguan siswa dalam lingkup **kelas mereka sendiri**. Papan peringkat ini secara ketat mematuhi **Konstitusi AksiCendekia Prinsip VII (Perlindungan Data Anak & UU PDP No. 27/2022)** dengan menyembunyikan nama lengkap, sekolah, umur, dan foto asli. Posisi siswa sendiri disajikan secara *pinned* di bagian bawah antarmuka meskipun posisi siswa berada di luar 10 besar. Selain itu, fitur ini menyediakan kontrol privasi di mana siswa dapat menyembunyikan diri (*opt-out*), dan orang tua dapat MENGUNCI (*parental lock*) opsi visibilitas tersebut.

Seluruh desain mematuhi penuh **Konstitusi AksiCendekia Prinsip I, II, IV, V, VI, VII, VIII, dan IX**.

---

## Clarifications

### Session 1 - 2026-08-27

- Q: Bagaimana penentuan waktu reset Papan Peringkat Kelas mingguan dan Tantangan Harian untuk siswa di zona waktu WIB, WITA, dan WIT? → A: Papan Peringkat Kelas mingguan di-reset setiap hari **Senin pukul 00:00 waktu lokal siswa** (`Asia/Jakarta`, `Asia/Makassar`, atau `Asia/Jayapura`). Tantangan Harian di-reset setiap hari pada **pukul 00:00 waktu lokal siswa**.
- Q: Apa yang terjadi jika siswa berada di luar posisi Top 10 pada Papan Peringkat Kelas? → A: API mengembalikan 10 besar siswa teratas (*Top 10*) ditambah entitas *pinned current student* yang mencantumkan peringkat presisi dan XP siswa yang sedang login, sehingga posisi siswa sendiri selalu terlihat di antarmuka.
- Q: Bagaimana mekanisme penyembunyian diri (*opt-out*) siswa bekerja pada respons API siswa lain? → A: Jika seorang siswa mengaktifkan mode tersembunyi (`is_hidden_from_leaderboard = true`), record siswa tersebut **sepenuhnya dikeluarkan (FILTERED OUT)** dari query SQL/Prisma papan peringkat yang dikembalikan ke siswa lain. Peringkat siswa lain dihitung ulang secara otomatis seolah siswa tersembunyi tidak ada.
- Q: Bagaimana mekanisme *Parental Lock* bekerja pada pengaturan visibilitas papan peringkat? → A: Jika akun Orang Tua yang terhubung mengaktifkan `is_leaderboard_privacy_locked = true` via portal/API Orang Tua, maka request perubahan visibilitas yang dikirim oleh siswa akan ditolak oleh backend dengan HTTP 403 Forbidden (`PRIVACY_SETTINGS_LOCKED_BY_PARENT`).
- Q: Bagaimana mencegah klaim hadiah Tantangan Harian ganda (*double claim race condition*)? → A: Endpoint klaim hadiah (`POST /api/v1/daily-challenges/:challengeId/claim`) mengeksekusi operasi transaksi atomik DB (`UPDATE student_daily_challenges SET status = 'CLAIMED', claimed_at = NOW() WHERE student_id = ? AND challenge_id = ? AND status = 'COMPLETED'`). Jika transaksi terpengaruh 0 baris, request ditolak dengan HTTP 400 Bad Request (`REWARD_ALREADY_CLAIMED`).

### Session 2 - 2026-08-27

- Q: Bagaimana aturan pemecah seri peringkat (*tie-breaking*) jika dua siswa memiliki akumulasi XP mingguan yang sama? → A: Peringkat ditentukan berdasarkan timestamp perolehan XP paling awal (`first_xp_timestamp ASC`). Jika timestamp persis sama, diurutkan alfabetis berdasarkan `display_name`.
- Q: Apa yang terjadi jika tantangan harian berstatus COMPLETED belum diklaim hingga hari berganti (melewati 00:00)? → A: Hadiah tantangan harian berstatus `COMPLETED` dapat diklaim hingga **maksimal 1 hari berikutnya (H+1)** melalui tab "Tantangan Kemarin". Jika lewat dari H+1 tidak diklaim, status otomatis berubah menjadi `EXPIRED` dan hadiah hangus.
- Q: Bagaimana tampilan Papan Peringkat Kelas jika diakses oleh Guru atau Orang Tua? → A: Guru kelas dapat melihat seluruh daftar peringkat siswa di kelasnya tanpa penapisan `is_hidden_from_leaderboard` untuk visibilitas akademis (tetap anonim tanpa foto asli). Orang Tua melihat tampilan dari sudut pandang anak mereka dengan objek `myRank` menunjuk pada posisi anaknya.
- Q: Bagaimana tampilan Papan Peringkat Kelas bagi siswa yang mengaktifkan status tersembunyi (*opt-out*) saat membuka papan peringkatnya sendiri? → A: Siswa tersebut tetap dapat melihat papan peringkat kelasnya dan posisi dirinya sendiri di objek `myRank` dengan indikator status `"Visibilitas Anda: Tersembunyi dari Teman"`. Siswa lain tetap tidak dapat melihat siswa tersembunyi di daftar mereka.

---

## Clarified Architectural Decisions

1. **Mesin Penjadwalan & Generator Tantangan Harian**:
   - **Frekuensi Generator**: Dijalankan setiap hari pada pukul 00:00 (atau via scheduled job) untuk mempublikasikan 1 tantangan per jenjang (`TK`, `SD`, `SMP`, `SMA`).
   - **Kriteria Kurikulum**: Hanya butir soal berstatus `PUBLISHED` dari Feature 003 yang dapat dimasukkan ke dalam konfigurasi tantangan harian.
   - **Pelacakan Progres**: Mengonsumsi event `learning.session.question_answered` atau `learning.session.completed` dari Feature 004 untuk mengupdate counter progres siswa (`current_progress / target_progress`) secara real-time.

2. **Kalkulasi & Agregasi XP Papan Peringkat Kelas Mingguan**:
   - **Lingkup Terbatas**: Query XP dibatasi pada siswa yang terdaftar dalam `class_id` yang sama (`StudentClassEnrollment`). TIDAK ADA papan peringkat lintas kelas atau global.
   - **Windowing Mingguan**: Menghitung XP yang diperoleh dari tabel `xp_transactions` dalam rentang waktu `start_of_week` (Senin 00:00:00) hingga `end_of_week` (Minggu 23:59:59) sesuai zona waktu kelas/siswa.
   - **Pinning Posisi Siswa**: Query mengembalikan Top 10 siswa aktif (non-hidden) dan jika siswa yang meminta tidak berada di Top 10, menyertakan objek `my_rank` yang berisi peringkat dan XP siswa tersebut.

3. **Perlindungan Data Anak & Sistem Privasi Bertingkat (UU PDP No. 27/2022)**:
   - **Kepatuhan Data Minimization**: Payload API Papan Peringkat WAJIB HANYA mengembalikan: `rank`, `student_id` (masked/hashed atau UUID internal), `display_name` (nama tampilan/pseudonym), `avatar_token` (aset SVG/identitas visual non-foto), dan `weekly_xp`.
   - **Atribut Terlarang**: Pengembalian `full_name`, `school_name`, `age`, `birth_date`, `avatar_url` (foto asli), atau `email` pada endpoint Papan Peringkat DILARANG KERAS.
   - **Penguncian Orang Tua (Parental Lock)**: Atribut `is_privacy_locked` pada entitas `StudentPrivacySetting` yang hanya dapat diubah oleh peran `PARENT` terverifikasi.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pelacakan Progres Tantangan Harian & Klaim Hadiah Idempotent (Priority: P1)

Sebagai Siswa, saya ingin melihat 1 Tantangan Harian yang relevan dengan jenjang pendidikan saya setiap hari, melacak progres pencapaian saya secara live, dan mengklaim hadiahnya dengan aman tanpa risiko klaim ganda, agar saya termotivasi untuk belajar secara konsisten setiap hari.

**Why this priority**: Tantangan Harian adalah pendorong utama engagement harian (*daily active habit*) dan retensi siswa.

**Independent Test**:
1. Siswa jenjang SD membuka aplikasi -> API `GET /api/v1/daily-challenges/today` mengembalikan 1 tantangan SD hari itu (misal: "Selesaikan 10 soal cerita dalam 5 menit", progres 0/10).
2. Siswa menyelesaikan 6 soal cerita -> progres terupdate menjadi 6/10.
3. Siswa menyelesaikan 4 soal cerita tersisa -> status tantangan berubah menjadi `COMPLETED`.
4. Siswa menekan tombol "Klaim Hadiah" (`POST /api/v1/daily-challenges/:id/claim`) -> saldo XP / Power-up bertambah, status menjadi `CLAIMED`.
5. Mengirimkan request klaim kedua untuk tantangan yang sama pada milidetik yang sama -> backend menolak dengan error `REWARD_ALREADY_CLAIMED`.

**Acceptance Scenarios**:
1. **Given** hari kalender baru (00:00 waktu lokal), **When** siswa mengakses Tantangan Harian, **Then** sistem menyajikan tepat 1 tantangan yang digenerate khusus untuk jenjang siswa (`TK`, `SD`, `SMP`, atau `SMA`) berbasis butir soal `PUBLISHED`.
2. **Given** siswa sedang mengerjakan sesi belajar yang memenuhi kriteria tantangan, **When** butir soal dijawab benar, **Then** counter `current_progress` pada `StudentDailyChallenge` bertambah secara real-time.
3. **Given** `current_progress >= target_progress`, **When** kriteria terpenuhi, **Then** status tantangan berubah menjadi `COMPLETED` dan tombol klaim hadiah aktif.
4. **Given** status tantangan `COMPLETED`, **When** siswa mengklaim hadiah, **Then** transaksi atomik mengubah status menjadi `CLAIMED`, mengreditkan akumulasi XP/hadiah, dan mencatat timestamp `claimed_at`.
5. **Given** tantangan berstatus `CLAIMED`, **When** request klaim dikirim ulang (baik secara sengaja maupun akibat *network retry*), **Then** backend mengembalikan error 400 Bad Request (`REWARD_ALREADY_CLAIMED`) dan tidak menambahkan hadiah ganda.

---

### User Story 2 - Papan Peringkat Kelas Mingguan & Pin Posisi Siswa (Priority: P1)

Sebagai Siswa, saya ingin melihat Papan Peringkat Kelas mingguan yang menampilkan perolehan XP teman-teman sekelas saya serta posisi peringkat saya sendiri, agar saya dapat bersaing secara sehat dalam lingkungan kelas yang akrab.

**Why this priority**: Memberikan rasa kompetisi yang sehat (*friendly competition*) dalam batasan komunitas kelas yang dikenal, tanpa risiko intimidasi dari papan peringkat global.

**Independent Test**:
1. Kelas A terdiri dari 25 siswa. Siswa X berada di peringkat ke-14 dengan 350 XP mingguan.
2. Siswa X memanggil `GET /api/v1/classes/:classId/leaderboard` -> API mengembalikan 10 siswa teratas (*Top 10*) dan objek `my_rank` yang menunjukkan Siswa X berada di posisi #14 dengan 350 XP.
3. Pada hari Senin pukul 00:00 waktu lokal, cron reset berjalan -> seluruh XP mingguan di papan peringkat di-reset menjadi 0 XP untuk minggu baru.

**Acceptance Scenarios**:
1. **Given** siswa terdaftar pada suatu `class_id`, **When** membuka Papan Peringkat Kelas, **Then** backend HANYA mengambil data siswa yang terdaftar pada `class_id` tersebut.
2. **Given** daftar peringkat kelas dihitung, **When** payload API disusun, **Then** daftar mengembalikan 10 siswa teratas (*Top 10*) yang diurutkan berdasarkan `weekly_xp` secara descending.
3. **Given** siswa yang meminta API tidak masuk dalam Top 10 (misal: peringkat #15 dari 30 siswa), **When** response dikirim, **Then** objek `my_rank` secara eksplisit disertakan dalam response sehingga posisi siswa tetap terlihat di antarmuka UI.
4. **Given** hari berganti ke hari Senin pukul 00:00 waktu lokal siswa, **When** papan peringkat diakses, **Then** akumulasi XP dihitung dari rentang minggu berjalan baru dan peringkat dimulai kembali dari 0 XP.

---

### User Story 3 - Perlindungan Privasi Data Anak & Parental Lock (Priority: P1)

Sebagai Orang Tua atau Siswa yang peduli privasi, saya ingin memastikan Papan Peringkat Kelas tidak membocorkan data pribadi (nama lengkap, sekolah, umur, foto asli), serta siswa dapat menyembunyikan diri dari papan peringkat dengan opsi penguncian dari orang tua.

**Why this priority**: Merupakan syarat mutlak konstitusional (**Prinsip VII: Perlindungan Data Anak & UU PDP No. 27/2022**) untuk mencegah eksploitasi data anak dan perundungan cyber (*cyberbullying*).

**Independent Test**:
1. Memeriksa schema dan payload API `GET /api/v1/classes/:classId/leaderboard` -> mengonfirmasi TIDAK ADA field `full_name`, `school_name`, `age`, atau `avatar_url` (foto asli).
2. Siswa Y mengaktifkan toggle "Sembunyikan Saya dari Papan Peringkat" -> `PATCH /api/v1/students/me/privacy` dengan `is_hidden_from_leaderboard = true`.
3. Siswa Z (teman sekelas Siswa Y) membuka Papan Peringkat Kelas -> nama tampilan Siswa Y TIDAK MUNCUL sama sekali di daftar papan peringkat Siswa Z.
4. Orang Tua dari Siswa Y mengaktifkan *Parental Lock* (`is_leaderboard_privacy_locked = true`).
5. Siswa Y mencoba mengubah toggle privasi kembali -> backend menolak dengan error HTTP 403 `PRIVACY_SETTINGS_LOCKED_BY_PARENT`.

**Acceptance Scenarios**:
1. **Given** endpoint Papan Peringkat Kelas dipanggil, **When** JSON response dibentuk, **Then** payload HANYA berisi `rank`, `display_name`, `avatar_token`, dan `weekly_xp`. Pengembalian data sensitif pribadi dilarang keras.
2. **Given** siswa memiliki `is_hidden_from_leaderboard = true`, **When** siswa lain memanggil API Papan Peringkat Kelas, **Then** siswa tersembunyi tersebut 100% difilter dari daftar dan tidak mempengaruhi posisi siswa lain.
3. **Given** orang tua mengaktifkan penguncian privasi (`is_leaderboard_privacy_locked = true`), **When** siswa mengirim request update pengaturan privasi, **Then** backend memverifikasi status kunci dan menolak request dengan HTTP 403 Forbidden.
4. **Given** siswa yang tersembunyi membuka papan peringkatnya sendiri, **When** response diterima, **Then** API mengembalikan indikator `is_self_hidden: true` dan menyajikan papan peringkat kelas tanpa mencantumkan dirinya di tampilan siswa lain.

---

### User Story 4 - Penjadwalan Otomatis Tantangan Harian Berbasis Soal PUBLISHED (Priority: P2)

Sebagai Sistem, saya ingin secara otomatis membuat 1 tantangan harian per jenjang pendidikan setiap hari yang terdiri dari butir soal berstatus `PUBLISHED`, agar konten tantangan selalu segar dan terjamin kualitasnya.

**Why this priority**: Menjamin keberlanjutan operasional konten harian tanpa intervensi manual tim admin setiap hari.

**Independent Test**:
1. Memastikan database memuat butir soal dengan berbagai status (`DRAFT`, `REVIEW`, `PUBLISHED`).
2. Menjalankan generator tantangan harian -> generator HANYA memilih soal berstatus `PUBLISHED` dan mengelompokkannya sesuai jenjang (`TK`, `SD`, `SMP`, `SMA`).
3. Memverifikasi bahwa setiap jenjang mendapatkan tepat 1 tantangan aktif untuk tanggal kalender tersebut.

**Acceptance Scenarios**:
1. **Given** generator tantangan harian dieksekusi untuk tanggal baru, **When** query pemilihan soal berjalan, **Then** hanya butir soal dengan status `PUBLISHED` pada Kurikulum Merdeka yang dipilih.
2. **Given** 4 jenjang pendidikan (`TK`, `SD`, `SMP`, `SMA`), **When** proses eksekusi selesai, **Then** terbentuk 4 entitas `DailyChallenge` aktif untuk masing-masing jenjang.

---

### Edge Cases

- **Siswa Pindah Kelas di Tengah Minggu**: XP mingguan siswa tetap tercatat pada akun siswa, namun pada papan peringkat kelas, XP siswa dihitung untuk `class_id` tempat ia terdaftar saat ini.
- **Siswa Baru Masuk Kelas**: Siswa baru yang belum memiliki transaksi XP mingguan muncul di bagian terbawah papan peringkat dengan 0 XP.
- **Dua Siswa Memiliki Total XP Mingguan Sama**: Siswa yang mencapai jumlah XP tersebut lebih awal (*earlier timestamp*) menduduki peringkat lebih tinggi (*tie-breaking rule*).
- **Tidak Ada Soal PUBLISHED Cukup untuk Jenjang Tertentu**: Generator menggunakan *fallback template challenge* berbasis kriteria penyelesaian sesi standar (misal: "Selesaikan 2 sesi belajar jenjang SD") agar tantangan harian tetap tersedia.
- **Siswa Bertukar Zona Waktu saat Klaim Tantangan**: Sistem menggunakan zona waktu lokal yang tersimpan di profil siswa saat request dilakukan untuk menentukan tanggal batas klaim.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Tantangan Harian (Daily Challenges)
- **FR-001**: Sistem MUST menggenerasi tepat 1 (satu) Tantangan Harian per jenjang pendidikan (`TK`, `SD`, `SMP`, `SMA`) per hari kalender.
- **FR-002**: Butir soal yang digunakan dalam Tantangan Harian MUST berasal secara eksklusif dari soal berstatus `PUBLISHED`.
- **FR-003**: Sistem MUST mencatat dan menyajikan progres berjalan siswa untuk tantangan hari ini (misal: `6/10` soal diselesaikan).
- **FR-004**: Sistem MUST menyediakan endpoint bagi siswa untuk mengklaim hadiah penyelesaian Tantangan Harian (`POST /api/v1/daily-challenges/:id/claim`).
- **FR-005**: Penanganan klaim hadiah MUST bersifat *atomic* dan *idempotent*; hadiah untuk tantangan harian yang sama TIDAK DAPAT diklaim lebih dari satu kali oleh siswa yang sama.

#### Papan Peringkat Kelas (Class Leaderboard)
- **FR-006**: Papan Peringkat Kelas MUST dibatasi lingkupnya HANYA pada anggota kelas yang sama (`class_id`). Papan peringkat global lintas sekolah DILARANG.
- **FR-007**: Papan Peringkat Kelas MUST dihitung berdasarkan perolehan XP mingguan dalam periode berjalan (Senin 00:00:00 hingga Minggu 23:59:59 waktu lokal siswa).
- **FR-008**: Endpoint Papan Peringkat Kelas MUST menyajikan Top 10 siswa teratas dalam kelas.
- **FR-009**: Endpoint Papan Peringkat Kelas MUST SELALU menyertakan posisi/peringkat siswa yang sedang meminta (*current student's pinned rank*), meskipun siswa tersebut berada di luar 10 besar (misal: posisi #18).
- **FR-010**: Pemecah seri peringkat (*tie-breaking*) MUST mengutamakan siswa yang mencapai perolehan XP tersebut lebih awal.

#### Perlindungan Data Anak & Pengaturan Privasi
- **FR-011**: Endpoint Papan Peringkat Kelas MUST NOT pernah mengembalikan nama lengkap (`full_name`), nama sekolah (`school_name`), umur/tanggal lahir (`age`/`birth_date`), atau URL foto asli (`avatar_url`).
- **FR-012**: Response Papan Peringkat Kelas MUST HANYA mengembalikan nama tampilan (`display_name`), token avatar visual non-foto (`avatar_token`), peringkat (`rank`), dan total XP mingguan (`weekly_xp`).
- **FR-013**: Sistem MUST menyediakan pengaturan visibilitas bagi siswa untuk menyembunyikan diri (*opt-out*) dari papan peringkat kelas (`is_hidden_from_leaderboard`).
- **FR-014**: Siswa yang mengaktifkan status tersembunyi (`is_hidden_from_leaderboard = true`) MUST NOT muncul dalam respons API papan peringkat kelas milik siswa lain.
- **FR-015**: Sistem MUST menyediakan mekanisme penguncian dari orang tua (*Parental Lock*) `is_leaderboard_privacy_locked`. Jika diaktifkan oleh orang tua, siswa DILARANG mengabaikan atau mengubah status visibilitas papan peringkat tanpa persetujuan orang tua.

#### Pembatasan Ruang Lingkup (Out of Scope Enforcement)
- **FR-016**: Sistem MUST NOT menyediakan fitur pertemanan (*friendship*) antar-siswa.
- **FR-017**: Sistem MUST NOT menyediakan pesan langsung / obrolan (*direct messaging / chat*) antar-siswa.
- **FR-018**: Sistem MUST NOT menyediakan papan peringkat global (*global leaderboard*) atau turnamen antar-sekolah (*inter-school tournaments*).

---

### Key Entities

- **DailyChallenge**: Menyimpan master data tantangan harian per jenjang.
  - `id`: UUID
  - `education_level`: Enum (`TK`, `SD`, `SMP`, `SMA`)
  - `challenge_date`: Date (`YYYY-MM-DD`)
  - `title`: String (misal: "Selesaikan 10 soal cerita dalam 5 menit")
  - `description`: Text
  - `target_type`: Enum (`QUESTION_COUNT`, `LESSON_COUNT`, `ACCURACY_TARGET`)
  - `target_value`: Int (misal: 10)
  - `reward_xp`: Int
  - `reward_powerup_type`: Optional Enum (`HINT_TOKEN`, `STREAK_FREEZE`)
  - `reward_powerup_qty`: Int
  - `created_at`: Timestamp

- **StudentDailyChallenge**: Pelacakan progres dan status klaim tantangan harian per siswa.
  - `id`: UUID
  - `student_id`: UUID (FK to Student)
  - `challenge_id`: UUID (FK to DailyChallenge)
  - `current_progress`: Int (default: 0)
  - `status`: Enum (`IN_PROGRESS`, `COMPLETED`, `CLAIMED`)
  - `completed_at`: Nullable Timestamp
  - `claimed_at`: Nullable Timestamp

- **StudentPrivacySetting**: Pengaturan privasi dan penguncian orang tua untuk akun siswa.
  - `student_id`: UUID (PK, FK to Student)
  - `is_hidden_from_leaderboard`: Boolean (default: false)
  - `is_privacy_locked`: Boolean (default: false, hanya dapat diubah oleh peran PARENT)
  - `updated_at`: Timestamp

- **ClassLeaderboardCache / Snapshot**: Structure snapshot agregasi mingguan XP per kelas.
  - `class_id`: UUID
  - `student_id`: UUID
  - `weekly_xp`: Int
  - `rank`: Int
  - `week_start_date`: Date

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Response API Papan Peringkat Kelas (`GET /api/v1/classes/:classId/leaderboard`) 100% bebas dari atribut data pribadi (0% kebocoran nama lengkap, sekolah, umur, atau foto asli).
- **SC-002**: Siswa dengan status `is_hidden_from_leaderboard = true` memiliki 0% kemunculan dalam respons API Papan Peringkat Kelas yang dipanggil oleh siswa lain.
- **SC-003**: 100% uji coba klaim hadiah Tantangan Harian ganda secara simultan (*concurrent claim*) menghasilkan tepat 1 transaksi sukses dan menolak request berikutnya dengan HTTP 400 (`REWARD_ALREADY_CLAIMED`).
- **SC-004**: Papan Peringkat Kelas menyajikan Top 10 dan posisi siswa sendiri (*pinned student rank*) dengan waktu respon API di bawah 200ms pada kondisi 1.000 siswa per kelas.
- **SC-005**: Pengaturan visibilitas papan peringkat yang terkunci oleh orang tua (*parental lock*) menolak 100% percobaan perubahan oleh akun siswa dengan HTTP 403 Forbidden.

---

## Assumptions & Scope Boundaries

### Assumptions
- Setiap siswa terdaftar pada setidaknya 1 `class_id` resmi di bawah institusi/sekolah mereka.
- Butir soal Kurikulum Merdeka yang dipublikasikan (`status = 'PUBLISHED'`) melalui Feature 003 tersedia dalam jumlah yang cukup untuk membentuk variasi tantangan harian.
- Waktu reset mingguan papan peringkat dan harian tantangan dihitung berdasarkan zona waktu lokal yang tersimpan pada profil siswa (default: `Asia/Jakarta`).

### Scope Boundaries
- **Pertemanan (Friends)**: Tidak ada fitur menambah teman, mengikuti (*follow*), atau melihat profil siswa lain.
- **Pesan Antar-Siswa (Direct Messaging)**: Tidak ada fitur ruang percakapan, obrolan teks, atau komentar antar-siswa.
- **Papan Peringkat Global**: Tidak ada papan peringkat tingkat nasional, provinsi, atau lintas sekolah.
- **Turnamen Antar-Sekolah**: Tidak ada sistem kompetisi terstruktur atau bracket turnamen antar-sekolah.
