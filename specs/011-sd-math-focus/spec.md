# Feature Specification: Fokus Jenjang SD — Revamp Matematika Interaktif Kelas 1–6

**Feature Branch**: `011-sd-math-focus`

**Created**: 2026-09-02

**Status**: Draft

**Input**: User description: "Tolong revamp aplikasi ini dengan ketentuan sebagai berikut: (1) Rubah/Hide dulu semua menu pada aplikasi ini yang tidak perlu, saya ingin fokus dulu hanya pada jenjang SD dengan materi yang lebih komplit; (2) Fokus untuk pelajaran matematika terlebih dahulu; (3) Tambahkan animasi, ilustrasi, video untuk setiap pembelajaran — konten video bisa diambil dari platform lain ataupun media sosial seperti YouTube; (4) Untuk setiap kelas pada fase ini buatkan minimal 10 materi interaktif yang menarik; (5) Sesuaikan materi dengan kurikulum terbaru yang berlaku di Indonesia; (6) Materi ini bisa diakses oleh tamu ataupun yang sudah terdaftar; (7) Revamp dengan token yang seminimal mungkin"

---

## Executive Summary & Background Context

AksiCendekia saat ini melayani empat jenjang (TK, SD, SMP, SMA) dengan banyak permukaan produk: eksplorasi publik, sesi belajar siswa, peta misi, papan peringkat, pencapaian, dasbor orang tua, dasbor guru, CMS admin, dan langganan. Katalog materi interaktif yang ada (Feature `010`) baru berisi 12 pelajaran contoh — hanya **3 di antaranya untuk SD** dan semuanya pada satu fase (Fase B). Produk terasa lebar tetapi dangkal.

Fitur `011-sd-math-focus` **mempersempit permukaan produk dan memperdalam isinya**. Aplikasi difokuskan pada **satu jenjang (SD)** dan **satu mata pelajaran (Matematika)**, dengan katalog materi yang lengkap untuk **seluruh kelas 1 sampai 6**. Menu, jenjang, dan mata pelajaran yang belum menjadi fokus **disembunyikan di balik saklar konfigurasi** — bukan dihapus dari basis kode — sehingga dapat dinyalakan kembali tanpa pekerjaan ulang.

Setiap materi disajikan sebagai **pengalaman belajar interaktif**: ilustrasi, animasi penjelas konsep, video pendek, dan komponen manipulatif yang bisa dicoba anak, mengikuti model konten yang sudah dibangun pada Feature `010`. Seluruh materi **dapat diakses tamu tanpa login maupun pengguna terdaftar** dengan isi yang identik.

Prinsip pelaksanaan yang diminta pengguna: **kerjakan seefisien mungkin**. Fitur ini **menggunakan ulang** model konten, komponen interaktif, jalur eksplorasi tamu, dan pipeline seed yang sudah ada dari Feature `003`, `009`, dan `010`. Tidak ada arsitektur, tipe blok konten, atau tipe soal baru yang dibuat kecuali benar-benar diperlukan.

**Kepatuhan Konstitusi**: Prinsip VI (design tokens & aset self-hosted, anti-hotlink), VII (perlindungan data anak, tanpa pelacak pihak ketiga), VIII (pemetaan Kurikulum Merdeka & alur `draft → review → published`), IX (Aksesibilitas WCAG 2.1 AA).

**Pengecualian konstitusi yang disetujui**: pemilik produk memutuskan setiap materi memuat **dua-duanya** — animasi self-hosted **dan** video YouTube tersemat. Penyematan video pihak ketiga bertentangan dengan Prinsip VI (larangan hotlink domain pihak ketiga) dan menyentuh Prinsip VII (larangan pelacak pihak ketiga pada pengguna anak). Karena itu fitur ini **mensyaratkan amandemen konstitusi** yang mengizinkan penyematan video pihak ketiga dengan syarat privasi (lihat FR-016 dan FR-039). Amandemen tersebut adalah prasyarat rilis, bukan pekerjaan opsional.

---

## Clarifications

### Session 2026-09-02

- **Q1: Luas penyembunyian menu (FR-003)** → **Sembunyikan jenjang & mata pelajaran non-fokus saja.** Seluruh permukaan siswa (peta misi, papan peringkat, pencapaian) serta dasbor orang tua, dasbor guru, CMS admin, dan langganan **tetap aktif**. Perubahan dibatasi pada penyaringan jenjang dan mata pelajaran di seluruh titik masuk konten.
- **Q2: Volume materi (FR-008)** → **10 materi interaktif per tingkat kelas.** Kelas 1 sampai 6 masing-masing minimal 10 materi → **minimal 60 materi** dan **minimal 1.800 butir soal** (≥30 butir per materi). Untuk menahan biaya produksi (permintaan "token seminimal mungkin"), materi dan butir soalnya dihasilkan lewat pola/templat yang dipakai ulang antar kelas — tiap arketipe menurunkan variasi soal secara deterministik dari parameter materi — bukan ditulis satu per satu dari nol (FR-037).
- Q: Rentang ukuran layar mana yang WAJIB didukung penuh oleh antarmuka? (FR-040) → A: 320px–1280px+ — dari ponsel kecil sampai desktop, seluruhnya kelas satu.
- Q: Apakah setiap pelajaran, termasuk manipulatif lebar seperti garis bilangan dan batang pecahan, WAJIB dapat dipakai penuh dalam orientasi potret di ponsel? (FR-042) → A: Ya, potret wajib — seluruh pelajaran dan widget dapat dipakai penuh pada 320px potret; lanskap adalah bonus, tidak pernah menjadi syarat.
- Q: Saat anak mengerjakan soal seret-dan-letakkan atau garis bilangan di ponsel, apakah ia WAJIB dapat menyelesaikannya cukup dengan ketukan? (FR-043) → A: Ya, ketuk-untuk-menempatkan wajib — ketuk objek lalu ketuk tujuannya; menyeret tetap berfungsi tetapi tidak pernah menjadi satu-satunya cara.
- Q: Apakah kewajiban ramah-seluler mencakup dasbor orang tua, dasbor guru, dan CMS admin, atau hanya jalur belajar siswa dan tamu? (FR-045) → A: Semua kecuali CMS admin — siswa, tamu, orang tua, dan guru wajib ramah-seluler penuh; CMS tetap desktop-first tetapi tidak boleh rusak di layar kecil.
- Q: Bagaimana antarmuka dibuktikan benar-benar bekerja lintas perangkat sebelum dinyatakan selesai? (SC-013) → A: Uji otomatis pada lebar 320 / 375 / 768 / 1280px yang memeriksa luapan horizontal, ukuran target sentuh, dan keterselesaian dalam potret; ditambah satu putaran uji manual pada satu ponsel Android kelas bawah nyata.
- **Q3: Sumber video (FR-016)** → **Kombinasi: sematkan video YouTube DAN animasi self-hosted.** Setiap materi memuat animasi konsep yang di-host sendiri sebagai isi utama yang selalu tersedia, ditambah video YouTube tersemat sebagai penguat. Penyematan wajib memakai mode privasi tanpa cookie pelacak, tanpa putar otomatis, dan materi tetap dapat diselesaikan penuh bila sematan gagal dimuat atau diblokir. Keputusan ini memerlukan amandemen Konstitusi Prinsip VI.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Aplikasi Terfokus pada SD & Matematika (Priority: P1)

Sebagai pemilik produk, saya ingin seluruh jenjang dan mata pelajaran yang belum menjadi fokus disembunyikan, sehingga pengunjung baru hanya melihat satu jalur yang jelas: belajar Matematika SD. Menu jenjang lain (TK, SMP, SMA) dan mata pelajaran lain tidak lagi muncul di navigasi, filter, pencarian, maupun daftar katalog. Permukaan peran yang sudah ada (siswa, orang tua, guru, admin) tetap aktif, isinya saja yang tersaring ke Matematika SD.

**Why this priority**: Menentukan batas seluruh fitur lain. Tanpa ini, katalog SD yang baru akan tenggelam di antara permukaan yang belum siap. Memberi nilai mandiri: aplikasi langsung terasa lebih fokus meski katalog belum bertambah.

**Independent Test**: Jalankan aplikasi dengan saklar fokus aktif. Telusuri seluruh navigasi sebagai tamu, siswa, orang tua, dan guru; verifikasi tidak ada tautan atau kartu menuju jenjang non-SD maupun mata pelajaran non-Matematika, sementara seluruh permukaan peran tetap dapat dibuka. Matikan saklar; verifikasi seluruh jenjang dan mata pelajaran kembali muncul tanpa perubahan kode.

**Acceptance Scenarios**:

1. **Given** saklar fokus aktif, **When** tamu membuka halaman utama dan halaman eksplorasi, **Then** hanya jenjang SD dan mata pelajaran Matematika yang ditawarkan, dan tidak ada tautan ke jenjang atau mata pelajaran lain di navigasi, filter, maupun daftar katalog.
2. **Given** saklar fokus aktif, **When** pengguna membuka langsung URL materi jenjang non-SD yang sebelumnya dapat diakses, **Then** sistem tidak menampilkan galat teknis melainkan mengarahkan pengguna ke katalog Matematika SD dengan pesan ramah.
3. **Given** saklar fokus aktif, **When** pengguna melakukan pencarian materi, **Then** hasil hanya memuat materi Matematika SD.
4. **Given** saklar fokus dimatikan pada konfigurasi, **When** aplikasi dimuat ulang, **Then** seluruh jenjang dan mata pelajaran yang sebelumnya disembunyikan kembali tersedia utuh.
5. **Given** saklar fokus aktif, **When** orang tua atau guru membuka dasbornya, **Then** dasbor tetap berfungsi dan menampilkan data anak/kelas untuk Matematika SD tanpa halaman kosong atau galat akibat data jenjang lain yang tersaring.
6. **Given** saklar fokus aktif, **When** siswa membuka peta misi, papan peringkat, dan pencapaian, **Then** ketiganya tetap berfungsi dengan isi yang bersumber dari materi Matematika SD.

---

### User Story 2 — Katalog Matematika SD Lengkap Kelas 1–6 (Priority: P1)

Sebagai siswa SD (atau orang tuanya), saya ingin menemukan daftar materi Matematika yang lengkap untuk kelas saya, sehingga saya bisa belajar berurutan dari awal sampai akhir tanpa menemukan kelas yang kosong.

**Why this priority**: Ini inti permintaan "materi yang lebih komplit". Memberi nilai mandiri: bahkan sebelum media dan interaktivitas ditingkatkan, katalog yang lengkap sudah membuat aplikasi layak dipakai satu tahun ajaran.

**Independent Test**: Buka katalog Matematika SD dan pilih setiap kelas dari 1 sampai 6. Verifikasi setiap kelas memuat sekurang-kurangnya jumlah materi yang ditetapkan, tiap materi memiliki judul, ringkasan, tujuan pembelajaran, dan rujukan capaian pembelajaran, serta dapat dibuka sampai selesai.

**Acceptance Scenarios**:

1. **Given** katalog Matematika SD, **When** pengguna memilih salah satu kelas 1–6, **Then** ditampilkan sekurang-kurangnya 10 materi interaktif untuk kelas tersebut.
2. **Given** sebuah materi di katalog, **When** pengguna membukanya, **Then** materi memuat judul, ringkasan, tujuan pembelajaran, perkiraan durasi, tingkat kesulitan, dan rujukan capaian pembelajaran kurikulum.
3. **Given** materi-materi dalam satu kelas, **When** ditampilkan di katalog, **Then** urutannya mengikuti urutan pembelajaran yang masuk akal sepanjang tahun ajaran, bukan urutan acak.
4. **Given** seluruh materi dalam satu kelas, **When** diperiksa cakupan topiknya, **Then** topik-topik tersebut mencakup seluruh elemen Matematika kurikulum untuk kelas itu tanpa ada elemen yang tidak terwakili sama sekali.
5. **Given** seorang siswa menyelesaikan materi terakhir di kelasnya, **When** ia kembali ke katalog, **Then** ia diarahkan ke materi awal kelas berikutnya sebagai kelanjutan.

---

### User Story 3 — Setiap Materi Punya Ilustrasi, Animasi, dan Video (Priority: P2)

Sebagai siswa SD, saya ingin setiap materi punya gambar yang menarik, animasi yang menjelaskan konsep, dan video pendek yang bisa saya tonton, sehingga saya lebih mudah paham dibanding membaca teks panjang.

**Why this priority**: Menjawab permintaan "tambahkan animasi, ilustrasi, video untuk setiap pembelajaran". Bergantung pada adanya materi (US2), tetapi dapat diuji dan dinilai terpisah per materi.

**Independent Test**: Ambil sampel acak materi dari setiap kelas 1–6, verifikasi tiap materi memuat sekurang-kurangnya satu ilustrasi, satu animasi penjelas, satu elemen interaktif, dan satu elemen video; verifikasi setiap elemen memiliki padanan teks (alt text/takarir/transkrip) dan cadangan statis saat media gagal dimuat.

**Acceptance Scenarios**:

1. **Given** materi Matematika SD mana pun di katalog, **When** siswa membukanya, **Then** materi memuat sekurang-kurangnya satu ilustrasi, satu animasi penjelas konsep yang di-host sendiri, satu elemen interaktif yang dapat dimanipulasi, dan satu video YouTube tersemat.
2. **Given** sebuah video tersemat, **When** siswa memutarnya, **Then** tersedia takarir atau transkrip Bahasa Indonesia dan kendali putar/jeda yang dapat dioperasikan dengan keyboard.
7. **Given** halaman materi baru dimuat, **When** siswa belum menekan tombol putar, **Then** belum ada permintaan jaringan ke domain penyedia video; yang tampil adalah pratinjau statis dengan tombol putar.
8. **Given** video tersemat diblokir jaringan sekolah atau sudah dihapus penerbitnya, **When** materi dibuka, **Then** animasi self-hosted dan penjelasan teks tetap menyampaikan konsepnya secara utuh dan siswa dapat menyelesaikan materi.
3. **Given** siswa mengaktifkan preferensi "kurangi animasi" pada perangkatnya, **When** materi dimuat, **Then** animasi non-esensial digantikan ilustrasi statis atau kendali putar-atas-permintaan.
4. **Given** media gagal dimuat karena koneksi lambat atau terputus, **When** materi ditampilkan, **Then** ditampilkan ilustrasi statis dan penjelasan teks sebagai cadangan dan siswa tetap dapat menyelesaikan materi.
5. **Given** setiap ilustrasi dan animasi, **When** dibaca oleh pembaca layar, **Then** tersedia deskripsi teks yang menjelaskan makna matematisnya, bukan sekadar nama berkas.
6. **Given** sebuah elemen video, **When** halaman dimuat, **Then** video tidak diputar otomatis dengan suara.

---

### User Story 4 — Materi Interaktif yang Menarik dan Dapat Dinilai (Priority: P2)

Sebagai siswa SD, saya ingin mencoba sendiri konsepnya lewat komponen yang bisa saya geser, seret, dan susun, lalu mengerjakan latihan dengan umpan balik yang langsung dan ramah, sehingga belajar terasa seperti bermain.

**Why this priority**: Membedakan "10 materi" dari "10 halaman teks". Bergantung pada US2 tetapi dapat diuji per materi.

**Independent Test**: Kerjakan satu materi dari awal sampai ringkasan sebagai tamu; verifikasi komponen manipulatif merespons seketika, setiap butir soal memberi umpan balik dan pembahasan, dan ringkasan akhir menampilkan hasil.

**Acceptance Scenarios**:

1. **Given** sebuah komponen manipulatif dalam materi, **When** siswa mengubahnya, **Then** tampilan visual diperbarui seketika tanpa memuat ulang halaman.
2. **Given** sebuah materi, **When** siswa menyelesaikan segmen konsep, **Then** ia dapat lanjut ke latihan berisi sekurang-kurangnya 30 butir soal.
3. **Given** siswa menjawab sebuah butir soal, **When** jawabannya dikirim, **Then** ia menerima umpan balik benar/salah beserta pembahasan langkah demi langkah, dan petunjuk bertahap tersedia sebelum menjawab.
4. **Given** latihan dalam satu materi, **When** diperiksa jenis soalnya, **Then** sekurang-kurangnya sebagian soal berjenis visual/interaktif (mis. seret-dan-letakkan, penempatan pada garis bilangan), bukan seluruhnya pilihan ganda berbasis teks.
5. **Given** siswa kelas 1–2 yang belum lancar membaca, **When** ia membuka materi kelasnya, **Then** setiap soal dan pilihan jawaban dapat dipahami dari gambar/ikon, dan tersedia kendali "dengarkan" untuk membacakan teksnya.
6. **Given** seluruh alur belajar sebuah materi, **When** dioperasikan hanya dengan keyboard, **Then** siswa dapat menyelesaikannya dari awal sampai ringkasan.
7. **Given** ponsel selebar 320px dalam orientasi potret, **When** siswa mengerjakan seluruh materi termasuk komponen manipulatif lebar, **Then** ia dapat menyelesaikannya penuh tanpa diminta memutar perangkat dan tanpa halaman menggulir horizontal.
8. **Given** soal yang meminta memindahkan objek pada perangkat sentuh, **When** siswa mengetuk objek lalu mengetuk tujuannya, **Then** objek berpindah dan jawaban terekam — tanpa perlu gerakan menyeret sama sekali.

---

### User Story 5 — Akses Setara untuk Tamu dan Pengguna Terdaftar (Priority: P2)

Sebagai pengunjung yang belum mendaftar, saya ingin langsung mencoba materi Matematika SD tanpa membuat akun, dan sebagai pengguna terdaftar saya ingin materi yang sama tersimpan kemajuannya di akun saya.

**Why this priority**: Permintaan eksplisit pengguna dan penentu tingkat percobaan produk. Memakai ulang mode tamu yang sudah ada (Feature `009`).

**Independent Test**: Buka materi yang sama dalam dua kondisi — tanpa login dan dengan login — bandingkan isi yang tampil; verifikasi identik dan verifikasi kemajuan tamu tersimpan lokal serta dapat dipindahkan saat mendaftar.

**Acceptance Scenarios**:

1. **Given** pengunjung tanpa login, **When** ia membuka materi Matematika SD mana pun di katalog, **Then** seluruh isi materi, media, komponen interaktif, latihan, dan pembahasan tersedia penuh tanpa permintaan mendaftar atau membayar.
2. **Given** pengunjung tanpa login menyelesaikan sebagian materi, **When** ia kembali ke aplikasi di peramban yang sama, **Then** kemajuannya masih ada.
3. **Given** pengunjung tanpa login memiliki kemajuan tersimpan, **When** ia mendaftar, **Then** kemajuan tersebut dipindahkan ke akunnya tanpa hilang.
4. **Given** pengguna terdaftar dan pengunjung tamu, **When** keduanya membuka materi yang sama, **Then** isi pelajaran yang tampil identik.
5. **Given** pengunjung tanpa login, **When** ia menyelesaikan sebuah materi, **Then** tidak ada data pribadi anak yang dikumpulkan atau dikirim ke pihak ketiga.

---

### User Story 6 — Materi Sesuai Kurikulum yang Berlaku & Tertelusur (Priority: P3)

Sebagai guru atau orang tua, saya ingin tahu setiap materi memetakan ke capaian pembelajaran kurikulum resmi yang sedang berlaku, sehingga saya yakin anak tidak belajar hal yang tidak relevan dengan sekolahnya.

**Why this priority**: Penentu kepercayaan dan kepatuhan Prinsip VIII, tetapi tidak memblokir siswa mencoba materi.

**Independent Test**: Ambil sampel materi lintas kelas dan fase; verifikasi setiap materi mencantumkan fase, kelas, elemen, dan kutipan capaian pembelajaran beserta rujukan sumber resmi yang dapat ditelusuri.

**Acceptance Scenarios**:

1. **Given** sebuah materi, **When** metadatanya diperiksa, **Then** tercantum jenjang, fase, kelas, elemen kurikulum, dan kutipan capaian pembelajaran beserta rujukan dokumen sumber resmi.
2. **Given** materi yang diproduksi dalam fitur ini, **When** dibuat, **Then** statusnya berhenti di `REVIEW` dan tidak pernah langsung `PUBLISHED`.
3. **Given** materi berstatus `REVIEW`, **When** pemilik produk atau guru yang ditunjuk menyetujuinya lewat CMS, **Then** status berubah menjadi `PUBLISHED` dan materi muncul untuk siswa dan tamu.
4. **Given** materi berstatus `DRAFT` atau `REVIEW`, **When** tamu atau siswa membuka katalog, **Then** materi tersebut tidak tampil.
5. **Given** dokumen kurikulum resmi berubah, **When** rujukan sebuah materi diperiksa, **Then** sumbernya dapat ditelusuri sehingga materi dapat dimutakhirkan tanpa menebak.

---

### Edge Cases

- Apa yang terjadi jika pengguna membuka tautan lama menuju materi jenjang TK/SMP/SMA yang kini disembunyikan? → Diarahkan ke katalog Matematika SD dengan pesan ramah, bukan galat mentah.
- Bagaimana sistem menangani pengguna terdaftar yang profilnya berjenjang non-SD saat saklar fokus aktif? → Tetap dapat masuk dan diarahkan ke katalog SD tanpa kehilangan data profilnya.
- Bagaimana jika penyedia video pihak ketiga memblokir, menghapus, atau mengubah video yang dirujuk sebuah materi? → Materi menampilkan cadangan (animasi/ilustrasi + teks) dan tetap dapat diselesaikan; sistem menandai rujukan yang rusak untuk diperbaiki.
- Apa yang terjadi jika sebuah kelas hanya memiliki 9 materi karena satu materi ditolak saat review? → Kelas tersebut belum memenuhi kriteria rilis; sistem harus dapat melaporkan kelas mana yang belum memenuhi ambang minimum.
- Bagaimana perilaku pada perangkat layar kecil dan sentuh saat komponen manipulatif dipakai? → Pada 320px potret komponen tetap dapat diselesaikan penuh dengan ketukan saja, target sentuh minimum 44x44px, dan tidak ada presisi tetikus yang dibutuhkan (FR-042, FR-043, FR-044).
- Bagaimana jika komponen lebar seperti garis bilangan tidak muat di layar 320px? → Komponen menggulir di dalam wadahnya sendiri atau berganti tata letak ringkas; halaman itu sendiri tetap tidak menggulir horizontal, dan soal tetap dapat dijawab tanpa memutar perangkat (FR-041, FR-042).
- Bagaimana jika anak tidak sengaja menggeser halaman saat mencoba memindahkan objek? → Karena penempatan cukup dengan ketukan, tidak ada gerakan seret yang bersaing dengan gulir halaman (FR-043).
- Bagaimana jika penyimpanan lokal peramban tamu penuh atau dinonaktifkan? → Materi tetap dapat dikerjakan dalam satu sesi; pengguna diberi tahu kemajuannya tidak akan tersimpan.
- Bagaimana jika dua materi memetakan ke capaian pembelajaran yang sama? → Diperbolehkan, tetapi katalog tidak boleh menampilkan judul yang sama persis dua kali dalam satu kelas.
- Bagaimana jika anak membuka materi kelas yang lebih tinggi atau lebih rendah dari kelasnya? → Diizinkan; katalog tidak mengunci kelas, hanya menyarankan kelas yang sesuai profil.

---

## Requirements *(mandatory)*

### Functional Requirements

#### A. Fokus & Penyembunyian Permukaan

- **FR-001**: Sistem MUST menyediakan satu saklar konfigurasi "mode fokus" yang, ketika aktif, membatasi jenjang yang ditawarkan hanya ke SD dan mata pelajaran yang ditawarkan hanya ke Matematika.
- **FR-002**: Ketika mode fokus aktif, sistem MUST menghilangkan seluruh tautan navigasi, filter, entri pencarian, dan kartu katalog yang menuju jenjang selain SD atau mata pelajaran selain Matematika.
- **FR-003**: Penyembunyian MUST dibatasi pada jenjang dan mata pelajaran non-fokus saja. Permukaan siswa (peta misi, papan peringkat, pencapaian), dasbor orang tua, dasbor guru, CMS admin, dan langganan MUST tetap aktif dan berfungsi, dengan isinya tersaring hanya ke Matematika SD.
- **FR-004**: Sistem MUST menyembunyikan, bukan menghapus, permukaan non-fokus; mematikan saklar MUST mengembalikan seluruh permukaan tanpa perubahan kode, migrasi data, atau kehilangan data pengguna yang sudah ada.
- **FR-005**: Sistem MUST menangani akses langsung ke rute yang disembunyikan dengan pengalihan ramah ke katalog Matematika SD, tanpa menampilkan galat teknis atau halaman kosong.
- **FR-006**: Sistem MUST tetap mengizinkan pengguna terdaftar berperan apa pun (siswa, orang tua, guru, admin) untuk masuk dan memakai dasbornya saat mode fokus aktif; dasbor MUST menangani kondisi tanpa data jenjang non-SD tanpa galat atau halaman kosong.

#### B. Katalog & Cakupan Materi

- **FR-007**: Sistem MUST menyediakan katalog Matematika SD yang dikelompokkan per kelas untuk kelas 1, 2, 3, 4, 5, dan 6.
- **FR-008**: Setiap tingkat kelas (1, 2, 3, 4, 5, dan 6) MUST memiliki sekurang-kurangnya 10 materi interaktif, sehingga katalog memuat sekurang-kurangnya 60 materi Matematika SD secara keseluruhan.
- **FR-009**: Setiap materi MUST memiliki judul, ringkasan, tujuan pembelajaran, perkiraan durasi, tingkat kesulitan, dan urutan pembelajaran yang eksplisit dalam kelasnya.
- **FR-010**: Katalog MUST mengurutkan materi dalam satu kelas mengikuti urutan pembelajaran sepanjang tahun ajaran.
- **FR-011**: Kumpulan materi dalam satu kelas MUST mencakup seluruh elemen Matematika kurikulum untuk kelas tersebut, tanpa elemen yang sama sekali tidak terwakili.
- **FR-012**: Sistem MUST menyediakan laporan yang dapat diperiksa mengenai jumlah materi terbit per kelas, agar kekurangan cakupan dapat terdeteksi sebelum rilis.

#### C. Media, Animasi, Ilustrasi & Video

- **FR-013**: Setiap materi MUST memuat sekurang-kurangnya satu ilustrasi, satu animasi penjelas konsep yang di-host sendiri, satu elemen interaktif yang dapat dimanipulasi, dan satu video tersemat.
- **FR-014**: Setiap elemen visual MUST memiliki padanan teks: deskripsi alternatif untuk ilustrasi dan animasi, serta takarir atau transkrip Bahasa Indonesia untuk video.
- **FR-015**: Sistem MUST menyediakan cadangan statis (ilustrasi + penjelasan teks) ketika media gagal dimuat, sehingga materi tetap dapat diselesaikan.
- **FR-016**: Setiap materi MUST menyajikan animasi konsep yang di-host sendiri sebagai isi utama, DAN sebuah video pihak ketiga (YouTube) yang tersemat sebagai penguat. Materi MUST tetap dapat dipahami dan diselesaikan penuh walau video tersemat tidak dapat dimuat.
- **FR-016a**: Penyematan video pihak ketiga MUST memakai mode privasi penyedia (tanpa cookie pelacak), MUST TIDAK memuat skrip pelacak atau iklan bertarget, dan MUST TIDAK mengirim data yang mengidentifikasi pengguna anak.
- **FR-016b**: Sistem MUST TIDAK memuat sematan pihak ketiga sebelum pengguna secara sengaja memilih memutarnya; sebelum itu ditampilkan pratinjau statis dengan tombol putar.
- **FR-016c**: Setiap video tersemat MUST tercatat metadatanya (penerbit, judul, tautan, tanggal verifikasi) sehingga kelayakan isi dan status ketersediaannya dapat ditinjau ulang.
- **FR-016d**: Sistem MUST mendeteksi dan melaporkan video tersemat yang tidak lagi tersedia (dihapus, dijadikan privat, atau diblokir wilayah) agar dapat diganti.
- **FR-017**: Sistem MUST menghormati preferensi "kurangi gerak" perangkat dengan mengganti animasi non-esensial menjadi ilustrasi statis atau kendali putar-atas-permintaan.
- **FR-018**: Sistem MUST TIDAK memutar video atau audio secara otomatis dengan suara saat halaman dimuat.
- **FR-019**: Seluruh kendali media MUST dapat dioperasikan dengan keyboard dan memiliki target sentuh minimum 44x44px.

#### D. Interaktivitas & Latihan

- **FR-020**: Komponen manipulatif MUST memperbarui tampilan seketika saat dimanipulasi, tanpa memuat ulang halaman.
- **FR-021**: Setiap materi MUST memuat sekurang-kurangnya 30 butir soal latihan. Butir soal dihasilkan oleh arketipe secara deterministik dari parameter materi (rotasi bentuk soal + pasangan/parameter antar-lintasan) sehingga satu materi menghasilkan set latihan penuh tanpa menulis 30 brief per materi.
- **FR-022**: Setiap butir soal MUST memiliki pembahasan langkah demi langkah dan petunjuk bertahap yang dapat diakses sebelum menjawab.
- **FR-023**: Setiap materi MUST memuat sekurang-kurangnya satu butir soal berjenis visual/interaktif, bukan seluruhnya pilihan ganda berbasis teks.
- **FR-024**: Materi untuk siswa yang belum lancar membaca (kelas 1–2) MUST dapat dipahami dari gambar/ikon dan MUST menyediakan kendali "dengarkan" untuk membacakan teks tanpa mengirim data ke layanan pihak ketiga.
- **FR-025**: Seluruh alur belajar sebuah materi MUST dapat diselesaikan hanya dengan keyboard.

#### E. Akses Tamu & Terdaftar

- **FR-026**: Seluruh materi Matematika SD yang berstatus terbit MUST dapat diakses penuh oleh pengunjung tanpa login, termasuk media, komponen interaktif, latihan, dan pembahasan.
- **FR-027**: Isi materi yang disajikan kepada tamu dan kepada pengguna terdaftar MUST identik.
- **FR-028**: Sistem MUST menyimpan kemajuan tamu secara lokal di perangkatnya dan MUST memindahkannya ke akun ketika tamu mendaftar.
- **FR-029**: Sistem MUST TIDAK mengumpulkan data pribadi anak dari pengguna tamu dan MUST TIDAK mengirim data pengguna ke pihak ketiga pada jalur tamu.
- **FR-030**: Sistem MUST memberi tahu pengguna ketika kemajuan tidak dapat disimpan karena penyimpanan lokal tidak tersedia.

#### F. Kurikulum, Review & Kualitas

- **FR-031**: Setiap materi MUST memetakan ke kurikulum resmi yang berlaku dengan mencantumkan jenjang, fase, kelas, elemen, dan kutipan capaian pembelajaran.
- **FR-032**: Setiap kutipan capaian pembelajaran MUST menyimpan rujukan dokumen sumber resmi sehingga dapat ditelusuri, bukan rumusan dari ingatan.
- **FR-033**: Materi yang diproduksi dalam fitur ini MUST berhenti pada status `REVIEW`; perubahan ke `PUBLISHED` MUST dilakukan oleh pemilik produk atau guru yang ditunjuk melalui CMS.
- **FR-034**: Sistem MUST TIDAK menampilkan materi berstatus `DRAFT` atau `REVIEW` kepada siswa maupun tamu.
- **FR-035**: Seluruh teks materi, ilustrasi, dan animasi MUST orisinal atau berlisensi sah; menyalin konten berhak cipta dari platform lain DILARANG.
- **FR-035a**: Video pihak ketiga MUST hanya disajikan melalui pemutar sematan resmi penerbitnya (tanpa mengunduh ulang, menyalin, atau meng-host ulang berkasnya), dan MUST melalui pemeriksaan kelayakan isi untuk anak SD sebelum dipakai.
- **FR-039**: Rilis fitur ini MUST didahului amandemen Konstitusi Prinsip VI yang secara eksplisit mengizinkan penyematan video pihak ketiga dengan syarat privasi pada FR-016a sampai FR-016d. Selama amandemen belum disahkan, materi MUST tetap dapat dirilis dengan animasi self-hosted saja.

#### G. Efisiensi Pelaksanaan

- **FR-036**: Fitur ini MUST menggunakan ulang model konten, tipe blok, tipe soal, komponen interaktif, jalur tamu, dan pipeline seed yang sudah ada; struktur data atau komponen baru hanya boleh ditambahkan bila kebutuhan tidak terpenuhi oleh yang ada.
- **FR-037**: Materi baru MUST dihasilkan melalui pola dan templat yang dapat digunakan ulang antar kelas, bukan ditulis satu per satu dari nol untuk setiap materi.
- **FR-038**: Fitur ini MUST TIDAK melakukan penulisan ulang arsitektur, penggantian kerangka kerja, atau perubahan skema besar-besaran di luar yang diperlukan untuk memenuhi FR-001 sampai FR-035.

#### H. Responsif & Multi-Perangkat

- **FR-040**: Seluruh antarmuka MUST berfungsi penuh pada lebar layar 320px sampai 1280px ke atas — ponsel kecil, ponsel umum, tablet, dan desktop — tanpa satu pun alur inti yang hanya dapat diselesaikan pada sebagian ukuran saja.
- **FR-041**: Pada lebar berapa pun dalam rentang tersebut, halaman MUST TIDAK menggulir horizontal. Konten yang secara alami lebar (garis bilangan, tabel, diagram) MUST menggulir di dalam wadahnya sendiri, bukan menggeser seluruh halaman.
- **FR-042**: Setiap pelajaran, komponen manipulatif, dan butir soal MUST dapat diselesaikan penuh dalam orientasi potret pada lebar 320px. Sistem MUST TIDAK mensyaratkan pengguna memutar perangkat ke lanskap untuk menyelesaikan bagian mana pun, dan MUST TIDAK menampilkan permintaan "putar perangkat" sebagai penghalang. Lanskap MUST tetap dapat dipakai, sebagai tampilan tambahan, bukan syarat.
- **FR-043**: Setiap soal dan komponen manipulatif yang melibatkan pemindahan objek MUST dapat diselesaikan hanya dengan ketukan (ketuk objek, lalu ketuk tujuannya). Menyeret MUST tetap berfungsi bagi yang memilihnya, tetapi MUST TIDAK PERNAH menjadi satu-satunya cara menyelesaikan soal pada perangkat sentuh mana pun.
- **FR-044**: Seluruh target interaktif — tombol, opsi jawaban, objek yang dapat dipindahkan, dan zona tujuannya — MUST berukuran minimum 44x44px pada seluruh rentang ukuran layar, dan MUST TIDAK saling berdempetan sehingga salah sentuh menjadi mudah terjadi.
- **FR-045**: Kewajiban FR-040 sampai FR-044 MUST berlaku penuh pada jalur siswa, jalur tamu, dasbor orang tua, dan dasbor guru. CMS admin MUST tetap boleh dioptimalkan untuk desktop, tetapi MUST tetap dapat dibuka dan dinavigasi tanpa tata letak rusak atau kendali yang tidak terjangkau pada lebar 320px.

### Key Entities

- **Mode Fokus (Focus Configuration)**: Konfigurasi tingkat aplikasi yang menetapkan jenjang, mata pelajaran, dan permukaan produk yang sedang aktif. Dapat dinyalakan dan dimatikan tanpa perubahan kode.
- **Kelas (Grade)**: Tingkat kelas SD 1–6, masing-masing terkait ke satu fase kurikulum (Fase A: kelas 1–2, Fase B: kelas 3–4, Fase C: kelas 5–6) dan menampung sekumpulan materi berurutan.
- **Materi Interaktif (Interactive Lesson)**: Satu unit belajar berisi metadata kurikulum, blok konten (ilustrasi, animasi, video, komponen interaktif, teks), dan sekumpulan butir soal. Memiliki status alur review dan penanda tampil/tersembunyi di katalog.
- **Blok Konten (Content Block)**: Satu elemen penyusun materi dengan jenis (ilustrasi, animasi, video, teks kaya, komponen interaktif), padanan teks, dan cadangan statis.
- **Butir Soal (Question)**: Satu latihan dengan jenis, pertanyaan, kunci jawaban, pembahasan, dan petunjuk bertahap.
- **Capaian Pembelajaran (Curriculum Achievement)**: Rumusan capaian resmi beserta jenjang, fase, elemen, dan rujukan dokumen sumber, dipakai sebagai acuan pemetaan materi.
- **Kemajuan Belajar (Learning Progress)**: Catatan penyelesaian materi dan hasil latihan, tersimpan lokal untuk tamu dan pada akun untuk pengguna terdaftar.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Dengan mode fokus aktif, penelusuran seluruh navigasi sebagai tamu dan sebagai siswa tidak menemukan satu pun tautan menuju jenjang non-SD atau mata pelajaran non-Matematika.
- **SC-002**: Setiap kelas 1 sampai 6 memiliki sekurang-kurangnya 10 materi terbit (total minimal 60 materi dan 1.800 butir soal, ≥30 butir per materi), terverifikasi melalui laporan cakupan per kelas.
- **SC-003**: 100% materi yang terbit memuat sekurang-kurangnya satu ilustrasi, satu animasi self-hosted, satu elemen interaktif, dan satu video tersemat; dan 100% di antaranya tetap dapat diselesaikan ketika sematan video diblokir.
- **SC-004**: 100% elemen visual memiliki padanan teks, dan 100% materi dapat diselesaikan dari awal sampai ringkasan hanya dengan keyboard.
- **SC-005**: 100% materi yang terbit dapat dibuka dan diselesaikan penuh oleh pengunjung tanpa login, dengan isi identik dengan yang dilihat pengguna terdaftar.
- **SC-006**: 100% materi yang terbit mencantumkan kelas, fase, elemen, dan kutipan capaian pembelajaran beserta rujukan sumber yang dapat ditelusuri.
- **SC-007**: Materi terbuka dan siap dipakai dalam waktu di bawah 3 detik pada koneksi seluler tipikal, dan tetap dapat diselesaikan ketika media gagal dimuat.
- **SC-008**: Dalam uji coba dengan siswa SD, sekurang-kurangnya 80% peserta dapat menyelesaikan satu materi penuh tanpa bantuan orang dewasa.
- **SC-009**: Mematikan mode fokus mengembalikan seluruh permukaan produk sebelumnya tanpa kehilangan data pengguna maupun perubahan kode.
- **SC-010**: Tidak ada satu pun materi yang diterbitkan tanpa persetujuan manusia; seluruh materi hasil produksi fitur ini tercatat melewati status `REVIEW` lebih dulu.
- **SC-011**: Pada jalur tamu, tidak ada permintaan jaringan ke domain pihak ketiga sebelum pengguna menekan tombol putar video, terverifikasi melalui pemeriksaan lalu lintas halaman.
- **SC-012**: 100% video tersemat tercatat metadatanya (penerbit, judul, tautan, tanggal verifikasi) dan tervalidasi masih dapat diakses pada saat rilis.
- **SC-013**: Seluruh halaman jalur siswa, tamu, orang tua, dan guru lolos pemeriksaan otomatis pada lebar 320px, 375px, 768px, dan 1280px untuk tiga hal: nol luapan gulir horizontal, nol target interaktif di bawah 44x44px, dan setiap pelajaran dapat diselesaikan dalam orientasi potret. Ditambah satu putaran uji manual pada satu ponsel Android kelas bawah nyata sebelum rilis.
- **SC-014**: 100% soal yang melibatkan pemindahan objek dapat diselesaikan hanya dengan ketukan pada perangkat sentuh, tanpa satu pun yang mensyaratkan gerakan menyeret.

---

## Assumptions

- **Kurikulum**: "Kurikulum terbaru yang berlaku di Indonesia" diartikan sebagai Kurikulum Merdeka sebagaimana ditetapkan Kemendikbudristek, dengan pembagian fase SD: Fase A (kelas 1–2), Fase B (kelas 3–4), Fase C (kelas 5–6). Teks capaian pembelajaran diambil dari dokumen resmi saat implementasi, bukan dari ingatan, dan setiap materi menyimpan rujukan sumbernya.
- **Penyembunyian, bukan penghapusan**: Permukaan non-fokus disembunyikan lewat konfigurasi. Basis kode, data, dan riwayat pengguna untuk jenjang lain tetap utuh dan dapat diaktifkan kembali.
- **Akses gratis**: Materi Matematika SD pada fitur ini berada di luar dinding berbayar; pembatasan langganan yang ada tidak diterapkan pada materi ini.
- **Penggunaan ulang**: Model konten, tipe blok, tipe soal, komponen interaktif, mode tamu, dan pipeline seed dari fitur `003`, `009`, dan `010` dipakai ulang apa adanya. Fitur ini memperluas isi, bukan mengganti mesinnya.
- **Materi SD yang sudah ada**: Tiga materi SD dari fitur `010` dipertahankan dan dihitung sebagai bagian dari cakupan kelas yang sesuai, bukan diduplikasi.
- **Bahasa**: Bahasa antarmuka dan seluruh materi adalah Bahasa Indonesia, melalui layer i18n yang sudah ada.
- **Produksi konten**: Materi diproduksi sebagai bagian dari fitur ini oleh pelaksana, mengikuti pola fitur `010`; verifikasi kebenaran matematis dan kesesuaian usia dilakukan manusia pada tahap review.
- **Orisinalitas**: Situs rujukan pedagogi hanya dipakai sebagai acuan pola interaksi. Tidak ada teks, aset, atau kode yang disalin dari sumber berhak cipta. Video pihak ketiga hanya disematkan lewat pemutar resmi penerbitnya, tidak diunduh atau di-host ulang.
- **Amandemen konstitusi**: Keputusan menyematkan video YouTube diambil sadar oleh pemilik produk dan memerlukan amandemen Prinsip VI. Fitur ini mengasumsikan amandemen tersebut akan disahkan; bila tidak, materi tetap dapat rilis dengan animasi self-hosted saja (FR-039).
- **Kurasi video**: Video YouTube yang disematkan dipilih dan diverifikasi manusia pada tahap review — kelayakan isi untuk anak SD, kesesuaian dengan capaian pembelajaran, dan ketersediaan tautannya.
- **Jangkauan perangkat**: Ponsel, tablet, dan desktop seluruhnya merupakan sasaran kelas satu pada rentang 320px–1280px+ (FR-040). Ponsel Android kelas bawah pada koneksi seluler Indonesia yang tidak selalu stabil adalah kondisi terberat yang harus tetap lolos; desain harus tetap dapat diselesaikan dalam kondisi media gagal dimuat.

---

## Out of Scope

- Mata pelajaran selain Matematika (Bahasa Indonesia, IPAS, dan lainnya) untuk jenjang SD.
- Jenjang TK, SMP, dan SMA — disembunyikan, tidak dikembangkan pada fitur ini.
- Penghapusan permanen kode, data, atau rute untuk permukaan yang disembunyikan.
- Fitur baru di luar penyajian materi: obrolan antar-pengguna, kelas langsung, penilaian adaptif berbasis model, dan pembelian dalam aplikasi baru.
- Penyembunyian permukaan peran: dasbor orang tua, dasbor guru, CMS admin, langganan, peta misi, papan peringkat, dan pencapaian TETAP aktif (keputusan Q1).
- Produksi video sinematik sendiri; video pihak ketiga disematkan, bukan diproduksi.
- Aplikasi seluler native.
