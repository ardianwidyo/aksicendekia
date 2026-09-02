# Implementation Plan: Fokus Jenjang SD — Revamp Matematika Interaktif Kelas 1–6

**Branch**: `011-sd-math-focus` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-sd-math-focus/spec.md`

## Summary

Persempit permukaan produk ke satu jenjang (SD) dan satu mata pelajaran (Matematika) lewat satu saklar konfigurasi, lalu perdalam isinya menjadi minimal 10 materi interaktif per tingkat kelas 1–6 (≥60 materi, ≥600 butir soal), masing-masing memuat ilustrasi, animasi self-hosted, komponen manipulatif, dan video YouTube tersemat click-to-load.

Seluruh permukaan siswa, tamu, orang tua, dan guru wajib bekerja penuh pada 320px potret sampai desktop 1280px+, dengan setiap soal pemindahan objek dapat diselesaikan cukup dengan ketukan.

Pendekatan teknis: **tidak ada mesin baru**. Seluruh pekerjaan menempel pada rel yang sudah dibangun Feature 010 — `packages/content-kit` sebagai sumber tunggal konten, `packages/ui` untuk renderer blok dan widget, `apps/web` static export yang membundel konten saat build, `apps/api` + Prisma untuk CMS dan alur `REVIEW → PUBLISHED`. Empat hal yang benar-benar baru: (1) sumbu **kelas** (`gradeLevel`) yang belum ada di model mana pun, (2) **modul fokus** yang menyaring jenjang/mapel di satu tempat lalu dipakai web dan api, (3) **fasad video pihak ketiga** yang memenuhi enam syarat pengecualian Konstitusi VI v1.2.0, dan (4) **jalur masukan ketuk-untuk-menempatkan** pada seluruh widget dan soal interaktif, berbagi mesin keadaan dengan jalur keyboard yang sudah disyaratkan.

Pengendali biaya utama (FR-037, permintaan "token seminimal mungkin"): materi **tidak** ditulis satu per satu. 60 pelajaran dihasilkan dari sekitar 10 *arketipe topik* berparameter (nilai tempat, garis bilangan, pecahan, operasi, pengukuran, geometri, data, waktu, uang, pola) yang di-instansiasi per kelas dengan angka, konteks, dan tingkat kesulitan berbeda. Ilustrasi dan animasi juga berparameter — komponen SVG generik yang menerima data, bukan 60 berkas SVG tangan.

## Technical Context

**Language/Version**: TypeScript 5.x, strict mode, `noImplicitAny`. Node.js LTS untuk api dan tooling.

**Primary Dependencies**: Next.js App Router (`output: 'export'`), React 18, Tailwind CSS (PostCSS build-time), shadcn/ui, Fastify, Prisma ORM, Zod, Vitest. Workspace pnpm: `apps/web`, `apps/api`, `packages/ui`, `packages/content-kit`, `packages/design-tokens`.

**Storage**: PostgreSQL via Prisma (sumber kebenaran CMS + progres pengguna terdaftar). `apps/web` adalah static export sehingga jalur tamu membaca konten yang **dibundel saat build** dari `@aksicendekia/content-kit`; progres tamu di `localStorage` (Feature 009).

**Testing**: Vitest + coverage v8, ambang 80% (Konstitusi III). Pola uji yang sudah ada dan WAJIB diperluas, bukan diganti: `lesson-catalog-validity.spec.ts`, `seed-status.spec.ts`, `tk-readability.spec.ts`, `a11y-scan.spec.tsx`, `media-fault-injection.spec.tsx`, `interactive-questions.spec.ts`.

**Target Platform**: Peramban ponsel, tablet, dan desktop (Chrome/Safari mutakhir) pada rentang lebar **320px–1280px+**, seluruhnya kelas satu. Orientasi **potret wajib** — tidak ada alur yang mensyaratkan lanskap. Jaringan seluler Indonesia yang tidak stabil; ponsel Android kelas bawah adalah kondisi terberat yang harus lolos. Static export dilayani sebagai berkas statis.

**Project Type**: Web — monorepo dua aplikasi (`apps/web` frontend static export, `apps/api` Fastify) plus tiga paket bersama.

**Performance Goals**: Materi dapat dipakai < 3 detik pada 4G kelas menengah (SC-007). Anggaran payload JS per rute pelajaran ≤ 120 KB terkompresi di luar runtime bersama. Nol permintaan jaringan ke domain pihak ketiga sebelum pengguna menekan putar (SC-011).

**Constraints**:
- `apps/web` tanpa runtime server — semua penyaringan fokus dan pemuatan konten harus bekerja saat build atau di klien.
- Konstitusi VI v1.2.0: hanya video edukasi yang boleh tersemat, click-to-load, mode privasi, pratinjau self-hosted, terdaftar, dan tertinjau. Semua aset lain tetap self-hosted.
- Konstitusi VIII: konten produksi berhenti di `REVIEW`; manusia yang menerbitkan.
- WCAG 2.1 AA, target sentuh 44x44px pada **seluruh** elemen interaktif (bukan hanya kendali media), alur penuh dengan keyboard.
- Responsif 320px–1280px+ tanpa gulir horizontal halaman; potret wajib; ketuk-untuk-menempatkan wajib pada tiap soal pemindahan objek. Berlaku pada jalur siswa, tamu, orang tua, dan guru; CMS admin boleh desktop-first tetapi dilarang rusak di 320px.

**Scale/Scope**: 6 tingkat kelas × ≥10 pelajaran = **≥60 pelajaran**, **≥600 butir soal**, **≥240 blok konten media/interaktif**, **≥15 baris capaian pembelajaran** (Fase A/B/C × 5 elemen). Tiga pelajaran SD lama (`sd-matematika-01..03`) diserap, bukan diduplikasi.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Prinsip | Status | Bagaimana rencana ini memenuhinya |
|---|---------|--------|------------------------------------|
| I | Stack & Fondasi | PASS | Tidak ada penambahan runtime atau framework. Prisma tetap satu-satunya jalur data. |
| II | Clean Architecture | PASS | Perubahan api bersifat aditif pada modul `curriculum`, `content-blocks`, `sync`. Logika fokus & kurasi video hidup di service; controller hanya validasi + format. Tidak ada Prisma di controller. |
| III | TDD & Coverage 80% | PASS (gate) | Setiap tugas Phase 2 wajib test-first. Uji invarian katalog (jumlah per kelas, kelengkapan elemen, blok wajib) ditulis sebelum konten dibuat sehingga 60 pelajaran divalidasi mesin, bukan mata. |
| IV | Security & Defensive | PASS | Skema Zod baru untuk `VideoEmbedRef`, `FocusConfig`, dan payload blok `VIDEO`. Endpoint CMS baru mewarisi JWT + rate limit yang ada. |
| V | Frontend Stack | PASS | Next.js App Router + Tailwind build-time. Tidak ada CDN Tailwind. Komponen baru masuk `packages/ui`, tidak diduplikasi di app. |
| VI | Design System & Self-Hosted | PASS **dengan pengecualian tercatat** | Ilustrasi, animasi, font, pratinjau video seluruhnya self-hosted. Video YouTube tersemat memakai pengecualian v1.2.0 dan **harus lulus keenam syarat** — dikawal `Embedded Media Gate` sebagai uji otomatis, lihat Complexity Tracking. |
| VII | Perlindungan Data Anak | PASS | Nol permintaan pihak ketiga sebelum klik putar; varian nocookie; tidak ada identitas/progres yang dikirim ke sematan; jalur tamu tetap tanpa pengumpulan data anak. Diuji lewat uji jaringan, bukan janji. |
| VIII | Integritas Konten Kurikulum | PASS (gate) | Setiap pelajaran memetakan ke `CurriculumAchievement` dengan kutipan + `sourceUrl` + `retrievedAt`. Seed menulis `REVIEW`; guard yang sudah ada menolak `PUBLISHED`. Seluruh string UI lewat i18n. |
| IX | Aksesibilitas | PASS (gate) | Memperluas `a11y-scan.spec.tsx` ke seluruh arketipe baru. Fasad video: tombol putar 44x44px, dapat difokus, `aria-label` bermakna. Ditambah gerbang responsif baru: pemindaian pada 320/375/768/1280px untuk luapan horizontal, ukuran target sentuh, dan keterselesaian potret (SC-013). Ketuk-untuk-menempatkan (FR-043) memakai mesin keadaan yang sama dengan jalur keyboard, sehingga aksesibilitas dan kelayakan-sentuh dipenuhi satu implementasi, bukan dua. |

**Hasil gate awal**: LULUS. Satu pengecualian terdaftar (video pihak ketiga) yang sudah disahkan Konstitusi v1.2.0 dan dikawal uji otomatis. Tidak ada pelanggaran yang tidak dijustifikasi.

### Re-check pasca-Phase 1

Desain Phase 1 tidak memunculkan pelanggaran baru. Tiga hal menguat dan satu utang lama ditemukan:

- **Prinsip VI diperkuat, bukan dilonggarkan.** Kontrak [video-embed.md](./contracts/video-embed.md) menerjemahkan keenam syarat konstitusi menjadi enam kondisi pemblokir publikasi yang berjalan sebagai uji, bukan checklist. Satu celah yang mudah terlewat ditutup eksplisit: pratinjau video WAJIB self-hosted, karena pratinjau bawaan YouTube dilayani dari `i.ytimg.com` dan memakainya akan melanggar larangan hotlink sekaligus syarat nol-permintaan-pra-klik.
- **Prinsip VII terjaga di jalur tamu.** Registri menyimpan `externalId`, bukan URL jadi, sehingga pemanggil tidak dapat melewati varian nocookie. Deteksi video mati dipindah ke CI (R7) agar peramban anak tidak pernah menjadi pihak yang menghubungi penyedia.
- **Prinsip III menjadi pengendali kualitas 60 pelajaran.** Uji ditulis per *arketipe*, bukan per pelajaran, sehingga 600 butir soal terverifikasi kebenaran matematisnya dengan biaya sekitar 10 berkas uji. Tanpa lapisan arketipe, volume ini tidak dapat diuji secara jujur.
- **Utang Prinsip II ditemukan, tidak diperluas.** `apps/api/src/modules/sync/public-content.controller.ts` memanggil Prisma langsung dari controller — melanggar pemisahan lapisan. Fitur ini tidak menambah pola tersebut: logika fokus dan kueri per-kelas masuk lapisan service, dan kueri yang tersentuh dipindahkan seiring jalan. Refactor menyeluruh controller itu **di luar cakupan** dan dicatat di [contracts/public-api.md](./contracts/public-api.md) agar tidak hilang.

**Hasil gate pasca-desain**: LULUS. Complexity Tracking di bawah tetap berisi empat entri yang sama; tidak ada tambahan.

### Revisi pasca-klarifikasi responsif (2026-09-02)

Sesi `/speckit-clarify` berjalan setelah Phase 1 dan menambahkan FR-040 … FR-045 serta SC-013/SC-014. Dampaknya pada rencana:

- **Tidak ada perubahan model data.** Responsivitas murni lapisan penyajian; [data-model.md](./data-model.md) tetap berlaku apa adanya.
- **Beban terbesar jatuh pada widget interaktif, bukan halaman.** Tujuh widget di `packages/ui/src/components/interactive/` dirancang saat Feature 010 dengan asumsi lebar longgar. FR-042 (potret 320px) dan FR-043 (ketuk-untuk-menempatkan) menyentuh ketujuhnya. Ini pekerjaan nyata yang harus muncul di `tasks.md`, bukan penyesuaian CSS.
- **Ketuk hampir gratis bila dibangun benar.** FR-025 sudah mewajibkan alur keyboard penuh, yang secara mekanis adalah "pilih objek, lalu pilih tujuan" — identik dengan ketuk-untuk-menempatkan. `usePlacementInput` mengangkat mesin keadaan itu satu kali dan menyalurkannya ke tiga modalitas. Membangunnya sebagai jalur ketiga yang terpisah adalah kesalahan yang harus dihindari.
- **Jaminan pabrik bertambah tiga.** [contracts/lesson-authoring.md](./contracts/lesson-authoring.md) memperoleh O10–O12 sehingga potret, ketuk, dan ukuran target ditegakkan sekali per arketipe (10 tempat), bukan diperiksa 60 kali per pelajaran.
- **Gerbang rilis bertambah satu.** Pemindaian viewport 320/375/768/1280 masuk ke [quickstart.md](./quickstart.md) sebagai ambang yang harus lulus.
- **CMS admin dikecualikan sebagian** (FR-045): boleh desktop-first, tetapi tetap wajib lolos pemeriksaan "tidak rusak" di 320px. Ini menjaga biaya editor blok tetap terkendali tanpa membiarkannya benar-benar pecah.

## Project Structure

### Documentation (this feature)

```text
specs/011-sd-math-focus/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── focus-config.md
│   ├── lesson-authoring.md
│   ├── video-embed.md
│   └── public-api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
packages/content-kit/src/
├── focus/
│   ├── focus-config.ts              # NEW — satu sumber saklar fokus (FR-001..FR-005)
│   └── __tests__/focus-config.spec.ts
├── curriculum/
│   └── achievements.ts              # EXTEND — +CP Fase A & C, 5 elemen × 3 fase
├── lessons/
│   ├── types.ts                     # EXTEND — gradeLevel, videoEmbed, archetype
│   ├── archetypes/                  # NEW — 10 pabrik pelajaran berparameter (FR-037)
│   │   ├── place-value.ts
│   │   ├── number-line.ts
│   │   ├── fractions.ts
│   │   ├── operations.ts
│   │   ├── measurement.ts
│   │   ├── geometry.ts
│   │   ├── data-chart.ts
│   │   ├── time.ts
│   │   ├── money.ts
│   │   └── patterns.ts
│   ├── sd/                          # NEW — sd.ts dipecah per kelas
│   │   ├── kelas-1.ts … kelas-6.ts  # ≥10 pelajaran per berkas
│   │   └── index.ts
│   ├── video-registry.ts            # NEW — registri sematan (FR-016c)
│   └── __tests__/                   # EXTEND — invarian per kelas
├── schema/
│   └── video-embed.schema.ts        # NEW — Zod VideoEmbedRef

packages/ui/src/components/
├── lesson/blocks/
│   └── EmbeddedVideoBlock.tsx       # NEW — fasad click-to-load (FR-016, FR-016a/b)
├── illustration/                    # NEW — primitif SVG berparameter, viewBox-responsif
│   ├── PlaceValueBlocks.tsx  NumberLineStrip.tsx  FractionShape.tsx
│   ├── ArrayGrid.tsx  ShapeFigure.tsx  BarChartMini.tsx
│   └── ClockFace.tsx  MoneyStack.tsx  PatternRow.tsx  MeasureRuler.tsx
├── interactive/
│   └── usePlacementInput.ts         # NEW — mesin keadaan pilih→tempatkan bersama
│                                    #       (ketuk, seret, keyboard) untuk 7 widget
└── layout/
    └── ScrollableWide.tsx           # NEW — wadah gulir-sendiri untuk konten lebar (FR-041)

packages/ui/src/test-utils/
└── viewports.ts                     # NEW — 320/375/768/1280 + helper potret (SC-013)

apps/web/
├── lib/focus.ts                     # NEW — adaptor saklar fokus untuk rute & nav
├── app/explore/                     # EDIT — katalog per kelas, redirect ramah
└── public/assets/lessons/sd/        # EXTEND — pratinjau video + fallback per pelajaran

apps/api/
├── prisma/schema.prisma             # EDIT — gradeLevel, VideoEmbed, aditif & nullable
├── prisma/migrations/               # NEW — satu migrasi aditif
├── prisma/seed-interactive-content.ts  # EXTEND — seed 60 pelajaran + registri video
├── src/modules/curriculum/          # EDIT — filter fokus + query per kelas
└── src/modules/sync/public-content.controller.ts  # EDIT — filter fokus

scripts/
└── verify-video-embeds.ts           # NEW — deteksi link-rot di CI (FR-016d)
```

Pekerjaan responsif tidak memunculkan berkas per-halaman: ia terpusat pada tiga tempat — primitif ilustrasi yang menskala lewat `viewBox` alih-alih lebar tetap, `usePlacementInput` yang menyatukan ketuk/seret/keyboard untuk ketujuh widget, dan `ScrollableWide` yang memenuhi FR-041 di satu komponen. Sisanya adalah penyesuaian token dan uji.

**Structure Decision**: Melanjutkan monorepo pnpm yang sudah berjalan tanpa perubahan bentuk. `packages/content-kit` tetap sumber kebenaran konten yang bebas React dan Prisma, sehingga `apps/web` (static export) dan `apps/api` (seed + grading) sama-sama mengimpornya. Dua penyesuaian struktural: `lessons/sd.ts` dipecah menjadi `lessons/sd/kelas-N.ts` agar tiap berkas tetap di bawah batas 800 baris pada volume 60 pelajaran, dan ditambah `lessons/archetypes/` sebagai lapisan pabrik yang membuat pertumbuhan konten bersifat data, bukan kode.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Sematan video pihak ketiga (pengecualian Konstitusi VI) | Keputusan produk eksplisit (klarifikasi Q3): tiap materi memuat animasi self-hosted **dan** video YouTube. Disahkan Konstitusi v1.2.0 dengan enam syarat. | Animasi self-hosted saja ditolak pemilik produk. Meng-host ulang video YouTube melanggar hak cipta penerbit dan Konstitusi VI butir 6. |
| Lapisan pabrik arketipe (`lessons/archetypes/`) | 60 pelajaran × 10 soal ditulis tangan tidak layak dan bertentangan langsung dengan FR-037 serta permintaan "token seminimal mungkin". | Menulis 60 berkas pelajaran literal seperti pola Feature 010 (3 pelajaran) berskala 20× dan menghasilkan drift kualitas antar kelas yang tidak dapat divalidasi mesin. |
| Kolom `gradeLevel` baru pada Lesson | Spec menuntut pengelompokan per kelas 1–6; model saat ini hanya punya `educationStage` + `phase`, dan satu fase mencakup dua kelas sehingga tidak dapat membedakan kelas 3 dari kelas 4. | Menurunkan kelas dari `Unit.title` ditolak: rapuh, tidak dapat diindeks, dan tidak dapat divalidasi skema. Menambah fase palsu merusak pemetaan Kurikulum Merdeka. |
| Registri sematan + skrip verifikasi CI | FR-016c/d menuntut metadata tercatat dan deteksi video mati, sementara `apps/web` static export tidak punya runtime server untuk memeriksanya saat penyajian. | Pemeriksaan saat runtime di klien ditolak: memicu permintaan pihak ketiga sebelum klik putar dan melanggar Konstitusi VI butir 2. |
