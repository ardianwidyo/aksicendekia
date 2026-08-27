# Feature Specification: Model Freemium dan Langganan Pro AksiCendekia

**Feature Branch**: `008-freemium-pro-subscription`

**Created**: 2026-08-27 | **Last Clarified**: 2026-08-27

**Status**: Draft / Clarified & Approved

**Input**: User description: "Model freemium dan langganan Pro AksiCendekia. Kebutuhan: 1. Definisi paket: Gratis dan Pro. Batasan paket gratis dinyatakan sebagai konfigurasi entitlement, bukan if-else tersebar (contoh entitlement: jumlah sesi per hari, akses mata pelajaran, saldo power-up harian, akses laporan lengkap orang tua). 2. Layer entitlement terpusat yang dipanggil setiap feature sebelum mengizinkan aksi berbatas kuota. Feature lain TIDAK boleh membaca status langganan secara langsung. 3. Integrasi payment gateway Indonesia dengan alur: buat transaksi → redirect/snap → webhook konfirmasi → aktivasi entitlement. Webhook WAJIB memverifikasi signature dan idempoten. 4. Langganan bulanan dan tahunan, perpanjangan, pembatalan, masa tenggang bila pembayaran gagal. 5. Paket keluarga: satu langganan orang tua mencakup sampai sejumlah akun anak. 6. Halaman upgrade sesuai CTA 'Tingkatkan ke Pro' di desain, dengan perbandingan paket, dan paywall lembut yang muncul saat kuota gratis habis. 7. Riwayat transaksi dan invoice untuk pengguna. Di luar cakupan: kupon dan referral, pembayaran lewat pulsa, penagihan sekolah lewat purchase order, pengembalian dana otomatis. Kriteria selesai: webhook yang dikirim berulang tidak menggandakan masa aktif langganan; entitlement dievaluasi di server pada setiap aksi berbatas kuota, tidak pernah hanya di client; langganan kedaluwarsa langsung menutup akses Pro tanpa perlu deploy ulang atau job manual. Catatan: JANGAN menuliskan kredensial payment gateway di kode, spec, atau plan. Rujuk sebagai variabel environment."

---

## Executive Summary & Background Context

AksiCendekia adalah platform pembelajaran bergamifikasi untuk siswa TK, SD, SMP, dan SMA. Setelah mengimplementasikan sistem autentikasi multi-peran (`002-auth-multi-role`), kurikulum CMS (`003-content-curriculum-cms`), mesin sesi belajar (`004-learning-session-engine`), progres & gamifikasi (`005-progress-gamification`), tantangan harian & papan peringkat (`006-daily-challenges-class-leaderboard`), serta dasbor orang tua & guru (`007-parent-teacher-dashboards`), platform memerlukan **Model Monetisasi Freemium dan Langganan Pro (Freemium & Pro Subscription Engine)** untuk keberlanjutan layanan.

Fitur `008-freemium-pro-subscription` menyediakan infrastruktur monitisasi dan kontrol kuota terpusat yang mencakup:
1. **Definisi Paket & Entitlement Terpusat**: Pengaturan kuota dan akses fitur untuk paket Gratis (Free) dan Pro (Personal & Keluarga) yang dinyatakan secara terkonfigurasi dalam **Centralized Entitlement Layer (`EntitlementService`)**. Seluruh fitur platform WAJIB memanggil layer ini dan DILARANG keras membaca status langganan database secara langsung.
2. **Integrasi Payment Gateway Indonesia**: Penanganan alur transaksi mandiri dari pembuatan transaksi, tokenization/redirect Snap gateway, hingga penerimaan konfirmasi *webhook* dengan **verifikasi signature kriptografis** dan **jaminan idempotensi mutlak**.
3. **Manajemen Siklus Hidup Langganan (Subscription Lifecycle)**: Pengelolaan siklus langganan bulanan (`MONTHLY`) dan tahunan (`ANNUAL`), opsi perpanjangan otomatis, pembatalan langganan, dan masa tenggang (*grace period*) saat terjadi kegagalan pembayaran otomatis.
4. **Model Langganan Paket Keluarga (Family Subscription Inheritance)**: Kemampuan satu akun Orang Tua berlangganan paket Pro Keluarga yang secara otomatis mewariskan hak entitlement Pro kepada hingga 5 akun anak yang tertaut secara sah via `ParentChildLink`.
5. **Halaman Upgrade & Paywall Lembut (Soft Paywall UI)**: Antarmuka pembandingan paket langganan yang responsif, menyajikan matriks fitur, serta komponen modal paywall lembut (*soft paywall*) yang muncul secara elegan saat pengguna gratis mencapai batas kuota harian.
6. **Riwayat Transaksi & Digital Invoice**: Pencatatan riwayat transaksi keuangan immutable beserta fasilitas tampilan dan unduh faktur/invoice resmi untuk pengguna.
7. **Keamanan & Evaluasi Real-Time Server-Side**: Evaluasi entitlement dilakukan 100% di server (*backend enforced*). Status kedaluwarsa langganan berlaku seketika saat `current_time > ends_at` tanpa membutuhkan *cron job* khusus atau *redeploy* aplikasi. Kredensial gateway pembayaran sepenuhnya dikelola via variabel environment (`PAYMENT_GATEWAY_SERVER_KEY`, dll).

Seluruh desain mematuhi penuh **Konstitusi AksiCendekia Prinsip I, II, IV, V, VI, VII, VIII, dan IX**.

---

## Clarifications

### Session 1 - 2026-08-27

- Q: Bagaimana acuan reset waktu harian untuk kuota entitlement gratis (misal 3 sesi/hari dan 1 power-up/hari)? → A: Akumulasi kuota harian di-reset setiap hari pada **pukul 00:00 sesuai zona waktu lokal pengguna** (`timezone` pada profil pengguna, misal `Asia/Jakarta`, `Asia/Makassar`, atau `Asia/Jayapura`), konsisten dengan acuan reset sesi harian di spec 007.
- Q: Bagaimana penanganan biaya saat pengguna melakukan upgrade dari Pro Personal ke Pro Keluarga di tengah periode aktif? → A: Biaya dihitung secara **prorata (*prorated credit*)** — sisa nilai nominal dari sisa hari langganan lama dikonversi menjadi kredit pemotong biaya transaksi paket Pro Keluarga yang baru.
- Q: Bagaimana penanganan transaksi berstatus PENDING yang tidak mendapatkan webhook konfirmasi pembayaran? → A: Sesi transaksi berstatus `PENDING` yang tidak menerima konfirmasi webhook dalam waktu **24 jam** secara otomatis diubah menjadi `EXPIRED` oleh sistem.
- Q: Bagaimana perilaku akses dan tampilan antarmuka saat langganan masuk ke masa tenggang (`PAST_DUE`) akibat perpanjangan otomatis gagal? → A: **Akses Pro tetap aktif penuh selama 7 hari masa tenggang**, dibarengi tampilan notifikasi *banner warning* peringatan pembayaran di akun Orang Tua ("Pembayaran perpanjangan gagal. Harap perbarui metode pembayaran sebelum [tanggal]").

---

## Clarified Architectural Decisions

1. **Layer Entitlement Terpusat (`EntitlementService`) & Prinsip Anti-Direct DB Read**:
   - Fitur-fitur lain (seperti `LearningSessionEngine`, `GamificationEngine`, `ParentDashboard`) **TIDAK BOLEH** mengeksekusi query database untuk membaca `user.subscription_tier` atau `subscriptions.status`.
   - Seluruh pemeriksaan kuota/akses WAJIB melalui metode terpusat: `EntitlementService.checkQuotaAccess(userId, entitlementKey, context)` atau `EntitlementService.getActiveEntitlements(userId)`.
   - Entitlement kunci yang didukung:
     - `DAILY_SESSION_LIMIT`: Batas jumlah sesi belajar per hari (Free: 3 sesi/hari, Pro: Unlimited / `-1`).
     - `SUBJECT_ACCESS_TIER`: Tier akses mata pelajaran (Free: `BASIC` / hanya mapel utama Matematika & Bahasa Indonesia, Pro: `ALL` / seluruh mapel kurikulum).
     - `DAILY_POWERUP_ALLOWANCE`: Kuota saldo power-up gratis per hari (Free: 1/hari, Pro: 5/hari).
     - `PARENT_REPORT_DEPTH`: Kedalaman laporan orang tua (Free: `SUMMARY_ONLY`, Pro: `FULL_ANALYTICS` mencakup analisis akurasi butir soal & rekomendasi AI).
     - `FAMILY_MEMBER_CAPACITY`: Jumlah maksimum anak yang ditanggung langganan (Free: 0, Pro Personal: 0, Pro Family: 5 anak).

2. **Server-Side Real-Time Entitlement Evaluation**:
   - Evaluasi entitlement dilakukan di backend Fastify saat request API dikirimkan.
   - Status langganan dianggap aktif HANYA JIKA `status == 'ACTIVE'` ATAU (`status == 'PAST_DUE'` AND `current_time <= grace_period_ends_at`).
   - Ketika `current_time > ends_at` (dan melewati masa tenggang), `EntitlementService` secara otomatis mengembalikan konfigurasi tier `FREE` secara real-time. Tidak ada ketergantungan pada *cron job* atau proses *background cleanup* untuk mencabut akses Pro.

3. **Alur Transaksi & Idempotensi Webhook Gateway**:
   - **Alur Transaksi**:
     1. User memilih paket → `POST /api/v1/subscriptions/checkout` → Backend membuat record `PaymentTransaction` berstatus `PENDING` dan meminta `snap_token` / `redirect_url` dari API Payment Gateway.
     2. Web frontend membuka Snap popup / redirect pengguna ke halaman pembayaran gateway.
     3. Gateway mengirim HTTP POST ke Webhook backend (`POST /api/v1/payments/webhook`).
   - **Verifikasi Signature**:
     - Webhook handler WAJIB mengkalkulasi hash SHA-512 dari `order_id + status_code + gross_amount + PAYMENT_GATEWAY_SERVER_KEY` (atau HMAC-SHA256 sesuai standar gateway).
     - Jika hash tidak cocok, request ditolak seketika dengan HTTP `401 Unauthorized` dan dicatat dalam security log.
   - **Jaminan Idempotensi Mutlak**:
     - Setiap webhook diperiksa berdasarkan `order_id` dan `transaction_status`.
     - Jika `PaymentTransaction` untuk `order_id` tersebut sudah dalam status final (`SETTLED` / `PAID`), webhook balasan berulang HANYA akan mengembalikan HTTP `200 OK` tanpa mengubah `subscription.ends_at` atau menambah durasi langganan.
     - Formula penambahan durasi saat perpanjangan sah: `new_ends_at = MAX(current_ends_at, NOW()) + duration_period` (mencegah tumpang tindih atau pengurangan durasi).

4. **Masa Tenggang Pembayaran Gagal (Grace Period)**:
   - Jika pembayaran perpanjangan otomatis gagal, status langganan berubah menjadi `PAST_DUE` dengan `grace_period_ends_at = NOW() + 7 hari`.
   - Selama masa tenggang (7 hari), pengguna tetap memperoleh akses Pro, namun sistem menampilkan peringatan pembayaran di header app ("Pembayaran perpanjangan gagal. Harap perbarui metode pembayaran sebelum [tanggal]").
   - Jika hingga `grace_period_ends_at` pembayaran belum berhasil, status berubah menjadi `EXPIRED` dan entitlement langsung kembali ke paket `FREE`.

5. **Pewarisan Entitlement Paket Keluarga (Family Subscription)**:
   - Ketika `STUDENT` meminta evaluasi entitlement:
     1. Sistem mengecek apakah siswa memiliki langganan Pro individu yang aktif.
     2. Jika tidak ada, sistem mencari akun `PARENT` yang terhubung via `ParentChildLink` berstatus `ACTIVE`.
     3. Jika Parent memiliki langganan `PRO_FAMILY` yang aktif (`ACTIVE` atau `PAST_DUE`), siswa secara otomatis mewarisi entitlement `PRO` lengkap.

6. **Soft Paywall & Pengalaman Pengguna (UX)**:
   - Ketika batas kuota gratis tercapai (misal: siswa mencoba memulai sesi belajar ke-4 pada hari yang sama), API `POST /api/v1/learning/sessions` mengembalikan HTTP `403 Forbidden` dengan kode error terstruktur `PAYWALL_LIMIT_REACHED` beserta metadata entitlement (`current_usage: 3, limit: 3, entitlement: "DAILY_SESSION_LIMIT"`).
   - Frontend menangkap error ini dan menampilkan **Soft Paywall Modal** (bukan error crash), memberikan penjelasan ramah bahwa kuota harian telah habis, serta tombol CTA "Tingkatkan ke Pro" dan tombol "Kembali Besok".

7. **Reset Kuota Entitlement Harian (00:00 Zona Waktu Lokal Pengguna)**:
   - Akumulasi penggunaan kuota entitlement harian (`DAILY_SESSION_LIMIT`, `DAILY_POWERUP_ALLOWANCE`) di-reset setiap hari pada **pukul 00:00 sesuai zona waktu lokal pengguna** (`timezone` pada profil pengguna, misal `Asia/Jakarta`, `Asia/Makassar`, atau `Asia/Jayapura`), konsisten dengan acuan reset harian pada spec 007.

8. **Perhitungan Prorata Upgrade Paket Mid-Cycle**:
   - Ketika pengguna berpaket `PRO_PERSONAL` melakukan upgrade ke `PRO_FAMILY` di pertengahan periode langganan, sisa nilai nominal dari sisa hari paket lama dikonversi menjadi kredit (*prorated credit*) yang memotong total biaya transaksi `PRO_FAMILY` yang baru.

9. **Kedaluwarsa Otomatis Transaksi PENDING (24 Jam)**:
   - Record `PaymentTransaction` berstatus `PENDING` yang tidak menerima webhook konfirmasi pembayaran dalam kurun waktu **24 jam** sejak dibuat secara otomatis ditandai `EXPIRED` oleh sistem.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pembelian Langganan Pro & Aktivasi via Webhook Gateway (Priority: P1)

Sebagai Pengguna (Orang Tua atau Siswa Dewasa), saya ingin memilih paket langganan Pro (Bulanan atau Tahunan), melakukan pembayaran via Payment Gateway Indonesia, dan secara otomatis mendapatkan akses Pro seketika setelah pembayaran dikonfirmasi, agar saya/anak saya dapat menikmati seluruh fitur pembelajaran tanpa batasan.

**Why this priority**: Ini adalah alur monetisasi inti (*monetization happy path*). Tanpa alur checkout dan webhook konfirmasi yang andal, platform tidak dapat menerima pembayaran dan mengaktifkan fitur Pro.

**Independent Test**:
1. User login -> Membuat pesanan via `POST /api/v1/subscriptions/checkout` dengan `planId = "PRO_MONTHLY"` -> Menerima `snapToken` dan `orderId`.
2. Backend mencatat `PaymentTransaction` status `PENDING`.
3. Simulasi pengiriman webhook dari Payment Gateway `POST /api/v1/payments/webhook` dengan signature valid dan status `settlement` -> Backend memverifikasi signature, memperbarui `PaymentTransaction` menjadi `SETTLED`, dan mengaktifkan `Subscription` status `ACTIVE` dengan `ends_at = NOW() + 30 hari`.
4. User mengecek status entitlement via `GET /api/v1/entitlements/me` -> Seluruh entitlement mengembalikan nilai paket Pro (`DAILY_SESSION_LIMIT: -1`, `SUBJECT_ACCESS_TIER: "ALL"`).

**Acceptance Scenarios**:
1. **Given** User memilih paket Pro Bulanan/Tahunan pada halaman Upgrade, **When** menekan "Bayar Sekarang", **Then** backend menghasilkan `order_id` unik, menyimpan `PaymentTransaction` `PENDING`, dan mengembalikan Snap token/URL redirect gateway pembayaran.
2. **Given** Payment Gateway mengirimkan webhook konfirmasi pembayaran (`settlement`/`capture`), **When** webhook diterima backend, **Then** backend WAJIB memverifikasi signature SHA-512/HMAC; jika valid, transaksi diperbarui menjadi `SETTLED` dan masa aktif langganan Pro diperbarui secara tepat.
3. **Given** Gateway mengirimkan webhook dengan signature yang TIDAK valid atau telah dimanipulasi, **When** webhook diterima, **Then** backend menolak request dengan HTTP 401 `INVALID_WEBHOOK_SIGNATURE` dan TIDAK mengubah status langganan.
4. **Given** Webhook berulang untuk `order_id` yang sama dikirimkan 5 kali oleh gateway (retry mechanism), **When** diproses oleh backend, **Then** backend memproses idempotensi, mengembalikan HTTP 200 OK pada request ke-2 hingga ke-5, dan TIDAK memperpanjang `ends_at` secara berulang.

---

### User Story 2 - Evaluasi Entitlement Server-Side Terpusat & Soft Paywall (Priority: P1)

Sebagai Pengguna Gratis, ketika saya mencapai batas kuota harian (seperti jumlah sesi belajar harian), sistem harus mengevaluasi entitlement secara terpusat di server dan menyajikan Soft Paywall yang mengarahkan saya ke halaman upgrade tanpa memblokir navigasi dasar aplikasi.

**Why this priority**: Mengunci fitur berkuota di server (*server-side enforcement*) adalah pertahanan utama terhadap kebocoran revenue dan eksploitasi bypass client-side, sekaligus memberikan UX paywall yang ramah.

**Independent Test**:
1. Siswa gratis telah menyelesaikan 3 sesi belajar pada hari yang sama (`daily_sessions_count = 3`).
2. Siswa mencoba memulai sesi belajar ke-4 via `POST /api/v1/learning/sessions`.
3. Engine sesi belajar memanggil `EntitlementService.checkQuotaAccess(userId, "DAILY_SESSION_LIMIT")`.
4. `EntitlementService` mendeteksi kuota `3/3` telah habis -> Mengembalikan penolakan entitlement.
5. API mengembalikan HTTP 403 `PAYWALL_LIMIT_REACHED`.
6. Frontend menampilkan Soft Paywall Modal dengan informasi kuota terpakai dan CTA upgrade.

**Acceptance Scenarios**:
1. **Given** Siswa berpaket Gratis, **When** mencoba mengakses aksi berkuota (misal: memulai sesi belajar melebihi 3x/hari atau memilih mapel non-utama), **Then** backend menolak aksi tersebut di layer entitlement terpusat dan mengembalikan error HTTP 403 `PAYWALL_LIMIT_REACHED`.
2. **Given** Siswa berpaket Pro, **When** mengakses aksi berkuota yang sama, **Then** backend mengizinkan aksi tanpa batasan (`DAILY_SESSION_LIMIT: -1`).
3. **Given** Fitur apa pun di backend (misal: Gamification, CMS, Parent Dashboard), **When** mengecek akses fitur kuota, **Then** kode WAJIB memanggil `EntitlementService` dan DILARANG membaca kolom tabel DB langganan secara langsung.
4. **Given** Pengguna menerima pesan paywall di antarmuka, **When** memilih "Tingkatkan ke Pro", **Then** pengguna diarahakan ke Halaman Upgrade yang menampilkan matriks perbandingan paket Gratis vs Pro Personal vs Pro Keluarga.

---

### User Story 3 - Paket Keluarga & Pewarisan Entitlement Anak (Priority: P2)

Sebagai Orang Tua yang berlangganan Paket Keluarga Pro, saya ingin semua akun anak saya yang terikat (hingga 5 anak) secara otomatis mendapatkan akses Pro penuh tanpa perlu membeli langganan terpisah untuk tiap anak.

**Why this priority**: Paket Keluarga adalah proposisi nilai utama (*core value proposition*) untuk segmen pengguna Orang Tua dengan lebih dari satu anak.

**Independent Test**:
1. Orang Tua membeli paket `PRO_FAMILY` -> Langganan orang tua aktif (`status = ACTIVE`).
2. Anak A dan Anak B terhubung ke Orang Tua via `ParentChildLink` aktif.
3. Anak A (yang tidak memiliki langganan pribadi) memanggil `GET /api/v1/entitlements/me`.
4. `EntitlementService` mengecek relasi parent link, menemukan langganan Pro Keluarga milik orang tua, dan mengembalikan entitlement `PRO` lengkap untuk Anak A.
5. Jika Orang Tua menghubungkan Anak ke-6, backend menolak pautan keluarga atau tidak memberikan warisan Pro melebihi kapasitas maksimum 5 anak (`FAMILY_MEMBER_CAPACITY_EXCEEDED`).

**Acceptance Scenarios**:
1. **Given** Orang Tua memiliki langganan `PRO_FAMILY` aktif, **When** anak yang terikat via `ParentChildLink` aktif melakukan aksi berkuota, **Then** anak secara otomatis mewarisi entitlement Pro penuh.
2. **Given** Langganan Paket Keluarga Orang Tua kedaluwarsa atau dibatalkan, **When** anak melakukan aksi berkuota pada hari berikutnya, **Then** entitlement anak secara otomatis kembali ke tier `FREE` secara real-time.
3. **Given** Akun Orang Tua mencoba mendaftarkan anak ke-6 pada Paket Keluarga yang berkapasitas maksimum 5 anak, **When** penautan dikonfirmasi, **Then** sistem memberikan peringatan bahwa batas kapasitas paket keluarga (5 anak) telah tercapai dan anak ke-6 akan berada pada tier Gratis hingga paket disesuaikan.

---

### User Story 4 - Penanganan Perpanjangan, Pembatalan, Kedaluwarsa, & Masa Tenggang (Priority: P2)

Sebagai Pengguna Langganan Pro, saya ingin mengelola opsi perpanjangan dan pembatalan langganan saya, serta mendapatkan masa tenggang jika pembayaran perpanjangan otomatis gagal, agar akses belajar tidak terputus secara mendadak.

**Why this priority**: Mengelola siklus hidup langganan (*subscription lifecycle management*) menjamin keadilan bagi pengguna dan kepastian status operasional sistem penagihan.

**Independent Test**:
1. User dengan langganan aktif mematikan perpanjangan otomatis via `POST /api/v1/subscriptions/cancel`.
2. Status langganan berubah menjadi `CANCELED`, namun `ends_at` tetap di akhir periode yang sudah dibayar. User tetap mendapat akses Pro hingga tanggal `ends_at`.
3. Pada saat `current_time > ends_at`, `EntitlementService` secara real-time mengembalikan status entitlement `FREE` tanpa perlu bantuan job manual atau redeploy.
4. Simulasi kegagalan pembayaran perpanjangan otomatis -> Status langganan menjadi `PAST_DUE` dengan `grace_period_ends_at = NOW() + 7 hari`. User tetap mendapatkan akses Pro selama 7 hari dengan notifikasi peringatan pembayaran.

**Acceptance Scenarios**:
1. **Given** Pengguna membatalkan perpanjangan langganan, **When** pembatalan diproses, **Then** status berubah menjadi `CANCELED`, namun akses Pro tetap berlaku penuh sampai tanggal `ends_at` periode berjalan berakhir.
2. **Given** Pembayaran perpanjangan otomatis gagal, **When** webhook kegagalan diterima, **Then** status langganan berubah menjadi `PAST_DUE` dengan masa tenggang 7 hari; entitlement Pro tetap aktif selama periode tenggang tersebut.
3. **Given** Masa tenggang 7 hari berakhir tanpa pembayaran yang berhasil ATAU langganan berstatus `CANCELED` melewati `ends_at`, **When** pengguna melakukan request pada detik berikutnya, **Then** backend secara real-time mencabut akses Pro dan memberlakukan entitlement `FREE`.

---

### User Story 5 - Riwayat Transaksi & Unduh Invoice Digital (Priority: P3)

Sebagai Pengguna yang pernah melakukan transaksi, saya ingin melihat daftar riwayat pembayaran saya dan mengunduh invoice digital resmi untuk bukti pembayaran.

**Why this priority**: Transparansi finansial dan penyediaan bukti pembayaran (invoice) meningkatkan kepercayaan pengguna (*user trust*) dan kepatuhan administrasi.

**Independent Test**:
1. User membuka halaman Pengaturan Akun > Billing & Transaksi.
2. Backend memanggil `GET /api/v1/payments/history` -> Mengembalikan daftar transaksi terurut dari yang terbaru.
3. User menekan "Lihat Invoice" pada salah satu transaksi `SETTLED` -> Backend memanggil `GET /api/v1/payments/invoices/:invoiceId` -> Menyajikan rincian invoice lengkap (nomor invoice, tanggal, rincian paket, PPN 11%, total bayar, metode pembayaran, status).

**Acceptance Scenarios**:
1. **Given** Pengguna membuka halaman riwayat transaksi, **When** data dimuat, **Then** sistem menampilkan seluruh riwayat pembayaran beserta statusnya (`PENDING`, `SETTLED`, `FAILED`, `EXPIRED`).
2. **Given** Pengguna memilih transaksi yang sudah berhasil (`SETTLED`), **When** menekan "Lihat Invoice", **Then** sistem menampilkan invoice digital yang mencantumkan rincian item, nomor transaksi unik, tanggal, pajak (PPN 11%), dan status lunas.

---

### Edge Cases

- **Webhook Delay / Out-of-Order Delivery**: Webhook konfirmasi pembayaran diterima backend *sebelum* pengguna menyelesaikan alur redirect di browser, atau sebaliknya. -> *Handling*: Status transaksi di database menjadi sumber kebenaran tunggal (*single source of truth*). Frontend melakukan polling singkat (maksimal 5x) atau memverifikasi status transaksi ke backend setelah redirect untuk memastikan sinkronisasi UI.
- **Perubahan Waktu Jam Server (Clock Drift)**: Jam server berbeda dengan jam database. -> *Handling*: Seluruh perbandingan timestamp `ends_at` dan `grace_period_ends_at` WAJIB menggunakan timestamp terstandarisasi PostgreSQL `NOW() AT TIME ZONE 'UTC'`.
- **Double Checkout Request**: Pengguna mengklik tombol "Bayar" secara berkali-kali dalam hitungan milidetik. -> *Handling*: Endpoint checkout menerapkan locking / idempotency key per pengguna sehingga hanya 1 transaksi `PENDING` aktif yang dibuat untuk sesi checkout yang sama.
- **Penautan Anak Baru saat Paket Keluarga Aktif**: Orang Tua menambahkan anak baru ketika langganan `PRO_FAMILY` sudah berjalan pertengahan bulan. -> *Handling*: Anak baru yang terikat secara otomatis langsung menikmati sisa masa aktif Pro Keluarga tanpa biaya tambahan, selama total anak tidak melebihi 5.
- **Kredensial Gateway Hilang dari Environment**: Aplikasi dijalankan tanpa variabel environment `PAYMENT_GATEWAY_SERVER_KEY`. -> *Handling*: Saat aplikasi bootstrap (Fastify startup hook), Zod environment validator melempar fatal error dan menghentikan proses startup untuk mencegah transaksi tanpa verifikasi keamanan.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistem MUST menyediakan **Centralized Entitlement Layer (`EntitlementService`)** sebagai satu-satunya pintu evaluasi kuota dan hak akses fitur platform.
- **FR-002**: Seluruh modul fitur platform (Learning Session, Gamification, Parent Dashboard, Content CMS) DILARANG keras membaca status langganan pengguna dari database secara langsung dan WAJIB memanggil `EntitlementService`.
- **FR-003**: Sistem MUST mendefinisikan konfigurasi entitlement untuk tier `FREE`, `PRO_PERSONAL`, dan `PRO_FAMILY` yang mencakup batas sesi harian (`DAILY_SESSION_LIMIT`), tier akses mapel (`SUBJECT_ACCESS_TIER`), kuota power-up harian (`DAILY_POWERUP_ALLOWANCE`), kedalaman laporan orang tua (`PARENT_REPORT_DEPTH`), dan kapasitas anggota keluarga (`FAMILY_MEMBER_CAPACITY`).
- **FR-004**: Evaluasi entitlement MUST dilakukan di **server-side (backend Fastify)** secara real-time pada setiap request API berbatas kuota. Evaluasi client-side HANYA bersifat sebagai pengatur tampilan UI.
- **FR-005**: Sistem MUST menyediakan endpoint `POST /api/v1/subscriptions/checkout` untuk menginisiasi transaksi pembayaran langganan bulanan (`MONTHLY`) atau tahunan (`ANNUAL`) via Payment Gateway Indonesia.
- **FR-006**: Sistem MUST menyediakan endpoint webhook `POST /api/v1/payments/webhook` untuk menerima konfirmasi status pembayaran dari Payment Gateway.
- **FR-007**: Webhook handler MUST memverifikasi **signature kriptografis** (SHA-512/HMAC) menggunakan variabel environment secret sebelum memproses payload. Request dengan signature invalid WAJIB ditolak dengan HTTP 401.
- **FR-008**: Webhook handler MUST menjamin **idempotensi mutlak**. Pengiriman webhook berulang untuk `order_id` yang sama TIDAK BOLEH menggandakan atau memperpanjang masa aktif langganan melebihi durasi paket yang dibeli.
- **FR-009**: Kredensial API Payment Gateway (server key, client key, webhook secret) DILARANG KERAS dituliskan secara literal (*hardcoded*) di dalam kode, spec, atau plan, dan WAJIB dibaca dari variabel environment (`PAYMENT_GATEWAY_SERVER_KEY`, `PAYMENT_GATEWAY_CLIENT_KEY`, `PAYMENT_GATEWAY_WEBHOOK_SECRET`).
- **FR-010**: Sistem MUST mendukung langganan siklus bulanan (`MONTHLY` = 30 hari) dan tahunan (`ANNUAL` = 365 hari).
- **FR-011**: Sistem MUST mendukung penghentian perpanjangan otomatis (pembatalan) di mana status berubah menjadi `CANCELED`, namun hak akses Pro pengguna tetap berlaku hingga akhir periode `ends_at`.
- **FR-012**: Sistem MUST mendukung **masa tenggang (*grace period*) selama 7 hari** jika pembayaran perpanjangan otomatis gagal (`PAST_DUE`), di mana pengguna tetap memperoleh akses Pro selama 7 hari sebelum status berubah menjadi `EXPIRED`.
- **FR-013**: Pencabutan akses Pro saat langganan kedaluwarsa (`ends_at` terlewati dan grace period habis) MUST terjadi secara **otomatis dan seketika pada saat evaluasi request server**, tanpa membutuhkan *cron job* khusus atau *redeploy* aplikasi.
- **FR-014**: Sistem MUST mendukung **Paket Keluarga (`PRO_FAMILY`)** di mana 1 akun Orang Tua dapat mewariskan entitlement Pro kepada hingga 5 akun anak yang terhubung via `ParentChildLink` aktif.
- **FR-015**: Sistem MUST menyediakan endpoint `GET /api/v1/entitlements/me` bagi client untuk mengambil status entitlement pengguna saat ini guna menampilkan UI yang sesuai.
- **FR-016**: Antarmuka frontend MUST menyediakan **Halaman Upgrade** yang menyajikan tabel perbandingan paket (Free vs Pro Personal vs Pro Keluarga) sesuai dengan komponen design token AksiCendekia.
- **FR-017**: Antarmuka frontend MUST menyediakan modal **Soft Paywall** yang secara otomatis muncul saat API backend mengembalikan error HTTP 403 `PAYWALL_LIMIT_REACHED`.
- **FR-018**: Sistem MUST mencatat seluruh transaksi pembayaran ke dalam tabel ledger immutable (`PaymentTransaction`) dan menyediakan endpoint `GET /api/v1/payments/history`.
- **FR-019**: Sistem MUST menyediakan endpoint `GET /api/v1/payments/invoices/:invoiceId` untuk menyajikan rincian invoice digital terformat yang mencantumkan PPN 11%, rincian item, tanggal, dan status transaksi.
- **FR-020**: Fitur di luar cakupan (Kupon/Referral, Pembayaran Pulsa, Purchase Order Sekolah, dan Pengembalian Dana Otomatis) DILARANG diimplementasikan pada iterasi ini.
- **FR-021**: Sistem MUST mengonversi sisa nilai nominal langganan lama secara prorata (*prorated credit*) sebagai potongan harga saat pengguna melakukan upgrade dari `PRO_PERSONAL` ke `PRO_FAMILY` di tengah periode aktif.
- **FR-022**: Sistem MUST secara otomatis mengubah status transaksi `PaymentTransaction` dari `PENDING` menjadi `EXPIRED` jika konfirmasi webhook pembayaran tidak diterima dalam kurun waktu 24 jam.
- **FR-023**: Akumulasi penggunaan kuota entitlement harian (`DAILY_SESSION_LIMIT`, `DAILY_POWERUP_ALLOWANCE`) MUST di-reset setiap hari pada pukul 00:00 sesuai zona waktu lokal pengguna (`timezone`).

---

### Key Entities

- **SubscriptionPlan**: Entitas konfigurasional paket langganan.
  - Attributes: `id` (`FREE`, `PRO_PERSONAL`, `PRO_FAMILY`), `name`, `description`, `price_monthly_idr`, `price_annual_idr`, `max_family_members`, `is_active`, `created_at`, `updated_at`.
- **PlanEntitlementConfig**: Matriks pemetaan konfigurasi entitlement per paket.
  - Attributes: `id`, `plan_id`, `entitlement_key` (`DAILY_SESSION_LIMIT`, `SUBJECT_ACCESS_TIER`, `DAILY_POWERUP_ALLOWANCE`, `PARENT_REPORT_DEPTH`, `FAMILY_MEMBER_CAPACITY`), `entitlement_value` (string/json representation e.g. `"3"`, `"-1"`, `"BASIC"`, `"ALL"`).
- **Subscription**: Records status langganan aktif pengguna (Orang Tua atau Siswa).
  - Attributes: `id`, `user_id`, `plan_id`, `billing_cycle` (`MONTHLY`, `ANNUAL`), `status` (`PENDING_PAYMENT`, `ACTIVE`, `PAST_DUE`, `CANCELED`, `EXPIRED`), `starts_at`, `ends_at`, `grace_period_ends_at`, `auto_renew`, `payment_gateway_customer_id`, `created_at`, `updated_at`.
- **PaymentTransaction**: Ledger transaksi pembayaran immutable.
  - Attributes: `id`, `order_id` (unique transaction reference), `subscription_id`, `user_id`, `gross_amount_idr`, `tax_amount_idr`, `payment_method` (`EWALLET`, `VIRTUAL_ACCOUNT`, `CREDIT_CARD`, `QRIS`), `gateway_transaction_id`, `status` (`PENDING`, `SETTLED`, `FAILED`, `EXPIRED`, `REFUNDED`), `raw_gateway_response` (JSON), `paid_at`, `created_at`, `updated_at`.
- **Invoice**: Faktur digital untuk pengguna.
  - Attributes: `id`, `invoice_number` (format e.g. `INV/2026/08/AC-XXXXX`), `payment_transaction_id`, `user_id`, `subtotal_idr`, `tax_idr` (PPN 11%), `total_idr`, `billing_name`, `billing_email`, `status` (`PAID`, `UNPAID`), `issued_at`, `pdf_url` (optional self-hosted link).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **100% Idempotensi Webhook**: Pengiriman webhook simulasional yang diulang hingga 10x untuk `order_id` yang sama menghasilkan tepat 1x perubahan status transaksi dan 0x penggandaan durasi langganan.
- **SC-002**: **100% Server-Side Quota Enforcement**: Penolakan aksi berkuota (misal sesi belajar ke-4 pada tier Free) berhasil 100% diuji via API endpoint backend tanpa bergantung pada logika client.
- **SC-003**: **Real-Time Expiration Cutoff**: Akun Pro yang dimanipulasi timestamp `ends_at`-nya menjadi 1 detik di masa lalu secara otomatis langsung mengembalikan entitlement `FREE` pada request berikutnya tanpa membutuhkan eksekusi job manual atau redeploy backend.
- **SC-004**: **0 Key Leakage**: Pemindaian keamanan statis (*static security scan*) mengonfirmasi 0 kredensial gateway pembayaran yang ter-hardcode di repositori kode, spec, maupun plan.
- **SC-005**: **Verifikasi Signature Mutlak**: 100% request webhook dengan signature yang salah atau tanpa header signature ditolak dengan HTTP 401 Unauthorized.
- **SC-006**: **Waktu Respon Entitlement Check**: Panggilan check entitlement terpusat (`EntitlementService.checkQuotaAccess`) memiliki latensi rata-rata < 15ms per request.
- **SC-007**: **Pewarisan Entitlement Paket Keluarga**: 100% akun anak yang terhubung via `ParentChildLink` aktif dari Orang Tua berpaket `PRO_FAMILY` menerima status entitlement Pro secara otomatis.
- **SC-008**: **WCAG 2.1 AA Compliance & Design Tokens**: Halaman Upgrade dan Soft Paywall Modal 100% menggunakan token visual dari `packages/design-tokens` dan memenuhi kontras minimum 4.5:1 serta target sentuh minimum 44x44px.

---

## Assumptions & Dependencies

- **Assumptions**:
  - Payment Gateway Indonesia yang digunakan mendukung alur Snap/Redirect serta HTTP POST webhook notification dengan signature header verification (misal Midtrans Snap atau Xendit).
  - Pajak Pertambahan Nilai (PPN) Indonesia yang berlaku adalah 11% dan dihitung secara transparan pada ringkasan checkout dan invoice.
  - Pengguna dianggap memiliki koneksi internet yang stabil saat melakukan proses checkout pembayaran.
- **Dependencies**:
  - `002-auth-multi-role`: Untuk autentikasi JWT dan identifikasi peran pengguna (`PARENT`, `STUDENT`).
  - `007-parent-teacher-dashboards`: Untuk relasi `ParentChildLink` yang digunakan dalam pewarisan Paket Keluarga Pro.
  - `004-learning-session-engine` & `005-progress-gamification`: Modul konsumen yang memanggil `EntitlementService` sebelum mengizinkan pembuatan sesi belajar atau klaim power-up harian.
  - `packages/design-tokens`: Untuk konsistensi styling halaman upgrade dan modal paywall.

---
