# Feature Specification: Design System dan App Shell AksiCendekia

**Feature Branch**: `001-design-system-app-shell`

**Created**: 2026-08-27

**Status**: Draft

**Input**: User description: "/speckit.specify Design System dan App Shell AksiCendekia."

---

## Executive Summary & Background Context

AksiCendekia adalah platform belajar bergamifikasi untuk siswa TK, SD, SMP, dan SMA di Indonesia, serta platform manajemen untuk guru, orang tua, dan admin sekolah/CMS. Desain visual aplikasi telah difinalisasi dalam aset ekspor Stitch (`design/stitch/`).

Feature `001-design-system-app-shell` membangun **fondasi visual dan arsitektur UI tunggal** yang digunakan oleh seluruh fitur aplikasi berikutnya (persiapan login, kuis, CMS, dasbor). Feature ini murni fokus pada sistem token visual, pustaka komponen UI, arsitektur theming multi-jenjang, override tipografi profesional, dua varian app shell, dan layer i18n Bahasa Indonesia. Belum ada logika bisnis belajar, autentikasi backend, atau koneksi API pada fitur ini.

### Temuan Audit & Batasan Konsolidasi Desain
1. **Palet Token Kanon**: Seluruh 24 layar terverifikasi menggunakan palet 47 token warna Material Design 3 dan 7 token skala tipografi yang **100% identik** tanpa drift warna. Seluruh nilai token diekstrak langsung dari konfigurasi `tailwind.config` pada file `code.html` kanon.
2. **Aspirasi vs Realita Tema Jenjang**: Baris 121-124 pada `design/DESIGN.md` mendeskripsikan tema visual per jenjang (pastel TK, jewel tone SMP, dark mode neon SMA). Namun, desain visual pada seluruh layar kanon `code.html` saat ini hanya menggunakan 1 set token tunggal. Deskripsi tema tersebut diperlakukan sebagai aspirasi masa depan. Arsitektur theming wajib **siap menampung varian** via CSS Custom Property tanpa mengubah komponen, tetapi **tidak mengarang nilai hex baru** untuk varian jenjang saat ini.
3. **Pembersihan Folder Pra-Rebranding**: Seluruh folder `mathquest_*` adalah arsip pra-rebranding dan **dilarang dibaca/digunakan**. Referensi kanon dasbor siswa adalah `eduquest_*`.
4. **Isolasi Scope Layar**: Referensi visual Feature 001 HANYA berasal dari:
   - `aksicendekia_status_sistem_empty_error_loading`
   - `eduquest_dunia_angka_tk`
   - `eduquest_sd_hero_journey`
   - `eduquest_smp_space_lab`
   - `eduquest_sma_future_scientist`
   - `logo_aksicendekia_alternatif_1`
   - Shell profesional reference: `aksicendekia_editor_butir_soal_cms` dan `aksicendekia_dasbor_orang_tua_guru`.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pengalaman Siswa Menggunakan App Shell Siswa & Komponen Gamifikasi (Priority: P1)

Sebagai siswa (TK, SD, SMP, atau SMA), saya ingin menavigasi aplikasi belajar melalui antarmuka yang ramah, responsif, bergamifikasi, dan mudah diakses, agar pengalaman belajar terasa menyenangkan dan intuitif di perangkat seluler maupun komputer.

**Why this priority**: Merupakan fondasi pengalaman pengguna utama platform (core student experience). Tanpa shell siswa dan komponen bermain (Group A), platform tidak dapat menyajikan antarmuka gamifikasi kepada siswa.

**Independent Test**: Dapat diuji secara independen melalui Katalog Komponent atau Student Shell preview pada resolusi 375px (mobile) dan 1440px (desktop), di mana elemen gamifikasi (streak, selector jenjang, tombol taktil 3D, progress bar gradient) dapat diinteraksi dengan responsif dan memenuhi kontras & target sentuh WCAG 2.1 AA.

**Acceptance Scenarios**:

1. **Given** siswa membuka aplikasi dalam Student Shell pada resolusi mobile (375px) atau desktop (1440px), **When** melihat navigasi utama, **Then** area top bar menampilkan indikator streak (ikon api + jumlah hari) dan language switcher, serta sidebar/drawer menyediakan pemilih jenjang (TK, SD, SMP, SMA), menu Pencapaian, Pengaturan, dan CTA "Tingkatkan ke Pro".
2. **Given** siswa menekan tombol aksi utama (Button Primary), **When** status `:active` terpicu, **Then** tombol mengalami efek penekanan taktil (bottom border 4px menguncup dan elemen bergeser 2px ke bawah) memberikan umpan balik visual instan.
3. **Given** progress belajar ditampilkan pada Progress Bar, **When** nilai progress bertambah, **Then** bar terisi dengan bentuk ujung pill (rounded-full) menggunakan gradien warna `primary` ke `tertiary` (emerald success).
4. **Given** maskot memberikan ucapan/petunjuk, **When** Mascot Speech Bubble ditampilkan, **Then** gelembung percakapan memiliki sudut membulat konsisten dengan penunjuk segitiga yang mengarah tepat ke posisi maskot.

---

### User Story 2 - Pengalaman Pengguna Profesional Menggunakan App Shell Profesional & Override Tipografi (Priority: P1)

Sebagai pengguna profesional (Guru, Orang Tua, atau Admin CMS), saya ingin menggunakan antarmuka dasbor dan editor dengan kerapatan informasi yang lebih tinggi serta tipografi yang tegas dan bersih (Inter), agar pekerjaan administratif dan pemantauan dapat dilakukan dengan efisien.

**Why this priority**: Layar administratif (CMS dan dasbor orang tua/guru) memerlukan efisiensi ruang dan nada visual yang profesional tanpa harus membuat pustaka komponen terpisah atau menduplikasi kode.

**Independent Test**: Dapat diuji secara independen dengan beralih ke Professional Shell scope (`data-shell="professional"`), di mana seluruh komponen UI menggunakan palet warna dan struktur yang sama, namun seluruh heading secara otomatis ter-override menggunakan font Inter tanpa ada komponen yang terduplikasi.

**Acceptance Scenarios**:

1. **Given** pengembang atau pengguna berada di dalam scope Professional Shell (`aksicendekia_editor_butir_soal_cms` / `aksicendekia_dasbor_orang_tua_guru`), **When** judul/heading (h1-h6) ditampilkan, **Then** font family yang diterapkan adalah `Inter` (bukan `Quicksand`).
2. **Given** pengguna berada di dalam Student Shell, **When** judul/heading ditampilkan, **Then** font family yang diterapkan adalah `Quicksand`.
3. **Given** Professional Shell dibuka pada resolusi desktop (1440px), **When** bernavigasi di top navigation bar, **Then** navigasi menyediakan menu ringkas, pencarian, notifikasi, indikator peran pengguna, dan profil dengan kerapatan tinggi yang responsif.

---

### User Story 3 - Penanganan State Universal pada Komponen Data & CMS (Priority: P2)

Sebagai pengguna yang mengelola data atau melihat dasbor, saya ingin melihat indikator pemuatan skeleton saat data dimuat, pesan kosong yang ramah saat tidak ada data, dan penanganan galat yang jelas saat terjadi kesalahan, agar saya selalu memahami status sistem.

**Why this priority**: Menjamin kepastian status sistem (visibility of system status) dan UX yang konsisten di seluruh komponen data (Group C) tanpa terjadinya layout shift mendadak atau tampilan blank.

**Independent Test**: Dapat diuji pada Katalog Komponen dengan menguji switch state (Normal, Loading Skeleton, Empty State, Error State) pada setiap komponen Kelompok C (Data Table, Tabs, Dropdown Menu, Stat Card, Chart Wrapper, File Dropzone).

**Acceptance Scenarios**:

1. **Given** komponen Data Table atau Chart Wrapper sedang memuat data, **When** state `loading` aktif, **Then** komponen menampilkan skeleton loader berbentuk blok teranimasi (pulse skeleton), BUKAN spinner berputar.
2. **Given** komponen Data Table tidak memiliki baris data, **When** state `empty` aktif, **Then** komponen menyajikan Empty State bawaan yang memuat ilustrasi/ikon, judul ramah, deskripsi singkat, dan tombol aksi utama.
3. **Given** komponen gagal mengambil data dari sumber data, **When** state `error` aktif, **Then** komponen menyajikan Error State bawaan dengan ikon peringatan, pesan galat jelas, dan tombol "Coba Lagi" (Retry).

---

### User Story 4 - Pengalaman Formulir Lengkap & Aksesibilitas Terjamin (Priority: P2)

Sebagai pengguna yang mengisi formulir registrasi, input data, atau pengaturan, saya ingin menggunakan elemen input formulir yang memiliki label jelas, validasi galat, toggle sandi, serta dukungan penuh navigasi keyboard dan standar WCAG 2.1 AA.

**Why this priority**: Mengingat kepatuhan Konstitusi AksiCendekia Pasal IX (Aksesibilitas) dan keterbacaan input data, primitif formulir (Group B) harus solid dan bebas dari hambatan aksesibilitas.

**Independent Test**: Pengujian navigasi penuh menggunakan tombol `Tab`, `Space`, `Enter`, dan `Arrow keys` pada seluruh elemen form (Group B), serta verifikasi batas kontras warna >= 4.5:1 dan ukuran target sentuh >= 44x44px.

**Acceptance Scenarios**:

1. **Given** pengguna berada pada Password Input, **When** menekan tombol toggle visibilitas (ikon mata), **Then** tipe input berganti antara `password` dan `text` secara meyakinkan.
2. **Given** elemen Form Field mengalami kesalahan input, **When** pesan galat diberikan, **Then** batas input berubah ke warna `error` (#ba1a1a) dan pesan galat disajikan di bawah field dengan tipografi `body-sm` berwarna merah.
3. **Given** pengguna bernavigasi menggunakan keyboard, **When** memindahkan fokus antar elemen interaktif (tombol, input, checkbox, select), **Then** indicator ring fokus (`outline`/`primary-fixed`) terlihat jelas dan urutan fokus logis.

---

### User Story 5 - Layer Lokalisasi & i18n Bahasa Indonesia (Priority: P3)

Sebagai pengguna Indonesia, saya ingin seluruh teks antarmuka disajikan dalam Bahasa Indonesia yang baku dan ramah, tanpa adanya istilah Bahasa Inggris yang tertinggal dari draf desain visual.

**Why this priority**: Memenuhi Konstitusi Pasal VIII (Integritas Konten Kurikulum & i18n), di mana Bahasa Indonesia adalah bahasa utama aplikasi dan seluruh string wajib terisolasi dalam file file dictionary/locale.

**Independent Test**: Memeriksa file locale Bahasa Indonesia (`id.json`) dan kode komponen UI untuk memastikan 0% string literal Bahasa Inggris ter-hardcode pada komponen.

**Acceptance Scenarios**:

1. **Given** komponen UI (seperti label form, filter tabel, tombol aksi, atau pesan status) dirender, **When** string UI ditampilkan, **Then** seluruh string diambil dari dictionary i18n Bahasa Indonesia (misal: "Search" menjadi "Cari", "Submit" menjadi "Kirim", "Role" menjadi "Peran").
2. **Given** pengembang menambah dukungan bahasa kedua di masa depan, **When** locale switched ke `en`, **Then** seluruh komponen membaca string dari file locale bahasa kedua tanpa mengubah struktur kode komponen.

---

### Edge Cases

- **Resolusi Ekstrem (Mobile 320px & Ultra-wide 2560px)**: Komponen dan app shell tidak boleh pecah atau memicu scroll horizontal yang tidak diinginkan. Margin container-max dibatasi pada 1200px.
- **Teks Label Sangat Panjang (Localization Overflow)**: String Bahasa Indonesia yang lebih panjang dari versi Inggris tidak boleh memotong layout (text-ellipsis atau responsive wrap diterapkan dengan tepat).
- **Pengurangan Gerakan (Prefers Reduced Motion)**: Animasi skeleton loader dan transisi tombol wajib menghormati pengaturan query CSS `prefers-reduced-motion: reduce`.
- **Target Sentuh Kerapatan Tinggi**: Komponen pada Professional Shell yang memiliki kerapatan tinggi tetap wajib mempertahankan touch target minimum 44x44px (dapat menggunakan padding transparan/hitbox ekstensi jika ukuran visual lebih kecil).

---

## Requirements *(mandatory)*

### Functional Requirements

#### 1. Design Tokens (`packages/design-tokens`)
- **FR-001**: System MUST menyediakan 47 token warna Material Design 3 yang diekstrak langsung dari `tailwind.config` kanon tanpa modifikasi nilai hex:
  - Background & Surface: `background` (`#f8f9ff`), `on-background` (`#0b1c30`), `surface` (`#f8f9ff`), `on-surface` (`#0b1c30`), `surface-dim` (`#cbdbf5`), `surface-bright` (`#f8f9ff`), `surface-container-lowest` (`#ffffff`), `surface-container-low` (`#eff4ff`), `surface-container` (`#e5eeff`), `surface-container-high` (`#dce9ff`), `surface-container-highest` (`#d3e4fe`), `surface-variant` (`#d3e4fe`), `on-surface-variant` (`#424754`), `inverse-surface` (`#213145`), `inverse-on-surface` (`#eaf1ff`), `outline` (`#727785`), `outline-variant` (`#c2c6d6`), `surface-tint` (`#005ac2`).
  - Primary Palette: `primary` (`#0058be`), `on-primary` (`#ffffff`), `primary-container` (`#2170e4`), `on-primary-container` (`#fefcff`), `inverse-primary` (`#adc6ff`), `primary-fixed` (`#d8e2ff`), `primary-fixed-dim` (`#adc6ff`), `on-primary-fixed` (`#001a42`), `on-primary-fixed-variant` (`#004395`).
  - Secondary Palette: `secondary` (`#855300`), `on-secondary` (`#ffffff`), `secondary-container` (`#fea619`), `on-secondary-container` (`#684000`), `secondary-fixed` (`#ffddb8`), `secondary-fixed-dim` (`#ffb95f`), `on-secondary-fixed` (`#2a1700`), `on-secondary-fixed-variant` (`#653e00`).
  - Tertiary Palette: `tertiary` (`#006947`), `on-tertiary` (`#ffffff`), `tertiary-container` (`#00855b`), `on-tertiary-container` (`#f5fff6`), `tertiary-fixed` (`#6ffbbe`), `tertiary-fixed-dim` (`#4edea3`), `on-tertiary-fixed` (`#002113`), `on-tertiary-fixed-variant` (`#005236`).
  - Error Palette: `error` (`#ba1a1a`), `on-error` (`#ffffff`), `error-container` (`#ffdad6`), `on-error-container` (`#93000a`).
- **FR-002**: System MUST mengekspos skala radius: `sm` (`0.25rem` / 4px), `DEFAULT` (`0.5rem` / 8px), `md` (`0.75rem` / 12px), `lg` (`1rem` / 16px), `xl` (`1.5rem` / 24px), `full` (`9999px`).
- **FR-003**: System MUST mengekspos skala spacing berbasis 8px: `xs` (4px), `base` (8px), `sm` (12px), `md` (24px), `gutter` (20px), `lg` (48px), `xl` (64px), `container-max` (1200px).

#### 2. Arsitektur Theming Multi-Jenjang
- **FR-004**: System MUST mendefinisikan seluruh token visual sebagai CSS Custom Properties pada atribut root `data-jenjang` (contoh: `data-jenjang="sd"`).
- **FR-005**: Pada versi ini, keempat jenjang (`tk`, `sd`, `smp`, `sma`) MUST memuat nilai token yang identik (Single Palette Base). DILARANG mengarang nilai hex untuk tema jenjang sebelum ada desain resmi.
- **FR-006**: Komponen UI DILARANG membaca atau menulis nilai warna hex secara langsung. Seluruh komponen WAJIB mengonsumsi token via CSS custom property / token utility class Tailwind.

#### 3. Ekstensi Skala Tipografi
- **FR-007**: System MUST menyediakan 7 token tipografi kanon dari desain:
  - `display-lg`: Quicksand, 48px / 56px, bold (700), letter-spacing -0.02em.
  - `headline-lg`: Quicksand, 32px / 40px, bold (700).
  - `headline-lg-mobile`: Quicksand, 28px / 36px, bold (700).
  - `title-md`: Quicksand, 24px / 32px, semibold (600).
  - `body-lg`: Inter, 18px / 28px, regular (400).
  - `body-md`: Inter, 16px / 24px, regular (400).
  - `label-sm`: Inter, 12px / 16px, semibold (600).
- **FR-008**: System MUST memperluas skala tipografi dengan 4 token turunan logis:
  - `title-sm`: Quicksand, 20px / 28px, semibold (600).
  - `body-sm`: Inter, 14px / 20px, regular (400).
  - `label-md`: Inter, 14px / 20px, semibold (600).
  - `label-lg`: Inter, 16px / 24px, semibold (600).

#### 4. Pustaka Komponen UI (`packages/ui`)
- **FR-009 (Kelompok A - Gamifikasi)**:
  - `Interactive Card`: Kontainer kartu interaktif dengan bayangan lembut, border 1px `outline-variant`, padding `md` (24px), serta state hover/active taktil.
  - `Progress Bar`: Bar horizontal pill-shaped (`rounded-full`), latar belakang track bermuatan transparansi `primary`, isi bar menggunakan gradien `primary` ke `tertiary` (success).
  - `Achievement Badge`: Lencana pencapaian berbentuk koin/lingkaran dengan border tebal 4px warna `secondary` (amber/gold), aksen sunburst internal, dan wadah ikon/maskot.
  - `Button Primary`: Tombol aksi utama dengan 3D bottom border 4px bermuatan warna gelap sepadan, bereaksi tertekan (border terkikis & offset Y +2px) saat diklik/ditekan. Target sentuh minimum 44x44px.
  - `Ghost Button`: Tombol sekunder dengan garis tepi tanpa isian warna solid.
  - `Level Selector`: Tile pemilih level interaktif yang menampilkan angka berukuran `display-lg` dan ikon topik.
  - `Mascot Speech Bubble`: Kontainer gelembung percakapan dengan sudut membulat dan penunjuk segitiga mengarah ke maskot.
- **FR-010 (Kelompok B - Form & Umpan Balik)**:
  - `Text Input`: Input teks standar dengan state normal, fokus (`outline`/`primary`), galat (`error`), dan tidak aktif (`disabled`).
  - `Password Input`: Input teks sandi dengan tombol toggle visibilitas (show/hide password).
  - `Select`: Dropdown seleksi data dengan opsi popover dan navigasi keyboard.
  - `Checkbox`: Kotak centang kustom dengan target sentuh 44x44px dan state checked, unchecked, indeterminate, disabled.
  - `Radio Group`: Grup tombol radio dengan label dan fokus keyboard.
  - `Form Field`: Pembungkus form yang menggabungkan Label, Input, Helper Text, dan Pesan Galat.
  - `Modal / Dialog`: Jendela dialog modal dengan penutup backdrop, tombol ESC, focus trap, serta area header, body, footer.
  - `Toast`: Komponen notifikasi mengambang (Success, Error, Info, Warning) dengan penutup otomatis.
  - `Alert`: Kotak pesan peringatan/informasi inline dengan ikon status.
- **FR-011 (Kelompok C - Komponen Data & CMS)**:
  - `Data Table`: Tabel data responsif dengan pengurutan kolom (sort), paginasi baris, dan pemilih jumlah baris per halaman.
  - `Tabs`: Antarmuka tab dengan indikator aktif dan beralih panel.
  - `Dropdown Menu`: Menu aksi mengambang dengan ikon opsi dan pembatas baris.
  - `Stat Card`: Kartu statistik dasbor dengan judul, nilai angka utama, indikator tren (naik/turun), dan ikon aksen.
  - `Chart Wrapper`: Pembungkus area grafik responsif yang siap menampung elemen visualisasi.
  - `File Dropzone`: Area pengunggahan berkas seret-dan-lepas (drag & drop) dengan petunjuk format file dan daftar pratinjau berkas terunggah.

#### 5. State Universal (Empty, Error, Loading Skeleton)
- **FR-012**: System MUST menyediakan 3 komponen state universal:
  - `Loading State`: Skeleton loader berbentuk blok teranimasi (pulse animation) yang mencerminkan bentuk kontainer. DILARANG menggunakan spinner berputar untuk area konten.
  - `Empty State`: Tampilan saat data kosong memuat ilustrasi/ikon placeholder, judul ramah, deskripsi singkat, dan tombol aksi.
  - `Error State`: Tampilan saat terjadi galat memuat ikon peringatan, pesan galat jelas, dan tombol "Coba Lagi" (Retry).
- **FR-013**: Seluruh komponen Kelompok C (Data Table, Tabs, Dropdown Menu, Stat Card, Chart Wrapper, File Dropzone) WAJIB mendukung ketiga state universal ini secara bawaan via prop/slot `state="normal" | "loading" | "empty" | "error"`.

#### 6. Override Tipografi Profesional
- **FR-014**: System MUST menyediakan mekanisme font override pada scope shell profesional (`data-shell="professional"` atau `.shell-professional`).
- **FR-015**: Pada scope profesional, seluruh elemen heading (h1-h6 dan kelas font heading) WAJIB menggunakan font `Inter` menggantikan `Quicksand`. DILARANG membuat komponen duplikat atau tema terpisah untuk kebutuhan ini.

#### 7. App Shell (Siswa & Profesional)
- **FR-016 (Shell SISWA)**:
  - Sidebar: Pemilih jenjang (TK, SD, SMP, SMA), menu Pencapaian, Pengaturan, tombol CTA "Tingkatkan ke Pro".
  - Top Bar: Indikator streak (ikon api + angka), pemilih bahasa (Language Switcher).
  - Main Area: Area konten utama yang responsif.
- **FR-017 (Shell PROFESIONAL)**:
  - Top Navigation: Navigasi atas berkerapatan tinggi untuk Admin CMS, Guru, dan Orang Tua, memuat pemilih peran, tombol aksi cepat, kotak pencarian, lonceng notifikasi, dan menu profil.
  - Berdasarkan referensi `aksicendekia_editor_butir_soal_cms` dan `aksicendekia_dasbor_orang_tua_guru`.

#### 8. Layer i18n (Internasionalisasi)
- **FR-018**: Bahasa Indonesia (`id`) MUST menjadi bahasa default aplikasi.
- **FR-019**: Seluruh string teks UI pada komponen WAJIB dieksternalisasi ke dalam file locale Bahasa Indonesia (misal: `packages/ui/src/locales/id.json`).
- **FR-020**: String Bahasa Inggris pada draf desain visual (seperti label form CMS) WAJIB diterjemahkan ke Bahasa Indonesia di file locale. DILARANG menyalin literal Bahasa Inggris ke dalam kode komponen.

#### 9. Halaman Katalog Komponen Internal
- **FR-021**: System MUST menyediakan halaman katalog komponen internal (`apps/web/app/design-system/page.tsx` atau sejenisnya) yang menampilkan:
  - Dokumentasi seluruh 47 token warna, tipografi, radius, dan spacing.
  - Pratinjau interaktif seluruh komponen Kelompok A, Kelompok B, dan Kelompok C.
  - Demonstrasi ketiga state universal pada seluruh komponen Kelompok C.
  - Switcher preview untuk Student Shell dan Professional Shell pada ukuran layar 375px dan 1440px.

---

### Key Entities *(include if feature involves data)*

- **DesignToken**: Entitas struktur token yang memuat pasangan key-value untuk warna M3, skala tipografi, radius, dan spacing.
- **GradeTheme**: Konfigurasi tema jenjang (`tk`, `sd`, `smp`, `sma`) yang memetakan CSS variables pada atribut root `data-jenjang`.
- **LocaleDictionary**: Objek pemetaan kunci-string i18n untuk penerjemahan teks antarmuka (default `id`).
- **UIComponentProps**: Antarmuka standar komponen yang mendukung varian, ukuran, state universal (`normal`, `loading`, `empty`, `error`), dan kepatuhan aksesibilitas.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% komponen UI tampil presisi dan bebas dari kerusakan tata letak pada resolusi 375px (mobile) dan 1440px (desktop) di kedua App Shell.
- **SC-002**: Kepatuhan Aksesibilitas WCAG 2.1 Level AA tercapai 100%:
  - Seluruh elemen interaktif memiliki target sentuh minimum 44x44px.
  - Seluruh teks dan elemen visual memenuhi rasio kontras warna minimum 4.5:1.
  - Seluruh alur interaksi komponen dapat diakses penuh menggunakan keyboard (`Tab`, `Space`, `Enter`, `Arrows`).
- **SC-003**: 100% komponen Kelompok C (Data Table, Tabs, Dropdown Menu, Stat Card, Chart Wrapper, File Dropzone) berhasil mendukung dan menampilkan 3 State Universal (Loading Skeleton, Empty State, Error State).
- **SC-004**: Arsitektur theming teruji 100%: Penambahan varian tema jenjang baru di masa depan hanya memerlukan penambahan file/set variabel CSS tanpa mengubah 1 baris pun kode komponen.
- **SC-005**: 0% nilai hex warna, ukuran font, atau spacing yang di-hardcode di dalam file komponen (`packages/ui`).
- **SC-006**: 0% string literal Bahasa Inggris yang tersisa di dalam kode komponen (`packages/ui`). Entire UI text externalized via i18n locale files.

---

## Assumptions

- **Aset Gambar Local Hosting**: Seluruh aset gambar logo dan maskot disajikan dari storage lokal repo (`public/` atau self-hosted asset path), tidak ada yang menginduk (hotlink) ke domain pihak ketiga seperti `lh3.googleusercontent.com` (sesuai Konstitusi Pasal VI).
- **Ikonografi Lucide**: Mengingat CDN font ikon tidak diizinkan di environment produksi (Konstitusi Pasal V), ikonografi antarmuka menggunakan paket `lucide-react`.
- **Ketersediaan Framework**: Pengembangan komponen berada di bawah monorepo `pnpm` pada paket `packages/ui` (komponen Next.js / React + Tailwind CSS via PostCSS) dan `packages/design-tokens`.
- **Scope Fitur Statis**: Fitur ini tidak menghubungkan data ke API backend Fastify/Prisma; seluruh data pada komponen data table, stat card, dan shell adalah data sampel statis.
