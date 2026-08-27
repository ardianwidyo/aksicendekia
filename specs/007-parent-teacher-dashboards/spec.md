# Feature Specification: Dasbor Orang Tua dan Guru AksiCendekia

**Feature Branch**: `007-parent-teacher-dashboards`

**Created**: 2026-08-27 | **Last Clarified**: 2026-08-27

**Status**: Clarified & Approved

**Input**: User description: "Dasbor orang tua dan guru AksiCendekia. Kebutuhan: 1. Dasbor orang tua: ringkasan progres tiap anak (waktu belajar, pelajaran selesai, akurasi, streak), mata pelajaran terkuat dan terlemah, dan aktivitas terakhir. 2. Dasbor guru: tampilan kelas berisi seluruh siswa dengan progres per pelajaran, penanda siswa yang tertinggal, dan rata-rata akurasi per butir soal untuk mengetahui soal mana yang paling sering salah. 3. Guru dapat menugaskan pelajaran tertentu ke kelas dengan tenggat, dan melihat status pengerjaannya. 4. Laporan mingguan dalam bentuk data yang siap dikirim sebagai email ringkasan. Pengiriman email sesungguhnya di luar cakupan. 5. Ekspor data kelas ke CSV untuk guru. 6. Kontrol orang tua: batas waktu belajar harian, dan penguncian pengaturan privasi anak. Di luar cakupan: penilaian rapor formal, integrasi Dapodik, absensi, chat guru-orang tua. Kriteria selesai: orang tua hanya melihat data anak yang tertaut padanya melalui ParentChildLink terverifikasi; guru hanya melihat siswa pada kelas miliknya; setiap akses data siswa oleh non-pemilik tercatat dalam log akses."

---

## Executive Summary & Background Context

AksiCendekia adalah platform pembelajaran bergamifikasi untuk siswa TK, SD, SMP, dan SMA. Setelah mengimplementasikan sistem autentikasi multi-peran (`002-auth-multi-role`), kurikulum CMS (`003-content-curriculum-cms`), mesin sesi belajar (`004-learning-session-engine`), serta progres & gamifikasi (`005-progress-gamification` dan `006-daily-challenges-class-leaderboard`), platform membutuhkan antarmuka pemantauan dan kontrol terpadu untuk pemangku kepentingan dewasa: **Dasbor Orang Tua dan Guru (Parent and Teacher Dashboards)**.

Fitur `007-parent-teacher-dashboards` menyediakan antarmuka terpusat bagi:
1. **Orang Tua**: Memantau progres belajar anak yang terverifikasi (`ParentChildLink`), melacak waktu belajar, pelajaran selesai, akurasi, streak, mata pelajaran terkuat/terlemah, aktivitas terbaru, serta mengonfigurasi **Kontrol Orang Tua** (batas waktu belajar harian dan penguncian pengaturan privasi anak).
2. **Guru**: Mengelola kelas miliknya, melacak progres belajar siswa per pelajaran, mengidentifikasi siswa yang membutuhkan bantuan ("Perlu Pendampingan"), menganalisis akurasi per butir soal (*item difficulty accuracy analysis*), membuat dan memantau penugasan (*class assignments*) dengan tenggat waktu, serta mengekspor data performa kelas ke format CSV.
3. **Sistem Agregasi Laporan Mingguan**: Menyediakan data terstruktur (JSON & template HTML) yang siap dikonsumsi oleh layanan surel untuk ringkasan mingguan orang tua dan guru.
4. **Sistem Keamanan & Audit Log Akses Data Siswa**: Memastikan otorisasi berbasis relasi yang ketat di mana Orang Tua HANYA dapat mengakses anak yang tertaut padanya, Guru HANYA dapat mengakses siswa pada kelas miliknya, dan SETIAP akses data siswa oleh pengguna non-pemilik (orang tua/guru) WAJIB tercatat secara permanen dalam `StudentDataAccessLog` sesuai UU PDP No. 27/2022 dan **Konstitusi AksiCendekia Prinsip VII**.

Seluruh desain mematuhi penuh **Konstitusi AksiCendekia Prinsip I, II, IV, V, VI, VII, VIII, dan IX**.

---

## Clarifications

### Session 1 - 2026-08-27

- Q: Bagaimana penanganan penugasan kelas (*assignments*) untuk siswa yang baru mendaftar ke suatu kelas setelah tenggat penugasan lama telah lewat? → A: Siswa baru **tidak diberikan penugasan lama yang tenggatnya sudah lewat**; siswa baru hanya secara otomatis mendapatkan penugasan yang masih berstatus aktif atau mendatang (*due_date >= current_time*).
- Q: Bagaimana acuan reset harian untuk akumulasi durasi belajar dan batas waktu harian (*daily time limit*) orang tua? → A: Akumulasi durasi belajar dan batas waktu harian di-reset setiap hari pada **pukul 00:00 sesuai zona waktu lokal siswa** (`timezone` pada profil siswa, misal `Asia/Jakarta`, `Asia/Makassar`, atau `Asia/Jayapura`).
- Q: Berapa lama masa retensi penyimpanan riwayat audit log akses data siswa (`StudentDataAccessLog`) dan laporan mingguan (`WeeklyReportSummary`)? → A: Log akses audit (`StudentDataAccessLog`) disimpan selama **1 tahun** (sesuai standar retensi audit UU PDP No. 27/2022) lalu diarsipkan/dibersihkan secara berkala; laporan mingguan (`WeeklyReportSummary`) disimpan selama **12 bulan terakhir**.

---

## Clarified Architectural Decisions

1. **Otorisasi Akses Data Siswa & Guard Berbasis Relasi**:
   - **Orang Tua**: Akses ke data anak diverifikasi melalui `ParentChildLink` aktif (`status = 'ACTIVE'` & `parent_user_id = current_user.id`).
   - **Guru**: Akses ke data kelas & siswa diverifikasi melalui pemilikan kelas (`class.teacher_id = current_user.id` atau `TeacherClassEnrollment`).
   - Penolakan akses mengembalikan HTTP `403 Forbidden` dengan kode error terdefinisi (`FORBIDDEN_PARENT_LINK_REQUIRED` atau `FORBIDDEN_TEACHER_CLASS_REQUIRED`).

2. **Pencatatan Audit Log Akses (Student Data Access Logging)**:
   - Setiap endpoint yang membaca/mengubah data siswa oleh aktor dewasa (Guru atau Orang Tua) secara eksplisit memicu pembuatan record `StudentDataAccessLog`.
   - Record mencakup: `accessorUserId`, `accessorRole`, `targetStudentId`, `accessType` (`READ_DASHBOARD`, `READ_RECENT_ACTIVITY`, `READ_ITEM_ANALYSIS`, `EXPORT_CSV`, `UPDATE_PARENTAL_CONTROL`), `endpoint`, `ipAddress`, `userAgent`, dan `timestamp`.

3. **Kriteria Siswa Tertinggal (Behind/At-Risk Student Algorithm)**:
   - Seorang siswa ditandai sebagai `BEHIND` ("Perlu Pendampingan") jika memenuhi minimal salah satu kondisi berikut:
     1. **Low Accuracy**: Akurasi rata-rata < 60% dalam 5 sesi belajar terakhir.
     2. **Low Activity**: Total waktu belajar 14 hari terakhir < 30% dari rata-rata waktu belajar kelas.
     3. **Overdue Assignment**: Memiliki minimal 1 penugasan (*assignment*) aktif yang melewati tenggat (*due date*) tanpa penyelesaian.

4. **Mesin Penugasan Pelajaran (Class Assignments Engine)**:
   - Penugasan dibuat oleh Guru untuk suatu `class_id` bertarget `lesson_id` atau `topic_id` dengan `due_date`.
   - Status penugasan per siswa: `NOT_STARTED`, `IN_PROGRESS`, `SUBMITTED`, atau `OVERDUE`.
   - Sesi belajar siswa yang menyelesaikan pelajaran yang ditugaskan secara otomatis menghubungkan dan memperbarui record `StudentAssignmentProgress`.

5. **Kontrol Orang Tua & Pembatasan Durasi Belajar**:
   - Batas waktu belajar harian disimpan pada `ParentalControlSetting` (`daily_time_limit_minutes`: `15`, `30`, `45`, `60`, `90`, `120`, atau `NULL` / Tidak Terbatas).
   - Ketika total waktu belajar harian siswa (`today_learning_seconds / 60`) telah mencapai atau melebihi `daily_time_limit_minutes`, endpoint inisiasi sesi belajar (`POST /api/v1/learning/sessions`) menolak pembuatan sesi baru dengan HTTP 403 Forbidden (`DAILY_TIME_LIMIT_EXCEEDED`).
   - Penguncian privasi (`is_privacy_locked = true`) mencegah siswa mengubah visibilitas papan peringkat dan nama tampilan mereka.

6. **Ekspor CSV Guru Safe Format**:
   - Guru dapat mengekspor CSV data performa kelas.
   - Semua kolom string yang dimulai dengan karakter sensitif CSV formula injection (`=`, `+`, `-`, `@`, `\t`, `\r`) wajib ditambahi awalan petik tunggal (`'`) untuk keamanan spreadsheet.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pemantauan Dasbor Orang Tua & Kontrol Orang Tua (Priority: P1)

Sebagai Orang Tua yang terverifikasi, saya ingin melihat ringkasan progres belajar anak-anak saya (waktu belajar, pelajaran selesai, akurasi, streak, mata pelajaran terkuat/terlemah, aktivitas terbaru) serta mengatur batas waktu belajar harian dan kunci privasi anak, agar saya dapat mendampingi proses belajar anak secara sehat dan aman.

**Why this priority**: Dasbor Orang Tua adalah komponen utama keterlibatan orang tua (*parent engagement*) dan penegakan batas wajar durasi belajar anak (*screen time control*) serta perlindungan privasi anak.

**Independent Test**:
1. Orang Tua login -> Memanggil `GET /api/v1/parent/children` -> Mengembalikan daftar anak yang tertaut via `ParentChildLink` aktif.
2. Orang Tua memilih Anak A -> Memanggil `GET /api/v1/parent/children/:studentId/summary` -> Menampilkan metrik waktu belajar, akurasi, streak, pelajaran selesai, mata pelajaran terkuat/terlemah, dan 5 aktivitas terbaru.
3. Orang Tua mengubah batas waktu belajar harian Anak A menjadi 30 menit via `PUT /api/v1/parent/children/:studentId/controls` -> Pengaturan tersimpan dan log akses tercatat pada `StudentDataAccessLog`.
4. Anak A mencoba memulai sesi belajar ke-31 menit pada hari yang sama -> Backend menolak pembuatan sesi belajar dengan error `DAILY_TIME_LIMIT_EXCEEDED`.

**Acceptance Scenarios**:
1. **Given** Orang Tua terautentikasi, **When** mengakses dasbor orang tua, **Then** sistem HANYA menyajikan daftar anak yang terikat via `ParentChildLink` berstatus `ACTIVE`.
2. **Given** Orang Tua meminta data anak yang tidak terikat padanya, **When** request dikirim, **Then** backend menolak dengan HTTP 403 Forbidden (`FORBIDDEN_PARENT_LINK_REQUIRED`) dan mencatat pembatalan pada audit log.
3. **Given** Orang Tua membuka ringkasan anak, **When** data dikembalikan, **Then** payload menyajikan waktu belajar total, pelajaran selesai, akurasi rata-rata, streak, mata pelajaran terkuat & terlemah (berdasarkan penguasaan/akurasi), dan daftar aktivitas terbaru.
4. **Given** Orang Tua mengatur `daily_time_limit_minutes = 30`, **When** akumulasi durasi sesi belajar anak pada hari itu mencapai 30 menit, **Then** percobaan pembuatan sesi belajar baru ditolak dengan error 403 `DAILY_TIME_LIMIT_EXCEEDED`.
5. **Given** Orang Tua mengaktifkan `is_privacy_locked = true`, **When** anak mencoba mengubah visibilitas papan peringkat pada profilnya, **Then** backend menolak request anak dengan HTTP 403 `PRIVACY_SETTINGS_LOCKED_BY_PARENT`.

---

### User Story 2 - Dasbor Guru, Tampilan Kelas, Penanda Siswa Tertinggal, & Analisis Butir Soal (Priority: P1)

Sebagai Guru Kelas, saya ingin melihat seluruh siswa di kelas saya beserta progres belajar per pelajaran, penanda otomatis siswa yang tertinggal ("Perlu Pendampingan"), serta analisis akurasi per butir soal, agar saya dapat memberikan intervensi pembelajaran yang tepat sasaran.

**Why this priority**: Guru membutuhkan pemantauan akademis yang komprehensif untuk mendeteksi kesenjangan belajar dan mengidentifikasi butir soal yang membingungkan siswa.

**Independent Test**:
1. Guru login -> Memanggil `GET /api/v1/teacher/classes` -> Mengembalikan daftar kelas milik guru tersebut.
2. Guru memilih Kelas 4-A -> Memanggil `GET /api/v1/teacher/classes/:classId/students` -> Menampilkan daftar seluruh siswa kelas, progres per pelajaran, dan status penanda siswa.
3. Siswa B yang memiliki akurasi 52% dalam 5 sesi terakhir otomatis ditandai dengan badge `is_behind = true` ("Perlu Pendampingan") dan alasan `LOW_ACCURACY`.
4. Guru membuka tab Analisis Butir Soal -> Memanggil `GET /api/v1/teacher/classes/:classId/item-analysis?lessonId=xxx` -> Menampilkan daftar soal diurutkan dari persentase akurasi terkecil (soal paling sering salah) hingga terbesar.

**Acceptance Scenarios**:
1. **Given** Guru terautentikasi, **When** membuka Dasbor Guru, **Then** sistem HANYA menampilkan kelas-kelas yang dimiliki oleh guru tersebut (`class.teacher_id = current_user.id`).
2. **Given** Guru mengakses data kelas milik guru lain, **When** API dipanggil, **Then** backend menolak dengan HTTP 403 Forbidden (`FORBIDDEN_TEACHER_CLASS_REQUIRED`) dan merekam percobaan di audit log.
3. **Given** daftar siswa dalam kelas dimuat, **When** algoritma evaluasi risiko berjalan, **Then** siswa yang memenuhi kriteria (akurasi <60%, aktivitas <30% rerata kelas, atau tugas terlambat) secara otomatis diberi status `is_behind = true` beserta alasannya.
4. **Given** Guru memilih suatu pelajaran/topik pada fitur Analisis Butir Soal, **When** data dimuat, **Then** API mengembalikan rata-rata akurasi per butir soal (`accuracy_rate`, `total_attempts`, `wrong_attempts`) diurutkan dari yang paling tinggi tingkat kesalahannya.
5. **Given** Guru mengakses tampilan kelas atau analisis butir soal, **When** request selesai diproses, **Then** backend secara otomatis mencatat record audit log pada `StudentDataAccessLog`.

---

### User Story 3 - Penugasan Pelajaran oleh Guru & Pemantauan Tenggat (Priority: P2)

Sebagai Guru, saya ingin menugaskan pelajaran tertentu ke kelas saya dengan menetapkan tenggat waktu (*due date*), serta memantau status pengerjaan siswa secara real-time, agar kegiatan pembelajaran terstruktur dengan jelas.

**Why this priority**: Penugasan adalah jembatan utama instruksi guru ke sesi belajar siswa di platform AksiCendekia.

**Independent Test**:
1. Guru membuat penugasan baru untuk Kelas 4-A: Pelajaran "Pecahan Senilai", Tenggat: 3 hari ke depan (`POST /api/v1/teacher/assignments`).
2. API mengembalikan penugasan baru bertatus `ACTIVE` dan membuat record `StudentAssignmentProgress` untuk seluruh siswa terdaftar di Kelas 4-A dengan status `NOT_STARTED`.
3. Siswa A menyelesaikan sesi belajar pelajaran "Pecahan Senilai" -> Backend secara otomatis mengupdate status penugasan Siswa A menjadi `COMPLETED` beserta timestamp dan akurasinya.
4. Setelah melewati tenggat, Siswa B yang belum mengerjakan penugasan tersebut otomatis berubah statusnya menjadi `OVERDUE`.
5. Guru memanggil `GET /api/v1/teacher/assignments/:assignmentId` -> Menampilkan grafik rekapitulasi (misal: 18/20 selesai, 2 terlambat) dan tabel status per siswa.

**Acceptance Scenarios**:
1. **Given** Guru berada di Dasbor Penugasan Kelas, **When** membuat penugasan baru dengan menetapkan `class_id`, `lesson_id`, dan `due_date`, **Then** penugasan berhasil dibuat dan dikaitkan ke seluruh siswa di kelas tersebut.
2. **Given** siswa mengerjakan pelajaran yang sedang ditugaskan, **When** sesi belajar selesai, **Then** sistem memperbarui `StudentAssignmentProgress` siswa menjadi `COMPLETED` dengan mencatat `score`, `accuracy`, dan `completed_at`.
3. **Given** waktu saat ini melewati `due_date` penugasan, **When** status dicek, **Then** penugasan siswa yang masih `NOT_STARTED` atau `IN_PROGRESS` otomatis ditandai `OVERDUE`.
4. **Given** Guru membuka pemantauan penugasan, **When** data dipanggil, **Then** API menyajikan rekapitulasi status pengerjaan per siswa beserta tanggal penyelesaian dan skor akurasi.

---

### User Story 4 - Ekspor Data Kelas ke CSV untuk Guru (Priority: P2)

Sebagai Guru, saya ingin mengekspor data progres, penugasan, dan performa siswa di kelas saya ke dalam berkas CSV, agar saya dapat mengolah data tersebut untuk administrasi kelas internal.

**Why this priority**: Memudahkan administrasi pencatatan guru tanpa perlu memasukkan data secara manual.

**Independent Test**:
1. Guru menekan tombol "Ekspor CSV Kelas" pada Dasbor Kelas 4-A (`GET /api/v1/teacher/classes/:classId/export-csv`).
2. Backend menghasilkan file CSV dengan header: `ID Siswa, Nama Tampilan, Sesi Selesai, Waktu Belajar (Menit), Akurasi Rata-rata (%), Status Risiko, Penugasan Selesai`.
3. Semua teks yang diawali dengan `=`, `+`, `-`, `@` telah diberikan awalan sanitasi petik tunggal (`'`).
4. Berkas terunduh dengan Content-Type `text/csv` dan pencatatan audit log `StudentDataAccessLog` tercatat untuk operasi ekspor tersebut.

**Acceptance Scenarios**:
1. **Given** Guru pemilik kelas menekan Ekspor CSV, **When** request diproses, **Then** backend menyusun baris CSV yang mencakup seluruh siswa di kelas tersebut.
2. **Given** data siswa mengandung karakter seperti `=SUM(A1:A10)` pada nama atau bidang teks, **When** CSV disusun, **Then** karakter pertama disanitasi menjadi `'=SUM(A1:A10)` untuk mencegah serangan CSV Injection.
3. **Given** proses ekspor selesai, **When** respons dikirim, **Then** header HTTP `Content-Disposition: attachment; filename="rekap-kelas-[classId]-[date].csv"` dikembalikan dan event audit log ekspor tercatat.

---

### User Story 5 - Agregasi Laporan Mingguan & Data Ringkasan Email (Priority: P3)

Sebagai Sistem, saya ingin mengagregasi data performa belajar harian menjadi laporan ringkasan mingguan (JSON & HTML Payload) yang siap dikirimkan melalui layanan surel kepada Orang Tua dan Guru setiap akhir minggu.

**Why this priority**: Laporan mingguan memberikan umpan balik berkala kepada orang tua dan guru tanpa mewajibkan mereka membuka dasbor setiap hari.

**Independent Test**:
1. Cron job mingguan memicu pembentukan laporan ringkasan (`POST /api/v1/reports/weekly/generate`).
2. Untuk setiap Orang Tua yang terhubung, sistem menyusun JSON payload laporan yang berisi: ringkasan waktu belajar mingguan anak, perbandingan dengan minggu sebelumnya, pelajaran terselesaikan, badge yang diraih, serta rekomendasi fokus belajar.
3. Untuk setiap Guru, sistem menyusun JSON payload ringkasan kelas: tingkat keaktifan kelas, daftar siswa yang membutuhkan pendampingan, dan topik pelajaran dengan akurasi terendah.
4. Data laporan tersimpan di database (`WeeklyReportSummary`) dan siap diambil oleh modul pengiriman email eksternal.

**Acceptance Scenarios**:
1. **Given** jadwal agregasi mingguan tiba (setiap hari Minggu pukul 23:59 waktu lokal), **When** agregator berjalan, **Then** sistem menghitung statistik 7 hari terakhir untuk setiap anak dan kelas.
2. **Given** statistik terhitung, **When** payload disiapkan, **Then** sistem menyimpan data terstruktur ringkasan mingguan pada tabel `WeeklyReportSummary` yang siap dikonsumsi API/email parser.
3. **Given** API `GET /api/v1/parent/children/:studentId/weekly-reports` dipanggil orang tua, **When** data dikembalikan, **Then** daftar laporan ringkasan mingguan terdahulu dapat dibaca dengan tampilan grafik dan poin motivasi.

---

### Edge Cases

- **Anak belum memiliki aktivitas belajar sama sekali**: Dasbor Orang Tua menyajikan antarmuka *empty state* yang ramah dengan pesan "Anak belum memulai sesi belajar minggu ini", nilai waktu 0 menit, akurasi 0%, dan rekomendasi topik awal.
- **Siswa pindah kelas atau dikeluarkan dari kelas**: Penugasan kelas yang sedang berjalan untuk siswa tersebut diarsipkan dan status siswa di kelas lama di-unenroll, tetapi data sejarah `StudentDataAccessLog` dan sesi belajar yang sudah selesai tetap tersimpan untuk audit trail.
- **Orang Tua membatalkan tautan anak (`ParentChildLink` revoked)**: Akses Orang Tua ke data anak tersebut serta merta dicabut (HTTP 403), dan pengaturan kontrol orang tua yang dikunci dikembalikan ke default mandiri anak.
- **Batas waktu belajar harian diubah saat anak sedang dalam sesi aktif**: Batas waktu baru langsung berlaku pada percobaan inisiasi sesi berikutnya. Sesi yang sedang berjalan tetap diperbolehkan selesai hingga batas toleransi 5 menit.
- **Data ekspor CSV kelas sangat besar (>500 siswa)**: Ekspor CSV diproses secara *streaming response* untuk mencegah penumpukan memori (*out of memory*) pada server Node.js/Fastify.

---

## Functional Requirements

### Dasbor Orang Tua & Kontrol Orang Tua
- **FR-001**: Sistem MUST mengautentikasi dan memverifikasi bahwa Orang Tua yang meminta data anak memiliki relasi `ParentChildLink` berstatus `ACTIVE`.
- **FR-002**: Sistem MUST menyajikan ringkasan progres belajar tiap anak yang mencakup: total waktu belajar (menit/jam), jumlah pelajaran selesai, persentase akurasi rata-rata, dan streak belajar harian.
- **FR-003**: Sistem MUST menghitung dan menampilkan mata pelajaran terkuat (*strongest subject*) dan terlemah (*weakest subject*) untuk tiap anak berdasarkan persentase akurasi dan penguasaan topik.
- **FR-004**: Sistem MUST menampilkan riwayat aktivitas belajar terbaru (*recent activities*) anak dalam urutan kronologis terbalik (timestamp, nama pelajaran, durasi, skor, XP).
- **FR-005**: Sistem MUST menyediakan fitur Kontrol Orang Tua untuk mengonfigurasi batas waktu belajar harian (`daily_time_limit_minutes`: 15, 30, 45, 60, 90, 120, atau Unlimited).
- **FR-006**: Sistem MUST menolak inisiasi sesi belajar baru siswa apabila total durasi belajar harian siswa telah mencapai atau melebihi batas waktu harian yang ditetapkan orang tua.
- **FR-007**: Sistem MUST menyediakan opsi penguncian privasi anak (`is_privacy_locked`) oleh Orang Tua, yang mencegah siswa mengubah visibilitas papan peringkat dan identitas profil mereka sendiri.

### Dasbor Guru & Manajemen Penugasan Kelas
- **FR-008**: Sistem MUST membatasi Dasbor Guru HANYA pada kelas-kelas yang dimiliki oleh guru tersebut (`class.teacher_id = current_user.id`).
- **FR-009**: Sistem MUST menampilkan antarmuka kelas yang memuat daftar seluruh siswa terdaftar beserta persentase progres penyelesaian pelajaran/kurikulum.
- **FR-010**: Sistem MUST secara otomatis menandai siswa yang tertinggal (*at-risk/behind*) dengan label "Perlu Pendampingan" berdasarkan kriteria akurasi rendah (<60%), keaktifan rendah (<30% rerata kelas), atau penugasan terlambat.
- **FR-011**: Sistem MUST menyediakan fitur Analisis Butir Soal (*Item Accuracy Analysis*) yang menghitung dan mengurutkan rata-rata akurasi siswa per butir soal (`QuestionItem`) untuk mengidentifikasi soal yang paling sering salah.
- **FR-012**: Sistem MUST memungkinkan Guru untuk membuat penugasan pelajaran (`LessonAssignment`) ke seluruh atau sebagian siswa dalam kelas dengan menentukan `lesson_id` dan tenggat waktu (`due_date`).
- **FR-013**: Sistem MUST melacak status penugasan siswa secara real-time (`NOT_STARTED`, `IN_PROGRESS`, `SUBMITTED`, `OVERDUE`) beserta timestamp dan akurasi penyelesaian.
- **FR-014**: Sistem MUST menyediakan fitur ekspor data rekapitulasi kelas ke berkas CSV yang disanitasi dari potensi *CSV Injection*.

### Agregasi Laporan Mingguan & Audit Log Akses Data
- **FR-015**: Sistem MUST mengagregasi statistik harian menjadi data ringkasan laporan mingguan (`WeeklyReportSummary`) untuk Orang Tua dan Guru pada setiap akhir minggu.
- **FR-016**: Sistem MUST menyediakan payload JSON dan format HTML ringkasan laporan mingguan yang siap dikonsumsi oleh modul surel.
- **FR-017**: Sistem MUST mencatat SETIAP akses data siswa oleh Orang Tua maupun Guru ke dalam tabel audit log `StudentDataAccessLog` secara otomatis (merekam `accessor_user_id`, `accessor_role`, `target_student_id`, `access_type`, `endpoint`, `ip_address`, `user_agent`, `timestamp`).

---

## Key Entities

- **ParentalControlSetting**: Menyimpan konfigurasi kontrol orang tua terhadap akun anak (`student_user_id`, `parent_user_id`, `daily_time_limit_minutes`, `is_privacy_locked`, `updated_at`).
- **LessonAssignment**: Menyiapkan entitas penugasan pelajaran dari guru ke kelas (`id`, `class_id`, `teacher_user_id`, `lesson_id`, `title`, `description`, `due_date`, `created_at`).
- **StudentAssignmentProgress**: Melacak status pengerjaan penugasan per siswa (`id`, `assignment_id`, `student_user_id`, `status`, `score`, `accuracy`, `completed_at`, `updated_at`).
- **WeeklyReportSummary**: Menyimpan payload ringkasan performa belajar mingguan (`id`, `target_user_id`, `target_role`, `student_user_id`, `week_start_date`, `week_end_date`, `report_data_json`, `created_at`).
- **StudentDataAccessLog**: Tabel log audit keamanan untuk mencatat seluruh aktivitas pembacaan/pengubahan data siswa oleh non-pemilik (`id`, `accessor_user_id`, `accessor_role`, `target_student_id`, `access_type`, `endpoint`, `ip_address`, `user_agent`, `created_at`).

---

## Success Criteria

- **SC-001**: Orang Tua dapat melihat data progres lengkap seluruh anak yang tertaut padanya dalam waktu pemuatan < 1.2 detik (p95).
- **SC-002**: 100% percobaan akses data siswa oleh pengguna yang bukan merupakan orang tua tertaut atau guru kelasnya berhasil ditolak dengan HTTP 403 Forbidden.
- **SC-003**: 100% akses data siswa yang dilakukan oleh Orang Tua dan Guru tercatat dengan tepat dan lengkap pada tabel `StudentDataAccessLog`.
- **SC-004**: Algoritma penanda siswa tertinggal ("Perlu Pendampingan") berhasil mengidentifikasi siswa berisiko secara otomatis dengan akurasi 100% sesuai aturan ambang batas (akurasi <60%, keaktifan <30%, overdue).
- **SC-005**: Siswa yang telah menghabiskan kuota durasi belajar harian ditolak pembuatan sesi belajarnya 100% tepat waktu tanpa kebocoran sesi.
- **SC-006**: Ekspor berkas CSV kelas selesai diunduh dalam < 2 detik untuk kelas berkapasitas 50 siswa dan bebas dari insiden *CSV Injection*.

---

## Assumptions

- **Sistem Autentikasi & Relasi**: Modul autentikasi `002-auth-multi-role` sudah menyediakan entitas `User`, `ParentChildLink` (berstatus `ACTIVE`/`PENDING`), `Class`, dan `StudentClassEnrollment`.
- **Data Sesi Belajar**: Modul sesi belajar `004-learning-session-engine` dan progres `005-progress-gamification` menyediakan data riwayat `LearningSession`, `StudentProgress`, `XpTransaction`, dan `QuestionAnswer`.
- **Pengiriman Email**: Eksekusi pengiriman email sesungguhnya (via SMTP/SendGrid/SES) berada di luar cakupan spesifikasi ini (Out of Scope); spesifikasi ini hanya bertanggung jawab memproduksi dan menyimpan payload laporan mingguan yang siap kirim.
