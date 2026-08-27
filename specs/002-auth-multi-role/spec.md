# Feature Specification: Autentikasi dan Manajemen Akun Multi-Peran AksiCendekia

**Feature Branch**: `002-auth-multi-role`

**Created**: 2026-08-27 | **Last Clarified**: 2026-08-27

**Status**: Clarified & Approved

**Input**: User description: "Autentikasi dan manajemen akun multi-peran AksiCendekia. Empat peran: SISWA, ORANG_TUA, GURU, ADMIN. Kebutuhan: 1. Registrasi dan login berbasis email + password dengan Argon2id. 2. Sesi JWT dengan rotasi refresh token & deteksi reuse. 3. Persetujuan orang tua/wali untuk siswa < 18 tahun (Prinsip VII Constitution). 4. Alur pendaftaran anak oleh orang tua & alur pendaftaran siswa mandiri dengan PENDING_CONSENT. 5. Profil siswa minimalis tanpa data sensitif. 6. Kode kelas guru & otorisasi kelas. 7. Reset password token sekali pakai. 8. Middleware otorisasi berbasis relasi. Halaman UI berbasis komponen Feature 001."

---

## Executive Summary & Background Context

AksiCendekia adalah platform belajar bergamifikasi untuk siswa TK, SD, SMP, dan SMA, serta platform manajemen untuk guru, orang tua, dan admin sekolah/CMS. Setelah menyelesaikan fondasi visual dan sistem komponen pada Feature 001 (`001-design-system-app-shell`), platform memerlukan **sistem identitas, autentikasi aman, dan otorisasi berbasis relasi multi-peran** sebagai fondasi akses data backend dan antarmuka pengguna.

Fitur `002-auth-multi-role` mengimplementasikan manajemen akun untuk empat peran pengguna (`SISWA`, `ORANG_TUA`, `GURU`, `ADMIN`), mekanisme autentikasi email & kata sandi dengan penggaraman/penyincangan **Argon2id**, manajemen sesi JWT tingkat lanjut (akses token singkat in-memory, rotasi refresh token dalam cookie HTTP-Only secure, serta deteksi dan pembatalan sesi keluarga pada penggunaan ulang token), dan **penegakan perlindungan data anak di bawah 18 tahun** yang diwajibkan oleh **Prinsip VII Konstitusi AksiCendekia** dan UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (PDP).

Selain itu, fitur ini menyediakan manajemen hubungan siswa-wali dengan dukungan dual-verifikasi (Tautan Email & Kode OTP 6-digit), pembuatan kelas dan pengundangan siswa via kode kelas oleh guru, pemulihan akun melalui reset password email, rate-limiting ketat via Fastify, middleware otorisasi relasional (`Relational Authorization Middleware`), serta antarmuka UI lengkap yang dibangun di atas pustaka komponen dari Feature 001.

---

## Clarified Architectural Decisions

1. **Metode Verifikasi Persetujuan Wali (Student-Driven Flow)**:
   - Kombinasi Tautan Email Unik (`/parent/consent/[token]`) dan Kode OTP 6-digit. Orang tua/wali dapat memilih menyetujui langsung melalui klausa satu-klik di email atau menginput kode OTP 6-digit pada dasbor orang tua.
2. **Penyimpanan Token Sesi JWT**:
   - Refresh Token disimpan dalam **Cookie HTTP-Only, Secure, SameSite=Strict** untuk perlindungan maksimal dari serangan XSS dan CSRF.
   - Access Token berumur pendek (15 menit) disimpan strictly **In-Memory (React State/Context)** pada peramban web (`apps/web`).
3. **Ambang Batas Rate Limiting (Fastify Rate Limit)**:
   - Ketat: Maksimal 5 kali percobaan gagal per 15 menit untuk endpoint sensitive (`/api/v1/auth/login`, `/api/v1/auth/forgot-password`, `/api/v1/auth/reset-password`).
   - Publik/Umum: Maksimal 100 request/menit untuk endpoint API umum.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrasi, Login Email + Password, & Manajemen Sesi JWT Aman (Priority: P1)

Sebagai pengguna baru atau terdaftar (Siswa, Orang Tua, Guru, atau Admin), saya ingin mendaftar dan masuk ke platform menggunakan kombinasi email dan kata sandi yang aman, serta mempertahankan sesi kerja dengan token yang dapat diperbarui secara otomatis tanpa sering diminta login ulang, agar pengalaman akses sistem tetap aman dan lancar.

**Why this priority**: Merupakan pintu masuk utama seluruh pengguna platform. Tanpa autentikasi email+password, enkripsi kata sandi yang kuat (Argon2id), dan pengelolaan JWT/refresh token yang terisolasi, sistem tidak dapat mengidentifikasi pengguna atau mengamankan API backend.

**Independent Test**: Dapat diuji secara penuh via pengujian integrasi API backend dan UI form login/registrasi:
1. Registrasi pengguna baru menghasilkan hash Argon2id di database (bukan teks polos atau MD5/SHA256).
2. Login sukses mengembalikan Access Token JWT (in-memory) dan Refresh Token dalam cookie HTTP-Only, Secure, SameSite=Strict.
3. Memanggil endpoint `/api/v1/auth/refresh` memperbarui Access Token dan mengganti Refresh Token lama dengan yang baru (rotasi).
4. Jika Refresh Token lama yang sudah pernah diputar digunakan kembali (reuse attempt), sistem mendeteksi pencurian token dan **membatalkan seluruh sesi (family revocation)** milik pengguna tersebut, sehingga seluruh token turunan tidak valid lagi.
5. Logout berhasil mencabut refresh token dari daftar aktif dan menghapus cookie HTTP-Only.

**Acceptance Scenarios**:

1. **Given** pendaftar memasukkan email valid dan password minimal 8 karakter, **When** form registrasi dikirim, **Then** akun berhasil dibuat dengan password yang di-hash Argon2id dan email unik.
2. **Given** pengguna terdaftar memasukkan kredensial yang benar, **When** melakukan login, **Then** backend mengembalikan Access Token JWT (expired 15m) di memori dan Refresh Token terotasi (expired 7d) di secure HTTP-Only cookie.
3. **Given** Access Token pengguna telah kedaluwarsa, **When** klien mengirimkan Refresh Token valid ke endpoint refresh, **Then** backend menerbitkan pasangan token baru dan menonaktifkan Refresh Token lama.
4. **Given** penyerang mencoba menggunakan Refresh Token lama yang sudah pernah dirotasi, **When** diproses oleh backend, **Then** backend menolak transaksi, menandai terjadinya insiden keamanan, membatalkan seluruh sesi milik user tersebut, dan mewajibkan login ulang.
5. **Given** pengguna menekan tombol Logout, **When** permintaan dikirim, **Then** Refresh Token dicabut di backend dan cookie dihapus dari peramban.

---

### User Story 2 - Perlindungan Data Anak & Alur Persetujuan Orang Tua/Wali (Priority: P1)

Sebagai orang tua/wali dari siswa di bawah 18 tahun, saya ingin mengontrol dan memberikan persetujuan resmi atas pendaftaran akun anak saya melalui tautan email atau kode OTP 6-digit, serta mengelola akun anak di bawah naungan akun orang tua saya, agar perlindungan data pribadi anak terjamin sesuai Prinsip VII Konstitusi dan hukum yang berlaku.

**Why this priority**: Kepatuhan NON-NEGOTIABLE terhadap Prinsip VII Konstitusi AksiCendekia dan UU No. 27/2022 (PDP). Siswa di bawah 18 tahun tanpa persetujuan wali yang terekam secara sah DILARANG keras mengakses data atau fitur platform selain endpoint status akunnya sendiri.

**Independent Test**: Pengujian skenario pembuatan akun anak (Parent-driven & Student-driven):
1. Akun siswa berusia < 18 tahun yang mendaftar mandiri otomatis berstatus `PENDING_CONSENT`. Saat login, akun tersebut diblokir dari seluruh endpoint API bisnis (mengembalikan 403 Consent Required) dan HANYA bisa mengakses `/api/v1/auth/status` atau `/api/v1/students/me/consent-status`.
2. Setelah orang tua memberikan persetujuan (via tautan email atau menginput OTP 6-digit di dasbor orang tua), status akun berubah menjadi `ACTIVE` dan otorisasi API terbuka.
3. Orang tua yang mendaftar lebih dulu dapat menambahkan akun anak langsung dari dasbor Manajemen Anak, di mana persetujuan otomatis terekam dan akun anak langsung berstatus `ACTIVE`.

**Acceptance Scenarios**:

1. **Given** orang tua login di dasbor Orang Tua, **When** menambah akun anak baru (Parent-driven flow), **Then** akun siswa dibuat, langsung terhubung di bawah wali tersebut, dan persetujuan wali terekam otomatis dengan versi teks persetujuan aktif.
2. **Given** calon siswa di bawah 18 tahun mendaftar sendiri (Student-driven flow), **When** pendaftaran berhasil dengan menginput email orang tua, **Then** akun berstatus `PENDING_CONSENT` dan sistem mengirimkan surel permohonan persetujuan berisi tautan verifikasi satu-klik dan kode OTP 6-digit ke email wali.
3. **Given** siswa berstatus `PENDING_CONSENT` mencoba mengakses endpoint platform (misal: daftar kelas atau data profil), **When** request diterima backend, **Then** middleware otorisasi menolak dengan HTTP status 403 Consent Required.
4. **Given** orang tua membuka link verifikasi persetujuan atau memasukkan OTP 6-digit pada dasbor orang tua, **When** persetujuan dikonfirmasi, **Then** sistem merekam log persetujuan (`parent_user_id`, `consented_at`, `verification_method`, `consent_version`) dan mengaktifkan akun siswa menjadi `ACTIVE`.

---

### User Story 3 - Profil Minimalis Siswa & Anonimitas Publik (Priority: P2)

Sebagai siswa, saya ingin memiliki profil belajar yang hanya menampilkan nama tampilan, jenjang pendidikan, kelas, dan avatar bawaan tanpa perlu memasukkan data pribadi yang sensitif, agar privasi saya terjaga saat berinteraksi di platform.

**Why this priority**: Menjaga kerahasiaan identitas anak sesuai Prinsip VII Konstitusi (data minimization & anonymous public profiles). Platform dilarang menyimpan atau menampilkan foto asli, nama lengkap publik, alamat rumah, atau nomor telepon siswa.

**Independent Test**: Memeriksa skema database profil siswa dan respons API profil:
1. Field publik siswa hanya mencakup `display_name`, `education_stage` (`TK`, `SD`, `SMP`, `SMA`), `grade_level`, dan `avatar_id` (dari preset avatar platform).
2. Tidak ada field untuk nama lengkap publik, foto unggahan pribadi (upload photo forbidden), alamat rumah, atau nomor telepon pada skema profil siswa.
3. Memastikan preset avatar disajikan dari penyimpanan internal platform (self-hosted asset).

**Acceptance Scenarios**:

1. **Given** siswa menyelesaikan registrasi atau onboarding, **When** mengonfigurasi profil, **Then** siswa memilih `display_name`, `education_stage` (TK/SD/SMP/SMA), `grade_level`, dan memilih salah satu avatar dari daftar preset bawaan AksiCendekia.
2. **Given** pengguna mana pun melihat profil publik atau papan peringkat siswa, **When** data dipanggil, **Then** API hanya mengembalikan `display_name`, `education_stage`, `grade_level`, dan `avatar_id`, tanpa membocorkan identitas pribadi asli.
3. **Given** siswa mencoba mengunggah foto profil kustom, **When** diproses, **Then** sistem menolak opsi unggah foto pribadi dan mewajibkan penggunaan avatar preset bawaan.

---

### User Story 4 - Manajemen Kelas oleh Guru & Otorisasi Berbasis Relasi (Priority: P2)

Sebagai guru, saya ingin dapat membuat kelas baru, memperoleh kode kelas unik, dan mengundang siswa bergabung, serta hanya memiliki akses ke data siswa yang terdaftar di kelas saya, agar pengelolaan pembelajaran berjalan teratur dan aman.

**Why this priority**: Menjamin batasan akses data siswa antar-kelas. Guru tidak boleh memiliki akses menyeluruh ke seluruh siswa platform, melainkan terikat pada relasi keanggotaan kelas.

**Independent Test**: Pengujian otorisasi relasional (Relational Authorization Middleware):
1. Guru A membuat Kelas 10-A dan menghasilkan kode kelas (misal `AKSI-8X2K`).
2. Siswa B bergabung ke Kelas 10-A menggunakan kode kelas tersebut.
3. Guru A dapat mengakses data profil/perkembangan Siswa B di Kelas 10-A.
4. Guru C (pemilik Kelas 10-B) yang mencoba mengakses data Siswa B atau data Kelas 10-A ditolak oleh middleware otorisasi relasional dengan HTTP status **403 Forbidden**.

**Acceptance Scenarios**:

1. **Given** guru berada di dasbor Guru, **When** membuat kelas baru dengan nama "Matematika 7-A" dan jenjang "SMP", **Then** sistem menyimpan kelas dan menghasilkan kode kelas unik 6-8 karakter alfanumerik.
2. **Given** siswa memasukkan kode kelas valid dari gurunya, **When** mengonfirmasi bergabung, **Then** relasi siswa dengan kelas tersebut tercatat dan guru kelas dapat melihat siswa dalam daftar anggota kelas (roster).
3. **Given** Guru C mencoba memanggil endpoint data siswa yang terdaftar di kelas milik Guru A, **When** request diproses oleh Middleware Otorisasi Relasi, **Then** backend mengembalikan respons HTTP status `403 Forbidden`.
4. **Given** permintaan data siswa dikirim ke backend, **When** middleware otorisasi mengevaluasi akses, **Then** akses HANYA diberikan jika pemanggil adalah: (a) siswa itu sendiri, (b) orang tua/wali terverifikasi dari siswa tersebut, (c) guru dari kelas yang diikuti siswa tersebut, atau (d) Admin.

---

### User Story 5 - Pemulihan Akun via Reset Password Email & Onboarding UI (Priority: P3)

Sebagai pengguna yang lupa kata sandi, saya ingin dapat meminta tautan reset password ke email saya yang berisi token sekali pakai berdurasi terbatas, agar saya dapat memperbarui kata sandi saya dengan aman.

**Why this priority**: Menyediakan alur mandiri bagi pengguna untuk memulihkan akses akun tanpa bantuan manual admin, sekaligus melengkapi antarmuka pengguna (UI) sesuai komponen Feature 001.

**Independent Test**:
1. Meminta reset password mengirim email berisi tautan unik dengan token berkriptografi kuat (dibatasi 5 percobaan / 15 menit oleh Rate Limiter).
2. Token reset password hanya berlaku satu kali dan kedaluwarsa setelah 15 menit.
3. Menggunakan token yang sudah kadaluwarsa atau pernah dipakai akan ditolak dengan pesan kesalahan yang jelas.
4. Seluruh antarmuka UI (Registrasi Multi-Peran, Login, Lupa Password, Onboarding Jenjang Siswa, Halaman Persetujuan Orang Tua, Manajemen Anak Orang Tua, dan Pembuatan Kelas Guru) dibangun menggunakan komponen standar Feature 001.

---

## Edge Cases

- **Pendaftaran Siswa Usia $\ge$ 18 Tahun**: Jika tanggal lahir siswa menunjukkan usia 18 tahun atau lebih pada saat pendaftaran, sistem menetapkan status akun langsung `ACTIVE` tanpa mewajibkan alur persetujuan orang tua/wali.
- **Email Wali Salah pada Student-Driven Flow**: Jika siswa memasukkan email wali yang salah atau tidak aktif, siswa dapat memperbarui email wali dari halaman status persetujuan akun (`/api/v1/students/me/consent-status`) untuk memicu ulang pengiriman surel persetujuan.
- **Orang Tua Mendaftar dengan Email yang Sama dengan Siswa**: Sistem menolak pendaftaran akun orang tua jika email yang digunakan sudah terdaftar sebagai akun siswa atau peran lain (email unik global).
- **Perubahan Kode Kelas oleh Guru**: Guru dapat meregenerasi kode kelas jika kode lama bocor. Kode kelas lama menjadi tidak berlaku untuk pendaftaran baru, namun tidak mempengaruhi siswa yang sudah terlanjur bergabung.
- **Race Condition pada Refresh Token Rotation**: Jika dua permintaan refresh token dikirim bersamaan secara paralel (misal karena pengulangan jaringan pada klien), backend menerapkan window toleransi atomik 5 detik untuk mencegah false-positive reuse trigger.
- **Rate Limit Exceeded**: Pengguna yang melebihi 5 kali percobaan gagal login/reset password dalam 15 menit menerima respon HTTP status `429 Too Many Requests` dengan header `Retry-After`.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Authentikasi & Sesi (FR-AUTH)
- **FR-AUTH-001**: Sistem WAJIB mendukung registrasi dan login menggunakan email dan password untuk 4 peran pengguna: `SISWA`, `ORANG_TUA`, `GURU`, dan `ADMIN`.
- **FR-AUTH-002**: Password pengguna WAJIB di-hash menggunakan algoritma **Argon2id** dengan parameter keamanan standar industri (minimal memory cost 65536 KB, time cost 3, parallelism 4).
- **FR-AUTH-003**: Sistem WAJIB menerbitkan sesi JWT yang terdiri dari **Access Token** berumur pendek (15 menit, disimpan in-memory pada frontend) dan **Refresh Token** berumur lebih panjang (7 hari) yang disimpan dalam Cookie HTTP-Only, Secure, SameSite=Strict.
- **FR-AUTH-004**: Setiap penggunaan Refresh Token WAJIB menerapkan **Rotasi Token** (menerbitkan Refresh Token baru dan mencabut Refresh Token lama yang digunakan).
- **FR-AUTH-005**: Sistem WAJIB menerapkan **Deteksi Penggunaan Ulang Refresh Token (Reuse Detection)**. Jika Refresh Token yang sudah dicabut/dirotasi dikirimkan kembali, sistem WAJIB membatalkan seluruh famili Refresh Token milik pengguna tersebut (session family revocation) dan menghapus seluruh sesi aktif.
- **FR-AUTH-006**: Endpoint Logout WAJIB mencabut Refresh Token yang sedang aktif dan menghentikan sesi pengguna dengan menghapus cookie HTTP-Only.
- **FR-AUTH-007**: Sistem WAJIB menyediakan fitur Reset Password via email menggunakan **One-Time Token** berkriptografi kuat yang kedaluwarsa dalam 15 menit dan hanya dapat digunakan 1 kali.
- **FR-AUTH-008**: Sistem WAJIB menerapkan Rate Limiting via Fastify Rate Limit: maksimal 5 kali percobaan gagal per 15 menit untuk endpoint autentikasi sensitive (`/login`, `/forgot-password`, `/reset-password`), dan 100 req/menit untuk API umum.

#### Perlindungan Data Anak & Persetujuan Wali (FR-PDP)
- **FR-PDP-001**: Akun siswa di bawah 18 tahun TIDAK BOLEH berstatus `ACTIVE` sebelum persetujuan orang tua/wali terekam secara sah di sistem.
- **FR-PDP-002**: Log persetujuan orang tua/wali WAJIB menyimpan data audit:
  1. Identitas wali (`parent_user_id` atau email wali terverifikasi)
  2. Timestamp persetujuan (`consented_at`)
  3. Metode verifikasi (`EMAIL_LINK`, `OTP_CODE`, atau `DIRECT_PARENT_DASHBOARD`)
  4. Versi teks persetujuan (`consent_version`, misal `v1.0`)
- **FR-PDP-003**: Sistem WAJIB mendukung alur **Parent-Driven**: Orang tua mendaftar terlebih dahulu, kemudian membuat akun anak di dasbor orang tua. Persetujuan wali terekam secara otomatis dan akun anak langsung berstatus `ACTIVE`.
- **FR-PDP-004**: Sistem WAJIB mendukung alur **Student-Driven**: Siswa mendaftar mandiri dan memasukkan email orang tua/wali. Akun siswa ditetapkan pada status `PENDING_CONSENT`. Sistem mengirimkan surel yang memuat **Tautan Verifikasi Satu-Klik** dan **Kode OTP 6-digit**.
- **FR-PDP-005**: Siswa berstatus `PENDING_CONSENT` WAJIB diblokir dari seluruh endpoint API platform, KECUALI endpoint status persetujuan akunnya sendiri (`/api/v1/auth/status` dan `/api/v1/students/me/consent-status`).

#### Manajemen Profil Siswa (FR-PROF)
- **FR-PROF-001**: Profil siswa HANYA boleh menyimpan dan menampilkan data: `display_name` (nama tampilan), `education_stage` (`TK`, `SD`, `SMP`, `SMA`), `grade_level` (kelas 1-12), dan `avatar_id` dari set avatar bawaan AksiCendekia.
- **FR-PROF-002**: Profil siswa DILARANG keras menyimpan atau menampilkan nama lengkap publik, foto unggahan pribadi pengguna, alamat rumah, atau nomor telepon siswa.
- **FR-PROF-003**: Seluruh gambar avatar WAJIB dilayani dari penyimpanan media internal AksiCendekia (self-hosted assets, sesuai Prinsip VI Constitution).

#### Manajemen Kelas & Otorisasi Guru (FR-CLASS)
- **FR-CLASS-001**: Guru yang terautentikasi dapat membuat satu atau lebih Kelas (`Classroom`) dengan menentukan nama kelas, jenjang pendidikan (`education_stage`), dan deskripsi opsional.
- **FR-CLASS-002**: Setiap kelas yang dibuat otomatis memiliki Kode Kelas (`class_code`) unik alfanumerik 6-8 karakter yang dapat dibagikan oleh guru kepada siswa.
- **FR-CLASS-003**: Siswa dapat bergabung ke kelas dengan memasukkan kode kelas valid.
- **FR-CLASS-004**: Guru HANYA dapat mengakses data siswa dan daftar anggota pada kelas yang ia miliki. Akses guru terhadap data siswa di luar kelas miliknya WAJIB ditolak.

#### Middleware Otorisasi Berbasis Relasi (FR-AUTHZ)
- **FR-AUTHZ-001**: Setiap endpoint yang mengembalikan data pribadi/belajar siswa WAJIB dilindungi oleh Middleware Otorisasi Berbasis Relasi (`Relational Authorization Middleware`).
- **FR-AUTHZ-002**: Middleware otorisasi WAJIB mengevaluasi apakah pemanggil request memiliki salah satu dari relasi berikut terhadap data siswa target:
  1. **Siswa itu sendiri**: `caller.user_id == target_student.user_id` (dengan status akun `ACTIVE`).
  2. **Wali terverifikasi**: Pemanggil adalah `ORANG_TUA` yang terhubung secara resmi dan memiliki log persetujuan aktif terhadap siswa target.
  3. **Guru kelas terkait**: Pemanggil adalah `GURU` yang memiliki kelas di mana siswa target terdaftar sebagai anggota aktif.
  4. **Admin**: Pemanggil memiliki peran `ADMIN`.
- **FR-AUTHZ-003**: Jika pemanggil tidak memiliki salah satu relasi sah di atas, middleware WAJIB mengembalikan HTTP status `403 Forbidden`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **Perlindungan Akses Anak**: 100% siswa berusia < 18 tahun tanpa persetujuan orang tua/wali berstatus `PENDING_CONSENT` dan ditolak dari seluruh endpoint bisnis platform (mengembalikan status HTTP 403), hanya dapat mengakses endpoint status persetujuan akunnya sendiri.
- **SC-002**: **Isolasi Data Otorisasi Relasional Guru**: 100% percobaan akses data siswa oleh Guru pada kelas lain yang tidak diampunya mengembalikan HTTP status `403 Forbidden` pada pengujian skenario pengujian integrasi otomatis.
- **SC-003**: **Deteksi Reuse Refresh Token**: 100% kasus uji penggunaan ulang Refresh Token yang sudah kadaluwarsa/dirotasi berhasil mendeteksi insiden dan membatalkan seluruh sesi (`family_id`) milik pengguna terkait.
- **SC-004**: **Keamanan Hash Password & Token**: 100% password tersimpan dengan format **Argon2id** dan Refresh Token tersimpan dalam cookie HTTP-Only, Secure, SameSite=Strict.
- **SC-005**: **Penanganan Rate Limiting**: 100% request melebihi 5 kali percobaan gagal login/reset password dalam 15 menit terblokir oleh HTTP 429 Too Many Requests.
- **SC-006**: **Kepatuhan Privasi Profil Siswa**: Response API profil siswa 0% mengandung data nama lengkap publik, nomor telepon, alamat, atau URL foto pribadi unggahan.
