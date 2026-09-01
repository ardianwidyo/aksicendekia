# Feature Specification: Materi Belajar Interaktif — Animasi, Video, Ilustrasi & Manipulatif

**Feature Branch**: `010-interactive-lesson-content`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Tolong rubah materi pada aksicendekia menjadi lebih menarik dan interaktif. Ada animasi/video/ilustrasi yang bisa memudahkan belajar pada anak. Kamu bisa refer ke situs-situs berikut untuk materinya https://id.mathigon.org/, https://www.adaptedmind.com/, https://za.ixl.com/"

---

## Executive Summary & Background Context

AksiCendekia adalah platform belajar bergamifikasi untuk siswa TK, SD, SMP, dan SMA. Model konten kurikulum dan CMS sudah tersedia (`003-content-curriculum-cms`), mesin sesi belajar sudah berjalan (`004-learning-session-engine`), dan akses tanpa login sudah didukung (`009-guest-mode-local-storage`). Namun materi pelajaran yang disajikan saat ini masih dominan berupa teks dan butir soal statis, sehingga kurang menarik dan lebih sulit dipahami anak.

Fitur `010-interactive-lesson-content` mengubah cara materi disajikan menjadi **pengalaman belajar interaktif**: setiap pelajaran dapat memuat **ilustrasi kaya**, **animasi yang menjelaskan konsep**, **video penjelas singkat**, dan **komponen interaktif (manipulatif)** yang bisa disentuh, digeser, atau ditelusuri langkah demi langkah oleh siswa — sebelum dan selama latihan soal. Fitur ini juga menambah **tipe soal visual/interaktif** (mis. seret-dan-letakkan, penempatan pada garis bilangan) dengan umpan balik beranimasi yang ramah anak.

Situs rujukan — **Mathigon** (buku teks interaktif dengan manipulatif dan pengungkapan bertahap), **AdaptedMind** (video pelajaran + latihan + penghargaan), dan **IXL** (latihan adaptif dengan tipe soal visual dan pembahasan) — dipakai **hanya sebagai acuan pedagogi dan pola interaksi**. Tidak ada konten, aset, atau kode yang disalin dari situs-situs tersebut; seluruh ilustrasi, animasi, dan video bersifat orisinal atau berlisensi sah untuk di-hosting sendiri.

Pengembangan fitur ini mematuhi **Konstitusi AksiCendekia**: Prinsip VI (Design System & aset self-hosted, anti-hotlink, theming per jenjang), Prinsip VIII (Integritas Konten Kurikulum: pemetaan Kurikulum Merdeka dan alur `draft → review → published`), Prinsip IX (Aksesibilitas WCAG 2.1 AA), dan Prinsip VII (Perlindungan Data Anak: tanpa pelacak pihak ketiga, minimalisasi data).

---

## Clarifications

### Session 2026-09-01

- **Q1: Model authoring komponen interaktif (FR-028)** → **Konfigurasi tanpa-kode di atas katalog tipe komponen yang dirawat engineering.** Pembuat materi memilih tipe komponen dari katalog dan mengisi parameter; perilaku interaktif baru adalah pekerjaan engineering, bukan per-pelajaran.
- **Q2: Siapa yang memproduksi konten & cakupannya (FR-027)** → **Konten diproduksi sebagai bagian dari fitur ini oleh pelaksana (bukan tim konten pemberi tugas).** Cakupan: **satu mata pelajaran inti per jenjang** untuk **TK, SD, SMP, SMA**, masing-masing **3 pelajaran interaktif** dengan **10 soal per pelajaran** (meniru pola seed Feature 003). Situs rujukan (Mathigon, AdaptedMind, IXL) dan riset internet dipakai **hanya untuk acuan pedagogi/pola interaksi**; tidak ada konten, teks, aset, atau kode yang disalin dari sumber berhak cipta.
- **Q3: Penanganan elemen video (FR-001, FR-014, FR-015)** → **Kombinasi: animasi berbasis kode/SVG sekarang, slot berkas video (.mp4) opsional.** Setiap "video penjelas" diwujudkan sebagai animasi berbasis kode yang ringan, dapat di-play/pause, dan bertakarir teks. Model konten tetap menyediakan slot berkas video yang, jika/ketika tersedia, dapat menggantikan animasi tanpa mengubah struktur pelajaran.
- Q: Dari mana teks Capaian Pembelajaran resmi Kurikulum Merdeka harus diambil untuk memetakan 12 pelajaran ini? (FR-008) → A: Dari dokumen resmi Kemendikbudristek yang diambil via pencarian web saat implementasi; setiap pelajaran menyimpan kutipan CP beserta rujukan sumbernya sehingga dapat ditelusuri, bukan rumusan hasil ingatan.
- Q: Siapa yang memeriksa kebenaran matematis dan kesesuaian usia dari 12 pelajaran buatan pelaksana sebelum statusnya menjadi `PUBLISHED`? (FR-030) → A: Pelaksana menghentikan konten di status `REVIEW`; penerbitan ke `PUBLISHED` dilakukan oleh pemilik produk atau guru yang ditunjuk setelah membaca isinya. Pelaksana TIDAK boleh menerbitkan sendiri konten yang ia produksi.
- Q: Apa yang terjadi pada 3 pelajaran contoh lama (`lesson_m1`, `lesson_m2`, `lesson_i1`) setelah 12 pelajaran interaktif masuk ke katalog? (FR-031) → A: Rutenya tetap dapat diakses (tidak 404), tetapi disembunyikan dari daftar katalog; pengunjung yang membuka rute lama diarahkan ke padanan interaktifnya.
- Q: Bagaimana anak TK yang belum lancar membaca dapat mengerjakan 10 soal per pelajaran, mengingat seluruh soal dan pembahasan berbasis teks? → A: Pelajaran TK didesain berbasis gambar/ikon dengan teks minimal, ditambah tombol "dengarkan" yang memakai pembaca suara bawaan peramban (tanpa berkas audio dan tanpa layanan pihak ketiga). Slot aset audio terekam disediakan di model konten untuk diisi kemudian.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Siswa Memahami Konsep Lewat Materi Interaktif (Priority: P1)

Sebagai siswa, saya ingin membuka sebuah pelajaran dan menemukan penjelasan konsep yang hidup — ilustrasi, animasi, komponen yang bisa saya geser/sentuh untuk mencoba sendiri, dan video pendek opsional — sebelum saya mengerjakan latihan, agar saya lebih tertarik dan lebih mudah paham dibanding membaca teks panjang.

**Why this priority**: Ini inti dari permintaan pengguna — membuat materi lebih menarik dan memudahkan belajar anak. Memberi nilai mandiri walaupun tipe soal baru (P3) belum ada: pelajaran yang sama tetap bisa dipahami lebih baik.

**Independent Test**: Buka sebuah pelajaran percontohan sebagai tamu dan sebagai siswa login. Verifikasi segmen konsep menampilkan minimal satu animasi atau ilustrasi dan minimal satu elemen interaktif, video (jika ada) memiliki takarir Bahasa Indonesia dan transkrip, lalu siswa dapat menyelesaikan segmen konsep dan lanjut ke latihan.

**Acceptance Scenarios**:

1. **Given** sebuah pelajaran interaktif berstatus `PUBLISHED`, **When** siswa membukanya, **Then** pelajaran menampilkan penelusuran konsep yang memuat minimal satu ilustrasi atau animasi dan minimal satu elemen interaktif sebelum ada latihan yang dinilai.
2. **Given** sebuah manipulatif interaktif (mis. batang pecahan, garis bilangan, penggeser parameter), **When** siswa mengubahnya, **Then** tampilan visual diperbarui seketika sesuai nilai baru tanpa memuat ulang halaman.
3. **Given** sebuah video penjelas pelajaran, **When** siswa memutarnya, **Then** takarir Bahasa Indonesia dapat diaktifkan dan transkrip teks dapat diakses.
4. **Given** siswa mengaktifkan preferensi "kurangi animasi" di perangkatnya, **When** pelajaran dimuat, **Then** animasi non-esensial digantikan ilustrasi statis atau kontrol putar-atas-permintaan.
5. **Given** pengguna tamu (tanpa login), **When** membuka pelajaran yang sama lewat jalur eksplorasi publik, **Then** konten interaktif yang identik tersedia.
6. **Given** koneksi lambat atau terputus, **When** video atau animasi berat gagal dimuat, **Then** ditampilkan ilustrasi statis beserta penjelasan teks sebagai cadangan dan siswa tetap bisa menyelesaikan pelajaran.
7. **Given** anak TK yang belum bisa membaca membuka pelajaran jenjang TK, **When** ia mengerjakan soal, **Then** setiap soal dan pilihan jawaban dapat dipahami dari gambar/ikon saja, dan tersedia kontrol "dengarkan" untuk membacakan teksnya.

---

### User Story 2 - Tim Konten Menyusun Materi Interaktif di CMS (Priority: P2)

Sebagai Content Manager / Admin, saya ingin menyusun sebuah pelajaran di CMS dengan merangkai blok konten — ilustrasi, animasi, video (diunggah ke penyimpanan milik platform), dan instans komponen interaktif dari katalog beserta parameternya — melihat pratinjau seperti yang dilihat siswa, lalu menjalankannya melalui alur `draft → review → published`.

**Why this priority**: Tanpa jalur penyusunan, materi interaktif tidak bisa diproduksi atau dirawat dalam skala besar. Namun P1 sudah bisa didemokan lebih dulu dengan konten percontohan yang di-seed.

**Independent Test**: Sebagai Admin, buat satu pelajaran, tambahkan satu blok ilustrasi (dengan teks alternatif), satu blok animasi, satu video (dengan berkas takarir yang diunggah), dan satu instans komponen interaktif dengan parameter; lihat pratinjau; ajukan ke review; terbitkan; verifikasi siswa kemudian melihat persis konten tersebut.

**Acceptance Scenarios**:

1. **Given** editor pelajaran, **When** penulis menambahkan blok ilustrasi tanpa teks alternatif atau video tanpa takarir, **Then** sistem memblokir transisi ke `REVIEW` dan menampilkan daftar item aksesibilitas yang belum lengkap.
2. **Given** penulis memilih tipe komponen interaktif dari katalog, **When** ia mengisi parameter dan menyimpan, **Then** pratinjau langsung merender komponen dengan parameter tersebut.
3. **Given** pengunggahan aset media, **When** berkas melebihi ukuran maksimum atau memakai format yang tidak diizinkan, **Then** pengunggahan ditolak dengan pesan yang jelas.
4. **Given** pelajaran interaktif berstatus `PUBLISHED`, **When** penulis menyuntingnya, **Then** dibuat versi baru (immutable versioning sesuai Feature 003) dan siswa tetap melihat versi terbit saat ini sampai versi baru diterbitkan.
5. **Given** sebuah aset media, **When** aset disimpan dan disajikan, **Then** aset dilayani dari penyimpanan milik platform (tanpa hotlink pihak ketiga).

---

### User Story 3 - Latihan Soal dengan Interaksi Visual & Umpan Balik Beranimasi (Priority: P3)

Sebagai siswa, saya ingin mengerjakan soal yang tidak hanya pilihan ganda — misalnya menyeret objek ke kelompok yang tepat, menempatkan nilai pada garis bilangan, menekan bagian gambar, atau memasangkan dengan gambar — dengan umpan balik yang menyemangati dan beranimasi, agar latihan terasa menyenangkan.

**Why this priority**: Memperkuat keterlibatan dan menyerupai rasa latihan IXL/AdaptedMind, tetapi nilai penjelasan konsep (P1) dan jalur penyusunan (P2) lebih dulu. Tipe soal yang sudah ada tetap berfungsi.

**Independent Test**: Susun satu soal seret-dan-letakkan dan satu soal garis bilangan; siswa menjawab keduanya; benar/salah dievaluasi dengan aturan yang sama seperti tipe soal lama; umpan balik beranimasi dimainkan; pengguna keyboard-saja juga dapat menyelesaikan keduanya.

**Acceptance Scenarios**:

1. **Given** soal seret-dan-letakkan, **When** siswa menempatkan objek dan mengirim jawaban, **Then** jawaban dievaluasi dengan aturan otoritas yang sama seperti tipe soal lama (server untuk sesi login, lokal untuk Mode Tamu) dan umpan balik langsung ditampilkan.
2. **Given** jawaban benar, **When** umpan balik muncul, **Then** animasi positif singkat dimainkan dengan perlakuan visual success/emerald; **Given** jawaban salah, **Then** umpan balik lembut dan menawarkan petunjuk bertingkat serta pembahasan.
3. **Given** siswa hanya memakai keyboard, **When** ia mencapai soal interaktif, **Then** setiap interaksi (pilih, geser, letakkan, kirim) dapat dioperasikan tanpa penunjuk/tetikus.
4. **Given** preferensi "kurangi animasi", **When** umpan balik dipicu, **Then** dipakai indikasi setara tanpa animasi.

---

### User Story 4 - Akses & Kinerja Setara untuk Semua Anak (Priority: P3)

Sebagai siswa dengan perangkat sederhana dan koneksi terbatas, saya ingin materi interaktif tetap cepat dibuka dan dapat dipakai penuh — dengan takarir, transkrip, teks alternatif, navigasi keyboard, kontras memadai, dan pemuatan bertahap — agar saya tidak tertinggal hanya karena keterbatasan perangkat.

**Why this priority**: Konstitusi Prinsip VI/IX; audiens Indonesia mencakup perangkat kelas bawah dan bandwidth yang bervariasi. Dapat diuji mandiri lewat throttling perangkat/jaringan dan audit aksesibilitas.

**Independent Test**: Muat pelajaran interaktif percontohan pada profil perangkat menengah yang di-throttle; ukur waktu-hingga-interaktif untuk segmen konsep; jalankan pemeriksaan aksesibilitas otomatis dan manual; verifikasi tidak ada kegagalan yang memblokir.

**Acceptance Scenarios**:

1. **Given** koneksi yang di-throttle, **When** siswa membuka pelajaran interaktif, **Then** layar konsep pertama menjadi interaktif dalam batas waktu target dan media berat dimuat secara bertahap.
2. **Given** pemindaian aksesibilitas otomatis atas pelajaran interaktif mana pun yang `PUBLISHED`, **When** dijalankan, **Then** tidak ada pelanggaran WCAG 2.1 AA pada komponen interaktif.
3. **Given** siswa yang hemat kuota, **When** ia membuka pelajaran, **Then** video tidak diputar atau diunduh otomatis sampai diminta secara eksplisit.

---

### Edge Cases

- Video gagal / aset 404 / penyimpanan tidak tersedia → tampil ilustrasi statis + penjelasan teks; pelajaran tetap dapat diselesaikan.
- Penulis menerbitkan pelajaran dengan tipe komponen interaktif yang belakangan dihentikan dukungannya → siswa melihat cadangan anggun (representasi statis + penjelasan); dasbor review menandainya.
- Ilustrasi sangat besar pada layar kecil → penskalaan responsif, tanpa gulir horizontal, tetap terbaca.
- Siswa menekan kontrol interaktif berulang-cepat → pembaruan diredam/menetap tanpa membuat antarmuka macet.
- "Kurangi animasi" + pembaca layar bersamaan → seluruh informasi konsep tersedia sebagai teks/deskripsi.
- Mode Tamu: komponen interaktif tidak butuh server; seluruh logika berjalan di sisi klien dengan payload konten publik.
- Dua penulis menyunting media pelajaran yang sama secara bersamaan → versioning mencegah penimpaan; simpanan kedua membuat/mencabangkan versi draft.
- Pemetaan kurikulum (jenjang/fase/mapel/capaian pembelajaran) tetap wajib pada setiap pelajaran interaktif; tidak bisa terbit tanpa itu.
- Jenjang muda (TK/SD) menampilkan lebih banyak ilustrasi/animasi; jenjang tua (SMP/SMA) lebih banyak diagram/grafik — melalui token per jenjang, bukan percabangan komponen.
- Bandwidth sangat rendah hingga gambar cadangan pun lambat → penjelasan teks saja sudah cukup untuk menyelesaikan pelajaran.
- Pengunjung membuka tautan pelajaran legacy yang sudah tersebar → halaman tetap terbuka (tidak 404), menampilkan konten lamanya, disertai ajakan jelas menuju versi interaktif yang setara.
- Perangkat TK tidak memiliki suara Bahasa Indonesia untuk sintesis suara → kontrol "dengarkan" disembunyikan/dinonaktifkan, dan pelajaran tetap tuntas lewat gambar dan ikon.
- Anak TK menekan tombol "dengarkan" berulang-cepat → pembacaan sebelumnya dihentikan lalu diganti, tidak menumpuk menjadi suara bertindih.

---

## Requirements *(mandatory)*

### Functional Requirements

**Model konten & penyusunan**

- **FR-001**: Sistem MUST memungkinkan penulis konten menyusun sebuah pelajaran dari blok konten terurut yang mencakup minimal: teks kaya, ilustrasi/gambar, animasi, video penjelas, dan instans komponen interaktif. Blok "video penjelas" MUST dapat dipenuhi oleh salah satu dari: animasi berbasis kode/SVG (default v1) atau berkas video yang diunggah; keduanya menempati slot yang sama sehingga berkas video dapat menggantikan animasi tanpa mengubah struktur pelajaran.
- **FR-002**: Sistem MUST menyediakan katalog tipe komponen interaktif yang dapat dipakai ulang dengan parameter yang dapat dikonfigurasi tanpa menulis kode, sehingga penulis dapat membuat instans (mis. pengungkapan langkah demi langkah, penjelajah parameter/penggeser, seret-dan-letakkan pengelompokan, penempatan garis bilangan, titik-sentuh pada gambar, contoh pengerjaan beranimasi, pemasangan gambar).
- **FR-003**: Sistem MUST menyimpan seluruh aset media (gambar, berkas animasi, video, takarir, transkrip) di penyimpanan milik platform dan menyajikannya dari sana; hotlink pihak ketiga MUST ditolak.
- **FR-004**: Sistem MUST mewajibkan teks alternatif untuk setiap blok ilustrasi/gambar dan takarir Bahasa Indonesia serta transkrip teks untuk setiap video sebelum pelajaran dapat berpindah dari `DRAFT` ke `REVIEW`.
- **FR-005**: Sistem MUST memvalidasi media yang diunggah terhadap format yang diizinkan dan ukuran berkas maksimum, menolak unggahan yang tidak sesuai dengan pesan spesifik yang ramah pengguna.
- **FR-006**: Sistem MUST menyediakan pratinjau bagi penulis yang merender pelajaran (semua blok dan komponen interaktif beserta parameternya) sebagaimana yang dialami siswa.
- **FR-007**: Pelajaran interaktif MUST mengikuti siklus hidup konten yang sudah ada (`DRAFT → REVIEW → PUBLISHED → ARCHIVED`) dan immutable versioning dari Feature 003; menyunting pelajaran interaktif ber-`PUBLISHED` MUST membuat versi baru tanpa mengganggu siswa yang sedang aktif.
- **FR-008**: Setiap pelajaran interaktif MUST mempertahankan pemetaan Kurikulum Merdeka (jenjang, fase, mata pelajaran, capaian pembelajaran); penerbitan tanpa pemetaan lengkap MUST diblokir. Teks capaian pembelajaran MUST berupa kutipan dari dokumen resmi Kemendikbudristek, bukan rumusan bebas.
- **FR-008a**: Setiap pelajaran MUST menyimpan **rujukan sumber capaian pembelajaran** yang dapat ditelusuri (nama/nomor dokumen resmi, fase, elemen, dan tanggal pengambilan). Pelajaran tanpa rujukan sumber MUST diblokir dari `PUBLISHED`.
- **FR-009**: Sistem MUST menampilkan kepada reviewer, dalam alur review, tipe komponen interaktif dan media yang dipakai sebuah pelajaran, serta menandai tipe komponen yang usang/tidak didukung.

**Penyajian & pengalaman siswa**

- **FR-010**: Saat siswa membuka pelajaran interaktif, sistem MUST menyajikan penelusuran konsep yang memuat minimal satu ilustrasi atau animasi dan minimal satu elemen interaktif sebelum ada latihan yang dinilai.
- **FR-011**: Komponen interaktif MUST memperbarui keadaan visualnya seketika sebagai respons atas input siswa tanpa memuat ulang seluruh halaman.
- **FR-012**: Sistem MUST menyediakan konten pelajaran interaktif yang identik di Mode Tamu (Feature 009) melalui jalur konten publik, dengan seluruh logika komponen berjalan di sisi klien.
- **FR-013**: Sistem MUST menghormati preferensi "kurangi gerak" pada OS/peramban dengan mengganti animasi non-esensial menjadi ilustrasi statis atau pemutaran atas-permintaan.
- **FR-014**: Video penjelas MUST TIDAK diputar atau diunduh otomatis sebelum siswa meminta pemutaran secara eksplisit; takarir/teks pengiring MUST dapat dinyalakan/dimatikan dan transkrip dapat dijangkau. Ketika slot diisi animasi berbasis kode/SVG, ketentuan takarir/teks pengiring dan transkrip tetap berlaku sama.
- **FR-015**: Ketika berkas video atau animasi berat tidak dapat dimuat atau tidak didukung perangkat, sistem MUST menampilkan ilustrasi statis dan penjelasan teks sebagai cadangan yang tetap memungkinkan siswa menyelesaikan pelajaran.
- **FR-016**: Sistem MUST memuat konten pelajaran secara bertahap sehingga layar konsep pertama cepat dapat dipakai sementara media yang lebih berat dimuat di latar belakang.
- **FR-017**: Perlakuan visual konten interaktif MUST berbeda per jenjang (TK, SD, SMP, SMA) melalui design token, bukan melalui percabangan komponen.
- **FR-017a**: Pelajaran jenjang TK MUST dapat diselesaikan oleh anak yang belum bisa membaca: makna setiap soal, pilihan jawaban, dan umpan balik MUST tersampaikan lewat gambar, ikon, atau warna+bentuk, dengan teks sebagai pelengkap — bukan sebagai satu-satunya pembawa makna.
- **FR-017b**: Konten TK MUST menyediakan kontrol "dengarkan" yang membacakan teks soal, pilihan jawaban, dan umpan balik menggunakan kemampuan sintesis suara bawaan peramban. Kontrol ini MUST dapat dioperasikan dengan keyboard dan MUST TIDAK memanggil layanan pihak ketiga mana pun.
- **FR-017c**: Ketika perangkat tidak menyediakan suara Bahasa Indonesia, sistem MUST menyembunyikan atau menonaktifkan kontrol "dengarkan" secara anggun; pelajaran MUST tetap dapat diselesaikan sepenuhnya lewat jalur gambar/ikon.
- **FR-017d**: Model konten MUST menyediakan slot aset audio terekam per blok dan per butir soal yang, jika/ketika diisi, menggantikan sintesis suara peramban tanpa mengubah struktur pelajaran. Slot ini TIDAK diisi pada v1.

**Soal latihan interaktif**

- **FR-018**: Sistem MUST mendukung tipe soal visual/interaktif (minimal seret-dan-letakkan pengelompokan dan penempatan garis bilangan) sebagai tambahan atas tipe soal yang sudah ada.
- **FR-019**: Jawaban atas tipe soal interaktif MUST dievaluasi dengan model otoritas yang sama seperti tipe soal lama: di server untuk sesi terautentikasi (Feature 004), di klien untuk Mode Tamu (Feature 009). Skor yang dikirim klien MUST diabaikan untuk sesi terautentikasi.
- **FR-020**: Umpan balik untuk soal interaktif MUST memakai perlakuan taktil DESIGN.md: jawaban benar menampilkan animasi positif singkat dengan tema success/emerald; jawaban salah memberi umpan balik lembut dengan akses ke petunjuk bertingkat dan pembahasan.
- **FR-021**: Soal interaktif MUST terintegrasi dengan mekanisme petunjuk bertingkat dan pembahasan yang sudah ada tanpa membocorkan kunci jawaban sebelum submisi (sesi terautentikasi).

**Aksesibilitas & kualitas**

- **FR-022**: Setiap komponen interaktif dan tipe soal MUST sepenuhnya dapat dioperasikan hanya dengan keyboard dan memaparkan nama/peran/keadaan yang dapat diakses ke teknologi bantu.
- **FR-023**: Seluruh konten interaktif MUST memenuhi WCAG 2.1 AA (kontras teks ≥ 4.5:1, target sentuh ≥ 44×44px, tidak ada informasi yang hanya disampaikan lewat warna).
- **FR-024**: Seluruh string UI pada konten interaktif MUST melewati layer i18n (default Bahasa Indonesia); tidak ada string literal di komponen.
- **FR-025**: Sistem MUST TIDAK memperkenalkan pelacak pihak ketiga, beacon analitik, atau transmisi data pribadi melalui media tertanam atau komponen interaktif.
- **FR-026**: Sistem MUST hanya merekam data interaksi yang punya justifikasi fungsional; untuk anak, hal ini mengikuti aturan persetujuan dan minimalisasi data yang sudah ada (Prinsip VII).

**Cakupan / produksi konten**

- **FR-027**: Fitur ini MUST menghasilkan konten interaktif nyata untuk **empat jenjang (TK, SD, SMP, SMA)**: **satu mata pelajaran inti per jenjang**, masing-masing **3 pelajaran interaktif** berisi **10 butir soal** (termasuk minimal satu tipe soal interaktif per pelajaran), lengkap dengan penelusuran konsep (ilustrasi/animasi + minimal satu komponen interaktif), petunjuk bertingkat, dan pembahasan. Konten ini di-seed sehingga fitur dapat diuji end-to-end di kedua mode (login dan Mode Tamu).
- **FR-028**: Instans komponen interaktif MUST disusun sebagai **konfigurasi tanpa-kode** di atas katalog tipe komponen yang diimplementasikan dan dirawat engineering; mendefinisikan perilaku komponen interaktif yang baru berada di luar cakupan authoring konten dan merupakan pekerjaan engineering.
- **FR-029**: Konten yang diproduksi MUST orisinal untuk platform. Situs rujukan (Mathigon, AdaptedMind, IXL) dan sumber internet lain HANYA boleh dipakai sebagai acuan pedagogi dan pola interaksi; menyalin teks, gambar, aset, atau kode dari sumber berhak cipta DILARANG. Setiap aset yang bukan buatan sendiri MUST berlisensi yang mengizinkan hosting mandiri dan pencatatan atribusinya.
- **FR-030**: Setiap pelajaran interaktif yang diproduksi MUST melewati alur `DRAFT → REVIEW → PUBLISHED` yang sama seperti konten lain, dengan pemetaan Kurikulum Merdeka lengkap (jenjang, fase, mata pelajaran, capaian pembelajaran) dan seluruh syarat aksesibilitas (teks alternatif, takarir/transkrip, operabilitas keyboard) terpenuhi sebelum `PUBLISHED`.
- **FR-030a**: Konten yang diproduksi pelaksana MUST berhenti pada status `REVIEW`. Transisi `REVIEW → PUBLISHED` MUST dilakukan oleh manusia peninjau (pemilik produk atau guru yang ditunjuk); pelaksana yang memproduksi konten TIDAK boleh menerbitkan konten tersebut sendiri. Pemisahan ini menjaga gerbang review tetap bermakna untuk materi yang menjangkau anak.
- **FR-030b**: Sistem MUST menyediakan cara menjalankan dan menguji pelajaran berstatus `REVIEW` di lingkungan non-produksi (agar fitur dapat divalidasi end-to-end sebelum penerbitan), sementara jalur produksi — termasuk Mode Tamu dan bundel statis — MUST tetap hanya menyajikan pelajaran berstatus `PUBLISHED`.
- **FR-031**: Pelajaran non-interaktif yang sudah ada MUST tetap dapat diselesaikan tanpa perubahan perilaku; adopsi konten interaktif bersifat bertahap per pelajaran.
- **FR-031a**: Pelajaran contoh lama (`lesson_m1`, `lesson_m2`, `lesson_i1`) MUST ditandai sebagai *legacy*: rutenya MUST tetap dapat diakses (tidak menghasilkan 404) demi tautan yang mungkin sudah tersebar, namun MUST disembunyikan dari daftar katalog eksplorasi. Pengunjung yang membuka rute legacy MUST diberi jalan menuju padanan interaktifnya.

### Key Entities *(include if feature involves data)*

- **Interactive Lesson**: pelajaran yang isinya berupa kumpulan blok konten terurut; membawa pemetaan kurikulum, status siklus hidup, dan garis keturunan versi.
- **Content Block**: unit terurut dalam pelajaran; tipenya salah satu dari teks kaya, ilustrasi, animasi, video, atau instans komponen interaktif; menyimpan metadata aksesibilitas (teks alternatif, rujukan takarir, rujukan transkrip).
- **Media Asset**: berkas yang di-hosting platform (gambar, animasi, video, trek takarir, transkrip) dengan format, ukuran, dimensi, dan rujukan pemakaian.
- **Interactive Widget Type**: entri katalog yang mendeskripsikan sebuah interaksi yang dapat dipakai ulang (nama, deskripsi, skema parameter, catatan aksesibilitas, status dukungan).
- **Interactive Widget Instance**: konfigurasi terautorkan dari sebuah tipe komponen yang ditempatkan di blok konten (nilai-nilai parameter).
- **Interactive Question**: butir latihan yang memakai moda respons visual/interaktif; merujuk definisi jawaban benar (disimpan di server untuk sesi terautentikasi), petunjuk, dan pembahasan.
- **Curriculum Reference**: kutipan capaian pembelajaran resmi beserta rujukan sumbernya (dokumen Kemendikbudristek, fase, elemen, tanggal pengambilan) yang melekat pada setiap pelajaran dan menjadi syarat terbit.
- **Accessibility Metadata**: teks alternatif, trek takarir, transkrip, alternatif kurangi-gerak — melekat pada blok/aset dan ditegakkan saat review.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dalam pengujian termoderasi, minimal 85% siswa pada jenjang target dapat menjelaskan konsep target dengan benar setelah menyelesaikan pelajaran interaktif, dibanding versi teks-saja sebelumnya.
- **SC-002**: Nilai tengah penilaian siswa untuk "pelajaran ini menyenangkan dan mudah diikuti" minimal 4 dari 5 pada seluruh pelajaran interaktif percontohan.
- **SC-003**: Tingkat penyelesaian pelajaran untuk pelajaran interaktif percontohan minimal 15 poin persentase lebih tinggi daripada versi teks-saja sebelumnya.
- **SC-004**: Pada profil perangkat menengah yang di-throttle, layar konsep pertama pelajaran interaktif dapat dipakai dalam 3 detik; seluruh pelajaran dalam 10 detik.
- **SC-005**: 100% pelajaran interaktif yang berstatus `REVIEW` atau `PUBLISHED` lolos pemindaian WCAG 2.1 AA otomatis tanpa pelanggaran pada komponen interaktif, dan setiap video/animasi memiliki takarir Bahasa Indonesia serta transkrip.
- **SC-006**: 100% soal interaktif dapat diselesaikan hanya dengan keyboard.
- **SC-007**: Seorang penulis konten dapat menyusun dan mengajukan pelajaran interaktif baru (penelusuran konsep + minimal satu komponen interaktif + satu video bertakarir) dalam waktu di bawah 60 menit tanpa bantuan engineering.
- **SC-008**: Nol pelajaran interaktif sampai ke siswa tanpa pemetaan Kurikulum Merdeka lengkap dan status `PUBLISHED`. 100% dari 12 pelajaran memuat kutipan capaian pembelajaran beserta rujukan sumber resmi yang dapat ditelusuri kembali ke dokumen Kemendikbudristek.
- **SC-009**: Saat media gagal dimuat, minimal 95% upaya penyelesaian pelajaran tetap berhasil melalui cadangan (diukur dalam uji injeksi kegagalan).
- **SC-010**: Mode Tamu dan mode terautentikasi merender pelajaran interaktif yang sama tanpa perbedaan fitur pada penelusuran konsep.
- **SC-011**: Pada penyerahan fitur, tersedia dan berstatus **minimal `REVIEW`**: 4 jenjang × 1 mata pelajaran inti × 3 pelajaran interaktif × 10 soal (total 12 pelajaran, 120 soal), setiap pelajaran memuat minimal satu komponen interaktif dan minimal satu tipe soal interaktif, serta lolos seluruh gerbang otomatis (validasi skema, aksesibilitas, konsistensi kunci jawaban). Status `PUBLISHED` dicapai setelah persetujuan peninjau manusia sesuai FR-030a dan tidak dihitung sebagai syarat penyerahan teknis.
- **SC-012**: 100% konten yang diproduksi lolos tinjauan orisinalitas/lisensi — tidak ada teks, gambar, atau kode salinan dari sumber berhak cipta; setiap aset pihak ketiga memiliki catatan lisensi dan atribusi.
- **SC-013**: 100% butir soal pada pelajaran TK dapat dijawab benar tanpa membaca teks apa pun — diverifikasi dengan menyembunyikan seluruh teks dan memastikan gambar/ikon masih cukup untuk menentukan jawaban.

---

## Assumptions

- Konten interaktif adalah perluasan dari model konten yang ada (Feature 003) dan disajikan melalui mesin sesi belajar (Feature 004) serta jalur publik Mode Tamu (Feature 009); tidak ada sistem konten paralel yang diperkenalkan.
- Situs rujukan (Mathigon, AdaptedMind, IXL) hanya menginformasikan pedagogi dan pola interaksi; tidak ada konten, teks, aset, atau kode yang disalin. Seluruh ilustrasi, animasi, dan naskah bersifat orisinal; aset pihak ketiga hanya dipakai bila lisensinya mengizinkan hosting mandiri dan atribusi dicatat.
- Tipe komponen interaktif diimplementasikan dan dirawat oleh engineering sebagai katalog; konten disusun sebagai konfigurasi tanpa-kode atas katalog itu (FR-028).
- Konten awal untuk keempat jenjang (TK, SD, SMP, SMA) diproduksi sebagai bagian dari fitur ini oleh pelaksana: satu mata pelajaran inti per jenjang, 3 pelajaran, 10 soal per pelajaran (FR-027).
- **Asal-usul konten dibedakan menjadi tiga lapis**: (1) *pola interaksi* diadaptasi dari pengamatan atas situs rujukan — ide, bukan kode; (2) *naskah materi, butir soal, petunjuk, dan pembahasan* disusun orisinal oleh pelaksana; (3) *teks capaian pembelajaran* dikutip dari dokumen resmi Kemendikbudristek dengan rujukan sumber, tidak boleh dirumuskan bebas (FR-008, FR-008a).
- Pengambilan dokumen resmi Kurikulum Merdeka dilakukan sekali per fase (FOUNDATION, FASE_B, FASE_D, FASE_E) saat implementasi; bila dokumen resmi tidak dapat diakses, pelajaran terkait tetap berstatus `DRAFT`/`REVIEW` dan tidak diterbitkan sampai rujukan tersedia.
- Mata pelajaran inti default: **Matematika** untuk SD/SMP/SMA dan **Literasi/Numerasi Dasar** untuk TK, kecuali ditentukan lain saat perencanaan.
- Baseline perangkat/jaringan target adalah ponsel Android kelas menengah pada koneksi setara 3G yang di-throttle; "dapat dipakai" berarti penelusuran konsep sudah interaktif dan terbaca.
- Elemen "video penjelas" v1 diwujudkan sebagai animasi berbasis kode/SVG yang di-hosting sendiri; slot berkas video (.mp4, durasi pendek < 3 menit, di-hosting sendiri, tanpa adaptive streaming) tersedia namun pengisiannya opsional dan di luar jaminan v1 (FR-001, Q3).
- Perilaku penilaian, anti-cheat, petunjuk bertingkat, dan publikasi event dari Feature 004 dipakai ulang tanpa perubahan untuk sesi terautentikasi; Mode Tamu tetap memakai evaluasi lokal dari Feature 009.
- Theming per jenjang memakai design token yang ada (Prinsip VI); TK mendapat densitas ilustrasi/animasi tertinggi, SMA perlakuan paling diagramatik.
- Penyusunan konten terbatas pada peran ADMIN / Content Manager sebagaimana didefinisikan Feature 003; tidak ada peran baru.
- Metrik SC mengandalkan mekanisme sesi/telemetri yang sudah ada; tidak ada data pribadi baru yang dikumpulkan tentang anak.

## Dependencies

- **Feature 003** (model konten, CMS, siklus hidup/versioning, pemetaan kurikulum).
- **Feature 004** (mesin sesi belajar: pengurutan, penilaian server, petunjuk, event).
- **Feature 009** (jalur konten publik Mode Tamu dan evaluasi lokal).
- **Design system / design tokens** (`packages/design-tokens`) dan perlakuan taktil + emerald DESIGN.md.
- Kapabilitas **penyimpanan media/aset milik platform**.
