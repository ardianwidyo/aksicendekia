# Feature Specification: Mesin Sesi Belajar AksiCendekia — Inti Produk

**Feature Branch**: `004-learning-session-engine`

**Created**: 2026-08-27 | **Last Clarified**: 2026-08-27

**Status**: Clarified & Approved

**Input**: User description: "Mesin sesi belajar AksiCendekia — inti produk. Alur: siswa memilih pelajaran → sistem membuat sesi → menyajikan butir soal satu per satu → siswa menjawab → sistem menilai dan memberi umpan balik langsung → sesi selesai → layar hasil. Kebutuhan: 1. Pembuatan sesi: server yang menentukan urutan dan komposisi butir soal, bukan client. Client tidak pernah menerima kunci jawaban sebelum menjawab. 2. Penilaian di server. Untuk isian singkat, pencocokan toleran terhadap beda spasi, kapital, dan variasi ejaan yang telah didaftarkan. 3. Umpan balik langsung setelah tiap jawaban: benar/salah, pembahasan, dan opsi melihat petunjuk. Sesuai DESIGN.md, elemen jawaban 'menekan' saat dipilih dan warna emerald khusus untuk jawaban benar. 4. Sesi dapat dijeda dan dilanjutkan. Sesi yang ditinggalkan lebih dari 24 jam otomatis kedaluwarsa. 5. Layar hasil: skor, jumlah benar/salah, waktu pengerjaan, daftar soal yang salah beserta pembahasan, tombol ulangi dan lanjut. 6. Setiap peristiwa sesi (mulai, jawab, selesai) menerbitkan event terstruktur yang akan dikonsumsi Feature 005. Definisikan kontrak event-nya sekarang. 7. Riwayat sesi per siswa dapat dibaca ulang. Di luar cakupan: XP, level, streak, badge, power-up, papan peringkat, tantangan harian — semuanya Feature 005 dan 006. Feature ini hanya menerbitkan event, tidak menghitung reward. Kriteria selesai: memanggil API sesi secara langsung tidak pernah mengembalikan kunci jawaban butir soal yang belum dijawab; skor yang dikirim dari client diabaikan sepenuhnya; sesi yang sama tidak dapat diselesaikan dua kali untuk menerbitkan event ganda."

---

## Executive Summary & Background Context

AksiCendekia adalah platform belajar bergamifikasi untuk siswa TK, SD, SMP, dan SMA. Setelah membangun sistem identitas (`002-auth-multi-role`) dan model data kurikulum (`003-content-curriculum-cms`), platform memerlukan **Mesin Sesi Belajar (Learning Session Engine)** sebagai inti interaktif dari pengalaman belajar siswa (*core product engine*).

Fitur `004-learning-session-engine` mengimplementasikan siklus hidup lengkap sesi belajar interaktif: mulai dari inisialisasi sesi terkendali di server (*server-driven composition*), penyajian soal secara sekuensial dengan jaminan **Zero Key Answer Leakage (Anti-Cheat Strict)**, penilaian jawaban di backend dengan dukungan pencocokan toleran (*normalized matching*) untuk isian singkat, umpan balik visual & pedagogis instan (petunjuk bertingkat dan pembahasan) yang mengikuti **DESIGN.md (Tactile UI & Emerald Theme)**, fitur jeda/lanjutkan (*pause/resume*) dan penghancuran sesi otomatis setelah 24 jam (*auto-expire*), layar hasil evaluasi akhir yang komprehensif, publikasi **Domain Events terstruktur** untuk dikonsumsi oleh mesin gamifikasi (`005-gamification-rewards`), serta pembacaan ulang riwayat sesi belajar per siswa.

Fitur ini dirancang dengan mematuhi penuh **Konstitusi AksiCendekia Prinsip I (Kebebasan Belajar & Pengalaman Ramah Anak)**, **Prinsip II (Clean Architecture)**, **Prinsip IV (Keamanan & Anti-Cheat Strict)**, **Prinsip V/VI (Frontend Next.js App Router & Tactile Design System)**, dan **Prinsip VIII (Integritas Konten Kurikulum)**.

---

## Clarifications

### Session 2026-08-27

- Q: Bagaimana penanganan kegagalan jaringan saat siswa mengirimkan jawaban butir soal di tengah sesi belajar? → A: Klien menampilkan toast/modal koneksi terputus dan menyediakan tombol "Coba Lagi" yang mengirim ulang payload jawaban dengan `Idempotency-Key` yang sama tanpa membuat record baru di backend.

---

## Clarified Architectural Decisions

1. **Server-Driven Session Composition & Anti-Cheat Strict**:
   - **Komposisi & Urutan di Server**: Klien (`apps/web`) TIDAK pernah memilih atau menentukan daftar/urutan butir soal. Ketika siswa memulai pelajaran, backend (`apps/api`) mengambil butir soal berstatus `PUBLISHED` dari `003-content-curriculum-cms`, mengacak/menyusun urutan berdasarkan aturan server, dan menginisialisasi rekaman `LearningSession`.
   - **Zero Key Answer Leakage**: Endpoint baca sesi atau penyajian soal (`GET /api/v1/sessions/:id/current` / `GET /api/v1/sessions/:id`) secara ketat membuang (*strip/omit*) bidang `correct_option_id`, `accepted_answers`, `matching_mode`, `matching_pairs` (kunci jawaban sah), serta pembahasan (`explanation`) dari payload JSON. Kunci jawaban dan pembahasan HANYA dikirimkan dalam respons payload SETELAH siswa melakukan submisi jawaban untuk soal tersebut (`POST /api/v1/sessions/:id/answers`).
   - **Abaikan Skor Klien**: Skor, nilai persentase, atau status kebenaran yang dikirim oleh klien diabaikan 100%. Backend menghitung dan mencatat hasil evaluasi secara mandiri.

2. **Algoritma Penilaian Toleran Isian Singkat (`SHORT_ANSWER`)**:
   - Evaluasi dilakukan di backend dengan tiga mode pencocokan:
     - `EXACT`: Pencocokan teks persis (*case-sensitive*, spasi persis).
     - `CASE_INSENSITIVE`: Mengabaikan perbedaan huruf besar/kecil.
     - `NORMALIZED`: Pemangkasan spasi ganda/awal/akhir (`trim` & `collapse spaces`), konversi huruf kecil (`lowercase`), pembersihan tanda baca periferal (titik/koma/tanda tanya di akhir string), penormalan diakritik/aksen (NFD Unicode normalization), serta pencocokan terhadap seluruh daftar variasi ejaan terdaftar (`accepted_answers`).

3. **Umpan Balik Instan & Tactile Design System (Sesuai `DESIGN.md`)**:
   - **Umpan Balik Instan**: Setelah submisi jawaban, respons backend mengembalikan status (`is_correct`), pembahasan lengkap (`explanation`), dan kunci jawaban sah.
   - **Petunjuk Bertingkat (Tiered Hints)**: Siswa dapat meminta petunjuk via `POST /api/v1/sessions/:id/hints`. Backend memberikan petunjuk urutan berikutnya dan mencatat jumlah petunjuk yang digunakan (`hint_used_count`).
   - **Tactile UI (Elemen Menekan)**: Komponen tombol jawaban di `apps/web` mengimplementasikan efek taktil "depress" (bayangan 3D 4px di bagian bawah menghilang dan `transform: translateY(2px)` saat tombol dipilih/ditekan).
   - **Warna Emerald Khusus**: Warna status benar secara eksklusif menggunakan **Emerald / Success (`#00855b` / `#6ffbbe` / `bg-emerald-600`)**, sedangkan jawaban salah menggunakan warna **Error / Rose (`#ba1a1a` / `bg-rose-600`)**.

4. **Siklus Hidup Sesi (Pause, Resume, & 24h Auto-Expire)**:
   - Sesi memiliki status: `IN_PROGRESS`, `PAUSED`, `COMPLETED`, `EXPIRED`.
   - Siswa dapat menjeda sesi via `POST /api/v1/sessions/:id/pause` (status berubah menjadi `PAUSED`). Mengakses kembali atau menekan tombol lanjutkan memanggil `POST /api/v1/sessions/:id/resume` (status kembali `IN_PROGRESS`).
   - Sesi yang ditinggalkan tanpa aktivitas selama lebih dari 24 jam (`now - last_activity_at > 24 hours` atau `now > expires_at`) otomatis dinyatakan `EXPIRED` melalui evaluasi *lazy-check* saat request tiba atau pembersihan tugas latar belakang (*cron job*). Sesi berstatus `EXPIRED` atau `COMPLETED` ditolak dari submisi jawaban baru.

5. **Layar Hasil & Perlindungan Ganda (Double-Completion Guard & Idempotency)**:
   - Setelah soal terakhir dijawab, sesi ditandai `COMPLETED`. Layar hasil menyajikan: skor persentase (0–100%), jumlah benar & salah, total waktu pengerjaan (detik/menit), serta daftar soal yang dijawab salah lengkap dengan jawaban siswa, kunci jawaban benar, dan pembahasan.
   - **Idempotency Completion**: Memanggil endpoint penyelesaian atau memproses ulang sesi yang sudah `COMPLETED` bersifat *idempotent*—mengembalikan data hasil yang sudah tersimpan tanpa menerbitkan *Domain Events* ganda ke Feature 005.

6. **Kontrak Domain Events (Terintegrasi ke Feature 005 & Outbox Pattern)**:
   - Setiap peristiwa sesi diterbitkan secara asynchronous menggunakan **Transactional Outbox Pattern** ke Event Bus dengan schema JSON terstruktur:
     - `learning.session.started`
     - `learning.session.question_answered`
     - `learning.session.completed`
     - `learning.session.expired`
   - Fitur 004 HANYA menerbitkan event dan TIDAK menghitung XP, level, streak, badge, atau papan peringkat (di luar cakupan).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inisialisasi Sesi Belajar & Penyajian Soal Sekuensial Aman (Priority: P1)

Sebagai Siswa, saya ingin memilih sebuah pelajaran yang terbuka dan memulai sesi belajar, di mana server menyusun komposisi butir soal dan menyajikannya satu per satu secara sekuensial tanpa membocorkan kunci jawaban di peramban, agar proses belajar berjalan adil, terstruktur, dan bebas dari kecurangan.

**Why this priority**: Merupakan langkah awal dari alur inti produk (*learning engine*). Tanpa pembentukan sesi terkontrol di server dan isolasi kunci jawaban, seluruh sesi belajar rentan terhadap inspeksi jaringan (*inspect element/network tools*) dan pembocoran kunci jawaban.

**Independent Test**:
1. Siswa X memilih Pelajaran A yang terbuka via `POST /api/v1/sessions` -> backend membuat `LearningSession` baru berstatus `IN_PROGRESS` dan mengembalikan metadata sesi beserta butir soal pertama (`current_question_index: 0`).
2. Menginspeksi respons JSON untuk butir soal pertama -> memverifikasi bahwa properti `correct_option_id`, `accepted_answers`, `matching_mode`, `matching_pairs`, dan `explanation` **TIDAK ADA** (di-strip).
3. Mengakses API sesi dari Postman / Curl -> memverifikasi tidak ada endpoint yang mengembalikan kunci jawaban sebelum submisi dilakukan.

**Acceptance Scenarios**:
1. **Given** siswa memilih pelajaran valid dan terbuka, **When** menekan tombol "Mulai Belajar", **Then** server membuat sesi belajar baru (`status: IN_PROGRESS`, `expires_at: now + 24h`) dan menyajikan soal nomor 1 tanpa kunci jawaban.
2. **Given** peramban siswa menerima payload butir soal aktif, **When** data diurai oleh peramban atau diinspeksi di DevTools Network Tab, **Then** kunci jawaban benar, pembahasan, dan seluruh opsi pencocokan backend tidak ditemukan dalam payload JSON.
3. **Given** siswa mencoba mengirimkan parameter `score` atau `is_correct` dari client saat membuat/memperbarui sesi, **When** request diterima backend, **Then** backend mengabaikan input skor client dan tetap menggunakan perhitungan internal server.

---

### User Story 2 - Penilaian Server, Tolerance Matching Isian Singkat, & Feedback Visual Taktil (Priority: P1)

Sebagai Siswa, saya ingin menjawab butir soal (Pilihan Ganda, Isian Singkat, atau Mencocokkan Pasangan), mendapatkan penilaian yang adil di server (termasuk toleransi ejaan/spasi pada isian singkat), serta menerima umpan balik taktil interaktif dan penjelasan langsung, agar saya bisa memahami kesalahan dan belajar dengan cepat.

**Why this priority**: Inti interaksi pembelajaran (*learning feedback loop*). Umpan balik langsung yang mendidik dengan UI taktil memicu keterlibatan aktif siswa.

**Independent Test**:
1. Memilih opsi pada soal Pilihan Ganda -> tombol memperlihatkan animasi "depress" (menekan 2px).
2. Mengirimkan jawaban via `POST /api/v1/sessions/:id/answers` dengan header `Idempotency-Key` -> backend mengembalikan status `is_correct`, kunci jawaban sah, dan pembahasan.
3. Menguji soal Isian Singkat dengan kunci jawaban "Pancasila": memasukkan input `"  pancasila  "` dengan mode `NORMALIZED` -> backend mengembalikan `is_correct: true`.
4. Jika jawaban benar, elemen opsi berubah warna menjadi **Emerald (`#00855b`)**; jika salah, opsi yang dipilih berwarna **Rose/Error (`#ba1a1a`)** dan opsi yang benar ditandai warna Emerald.

**Acceptance Scenarios**:
1. **Given** siswa memilih jawaban pada soal Pilihan Ganda, **When** menglik opsi, **Then** tombol mengalami animasi visual "depress" (bayangan bawah memendek dan elemen bergerak 2px ke bawah).
2. **Given** soal tipe Isian Singkat dengan kunci terdaftar `["Soekarno", "Ir. Soekarno"]` mode `NORMALIZED`, **When** siswa memasukkan `" ir.  soekarno  "`, **Then** server menilai jawaban sebagai `is_correct: true`.
3. **Given** jawaban siswa telah dinilai di server, **When** umpan balik ditampilkan, **Then** jawaban benar diberi highlight warna Emerald khusus (`#00855b`), pembahasan (`explanation`) ditampilkan, dan tombol "Soal Berikutnya" terbuka.
4. **Given** siswa menekan tombol "Minta Petunjuk", **When** endpoint `/hints` dipanggil, **Then** backend mengembalikan petunjuk tingkat 1, mencatat `hint_used_count`, dan menyajikannya di UI.

---

### User Story 3 - Jeda Sesi, Lanjutkan, & Auto-Expire 24 Jam (Priority: P2)

Sebagai Siswa, saya ingin dapat menjeda sesi belajar saat ada keperluan lain dan melanjutkannya kembali nanti, namun sesi yang saya tinggalkan lebih dari 24 jam akan kedaluwarsa secara otomatis, agar progres belajar saya tersimpan dengan aman tanpa menggantung sesi lama selamanya.

**Why this priority**: Menjamin fleksibilitas pengalaman belajar siswa dalam kehidupan sehari-hari sekaligus menjaga kebersihan status database dari sesi-sesi terbengkalai.

**Independent Test**:
1. Siswa memulai sesi dan menjawab 2 dari 5 soal, lalu menekan "Jeda Sesi" -> `POST /api/v1/sessions/:id/pause` mengubah status menjadi `PAUSED`.
2. Siswa kembali ke aplikasi 1 jam kemudian dan menekan "Lanjutkan Belajar" -> `POST /api/v1/sessions/:id/resume` mengembalikan sesi ke `IN_PROGRESS` pada soal nomor 3.
3. Mensimulasikan sesi yang ditinggalkan 25 jam (mengubah `last_activity_at` di database) -> request submisi jawaban atau akses sesi berikutnya mengembalikan error `SESSION_EXPIRED` (409 Conflict) dan status sesi di DB diperbarui menjadi `EXPIRED`.

**Acceptance Scenarios**:
1. **Given** sesi sedang berlangsung (`IN_PROGRESS`), **When** siswa menekan tombol "Jeda", **Then** status sesi berubah menjadi `PAUSED`, waktu jeda dicatat, dan siswa dapat kembali ke dasbor utama.
2. **Given** sesi berstatus `PAUSED`, **When** siswa membuka kembali halaman sesi dalam kurun waktu < 24 jam, **Then** sesi melanjutkan dari posisi butir soal terakhir yang belum dijawab (`current_question_index`).
3. **Given** sesi yang ditinggalkan lebih dari 24 jam sejak aktivitas terakhir, **When** siswa mencoba mengakses atau menjawab sesi tersebut, **Then** server mengubah status sesi menjadi `EXPIRED`, menolak submisi jawaban, dan menerbitkan event `learning.session.expired`.

---

### User Story 4 - Layar Hasil Belajar & Anti-Double Completion (Priority: P1)

Sebagai Siswa, saya ingin melihat ringkasan hasil belajar lengkap setelah menjawab soal terakhir (skor akhir, jumlah benar/salah, total waktu pengerjaan, dan ulasan soal salah), serta dapat memilih untuk mengulangi sesi atau melanjutkan ke pelajaran berikutnya, agar saya mendapatkan rasa pencapaian (*sense of achievement*) yang jelas.

**Why this priority**: Menutup siklus sesi belajar dengan evaluasi transparan dan memberikan opsi aksi (*Retake / Next Lesson*) bagi siswa.

**Independent Test**:
1. Menjawab butir soal terakhir pada sesi -> backend otomatis menyelesaikan sesi (`status: COMPLETED`) atau memproses `POST /api/v1/sessions/:id/complete`.
2. Backend menghitung skor persentase secara akurat: `(jumlah_benar / total_soal) * 100`.
3. Memanggil kembali endpoint `complete` untuk sesi yang sudah `COMPLETED` -> mengembalikan data ringkasan yang sama tanpa mengubah data atau memicu event ganda (*idempotent*).
4. Menekan "Ulangi Sesi" membuat sesi belajar baru (`session_v2`); menekan "Lanjut" mengarahkan ke halaman detail pelajaran berikutnya.

**Acceptance Scenarios**:
1. **Given** siswa telah menjawab butir soal terakhir, **When** submisi berhasil, **Then** sesi berstatus `COMPLETED`, dan sistem mengarahkan siswa ke Layar Hasil.
2. **Given** Layar Hasil terbuka, **When** komponen me-render data, **Then** layar menampilkan skor persentase (0–100%), jumlah benar & salah, total durasi pengerjaan, serta daftar butir soal yang salah lengkap dengan jawaban siswa dan pembahasan benar.
3. **Given** endpoint penyelesaian sesi dipanggil lebih dari satu kali (akibat pengulangan request network), **When** backend memprosesnya, **Then** backend mengembalikan hasil ringkasan yang ada tanpa menerbitkan event `learning.session.completed` kedua kalinya.

---

### User Story 5 - Menerbitkan Structured Domain Events untuk Mesin Gamifikasi Feature 005 (Priority: P1)

Sebagai Pengembang Sistem & Integration Consumer (Feature 005), saya ingin Mesin Sesi Belajar menerbitkan event terstruktur yang valid (`started`, `question_answered`, `completed`, `expired`) ke Outbox/Event Bus saat peristiwa sesi terjadi, agar sistem Gamifikasi dapat menghitung XP, level, streak, dan badge secara terpisah tanpa kopling ketat.

**Why this priority**: Memastikan arsitektur terdekoppel (*decoupled architecture*) sesuai prinsip Event-Driven Design dan Konstitusi AksiCendekia Prinsip II & IV.

**Independent Test**:
1. Menginisialisasi sesi baru -> memeriksa tabel `OutboxEvents` / Event Bus -> terbit event `learning.session.started` dengan payload JSON valid.
2. Menjawab satu soal -> terbit event `learning.session.question_answered` membawa metadata `is_correct`, `time_spent_seconds`, dan `hint_used_count`.
3. Menyelesaikan sesi -> terbit event `learning.session.completed` membawa `score`, `correct_count`, dan `total_duration_seconds`.
4. Memverifikasi bahwa Feature 004 **TIDAK MENAMBAHKAN** kolom/tabel XP atau badge pada basis data internalnya.

**Acceptance Scenarios**:
1. **Given** sesi belajar dibuat, dijawab, atau diselesaikan, **When** peristiwa terjadi di backend, **Then** record event terstruktur secara otomatis ditulis ke tabel `OutboxEvent` dalam satu transaksi database atomik.
2. **Given** event `learning.session.completed` diterbitkan, **When** payload JSON diperiksa, **Then** payload memuat `session_id`, `student_id`, `lesson_id`, `subject_id`, `score`, `total_questions`, `correct_count`, `incorrect_count`, `total_duration_seconds`, dan `timestamp`.

---

### User Story 6 - Pembacaan Riwayat Sesi Belajar Siswa (Priority: P2)

Sebagai Siswa, saya ingin melihat daftar riwayat sesi belajar yang telah saya ikuti sebelumnya beserta detail skor dan ulasan soalnya, agar saya dapat mengevaluasi perkembangan belajar mandiri saya dari waktu ke waktu.

**Why this priority**: Memberikan transparansi riwayat belajar dan memungkinkan siswa meninjau kembali pembahasan soal pada sesi terdahulu.

**Independent Test**:
1. Siswa X memanggil `GET /api/v1/students/me/sessions` -> backend mengembalikan daftar paginasi sesi belajar siswa (status `COMPLETED` dan `EXPIRED`).
2. Siswa X memanggil `GET /api/v1/sessions/:id/history` -> backend mengembalikan rincian butir soal yang dijawab, jawaban siswa, dan pembahasan pada sesi tersebut.

**Acceptance Scenarios**:
1. **Given** siswa yang telah menyelesaikan beberapa sesi belajar, **When** membuka tab Riwayat Belajar, **Then** daftar sesi ditampilkan terurut dari yang terbaru (memuat nama pelajaran, tanggal, skor akhir, dan durasi).
2. **Given** siswa memilih salah satu riwayat sesi dari daftar, **When** memanggil API detail riwayat, **Then** backend menyajikan rincian lengkap butir soal, jawaban yang dipilih siswa, kunci jawaban benar, dan pembahasan.

---

### Edge Cases & Defensive Engineering

- **Disconnect / Browser Refresh saat Sesi Berlangsung**: Jika siswa menyegarkan peramban atau koneksi terputus di tengah sesi, memanggil `GET /api/v1/sessions/active` mengembalikan sesi `IN_PROGRESS` terakhir beserta posisi `current_question_index` tanpa menghilangkan jawaban yang sudah tersimpan.
- **Submisi Jawaban Ganda (Network Spam / Double Click)**: Header `Idempotency-Key` mencegah pembuatan jawaban ganda untuk soal yang sama dalam satu sesi.
- **Pelajaran Di-archive atau Di-unpublish saat Sesi Berlangsung**: Jika Admin mengarsipkan pelajaran ketika siswa sedang mengerjakan sesi, sesi yang sedang berjalan tetap diperbolehkan selesai hingga akhir, namun tidak dapat di-retake (`session_v2` ditolak).
- **Submisi Jawaban pada Sesi yang Sudah Expired**: Mengembalikan HTTP 409 Conflict dengan pesan `"Session has expired after 24 hours of inactivity"`.

---

## Functional Requirements

- **FR-001**: System MUST create a new `LearningSession` record via server-side composition upon student request for a published and unlocked lesson.
- **FR-002**: System MUST shuffle or order published questions on the server during session creation and retain the question sequence for the lifetime of that session.
- **FR-003**: System MUST strictly omit all answer keys (`correct_option_id`, `accepted_answers`, `matching_pairs`), grading thresholds, and explanations from session state and active question APIs prior to student submission (*Zero Key Answer Leakage*).
- **FR-004**: System MUST perform answer evaluation exclusively on the backend and MUST completely ignore any score, result, or evaluation data supplied by the client payload.
- **FR-005**: System MUST support three question grading modes on the server:
  - `MULTIPLE_CHOICE`: Match selected option ID against the correct option ID.
  - `SHORT_ANSWER`: Grade string inputs against `accepted_answers` using `EXACT`, `CASE_INSENSITIVE`, or `NORMALIZED` (trim whitespace, lowercasing, strip punctuation, NFD diacritic removal) matching algorithms.
  - `MATCHING_PAIRS`: Validate item pair associations against defined correct mappings.
- **FR-006**: System MUST enforce idempotency on answer submission requests using the `Idempotency-Key` HTTP header (UUIDv4) to prevent duplicate answer records or state corruption.
- **FR-007**: System MUST provide immediate feedback upon valid answer submission containing correctness status (`is_correct`), the correct answer key, and pedagogical explanation (`explanation`).
- **FR-008**: System MUST support tiered hint requests (`POST /api/v1/sessions/:id/hints`), revealing hints sequentially and tracking `hint_used_count` per question.
- **FR-009**: System UI MUST render interactive option buttons with a tactile "depress" effect (bottom shadow disappears and 2px Y-translation on press) per `DESIGN.md`.
- **FR-010**: System UI MUST use Emerald (`#00855b`) exclusively for correct answer highlights and Rose/Red (`#ba1a1a`) for incorrect answer highlights.
- **FR-011**: System MUST support explicit session pause (`PAUSED`) and resume (`IN_PROGRESS`) operations.
- **FR-012**: System MUST automatically transition sessions left inactive for > 24 hours to `EXPIRED` status and prohibit further submissions.
- **FR-013**: System MUST compute final session scores as `(correct_count / total_questions) * 100` upon session completion and render the Summary Screen.
- **FR-014**: System MUST guarantee double-completion protection (idempotent completion) so that calling completion endpoint multiple times returns existing summary without duplicate event publication.
- **FR-015**: System MUST publish structured JSON Domain Events (`learning.session.started`, `learning.session.question_answered`, `learning.session.completed`, `learning.session.expired`) via Transactional Outbox Pattern for downstream consumption by Feature 005.
- **FR-016**: Feature 004 MUST NOT compute or mutate user XP, levels, streaks, badges, power-ups, daily challenges, or leaderboard positions.
- **FR-017**: System MUST provide student session history endpoints (`GET /api/v1/students/me/sessions` and `GET /api/v1/sessions/:id/history`) supporting paginated read-back of completed and expired sessions.

---

## Data Model Architecture

```
                                  +-----------------------+
                                  |        User           |
                                  | (Role: SISWA)         |
                                  +-----------+-----------+
                                              | 1
                                              |
                                              | *
                                  +-----------v-----------+
                                  |    LearningSession    |
                                  +-----------------------+
                                  | id (PK UUID)          |
                                  | student_id (FK)       |
                                  | lesson_id (FK)        |
                                  | status (ENUM)         |
                                  | current_index (INT)   |
                                  | total_questions (INT) |
                                  | correct_count (INT)   |
                                  | score (DECIMAL)       |
                                  | started_at (DATETIME) |
                                  | last_activity_at      |
                                  | expires_at (DATETIME) |
                                  | completed_at (DATE)   |
                                  +-----------+-----------+
                                              |
                                     +--------+--------+
                                     | 1               | 1
                                     |                 |
                                     | *               | *
                         +-----------v-----------+   +-v---------------------+
                         | SessionQuestionOrder  |   |     SessionAnswer     |
                         +-----------------------+   +-----------------------+
                         | id (PK UUID)          |   | id (PK UUID)          |
                         | session_id (FK)       |   | session_id (FK)       |
                         | question_id (FK)      |   | question_id (FK)      |
                         | sequence_order (INT)  |   | student_answer (JSON) |
                         +-----------------------+   | is_correct (BOOL)     |
                                                     | hint_used_count (INT) |
                                                     | time_spent_sec (INT)  |
                                                     | submitted_at (DATE)   |
                                                     +-----------------------+
```

### Prisma Schema Definitions (`packages/database/prisma/schema.prisma`)

```prisma
enum SessionStatus {
  IN_PROGRESS
  PAUSED
  COMPLETED
  EXPIRED
}

model LearningSession {
  id               String                 @id @default(uuid())
  studentId        String                 @map("student_id")
  lessonId         String                 @map("lesson_id")
  status           SessionStatus          @default(IN_PROGRESS)
  currentIndex     Int                    @default(0) @map("current_index")
  totalQuestions   Int                    @map("total_questions")
  correctCount     Int                    @default(0) @map("correct_count")
  incorrectCount   Int                    @default(0) @map("incorrect_count")
  score            Decimal?               @db.Decimal(5, 2)
  durationSeconds  Int                    @default(0) @map("duration_seconds")
  startedAt        DateTime               @default(now()) @map("started_at")
  lastActivityAt   DateTime               @default(now()) @map("last_activity_at")
  expiresAt        DateTime               @map("expires_at")
  completedAt      DateTime?              @map("completed_at")

  questionOrders   SessionQuestionOrder[]
  answers          SessionAnswer[]
  outboxEvents     OutboxEvent[]

  student          User                   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  lesson           Lesson                 @relation(fields: [lessonId], references: [id], onDelete: Restrict)

  @@index([studentId, status])
  @@index([expiresAt, status])
  @@map("learning_sessions")
}

model SessionQuestionOrder {
  id            String          @id @default(uuid())
  sessionId     String          @map("session_id")
  questionId    String          @map("question_id")
  sequenceOrder Int             @map("sequence_order")

  session       LearningSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  question      QuestionItem    @relation(fields: [questionId], references: [id], onDelete: Restrict)

  @@unique([sessionId, sequenceOrder])
  @@map("session_question_orders")
}

model SessionAnswer {
  id              String          @id @default(uuid())
  sessionId       String          @map("session_id")
  questionId      String          @map("question_id")
  studentAnswer   Json            @map("student_answer")
  isCorrect       Boolean         @map("is_correct")
  hintUsedCount   Int             @default(0) @map("hint_used_count")
  timeSpentSec    Int             @default(0) @map("time_spent_sec")
  idempotencyKey  String          @unique @map("idempotency_key")
  submittedAt     DateTime        @default(now()) @map("submitted_at")

  session         LearningSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  question        QuestionItem    @relation(fields: [questionId], references: [id], onDelete: Restrict)

  @@unique([sessionId, questionId])
  @@map("session_answers")
}

model OutboxEvent {
  id            String           @id @default(uuid())
  aggregateType String           @map("aggregate_type") // "LearningSession"
  aggregateId   String           @map("aggregate_id")
  eventType     String           @map("event_type")     // "learning.session.completed", etc.
  payload       Json
  published     Boolean          @default(false)
  createdAt     DateTime         @default(now()) @map("created_at")
  publishedAt   DateTime?        @map("published_at")

  session       LearningSession? @relation(fields: [aggregateId], references: [id], onDelete: Cascade)

  @@index([published, createdAt])
  @@map("outbox_events")
}
```

---

## API Specifications & Endpoints Contract

### 1. Inisialisasi Sesi Belajar Baru
- **Endpoint**: `POST /api/v1/sessions`
- **Auth**: Required (Role: `SISWA`)
- **Request Body**:
  ```json
  {
    "lessonId": "usr_lesson_12345"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "sessionId": "sess_889a01bf-45bc",
    "lessonId": "usr_lesson_12345",
    "status": "IN_PROGRESS",
    "currentIndex": 0,
    "totalQuestions": 10,
    "expiresAt": "2026-08-28T12:00:00Z",
    "currentQuestion": {
      "id": "q_001",
      "type": "MULTIPLE_CHOICE",
      "prompt": "Berapakah hasil dari 12 + 15?",
      "options": [
        { "id": "opt_a", "text": "25" },
        { "id": "opt_b", "text": "27" },
        { "id": "opt_c", "text": "30" },
        { "id": "opt_d", "text": "22" }
      ],
      "availableHintsCount": 2
    }
  }
  ```
  *(Catatan: Properti `correct_option_id` & `explanation` di-strip/dibuang)*

---

### 2. Mengambil Soal Aktif / Status Sesi
- **Endpoint**: `GET /api/v1/sessions/:id`
- **Auth**: Required (Role: `SISWA`)
- **Response (200 OK)**:
  ```json
  {
    "sessionId": "sess_889a01bf-45bc",
    "status": "IN_PROGRESS",
    "currentIndex": 2,
    "totalQuestions": 10,
    "correctCount": 2,
    "currentQuestion": {
      "id": "q_003",
      "type": "SHORT_ANSWER",
      "prompt": "Sebutkan ibu kota negara Indonesia saat ini!",
      "availableHintsCount": 1
    }
  }
  ```

---

### 3. Submisi Jawaban Butir Soal (Server Grading)
- **Endpoint**: `POST /api/v1/sessions/:id/answers`
- **Headers**: `Idempotency-Key: c9b8f2a1-631d-4b92-94a1-1234567890ab`
- **Auth**: Required (Role: `SISWA`)
- **Request Body**:
  ```json
  {
    "questionId": "q_003",
    "answer": {
      "text": "  jakarta "
    },
    "timeSpentSeconds": 14
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "sessionId": "sess_889a01bf-45bc",
    "questionId": "q_003",
    "isCorrect": true,
    "explanation": "Ibu kota negara Indonesia adalah Jakarta.",
    "correctAnswer": {
      "acceptedAnswers": ["Jakarta", "DKI Jakarta"],
      "matchingMode": "NORMALIZED"
    },
    "sessionProgress": {
      "currentIndex": 3,
      "totalQuestions": 10,
      "isCompleted": false
    }
  }
  ```

---

### 4. Minta Petunjuk Bertingkat
- **Endpoint**: `POST /api/v1/sessions/:id/hints`
- **Auth**: Required (Role: `SISWA`)
- **Request Body**:
  ```json
  {
    "questionId": "q_003"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "questionId": "q_003",
    "hintTier": 1,
    "hintText": "Kota ini terletak di pulau Jawa bagian barat.",
    "remainingHints": 0
  }
  ```

---

### 5. Jeda & Lanjutkan Sesi
- **Endpoint**: `POST /api/v1/sessions/:id/pause` & `POST /api/v1/sessions/:id/resume`
- **Auth**: Required (Role: `SISWA`)
- **Response (200 OK)**:
  ```json
  {
    "sessionId": "sess_889a01bf-45bc",
    "status": "PAUSED", // atau "IN_PROGRESS" saat resume
    "updatedAt": "2026-08-27T12:30:00Z"
  }
  ```

---

### 6. Layar Hasil & Penyelesaian Sesi
- **Endpoint**: `POST /api/v1/sessions/:id/complete` (atau dipanggil otomatis pada jawaban terakhir)
- **Auth**: Required (Role: `SISWA`)
- **Response (200 OK)**:
  ```json
  {
    "sessionId": "sess_889a01bf-45bc",
    "lessonId": "usr_lesson_12345",
    "status": "COMPLETED",
    "score": 90.00,
    "totalQuestions": 10,
    "correctCount": 9,
    "incorrectCount": 1,
    "durationSeconds": 340,
    "completedAt": "2026-08-27T12:45:00Z",
    "incorrectQuestionsSummary": [
      {
        "questionId": "q_007",
        "prompt": "Berapakah 7 x 8?",
        "studentAnswer": "54",
        "correctAnswer": "56",
        "explanation": "7 dikali 8 sama dengan 56."
      }
    ]
  }
  ```

---

### 7. Riwayat Sesi Belajar Siswa
- **Endpoint**: `GET /api/v1/students/me/sessions?page=1&limit=10`
- **Auth**: Required (Role: `SISWA`)
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "sessionId": "sess_889a01bf-45bc",
        "lessonTitle": "Penjumlahan & Pengurangan Dasar",
        "subjectName": "Matematika",
        "score": 90.00,
        "status": "COMPLETED",
        "completedAt": "2026-08-27T12:45:00Z",
        "durationSeconds": 340
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

---

## Domain Event Contracts (For Feature 005 Gamification Consumer)

Seluruh event diterbitkan dengan format JSON terstruktur melalui **Outbox Pattern**.

### 1. `learning.session.started`
```json
{
  "eventId": "evt_001_uuid",
  "eventType": "learning.session.started",
  "aggregateId": "sess_889a01bf-45bc",
  "timestamp": "2026-08-27T12:00:00.000Z",
  "payload": {
    "sessionId": "sess_889a01bf-45bc",
    "studentId": "std_123",
    "lessonId": "usr_lesson_12345",
    "subjectId": "subj_math_sd",
    "totalQuestions": 10
  }
}
```

### 2. `learning.session.question_answered`
```json
{
  "eventId": "evt_002_uuid",
  "eventType": "learning.session.question_answered",
  "aggregateId": "sess_889a01bf-45bc",
  "timestamp": "2026-08-27T12:05:00.000Z",
  "payload": {
    "sessionId": "sess_889a01bf-45bc",
    "studentId": "std_123",
    "lessonId": "usr_lesson_12345",
    "questionId": "q_003",
    "questionType": "SHORT_ANSWER",
    "isCorrect": true,
    "timeSpentSeconds": 14,
    "hintUsedCount": 0
  }
}
```

### 3. `learning.session.completed`
```json
{
  "eventId": "evt_003_uuid",
  "eventType": "learning.session.completed",
  "aggregateId": "sess_889a01bf-45bc",
  "timestamp": "2026-08-27T12:45:00.000Z",
  "payload": {
    "sessionId": "sess_889a01bf-45bc",
    "studentId": "std_123",
    "lessonId": "usr_lesson_12345",
    "subjectId": "subj_math_sd",
    "score": 90.00,
    "totalQuestions": 10,
    "correctCount": 9,
    "incorrectCount": 1,
    "totalDurationSeconds": 340
  }
}
```

### 4. `learning.session.expired`
```json
{
  "eventId": "evt_004_uuid",
  "eventType": "learning.session.expired",
  "aggregateId": "sess_990b02cf-12ab",
  "timestamp": "2026-08-28T12:01:00.000Z",
  "payload": {
    "sessionId": "sess_990b02cf-12ab",
    "studentId": "std_123",
    "lessonId": "usr_lesson_12345",
    "lastActivityAt": "2026-08-27T12:00:00.000Z"
  }
}
```

---

## Non-Functional Requirements

- **Security & Anti-Cheat**: Zero key answer leakage on un-answered questions across all public endpoints. Scores sent by client payloads are rejected/ignored.
- **Idempotency & Double Completion Guard**: API submissions require `Idempotency-Key` headers. Completing a completed session returns cached summary without duplicate event emissions.
- **Performance**: Question fetching, session state resolution, and backend grading response time `< 150ms` (p95).
- **Session Expiration**: Automatic lazy-eval & background cleanup of sessions inactive for `> 24 hours`.
- **UI Responsiveness & Accessibility**: Tactile button "depress" styling with clear active focus, compliant with WCAG 2.1 AA contrast standards and `DESIGN.md` tokens.

---

## Success Criteria *(mandatory)*

- **SC-001**: Direct HTTP calls to any session API prior to answer submission **NEVER** contain answer keys, accepted strings, matching mappings, or explanations for un-answered questions.
- **SC-002**: Any score, correct flag, or calculation sent by client payloads is completely ignored by backend grading logic.
- **SC-003**: `SHORT_ANSWER` evaluation with `NORMALIZED` matching correctly ignores leading/trailing whitespace, extra inner spaces, capitalization, and diacritics while matching registered spellings.
- **SC-004**: Calling the completion endpoint multiple times for the same session succeeds idempotently without creating duplicate outbox events or corrupting final score metrics.
- **SC-005**: All four structured Domain Events (`started`, `question_answered`, `completed`, `expired`) are correctly written to the Outbox table with valid JSON schemas.
- **SC-006**: Interactive answer buttons trigger tactile "depress" animations and apply Emerald styling (`#00855b`) exclusively for correct answers per `DESIGN.md`.

---

## Assumptions & Dependencies

- **Dependencies**: Relies on `001-design-system-app-shell` for UI tokens, `002-auth-multi-role` for student JWT authentication, and `003-content-curriculum-cms` for published lesson and question data.
- **Gamification Isolation**: Feature 004 strictly isolates itself from XP/rewards computation, delegating all reward processing to Feature 005 via outbox events.
- **Time Window**: Expiration window is set to exactly 24 hours of inactivity from `last_activity_at`.
