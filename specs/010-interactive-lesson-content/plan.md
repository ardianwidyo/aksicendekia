# Implementation Plan: Materi Belajar Interaktif — Animasi, Video, Ilustrasi & Manipulatif

**Branch**: `010-interactive-lesson-content` | **Date**: 2026-09-01 | **Spec**: [specs/010-interactive-lesson-content/spec.md](./spec.md)

**Input**: Feature specification `specs/010-interactive-lesson-content/spec.md`, Konstitusi AksiCendekia v1.1.0, dan pemeriksaan kode nyata pada `apps/web`, `apps/api`, `packages/ui`, `packages/design-tokens`.

---

## Summary

Mengubah penyajian materi AksiCendekia dari teks + butir soal statis menjadi **pengalaman belajar interaktif**: pelajaran tersusun dari **blok konten terurut** (teks kaya, ilustrasi, animasi konsep, slot video, dan instans komponen interaktif), diikuti latihan dengan **tipe soal visual baru** (seret-dan-letakkan pengelompokan dan penempatan garis bilangan) berikut umpan balik taktil ala `DESIGN.md`.

Pendekatan teknis bertumpu pada tiga keputusan inti yang lahir dari kondisi kode saat ini:

1. **Katalog komponen interaktif berbasis registry** di `packages/ui/src/components/interactive/`, dipasangkan dengan skema parameter Zod. Konten hanya menyimpan `{ widgetType, params }` — memenuhi FR-002/FR-028 (konfigurasi tanpa-kode di atas katalog yang dirawat engineering), dan memberi jalur *graceful fallback* untuk tipe widget usang (FR-009).

2. **Paket kanonik baru `packages/content-kit`** sebagai satu-satunya sumber kebenaran untuk: skema konten (Zod), katalog metadata widget, **logika penilaian murni**, dan **12 pelajaran interaktif** (TK/SD/SMP/SMA × 3 pelajaran × 10 soal). Ini menyelesaikan dua masalah nyata yang sudah ada di repo — `apps/web` di-build sebagai **static export** (`output: 'export'`) sehingga konten harus ter-bundle, dan **logika penilaian saat ini terduplikasi** antara `apps/api/src/modules/session/session-grader.ts` dan `apps/web/lib/gamification/local-session-engine.ts` dengan konvensi kunci payload yang berbeda (`correctOptionId` vs `correct_option_id`).

3. **"Video" diwujudkan sebagai animasi berbasis kode/SVG** (`ConceptAnimation`) dengan kontrol play/pause, teks pengiring bertakarir, dan transkrip — sesuai klarifikasi Q3. Slot berkas `.mp4` tetap ada di model data namun tidak diisi di v1. Konsekuensinya: nol aset biner baru, bandwidth minimal (mendukung SC-004), self-hosted secara konstruksi (Prinsip VI), dan dapat diuji seperti komponen biasa.

Sesi klarifikasi 2026-09-01 menambahkan tiga batasan yang ikut membentuk desain:

4. **Capaian Pembelajaran wajib berupa kutipan resmi.** Teks CP tidak boleh dirumuskan dari pengetahuan model; ia diambil dari dokumen Kemendikbudristek dan disimpan sebagai entitas `CurriculumAchievement` beserta `sourceDocument`, `sourceUrl`, dan `retrievedAt` (R9). Pelajaran merujuk entitas ini, bukan menyalin teksnya.

5. **Produser bukan penerbit.** Seluruh konten hasil fitur ini di-seed pada status `REVIEW`; hanya endpoint `publish` yang dioperasikan manusia yang boleh menghasilkan `PUBLISHED` (R10). Karena jalur produksi hanya menyajikan `PUBLISHED`, disediakan saklar pratinjau khusus non-produksi agar fitur tetap dapat divalidasi end-to-end.

6. **TK harus bisa dikerjakan tanpa membaca.** Tiga pelajaran TK memakai pilihan jawaban bergambar sebagai pembawa makna utama, ditambah kontrol "dengarkan" berbasis `speechSynthesis` bawaan peramban — nol berkas audio, nol pihak ketiga (R11). Pelajaran contoh lama ditandai `HIDDEN_LEGACY`: rutenya tetap hidup, tetapi keluar dari daftar katalog (R12).

Backend Fastify diperluas dengan model konten blok (`LessonContentBlock`, `MediaAsset`, `InteractiveWidgetType`, `CurriculumAchievement`) plus **gerbang aksesibilitas dan kurikulum** yang memblokir transisi `DRAFT → REVIEW` bila teks alternatif/takarir/transkrip, rujukan CP, atau syarat khusus TK belum lengkap (FR-004, FR-008a, FR-017a–b, FR-030).

---

## Technical Context

**Language/Version**: TypeScript 5.4 (`strict: true`, `any` dilarang) di seluruh workspace; Node.js LTS untuk `apps/api`.

**Primary Dependencies**: Next.js 14 App Router (`output: 'export'`), React 18, Tailwind CSS 3.4 via PostCSS, Fastify 4, Prisma 5, Zod 3, `lucide-react`, `clsx`/`tailwind-merge`. **Tambahan (devDependencies saja)**: `vitest` (sudah ada), `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `vitest-axe` — lihat R6. **Nol dependensi runtime baru**: animasi memakai SVG/CSS, dan pembacaan suara memakai `window.speechSynthesis` bawaan peramban (R11).

**Storage**: PostgreSQL via Prisma ORM (konten, blok, aset, katalog widget). Progres tamu tetap di IndexedDB/LocalStorage (Feature 009). Aset media statis self-hosted di `apps/web/public/assets/` — tanpa hotlink pihak ketiga (Prinsip VI).

**Testing**: Vitest untuk seluruh workspace. Logika murni (`packages/content-kit`, grader, skema) diuji tanpa DOM; komponen interaktif diuji dengan jsdom + Testing Library + `vitest-axe`. Target cakupan **≥80%** (Prinsip III).

**Target Platform**: Peramban evergreen (desktop & mobile). Baseline uji: ponsel Android kelas menengah pada koneksi setara 3G ter-throttle. `apps/web` di-deploy sebagai static export ke Cloudflare; `apps/api` sebagai layanan Node.

**Project Type**: Monorepo pnpm workspace — aplikasi web (frontend + backend) dengan paket bersama.

**Performance Goals**: Layar konsep pertama interaktif ≤ **3 detik**, seluruh pelajaran siap ≤ **10 detik** pada profil ter-throttle (SC-004). Respons visual komponen interaktif ≤ **100 ms** setelah input. Anggaran JS tambahan per pelajaran ≤ **60 KB gzip** di luar chunk bersama.

**Constraints**:
- `apps/web` adalah **static export** — tidak ada SSR saat runtime; konten pelajaran WAJIB tersedia saat build. `generateStaticParams` harus diturunkan dari katalog, bukan di-hardcode (kondisi saat ini: 4 id hardcoded di `apps/web/app/explore/[lessonId]/page.tsx`).
- Tailwind CDN dilarang; seluruh token visual dari `packages/design-tokens` (Prinsip V/VI).
- WCAG 2.1 AA: target sentuh ≥ 44×44px, kontras ≥ 4.5:1, operabilitas keyboard penuh (Prinsip IX).
- Tanpa pelacak pihak ketiga atau transmisi data pribadi lewat media/komponen (Prinsip VII). Ini menutup pintu bagi embed video pihak ketiga **dan** layanan text-to-speech awan.
- Seluruh string UI melalui layer i18n `packages/ui/src/locales/id.json` (Prinsip VIII).
- Teks capaian pembelajaran WAJIB kutipan dokumen resmi dengan rujukan yang dapat ditelusuri — dilarang dirumuskan bebas (FR-008a).
- Konten hasil fitur ini berhenti di `REVIEW`; `PUBLISHED` hanya lewat aksi manusia (FR-030a). Saklar `CONTENT_PREVIEW_INCLUDE_REVIEW` / `NEXT_PUBLIC_CONTENT_PREVIEW` berdefault `false` dan WAJIB `false` di produksi.
- Ketersediaan suara Bahasa Indonesia pada `speechSynthesis` tidak dapat diandalkan; pelajaran TK TIDAK BOLEH bergantung padanya (FR-017c).

**Scale/Scope**: 4 jenjang × 1 mata pelajaran inti × 3 pelajaran × 10 butir soal = **12 pelajaran / 120 soal**; **4 baris capaian pembelajaran** (satu per fase); **7 tipe komponen interaktif** di katalog v1; **2 tipe soal interaktif** baru; ~5 blok konten per pelajaran; **3 pelajaran legacy** ditandai tersembunyi.

---

## Constitution Check (v1.1.0)

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design — hasil sama.*

| Pasal | Status | Catatan penerapan |
|---|---|---|
| **I. Tech Stack & Core Foundations** | **Pass** | Perluasan konten memakai Fastify + Prisma + PostgreSQL + TypeScript strict. Tanpa raw SQL. |
| **II. Clean Architecture** | **Pass** | Modul baru `apps/api/src/modules/content-blocks/` dipecah `controller → service → repository`. Gerbang aksesibilitas berada di *service*, bukan controller. Prisma hanya di repository. |
| **III. TDD & QA (NON-NEGOTIABLE)** | **Pass (dengan prasyarat)** | Red-Green-Refactor via Vitest, cakupan ≥80%. **Prasyarat**: infrastruktur uji komponen React belum ada di repo — diadakan lebih dulu (R6, tugas fase awal). Tanpa ini, target 80% pada widget tidak dapat dibuktikan. |
| **IV. Security & Defensive Design** | **Pass** | Seluruh payload blok konten, parameter widget, dan jawaban soal interaktif divalidasi Zod di batas sistem. Endpoint CMS tetap di balik JWT + rate limit. Unggahan aset divalidasi format & ukuran (FR-005). Render teks kaya memakai sanitasi — tanpa `dangerouslySetInnerHTML` atas konten mentah. |
| **V. Frontend Stack & Struktur** | **Pass** | Next.js App Router + TS strict + Tailwind via PostCSS. Komponen interaktif tinggal di `packages/ui`, bukan diduplikasi per-aplikasi. |
| **VI. Design System sebagai Sumber Tunggal** | **Pass** | Warna/tipografi/radius/spacing komponen interaktif dari `packages/design-tokens`; tanpa hex hardcoded. Perbedaan jenjang lewat atribut `data-jenjang` yang sudah ada di `ThemeProvider`, bukan percabangan komponen. Aset self-hosted; animasi berupa SVG inline sehingga tidak ada domain pihak ketiga sama sekali. |
| **VII. Perlindungan Data Anak (NON-NEGOTIABLE)** | **Pass** | Komponen interaktif tidak mengirim telemetri. Tanpa embed pihak ketiga (YouTube/Vimeo dilarang — konsisten dengan keputusan animasi SVG), dan **tanpa layanan text-to-speech awan**: pembacaan suara memakai `speechSynthesis` yang berjalan di perangkat. Interaksi widget efemeral di klien; hanya hasil jawaban yang tercatat, sama seperti soal lama. |
| **VIII. Integritas Konten Kurikulum** | **Pass (diperkuat)** | 12 pelajaran dipetakan ke jenjang/fase/mapel dan **merujuk kutipan capaian pembelajaran resmi** yang dapat ditelusuri ke dokumen Kemendikbudristek (R9) — bukan rumusan model. Hanya `PUBLISHED` disajikan di produksi, dan `PUBLISHED` hanya dapat dicapai lewat tinjauan manusia (R10), sehingga gerbang review bermakna secara substansi, bukan sekadar transisi status. Seluruh string UI via i18n. |
| **IX. Aksesibilitas** | **Pass (diperluas)** | Setiap widget punya jalur keyboard-first (bukan HTML5 drag-and-drop), peran/nama/keadaan ARIA, `prefers-reduced-motion` dihormati, target sentuh ≥44px, kontras ≥4.5:1. **Ditambah dimensi literasi**: pelajaran TK tidak boleh menuntut kemampuan membaca — makna dibawa gambar/ikon, dengan pembacaan suara sebagai penyempurna yang boleh absen (R11). Diverifikasi otomatis (`vitest-axe` + uji "teks disembunyikan") dan manual. |

**Gate result: PASS.** Dua deviasi terstruktur dicatat di [Complexity Tracking](#complexity-tracking) dengan justifikasi.

---

## Project Structure

### Documentation (this feature)

```text
specs/010-interactive-lesson-content/
├── plan.md                                  # File ini
├── research.md                              # Fase 0
├── data-model.md                            # Fase 1
├── quickstart.md                            # Fase 1
├── contracts/                               # Fase 1
│   ├── content-blocks.contract.md
│   ├── widget-catalog.contract.md
│   ├── interactive-questions.contract.md
│   └── public-content-api.contract.json
├── checklists/
│   └── requirements.md
└── tasks.md                                 # Fase 2 (/speckit-tasks — BUKAN output plan)
```

### Source Code (repository root)

```text
packages/
├── content-kit/                                    # BARU — sumber kebenaran konten & penilaian
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       ├── index.ts
│       ├── schema/
│       │   ├── content-block.schema.ts             # Zod: ContentBlock & payload tiap blockType
│       │   ├── widget-params.schema.ts             # Zod: parameter tiap widgetType
│       │   ├── question-payload.schema.ts          # Zod: payload kanonik semua tipe soal
│       │   └── media-asset.schema.ts
│       ├── catalog/
│       │   └── widget-catalog.ts                   # Metadata katalog (id, versi, status dukungan)
│       ├── curriculum/
│       │   ├── achievements.ts                     # 4 kutipan CP resmi + sourceUrl/retrievedAt (R9)
│       │   └── __tests__/
│       │       └── achievements-provenance.spec.ts # Wajib: teks, dokumen, URL, tanggal terisi
│       ├── grading/
│       │   ├── normalize.ts                        # normalizeAnswerText (satu implementasi)
│       │   ├── grade-question.ts                   # Penilaian murni semua tipe soal
│       │   └── __tests__/
│       │       ├── grade-multiple-choice.spec.ts
│       │       ├── grade-short-answer.spec.ts
│       │       ├── grade-matching-pairs.spec.ts
│       │       ├── grade-drag-drop-grouping.spec.ts
│       │       └── grade-number-line.spec.ts
│       ├── lessons/                                # 12 pelajaran interaktif (FR-027)
│       │   ├── tk/   { tk-01..tk-03 }.lesson.ts    # pilihan bergambar + narrationText (A7/A8)
│       │   ├── sd/   { sd-01..sd-03 }.lesson.ts
│       │   ├── smp/  { smp-01..smp-03 }.lesson.ts
│       │   ├── sma/  { sma-01..sma-03 }.lesson.ts
│       │   ├── legacy.ts                           # 3 entri HIDDEN_LEGACY + supersededBy (R12)
│       │   ├── catalog.ts                          # Indeks, lookup by id/stage, filter listing
│       │   └── __tests__/
│       │       ├── lesson-catalog-validity.spec.ts # Validasi Zod + gerbang a11y atas 12 pelajaran
│       │       ├── tk-readability.spec.ts          # Uji "teks disembunyikan" (SC-013)
│       │       └── seed-status.spec.ts             # Menjamin tidak ada entri berstatus PUBLISHED
│       └── __tests__/
│           └── widget-params.spec.ts

├── ui/
│   ├── package.json                                # + script "test", devDeps jsdom/RTL/axe
│   ├── vitest.config.ts                            # BARU
│   └── src/
│       ├── index.ts                                # + ekspor blok interaktif
│       ├── hooks/
│       │   ├── use-reduced-motion.ts               # BARU
│       │   ├── use-speech-synthesis.ts             # BARU — deteksi suara id-*, cancel, voiceschanged
│       │   └── __tests__/
│       ├── components/
│       │   ├── a11y/
│       │   │   ├── ListenButton.tsx                # BARU — kontrol "dengarkan" TK (FR-017b–d)
│       │   │   └── __tests__/ListenButton.spec.tsx # Termasuk kasus "tanpa suara Bahasa Indonesia"
│       │   ├── lesson/                             # BARU — renderer blok konten
│       │   │   ├── LessonContentRenderer.tsx       # Iterasi blok terurut -> komponen blok
│       │   │   ├── blocks/
│       │   │   │   ├── RichTextBlock.tsx
│       │   │   │   ├── IllustrationBlock.tsx       # alt text wajib
│       │   │   │   ├── ConceptAnimationBlock.tsx   # animasi SVG: play/pause, takarir, transkrip
│       │   │   │   ├── VideoBlock.tsx              # slot .mp4 opsional + fallback ilustrasi
│       │   │   │   └── InteractiveWidgetBlock.tsx  # resolve registry + lazy load
│       │   │   ├── UnsupportedWidgetFallback.tsx   # FR-009 / edge case widget usang
│       │   │   ├── MediaFallback.tsx               # FR-015 gagal muat -> ilustrasi + teks
│       │   │   └── __tests__/
│       │   ├── interactive/                        # BARU — katalog komponen (7 tipe v1)
│       │   │   ├── registry.ts                     # widgetType -> { component, paramsSchema }
│       │   │   ├── StepRevealExplainer.tsx
│       │   │   ├── ParameterExplorer.tsx
│       │   │   ├── NumberLineExplorer.tsx
│       │   │   ├── FractionBarBuilder.tsx
│       │   │   ├── ImageHotspot.tsx
│       │   │   ├── SortIntoGroups.tsx
│       │   │   ├── AnimatedWorkedExample.tsx
│       │   │   └── __tests__/                      # + uji keyboard & vitest-axe per komponen
│       │   └── question/                           # BARU — tipe soal interaktif
│       │       ├── DragDropGroupingQuestion.tsx    # keyboard-first: pilih item -> pilih kelompok
│       │       ├── NumberLinePlacementQuestion.tsx # keyboard: panah kiri/kanan + Enter
│       │       ├── InteractiveFeedback.tsx         # animasi benar (emerald) / umpan lembut
│       │       └── __tests__/
│       └── locales/
│           ├── id.json                             # + string blok/widget/umpan balik
│           └── en.json

apps/
├── api/
│   ├── prisma/
│   │   ├── schema.prisma                           # + LessonContentBlock, MediaAsset,
│   │   │                                           #   InteractiveWidgetType, CurriculumAchievement,
│   │   │                                           #   ContentBlockType, MediaAssetKind(+AUDIO),
│   │   │                                           #   WidgetSupportStatus, LessonListing,
│   │   │                                           #   QuestionType(+2), Lesson(+3 kolom)
│   │   ├── migrations/                             # migrasi additive
│   │   ├── seed-curriculum-achievements.ts         # BARU — 4 kutipan CP resmi (jalan lebih dulu)
│   │   └── seed-interactive-content.ts             # BARU — 12 pelajaran, status REVIEW saja
│   └── src/modules/
│       ├── content-blocks/                         # BARU (Clean Architecture)
│       │   ├── content-block.schema.ts             # Zod request/response
│       │   ├── content-block.repository.ts         # Prisma
│       │   ├── content-block.service.ts            # CRUD + reorder + gerbang review
│       │   ├── content-block.controller.ts         # Admin CMS routes (JWT + rate limit)
│       │   ├── media-asset.service.ts              # Validasi format/ukuran, anti-hotlink
│       │   ├── accessibility-gate.ts               # Aturan A1-A8 DRAFT -> REVIEW
│       │   ├── curriculum-gate.ts                  # Aturan C1-C3 termasuk rujukan CP (FR-008a)
│       │   ├── publish.service.ts                  # SATU-SATUNYA jalur REVIEW -> PUBLISHED
│       │   ├── curriculum-achievement.service.ts   # CRUD kutipan CP + validasi sourceUrl
│       │   └── __tests__/
│       │       └── publish-authority.spec.ts       # Menjamin tak ada jalur lain menulis PUBLISHED
│       ├── session/
│       │   └── session-grader.ts                   # DIUBAH -> delegasi ke content-kit
│       └── sync/
│           └── public-content.controller.ts        # DIUBAH -> contentBlocks + curriculumReference
│                                                   #   + filter status (saklar pratinjau, default off)
└── web/
    ├── vitest.config.ts                            # BARU (jsdom)
    ├── lib/
    │   ├── guest-lessons.ts                        # DIGANTI -> re-export dari content-kit
    │   └── gamification/
    │       └── local-session-engine.ts             # DIUBAH -> delegasi ke content-kit
    ├── app/explore/
    │   ├── page.tsx                                # katalog: filter listing = LISTED saja
    │   └── [lessonId]/
    │       ├── page.tsx                            # generateStaticParams dari SELURUH katalog,
    │       │                                       #   termasuk HIDDEN_LEGACY (cegah 404)
    │       └── LessonDetailClient.tsx              # LessonContentRenderer + spanduk legacy
    └── app/(student)/session/[id]/
        └── ActiveSessionClient.tsx                 # + tipe soal interaktif
```

**Structure Decision**: Mempertahankan monorepo pnpm yang ada (`apps/web`, `apps/api`, `packages/ui`, `packages/design-tokens`) dan menambahkan **satu** paket bersama `packages/content-kit`. Komponen visual interaktif tinggal di `packages/ui` (sesuai Prinsip V: komponen bersama tidak boleh diduplikasi per-aplikasi), sedangkan skema, katalog metadata, logika penilaian murni, dan data 12 pelajaran tinggal di `packages/content-kit` agar dapat diimpor **baik** oleh `apps/web` (static export, tanpa jaringan) **maupun** `apps/api` (seed + penilaian server) tanpa duplikasi. Justifikasi paket kelima ada di Complexity Tracking.

---

## Phase 0 — Research

Ringkasan keputusan (lengkap di [research.md](./research.md)):

| # | Pertanyaan | Keputusan |
|---|---|---|
| R1 | Sumber kebenaran konten vs. static export | Paket kanonik `packages/content-kit`; web mengimpor langsung, API men-seed dari sumber yang sama |
| R2 | Arsitektur katalog komponen interaktif | Registry `widgetType → { component, paramsSchema }` + fallback tipe tak dikenal |
| R3 | Wujud "video" di v1 | Animasi SVG/CSS berbasis kode dengan takarir & transkrip; slot `.mp4` opsional tetap ada |
| R4 | Duplikasi penilaian klien/server | Ekstraksi ke `content-kit`; payload dinormalisasi lewat Zod (memperbaiki divergensi snake_case/camelCase yang ada) |
| R5 | Pola interaksi aksesibel (drag-drop, garis bilangan) | Keyboard-first select-then-place + roving tabindex; hindari HTML5 DnD API |
| R6 | Infrastruktur uji komponen | Tambah jsdom + Testing Library + `vitest-axe`; `vitest.config.ts` per paket; script `test` di `packages/ui` |
| R7 | Kinerja & pemuatan bertahap | Layar konsep pertama statis+SVG inline; widget berat via `next/dynamic`; tanpa autoplay |
| R8 | Pemetaan kurikulum 12 pelajaran | TK→FOUNDATION, SD→FASE_B, SMP→FASE_D, SMA→FASE_E; Matematika (TK: Numerasi & Literasi Dasar) |
| R9 | Sumber & penyimpanan teks Capaian Pembelajaran | Kutipan dokumen resmi Kemendikbudristek, disimpan sebagai `CurriculumAchievement` dengan `sourceUrl` + `retrievedAt`; dilarang dirumuskan dari pengetahuan model |
| R10 | Pemisahan produser dan penerbit konten | Seed menulis `REVIEW` saja; `PUBLISHED` hanya lewat endpoint publish oleh manusia; saklar pratinjau non-produksi agar tetap dapat divalidasi |
| R11 | Literasi TK | Dua lapis: makna dibawa gambar/ikon (wajib) + kontrol "dengarkan" via `speechSynthesis` bawaan peramban (penyempurna, boleh absen) |
| R12 | Pelajaran contoh legacy | Penanda `listing = HIDDEN_LEGACY`: keluar dari katalog, tetapi tetap masuk `generateStaticParams` agar rutenya tidak 404 |

**Output**: [research.md](./research.md) — nol `NEEDS CLARIFICATION` tersisa.

---

## Phase 1 — Design & Contracts

- **[data-model.md](./data-model.md)** — entitas Prisma baru (`LessonContentBlock`, `MediaAsset`, `InteractiveWidgetType`, `CurriculumAchievement`), enum baru (`ContentBlockType`, `MediaAssetKind` termasuk `AUDIO`, `WidgetSupportStatus`, `LessonListing`), perluasan `QuestionType` dan `Lesson`, gerbang A1–A8 & C1–C3, payload soal TK, serta strategi migrasi additive.
- **[contracts/content-blocks.contract.md](./contracts/content-blocks.contract.md)** — endpoint CMS Admin untuk CRUD/reorder blok, unggah aset, gerbang `DRAFT → REVIEW`, endpoint `publish` (satu-satunya jalur ke `PUBLISHED`), dan pengelolaan kutipan capaian pembelajaran.
- **[contracts/widget-catalog.contract.md](./contracts/widget-catalog.contract.md)** — 7 tipe widget v1, skema parameter, kontrak W1–W10 (termasuk syarat TK), dan kontrak `ListenButton` L1–L8.
- **[contracts/interactive-questions.contract.md](./contracts/interactive-questions.contract.md)** — payload dan bentuk jawaban `DRAG_DROP_GROUPING` & `NUMBER_LINE`, varian TK bergambar (T1–T5), aturan penilaian bersama, dan pembagian klien/server (anti-cheat).
- **[contracts/public-content-api.contract.json](./contracts/public-content-api.contract.json)** — skema respons `GET /api/v1/public/lessons/:id` yang diperluas dengan `contentBlocks`, `curriculumReference`, `listing`, dan slot narasi, plus aturan filter status.
- **[quickstart.md](./quickstart.md)** — langkah validasi end-to-end: migrasi, seed, saklar pratinjau, jalur login & tamu, throttle, aksesibilitas, validasi khusus TK, rute legacy, gerbang penerbitan, dan verifikasi kutipan CP.

**Post-Design Constitution Re-check**: **PASS** — tidak ada pelanggaran baru. Perluasan skema tetap *additive* (kolom baru pada `lessons` nullable atau berdefault; tanpa perubahan tak-kompatibel pada `question_items`), sehingga pelajaran non-interaktif yang ada tetap tampil apa adanya (FR-031). Prinsip VIII dan IX justru **menguat** dibanding rancangan sebelumnya: pemetaan kurikulum kini berbasis kutipan yang dapat ditelusuri, penerbitan memerlukan manusia, dan aksesibilitas mencakup dimensi literasi untuk TK.

---

## Complexity Tracking

> Dua deviasi terstruktur dari struktur yang disebut eksplisit di Konstitusi. Keduanya dinilai perlu.

| Deviasi | Mengapa diperlukan | Alternatif sederhana yang ditolak |
|---|---|---|
| **Paket kelima `packages/content-kit`** (Konstitusi V menyebut `apps/web`, `apps/api`, `packages/ui`, `packages/design-tokens`) | (a) `apps/web` adalah static export tanpa API saat runtime, sehingga 12 pelajaran harus ter-bundle di build; (b) `apps/api` butuh konten yang sama untuk seed & penilaian server; (c) logika penilaian saat ini **sudah** terduplikasi dan divergen antara `session-grader.ts` dan `local-session-engine.ts` — menambah 2 tipe soal akan menggandakan drift tersebut. Satu paket murni tanpa dependensi React/Prisma menyelesaikan ketiganya sekaligus. | **Menaruh di `packages/ui`**: ditolak — memaksa `apps/api` menarik dependensi React hanya untuk menilai jawaban. **Duplikasi di web dan api**: ditolak — melanggar DRY dan melanjutkan bug kelas divergensi yang sudah terbukti ada. **Konten hanya di database**: ditolak — build static export tidak dapat mengambilnya; jalur tamu di produksi akan kosong. |
| **Penambahan devDependencies uji komponen** (`jsdom`, `@testing-library/react`, `@testing-library/user-event`, `vitest-axe`) dan `vitest.config.ts` di `packages/ui` | Konstitusi III mewajibkan cakupan ≥80% dan Konstitusi IX mewajibkan gerbang WCAG 2.1 AA. Deliverable inti fitur ini adalah komponen React interaktif, namun repo **belum memiliki** infrastruktur uji komponen sama sekali (`packages/ui` hanya punya script `lint`). Tanpa penambahan ini, kedua gerbang konstitusi tidak dapat dibuktikan untuk fitur ini. | **Menguji widget hanya lewat logika murni**: ditolak — tidak membuktikan operabilitas keyboard, peran ARIA, maupun kepatuhan `reduced-motion`, yang justru merupakan persyaratan wajib (FR-013, FR-022, FR-023). **Menunda uji komponen ke fitur lain**: ditolak — melanggar Prinsip III yang bersifat NON-NEGOTIABLE. |

---

## Risks & Mitigations

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Refactor grader bersama mengubah perilaku penilaian soal lama | Regresi nilai siswa | Tulis uji karakterisasi atas perilaku `session-grader.ts` & `local-session-engine.ts` **sebelum** ekstraksi (Red→Green), termasuk kasus snake_case dan camelCase; kedua konvensi kunci tetap diterima oleh parser kanonik. |
| Ukuran bundle web membengkak karena 12 pelajaran + 7 widget | Melanggar SC-004 | Widget dimuat via `next/dynamic`; data pelajaran dipecah per-id sehingga hanya pelajaran yang dibuka ikut ter-load; anggaran ≤60 KB gzip per pelajaran diverifikasi di quickstart. |
| Widget seret-dan-letakkan sulit diakses keyboard/AT | Gagal gerbang Prinsip IX | Pola select-then-place ditetapkan di kontrak katalog sebagai syarat wajib, bukan opsi; setiap komponen punya uji keyboard + `vitest-axe` sebelum dianggap selesai. |
| `generateStaticParams` hardcoded terlewat diperbarui | 404 pada pelajaran baru di produksi (persis bug yang baru saja diperbaiki di commit `6307936`) | Diturunkan dari katalog `content-kit`; ditambah uji yang menyatakan setiap id di katalog muncul di hasil `generateStaticParams`. |
| Konten meniru terlalu dekat sumber rujukan | Risiko hak cipta (FR-029) | Rujukan dipakai untuk pola interaksi & urutan pedagogis saja; naskah, angka, dan ilustrasi ditulis/di-gambar ulang; tinjauan orisinalitas jadi kriteria terbit (SC-012). |
| Dokumen resmi Capaian Pembelajaran tidak dapat diakses saat implementasi | 12 pelajaran tidak dapat lolos gerbang C3 | Pengambilan CP dijadwalkan sebagai **tugas paling awal**, bukan langkah akhir, agar kegagalannya ketahuan sedini mungkin. Bila tetap gagal, pelajaran berhenti di `REVIEW` — konsisten dengan R10 — dan itu dilaporkan terbuka, bukan ditutup dengan rumusan karangan. |
| Teks CP terlihat masuk akal tetapi bukan kutipan resmi | Guru dan orang tua mempercayai informasi yang salah | `sourceUrl` + `retrievedAt` wajib terisi dan diverifikasi manual di quickstart §11; uji `achievements-provenance.spec.ts` menolak baris dengan rujukan kosong. Kolom kosong lebih baik daripada kutipan palsu. |
| Konten belum ditinjau tidak sengaja terbit ke siswa | Materi keliru sampai ke anak | Seed hanya menulis `REVIEW`; `publish.service.ts` satu-satunya jalur ke `PUBLISHED`; uji `publish-authority.spec.ts` memindai tidak ada penulisan `PUBLISHED` di luar jalur itu; saklar pratinjau berdefault `false` dan diuji wajib `false` di build produksi. |
| Perangkat TK tidak punya suara Bahasa Indonesia | Pelajaran TK tak terpakai bila bergantung suara | Gambar/ikon dijadikan pembawa makna **wajib** (gerbang A7), suara hanya penyempurna; uji "teks disembunyikan" membuktikannya secara mekanis, bukan lewat penilaian subjektif. |
| Pelajaran legacy hilang dari `generateStaticParams` saat difilter | 404 pada tautan lama — mengulang bug commit `6307936` | Filter katalog dan sumber `generateStaticParams` sengaja **dipisah**: katalog memakai `listing = LISTED`, `generateStaticParams` memakai seluruh entri. Uji khusus mengunci pemisahan ini. |
