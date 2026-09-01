# Phase 0 Research: Materi Belajar Interaktif

**Feature**: `010-interactive-lesson-content` | **Date**: 2026-09-01 | **Plan**: [plan.md](./plan.md)

Riset ini berangkat dari pemeriksaan kode nyata, bukan asumsi. Temuan kondisi eksisting yang membentuk seluruh keputusan di bawah:

| Temuan | Bukti di repo | Implikasi |
|---|---|---|
| `apps/web` di-build sebagai **static export** | `apps/web/next.config.mjs` → `output: 'export'`; skrip deploy root → `wrangler pages deploy apps/web/out` | Tidak ada SSR/route handler saat runtime. Konten pelajaran harus tersedia **saat build**. |
| Konten tamu **hardcoded di frontend** | `apps/web/lib/guest-lessons.ts` (211 baris, 3 pelajaran) | Sudah ada sumber konten kedua di luar database. |
| Fetch API memakai host lokal dengan fallback diam | `apps/web/app/explore/page.tsx` → `fetch('http://localhost:4000/...')` lalu `setSubjects([...sample])` bila gagal | Di produksi jalur API tidak tercapai; yang benar-benar tampil adalah data bundled/fallback. |
| `generateStaticParams` **hardcoded 4 id** | `apps/web/app/explore/[lessonId]/page.tsx` | Menambah pelajaran tanpa memperbarui daftar ini = 404 (persis bug commit `6307936`). |
| Penilaian **terduplikasi dan divergen** | `apps/api/.../session-grader.ts` memakai `correctOptionId`, `acceptedAnswers`, `matchingMode`; `apps/web/.../local-session-engine.ts` memakai `correct_option_id`, `accepted_answers`, `matching_mode`, `matching_pairs` | Dua implementasi, dua konvensi kunci, dua daftar tanda baca normalisasi (`[.,!?]` vs `[.,!?;:]`). |
| **Tidak ada infrastruktur uji komponen** | Nol berkas `vitest.config.*` di repo; `packages/ui/package.json` hanya punya script `lint`; tidak ada `jsdom`/Testing Library | Widget React tidak dapat diuji hari ini. |
| Payload soal sudah fleksibel | `QuestionItem.contentPayload Json` di `schema.prisma` | Tipe soal baru tidak butuh perubahan bentuk kolom, hanya nilai enum baru. |
| Theming jenjang sudah ada | `packages/ui/src/providers/theme-provider.tsx` menyetel `data-jenjang` di `documentElement` | Perbedaan tampilan per jenjang cukup lewat token/CSS, tanpa percabangan komponen. |

---

## R1 — Sumber kebenaran konten di tengah static export

**Decision**: Buat paket kanonik `packages/content-kit` yang memuat skema Zod, katalog widget, logika penilaian murni, dan **12 pelajaran interaktif** sebagai data TypeScript bertipe. `apps/web` mengimpornya langsung (ikut ter-bundle saat build, nol permintaan jaringan). `apps/api` mengimpor paket yang sama untuk **men-seed** PostgreSQL (`prisma/seed-interactive-content.ts`) sehingga CMS dan jalur terautentikasi menyajikan konten yang identik. `apps/web/lib/guest-lessons.ts` menjadi re-export tipis demi kompatibilitas, dan `generateStaticParams` diturunkan dari katalog.

**Rationale**:
- Static export membuat "ambil dari API saat runtime" mustahil di produksi — kondisi ini sudah terbukti dari fallback diam di `explore/page.tsx`.
- Database tetap dibutuhkan untuk CMS, versioning, review, dan sesi terautentikasi. Menjadikan `content-kit` sebagai *hulu* dan database sebagai *hilir* (via seed) menjaga satu sumber kebenaran tanpa mengorbankan CMS.
- Menurunkan `generateStaticParams` dari katalog menutup kelas bug 404 yang baru saja terjadi.

**Alternatives considered**:
- *API sebagai satu-satunya sumber*: ditolak — jalur tamu di produksi akan kosong atau selamanya bergantung pada data fallback yang di-hardcode.
- *Database sebagai hulu, generate JSON saat build*: menarik, tetapi menambah ketergantungan build web pada database yang hidup; ditolak untuk v1 karena mempersulit CI dan deploy Cloudflare. Dapat ditinjau ulang bila CMS mulai dipakai produksi secara aktif.
- *Menyalin konten ke web dan api masing-masing*: ditolak — melanggar DRY dan mengulang pola divergensi yang sudah terbukti merugikan pada grader.

---

## R2 — Arsitektur katalog komponen interaktif

**Decision**: Registry berbasis peta di `packages/ui/src/components/interactive/registry.ts` yang memetakan `widgetType: string → { component, paramsSchema, supportStatus }`. Blok konten hanya menyimpan `{ widgetType, params }`. `InteractiveWidgetBlock` memvalidasi `params` dengan skema Zod dari `content-kit`, lalu merender komponen. Tipe yang tidak dikenal atau berstatus `DEPRECATED` merender `UnsupportedWidgetFallback` (representasi statis + penjelasan teks) alih-alih melempar galat.

Katalog v1 berisi **7 tipe**: `STEP_REVEAL`, `PARAMETER_EXPLORER`, `NUMBER_LINE_EXPLORER`, `FRACTION_BAR_BUILDER`, `IMAGE_HOTSPOT`, `SORT_INTO_GROUPS`, `ANIMATED_WORKED_EXAMPLE`.

**Rationale**: Memenuhi FR-002/FR-028 secara langsung — penulis mengonfigurasi, engineering menyediakan perilaku. Skema Zod per tipe membuat parameter salah tertangkap saat review/CI, bukan di hadapan siswa. Fallback memenuhi FR-009 dan edge case "widget usang" tanpa merusak pelajaran yang sudah terbit.

**Alternatives considered**:
- *Komponen bespoke per pelajaran*: ditolak — melanggar DRY, tidak dapat direview secara sistematis, dan membuat FR-002 mustahil.
- *Bahasa skrip di dalam konten* (opsi C pada klarifikasi): ditolak oleh keputusan pengguna dan karena risiko keamanan/aksesibilitas yang tidak terkendali.
- *Katalog disimpan penuh di database*: metadata di-seed ke tabel `interactive_widget_types` untuk kebutuhan tampilan CMS/review, tetapi **perilaku dan skema parameter tetap di kode** — database tidak boleh menjadi sumber kebenaran untuk sesuatu yang dieksekusi.

---

## R3 — Wujud elemen "video" di v1

**Decision**: Blok `ANIMATION` (`ConceptAnimationBlock`) merender animasi **SVG/CSS berbasis kode** yang dideklarasikan sebagai rangkaian langkah bertimestamp, dengan kontrol play/pause/ulang, teks pengiring tersinkron (berfungsi sebagai takarir), dan transkrip penuh yang selalu dapat dibuka. Blok `VIDEO` tetap ada di model data sebagai slot `MediaAsset` opsional; bila terisi, `VideoBlock` memakai elemen `<video>` native dengan `preload="none"`, trek `<track kind="captions">`, dan tanpa autoplay. Di v1 slot ini **tidak diisi**.

**Rationale**:
- Sesuai klarifikasi Q3 (kombinasi: animasi sekarang, slot `.mp4` opsional).
- SVG inline berarti nol aset biner baru, sehingga Prinsip VI (self-hosted, anti-hotlink) terpenuhi secara konstruksi dan target SC-004 jauh lebih mudah dicapai.
- Animasi berbasis kode mewarisi token warna per jenjang dan dapat diuji seperti komponen React biasa — tidak mungkin dilakukan pada berkas video.
- Embed pihak ketiga (YouTube/Vimeo) sekaligus melanggar Prinsip VI dan Prinsip VII (pelacakan). Keputusan ini menutup pintu itu secara eksplisit.

**Alternatives considered**:
- *Lottie / `lottie-web`*: ditolak — menambah dependensi runtime (~250 KB) plus aset JSON, sementara kebutuhan animasi di sini bersifat diagramatik sederhana.
- *GIF animasi*: ditolak — besar, tidak dapat dijeda, tidak dapat diberi takarir, dan buruk untuk `prefers-reduced-motion`.
- *Video `.mp4` diproduksi lebih dulu*: ditolak untuk v1 — tidak dapat dihasilkan dalam lingkup fitur ini; slotnya tetap disediakan agar dapat diisi belakangan tanpa mengubah struktur pelajaran.

---

## R4 — Menghapus duplikasi penilaian klien/server

**Decision**: Pindahkan `normalizeAnswerText` dan `gradeQuestion` ke `packages/content-kit/src/grading/`. Payload soal lebih dulu di-parse oleh skema Zod kanonik yang **menerima kedua konvensi kunci** (`correct_option_id` maupun `correctOptionId`, dst.) dan menghasilkan satu bentuk internal. `apps/api/.../session-grader.ts` dan `apps/web/.../local-session-engine.ts` menjadi pembungkus tipis yang mendelegasikan ke sana.

**Rationale**:
- Menambahkan `DRAG_DROP_GROUPING` dan `NUMBER_LINE` ke dua implementasi terpisah akan menggandakan permukaan bug yang sudah ada.
- Divergensi nyata hari ini bukan hipotetis: konvensi kunci berbeda, dan daftar tanda baca normalisasi berbeda (`[.,!?]+$` di server vs `[.,!?;:]+$` di klien). Artinya jawaban isian singkat yang diakhiri `;` dinilai berbeda antara Mode Tamu dan sesi login — cacat yang akan ikut diperbaiki oleh unifikasi ini.
- **Anti-cheat tidak terpengaruh**: yang dibagikan adalah *logika*, bukan *kunci jawaban*. Untuk sesi terautentikasi, kunci tetap tidak pernah meninggalkan server (Feature 004); Mode Tamu memang sudah menerima kunci sebagai trade-off yang disadari (Feature 009).

**Alternatives considered**:
- *Membiarkan duplikasi dan menyalin logika baru*: ditolak — melanggar DRY dan memperbesar cacat yang sudah terdeteksi.
- *Menjadikan penilaian server-only*: ditolak — akan merusak Mode Tamu yang secara desain berjalan tanpa jaringan.

**Catatan pelaksanaan**: ekstraksi dilakukan dengan **uji karakterisasi terlebih dahulu** atas perilaku kedua implementasi saat ini, agar unifikasi tidak diam-diam mengubah hasil penilaian soal yang sudah terbit.

---

## R5 — Pola interaksi yang aksesibel

**Decision**: Setiap interaksi berbasis penunjuk wajib punya padanan keyboard yang setara, ditetapkan sebagai syarat kontrak katalog:

- **Seret-dan-letakkan** → pola *select-then-place*: `Tab` menuju daftar item, panah untuk berpindah (roving `tabindex`), `Enter`/`Space` memilih item, `Tab` ke kelompok tujuan, `Enter` menempatkan. Status diumumkan lewat `aria-live="polite"`.
- **Garis bilangan** → `slider` dengan `role="slider"`, `aria-valuemin/max/now/text`, panah kiri/kanan untuk melangkah, `Home`/`End` ke ujung, `PageUp`/`PageDown` untuk langkah besar.
- **Penggeser parameter** → elemen `<input type="range">` native yang di-styling, bukan implementasi kustom.
- **Titik-sentuh gambar** → `<button>` sungguhan yang diposisikan absolut, bukan `<div>` dengan handler klik.
- Seluruh komponen memakai hook `useReducedMotion` dan menonaktifkan transisi non-esensial bila `prefers-reduced-motion: reduce`.

**Rationale**: FR-022/FR-023 dan Prinsip IX. Menetapkan pola ini di kontrak (bukan menyerahkan ke masing-masing komponen) membuat kepatuhan dapat diuji seragam.

**Alternatives considered**:
- *HTML5 Drag-and-Drop API*: ditolak — dukungan keyboard praktis nihil, perilaku pada layar sentuh buruk, dan sulit diumumkan ke pembaca layar.
- *Pustaka DnD pihak ketiga (`dnd-kit`, `react-dnd`)*: ditolak untuk v1 — menambah dependensi runtime untuk dua tipe soal, sementara pola select-then-place justru lebih aksesibel dan dapat diimplementasikan dengan primitif ARIA standar.

---

## R6 — Infrastruktur uji komponen (prasyarat)

**Decision**: Sebelum widget pertama ditulis, adakan infrastruktur uji komponen:
- Tambah devDependencies `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `vitest-axe` pada `packages/ui` dan `apps/web`.
- Tambah `vitest.config.ts` (environment `jsdom`, `globals: true`, provider cakupan `v8`) di `packages/ui`, `packages/content-kit`, dan `apps/web`.
- Tambah script `"test": "vitest run"` pada `packages/ui/package.json` agar tercakup oleh `pnpm test` di root.

**Rationale**: Konstitusi III mewajibkan ≥80% cakupan dan Konstitusi IX mewajibkan gerbang WCAG AA. Deliverable utama fitur ini adalah komponen React, namun repo saat ini **tidak punya satu pun** berkas konfigurasi Vitest dan `packages/ui` bahkan tidak punya script `test`. Tanpa langkah ini, kepatuhan tidak dapat dibuktikan — jadi ini prasyarat, bukan pekerjaan opsional.

**Alternatives considered**:
- *Hanya menguji logika murni*: ditolak — tidak membuktikan operabilitas keyboard, peran ARIA, atau kepatuhan `reduced-motion`, yang justru merupakan persyaratan fungsional eksplisit.
- *Playwright untuk seluruh verifikasi*: ditolak sebagai mekanisme utama — terlalu lambat untuk siklus TDD per komponen; pemeriksaan lintas-peramban dan pengukuran kinerja tetap dilakukan manual sesuai [quickstart.md](./quickstart.md).

---

## R7 — Kinerja dan pemuatan bertahap

**Decision**:
- Blok pertama pelajaran (judul, teks pembuka, ilustrasi SVG inline) berada di HTML statis hasil export — tanpa menunggu JavaScript apa pun.
- Komponen interaktif dimuat via `next/dynamic` dengan `SkeletonState` sebagai placeholder, sehingga tidak memblokir layar konsep pertama.
- Data pelajaran dipecah per-id agar hanya pelajaran yang dibuka ikut ter-load.
- Tanpa autoplay; video/animasi berat baru dimuat setelah interaksi eksplisit (FR-014).
- Anggaran: tambahan JS ≤ 60 KB gzip per pelajaran di luar chunk bersama.

**Rationale**: SC-004 (3 detik layar konsep pertama, 10 detik seluruh pelajaran pada profil ter-throttle) dan FR-016. Menempatkan konten pembuka di HTML statis adalah cara paling andal memenuhinya pada perangkat kelas menengah.

**Alternatives considered**:
- *Memuat seluruh katalog 12 pelajaran di satu bundle*: ditolak — membebani setiap kunjungan dengan konten yang tidak dibuka.
- *Mengandalkan cache peramban saja*: ditolak — kunjungan pertama justru yang diukur SC-004.

---

## R8 — Pemetaan kurikulum untuk 12 pelajaran

**Decision**: Sesuai enum `EducationStage` dan `CurriculumPhase` yang sudah ada di `schema.prisma`:

| Jenjang | Fase | Mata pelajaran inti | 3 pelajaran |
|---|---|---|---|
| TK | `FOUNDATION` | Numerasi & Literasi Dasar | Mengenal bilangan 1–10; Membandingkan banyak-sedikit; Mengenal bentuk dasar |
| SD | `FASE_B` | Matematika | Nilai tempat sampai ribuan; Pecahan sederhana sebagai bagian dari keseluruhan; Penjumlahan & pengurangan pada garis bilangan |
| SMP | `FASE_D` | Matematika | Bilangan bulat pada garis bilangan; Perbandingan senilai & berbalik nilai; Persamaan linear satu variabel |
| SMA | `FASE_E` | Matematika | Fungsi linear & gradien; Sistem persamaan linear dua variabel; Barisan aritmetika & geometri |

Setiap pelajaran: 1 penelusuran konsep (≥1 ilustrasi/animasi + ≥1 komponen interaktif) + 10 butir soal, minimal 1 di antaranya bertipe interaktif, masing-masing dengan petunjuk bertingkat dan pembahasan.

**Rationale**: Fase dipilih sebagai titik tengah representatif tiap jenjang, dan topiknya dipilih karena paling diuntungkan oleh manipulatif visual (garis bilangan, batang pecahan, penjelajah parameter) — sejalan dengan pola pedagogis yang diamati pada situs rujukan.

**Alternatives considered**:
- *Menyebar tiga pelajaran ke tiga fase berbeda per jenjang*: ditolak — menyulitkan penetapan prasyarat antar-pelajaran yang koheren.
- *Mata pelajaran berbeda-beda per jenjang*: ditolak — menyulitkan perbandingan SC-001/SC-003 terhadap versi teks-saja.

---

## R9 — Sumber dan penyimpanan teks Capaian Pembelajaran

**Decision**: Teks CP **tidak boleh** dirumuskan dari pengetahuan model. Saat implementasi, teks CP resmi diambil dari dokumen Kemendikbudristek melalui pencarian web, lalu disimpan sebagai entitas tersendiri `CurriculumAchievement` yang memuat `achievementText`, `sourceDocument`, `sourceUrl`, dan `retrievedAt`. Pelajaran merujuk ke entitas ini, bukan menyalin teksnya.

Pengambilan dilakukan **sekali per (fase, elemen)** — total 4 fase yang dipakai fitur ini (`FOUNDATION`, `FASE_B`, `FASE_D`, `FASE_E`).

**Rationale**:
- Konstitusi Prinsip VIII mewajibkan pemetaan ke capaian pembelajaran; klaim itu hanya bermakna bila teksnya dapat ditelusuri ke dokumen resmi.
- Entitas terpisah menghindari duplikasi: tiga pelajaran SD berbagi CP Fase B yang sama. Menyalin teks ke tiap pelajaran akan menciptakan tiga salinan yang bisa menyimpang.
- `retrievedAt` dan `sourceUrl` membuat konten dapat diaudit ulang saat kurikulum direvisi.

**Alternatives considered**:
- *Menulis rumusan CP dari pengetahuan model*: **ditolak** — inilah tepatnya yang dilarang oleh klarifikasi. Rumusan yang terdengar benar tetapi tidak sama dengan dokumen resmi justru lebih berbahaya daripada kolom kosong, karena guru akan mempercayainya.
- *Kolom teks bebas pada `Lesson`*: ditolak — mengundang duplikasi dan penyimpangan antar-pelajaran sefase.
- *Menunda pengisian CP ke fase berikutnya*: ditolak — Prinsip VIII menjadikan pemetaan syarat terbit, bukan pelengkap.

**Perilaku bila dokumen resmi tidak dapat diakses**: pelajaran terkait berhenti di `DRAFT`/`REVIEW` dan tidak diterbitkan. Ini konsisten dengan R10 yang memang menghentikan seluruh konten di `REVIEW`.

---

## R10 — Pemisahan produser dan penerbit konten

**Decision**: Konten yang diproduksi pelaksana di-seed dengan status **`REVIEW`**, bukan `PUBLISHED`. Transisi `REVIEW → PUBLISHED` hanya dapat dilakukan lewat aksi Admin di CMS oleh manusia peninjau.

Konsekuensi teknis yang harus ditangani: jalur produksi (`GET /api/v1/public/*` dan bundel statis `apps/web`) menyajikan **hanya** `PUBLISHED`, sehingga konten `REVIEW` tidak akan terlihat sama sekali dan fitur menjadi tidak dapat divalidasi end-to-end. Solusinya adalah **saklar khusus lingkungan non-produksi**:

- Variabel lingkungan `CONTENT_PREVIEW_INCLUDE_REVIEW=true` (default `false`) memperluas filter status pada endpoint publik menjadi `PUBLISHED | REVIEW`.
- Untuk bundel statis web, flag build `NEXT_PUBLIC_CONTENT_PREVIEW=true` memasukkan entri berstatus `REVIEW` ke katalog.
- Kedua flag **wajib bernilai false pada build produksi**, dan hal itu ditegakkan oleh uji, bukan sekadar konvensi.

**Rationale**: Tanpa ini, memenuhi FR-030a akan membuat FR-030b mustahil — fitur selesai tetapi tidak bisa dibuktikan bekerja. Saklar eksplisit dengan default aman lebih jujur daripada diam-diam menerbitkan konten agar demo berjalan.

**Alternatives considered**:
- *Seed langsung `PUBLISHED` lalu turunkan lagi*: ditolak — melanggar FR-030a secara langsung, dan ada jendela waktu di mana konten yang belum ditinjau tersaji ke siswa.
- *Menyalin 12 pelajaran ke fixture uji terpisah*: ditolak — fixture akan menyimpang dari konten sungguhan, sehingga yang diuji bukan yang dikirim.
- *Membuat status baru `PREVIEW`*: ditolak — menambah nilai enum ke alur siklus hidup Feature 003 yang sudah mapan, demi kebutuhan yang bisa diselesaikan dengan flag lingkungan.

---

## R11 — Literasi TK: desain gambar-dulu dan pembacaan suara

**Decision**: Dua lapis, keduanya wajib untuk 3 pelajaran TK.

**Lapis 1 — makna tidak bergantung teks.** Setiap soal TK memakai pilihan jawaban bergambar (`options[].illustrationAssetId`), dan pertanyaannya dapat dijawab benar bila seluruh teks disembunyikan. Ini diuji secara mekanis, bukan dinilai subjektif: uji merender soal dengan seluruh node teks dikosongkan dan memastikan masih ada pembeda visual antar-pilihan.

**Lapis 2 — kontrol "dengarkan".** Komponen `ListenButton` memakai **Web Speech API (`speechSynthesis`)** bawaan peramban dengan `lang: 'id-ID'`.

- Deteksi ketersediaan: bila `speechSynthesis` tidak ada **atau** tidak ada satu pun suara ber-`lang` diawali `id`, tombol tidak dirender sama sekali (FR-017c).
- Menekan tombol saat sedang membaca memanggil `cancel()` lebih dulu, sehingga suara tidak bertindih (edge case di spec).
- Pembacaan selalu dipicu gestur pengguna — tidak pernah otomatis (konsisten dengan FR-014 dan kebijakan autoplay peramban).

**Rationale**:
- `speechSynthesis` berjalan **sepenuhnya di perangkat**: nol berkas audio, nol permintaan jaringan, nol pihak ketiga. Ini satu-satunya opsi yang memenuhi Prinsip VI dan VII sekaligus dapat saya kerjakan tanpa produksi aset.
- Ketersediaan suara Bahasa Indonesia bervariasi antar-perangkat, karena itu lapis 1 dibuat **wajib** dan lapis 2 hanya penyempurna. Pelajaran tidak boleh bergantung pada suara.

**Alternatives considered**:
- *Berkas audio terekam*: ditolak untuk v1 karena alasan yang sama dengan video — tidak dapat saya produksi. Slot `MediaAssetKind.AUDIO` tetap disediakan agar dapat diisi kemudian tanpa mengubah struktur pelajaran (FR-017d).
- *Layanan text-to-speech awan*: ditolak tegas — memanggil pihak ketiga dengan konten yang dilihat anak, melanggar Prinsip VII dan VI.
- *Mengandalkan pembaca layar OS*: ditolak sebagai solusi utama — pembaca layar ditujukan untuk pengguna disabilitas yang sudah mengaktifkannya, bukan untuk anak 5 tahun yang sekadar belum bisa membaca.

---

## R12 — Penanganan pelajaran contoh legacy

**Decision**: Tambahkan penanda daftar pada entri konten: `listing: 'LISTED' | 'HIDDEN_LEGACY'` di `content-kit`, dicerminkan sebagai kolom `isListed Boolean @default(true)` pada `Lesson`.

- `lesson_m1`, `lesson_m2`, `lesson_i1` ditandai `HIDDEN_LEGACY`.
- Katalog `/explore` memfilter ke `LISTED` saja.
- `generateStaticParams` menyertakan **seluruh** entri termasuk yang tersembunyi, sehingga rute lama tetap ter-render dan tidak 404.
- Halaman pelajaran legacy menampilkan spanduk yang menautkan ke padanan interaktifnya (`supersededBy: string`).

**Rationale**: Memenuhi FR-031a tanpa menghapus apa pun. Menyertakan entri tersembunyi di `generateStaticParams` adalah inti keputusannya — inilah yang membedakan "disembunyikan dari daftar" dengan "dihapus", dan yang mencegah terulangnya bug 404 pada commit `6307936`.

**Alternatives considered**:
- *Redirect HTTP dari rute lama*: ditolak — static export tidak punya lapisan redirect saat runtime di Cloudflare Pages tanpa konfigurasi tambahan, dan redirect diam-diam menghilangkan konteks bagi pengunjung.
- *Menghapus entri legacy*: ditolak oleh klarifikasi, dan akan mematikan tautan yang mungkin sudah tersebar.
- *Mengisi ulang id lama dengan konten baru*: ditolak — judul dan cakupan berbeda, sehingga tautan lama akan mengarah ke materi yang bukan yang dimaksud penaut.

---

## Ringkasan status

Seluruh `NEEDS CLARIFICATION` dari Technical Context telah terselesaikan, dan keempat keputusan dari sesi klarifikasi 2026-09-01 (R9–R12) telah diserap. Tidak ada pertanyaan terbuka yang memblokir Fase 1.
