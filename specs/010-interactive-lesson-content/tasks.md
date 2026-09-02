---

description: "Task list for 010-interactive-lesson-content implementation"
---

# Tasks: Materi Belajar Interaktif — Animasi, Video, Ilustrasi & Manipulatif

**Input**: Design documents from `specs/010-interactive-lesson-content/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: INCLUDED. Konstitusi AksiCendekia Prinsip III (TDD, NON-NEGOTIABLE) dan plan.md mewajibkan siklus Red→Green→Refactor dengan cakupan ≥80%. Setiap fase menulis test lebih dulu.

**Organization**: Tugas dikelompokkan per user story agar tiap story dapat diimplementasi & diuji mandiri.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Boleh berjalan paralel (berkas berbeda, tanpa dependensi belum selesai)
- **[Story]**: US1–US4 (fase user story saja; Setup/Foundational/Polish tanpa label)
- Setiap deskripsi memuat path berkas yang tepat

## Path Conventions

Monorepo pnpm workspace: `apps/web/`, `apps/api/`, `packages/ui/`, `packages/design-tokens/`, dan **paket baru** `packages/content-kit/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Membuat paket `content-kit` dan infrastruktur uji komponen yang belum ada di repo (R6).

- [X] T001 Buat scaffold paket `packages/content-kit/`: `packages/content-kit/package.json` (name `@aksicendekia/content-kit`, `"type": "module"`, `"main": "./src/index.ts"`, script `"test": "vitest run"`, `"lint": "tsc --noEmit"`), `packages/content-kit/tsconfig.json` (mirror `packages/ui/tsconfig.json`, `strict: true`), `packages/content-kit/src/index.ts` (barrel kosong)
- [X] T002 [P] Buat `packages/content-kit/vitest.config.ts` (environment `node`, `globals: true`, coverage `v8` dengan threshold 80% lines/functions/branches/statements)
- [X] T003 [P] Tambah devDependencies uji komponen (`jsdom`, `@testing-library/react`, `@testing-library/user-event`, `vitest-axe`) ke `packages/ui/package.json` dan `apps/web/package.json`; tambah script `"test": "vitest run"` ke `packages/ui/package.json`
- [X] T004 [P] Buat `packages/ui/vitest.config.ts` dan `apps/web/vitest.config.ts` (environment `jsdom`, `globals: true`, setup file yang mendaftarkan matchers `vitest-axe`, coverage `v8` threshold 80%)
- [X] T005 Daftarkan dependensi workspace: tambah `"@aksicendekia/content-kit": "workspace:*"` ke `apps/web/package.json`, `apps/api/package.json`, `packages/ui/package.json`; jalankan `pnpm install` dan verifikasi resolusi

**Checkpoint**: `pnpm --filter @aksicendekia/content-kit test` dan `pnpm --filter @aksicendekia/ui test` dapat dijalankan (walau belum ada test).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Skema data, skema Zod kanonik, dan unifikasi grader — prasyarat semua user story.

**⚠️ CRITICAL**: Tidak ada pekerjaan user story yang boleh dimulai sebelum fase ini selesai.

- [X] T006 Perluas `apps/api/prisma/schema.prisma`: tambah enum `ContentBlockType`, `MediaAssetKind` (termasuk `AUDIO`), `WidgetSupportStatus`, `LessonListing`; tambah `DRAG_DROP_GROUPING` + `NUMBER_LINE` ke `QuestionType`; tambah model `MediaAsset`, `LessonContentBlock`, `InteractiveWidgetType`, `CurriculumAchievement`; tambah kolom `listing` (default `LISTED`), `supersededByLessonId`, `curriculumAchievementId` + relasi ke model `Lesson` (per [data-model.md](./data-model.md) §1–§3)
- [X] T007 Terapkan perubahan skema additive. CATATAN: repo ini TIDAK memakai folder migrations — workflow-nya `prisma db push`. Dijalankan `prisma db push` (non-destruktif, 4 tabel + 4 enum + 2 nilai QuestionType + 3 kolom Lesson) lalu `prisma generate`. DB dev di localhost:5433 kini sinkron.
- [X] T008 [P] Buat skema Zod konten di `packages/content-kit/src/schema/media-asset.schema.ts` dan `packages/content-kit/src/schema/content-block.schema.ts` (discriminated union atas `blockType` + tipe `AnimationStep`, `animationId` enum tertutup) per [data-model.md](./data-model.md) §3.2; ekspor dari `packages/content-kit/src/index.ts`
- [X] T009 [P] Buat `packages/content-kit/src/schema/question-payload.schema.ts`: parser kanonik yang menerima **kedua** konvensi kunci (`correct_option_id`/`correctOptionId`, `accepted_answers`/`acceptedAnswers`, `matching_mode`/`matchingMode`, `pairs`/`matching_pairs`) → satu bentuk internal; cakup `MULTIPLE_CHOICE`/`SHORT_ANSWER`/`MATCHING_PAIRS` (per [contracts/interactive-questions.contract.md](./contracts/interactive-questions.contract.md) §1)
- [X] T010 [P] Buat `packages/content-kit/src/schema/widget-params.schema.ts`: skema Zod per `widgetType` untuk 7 tipe v1 dengan default aman (per [contracts/widget-catalog.contract.md](./contracts/widget-catalog.contract.md) §3, syarat W9)
- [X] T011 Tulis uji karakterisasi yang mengunci perilaku grading **saat ini** di `packages/content-kit/src/grading/__tests__/characterization.spec.ts` untuk `MULTIPLE_CHOICE`/`SHORT_ANSWER`/`MATCHING_PAIRS` — pasangan input→output diturunkan dari `apps/api/src/modules/session/session-grader.ts` dan `apps/web/lib/gamification/local-session-engine.ts`, mencakup snake_case + camelCase, seluruh `matchingMode`, dan tanda baca akhir `.`/`,`/`;` (uji ini harus lulus terhadap kode lama sebelum ekstraksi)
- [X] T012 Ekstrak logika penilaian ke `packages/content-kit/src/grading/normalize.ts` (`normalizeAnswerText` tunggal, buang `[.,!?;:]+$`) dan `packages/content-kit/src/grading/grade-question.ts` (`gradeQuestion` untuk 3 tipe lama); buat uji karakterisasi T011 lulus terhadap content-kit (perubahan perilaku yang disengaja: penyeragaman tanda baca — didokumentasikan di uji)
- [X] T013 Ubah `apps/api/src/modules/session/session-grader.ts` dan `apps/web/lib/gamification/local-session-engine.ts` menjadi pembungkus tipis yang mendelegasikan ke `@aksicendekia/content-kit` (pertahankan signature ekspor); jalankan suite `apps/api/src/modules/session/__tests__/` dan `apps/web/lib/gamification/__tests__/` sampai hijau
- [X] T014 [P] Buat modul metadata katalog `packages/content-kit/src/catalog/widget-catalog.ts` (7 entri: `id`, `displayName`, `description`, `supportStatus: SUPPORTED`, `catalogVersion: 1`, `a11yNotes`, `paramsSchema` JSON-Schema hasil derivasi dari T010) + uji `packages/content-kit/src/catalog/__tests__/widget-catalog.spec.ts`
- [X] T015 [P] Buat `packages/ui/src/hooks/use-reduced-motion.ts` + `packages/ui/src/hooks/__tests__/use-reduced-motion.spec.ts` (mock `matchMedia`, `prefers-reduced-motion: reduce`)

**Checkpoint**: Skema DB & Zod siap, grader tunggal terbukti setara perilaku lama — user story dapat dimulai.

---

## Phase 3: User Story 1 - Siswa Memahami Konsep Lewat Materi Interaktif (Priority: P1) 🎯 MVP

**Goal**: Siswa (tamu atau login) membuka pelajaran interaktif yang di-seed dan menelusuri konsep (ilustrasi/animasi + minimal satu manipulatif) sebelum latihan; pelajaran TK berbasis gambar dengan kontrol "dengarkan"; rute pelajaran legacy tetap hidup namun keluar dari katalog.

**Independent Test**: [quickstart.md](./quickstart.md) §3 (tamu), §4 (login), §5.5 (TK), §9 (legacy). Buka satu pelajaran per jenjang di kedua mode; verifikasi penelusuran konsep, manipulatif reaktif, takarir/transkrip, dan penyelesaian sampai layar ringkasan.

### Tests for User Story 1 ⚠️ (tulis dulu, pastikan GAGAL sebelum implementasi)

- [X] T016 [P] [US1] `packages/content-kit/src/curriculum/__tests__/achievements-provenance.spec.ts` — setiap baris CP punya `achievementText`, `sourceDocument`, `sourceUrl` (https + domain resmi kementerian), `retrievedAt` tidak kosong
- [X] T017 [P] [US1] `packages/content-kit/src/lessons/__tests__/lesson-catalog-validity.spec.ts` — 12 pelajaran lolos `content-block.schema`, tiap pelajaran punya ≥1 blok konsep (`ILLUSTRATION`/`ANIMATION`) + ≥1 blok `INTERACTIVE_WIDGET` + 10 soal (≥1 interaktif) + `curriculumAchievementId` terisi
- [X] T018 [P] [US1] `packages/content-kit/src/lessons/__tests__/tk-readability.spec.ts` — untuk 3 pelajaran TK: tiap soal punya `options[].illustrationAssetId` + `narrationText`; tanpa `SHORT_ANSWER`; 2–3 opsi; uji "teks disembunyikan" menyisakan pembeda visual antar-opsi (SC-013)
- [X] T019 [P] [US1] `packages/content-kit/src/lessons/__tests__/seed-status.spec.ts` — tidak ada entri katalog berstatus `PUBLISHED` (FR-030a)
- [X] T020 [P] [US1] `packages/ui/src/components/a11y/__tests__/ListenButton.spec.tsx` — operabel keyboard, `aria-pressed`, memanggil `cancel()` sebelum bicara ulang, tidak dirender bila tak ada suara `id-*`, menunggu `voiceschanged`, tanpa permintaan jaringan, memutar `narrationAssetUrl` bila ada (kontrak L1–L8)
- [X] T021 [P] [US1] `packages/ui/src/components/lesson/__tests__/blocks.spec.tsx` + `renderer.spec.tsx` — `LessonContentRenderer` merender blok terurut; `RichTextBlock` menolak HTML mentah; `IllustrationBlock` butuh alt; `ConceptAnimationBlock` play/pause + transkrip + mode manual saat reduced-motion; `VideoBlock` tanpa autoplay + `<track>`; `InteractiveWidgetBlock` resolve registry / render `UnsupportedWidgetFallback` untuk tipe tak dikenal & `DEPRECATED`; `MediaFallback` tampil saat `onError`; seluruhnya `vitest-axe` bersih
- [X] T022 [P] [US1] Perluas `apps/api/src/modules/sync/__tests__/public-content.test.ts` — `GET /api/v1/public/lessons/:id` memuat `contentBlocks`, `curriculumReference`, `listing`; membuang kunci jawaban pada jalur terautentikasi; pelajaran `REVIEW` tersembunyi kecuali `CONTENT_PREVIEW_INCLUDE_REVIEW=true`
- [X] T023 [P] [US1] `apps/web/app/explore/__tests__/static-params.spec.ts` — `generateStaticParams` untuk `/explore/[lessonId]` mengembalikan **seluruh** id katalog termasuk `HIDDEN_LEGACY`; daftar `/explore` mengecualikan `HIDDEN_LEGACY`

### Implementation for User Story 1

- [X] T024 [US1] Riset & catat teks Capaian Pembelajaran resmi Kurikulum Merdeka untuk fase `FOUNDATION`, `FASE_B`, `FASE_D`, `FASE_E` (elemen Matematika/Numerasi relevan) via pencarian web; tulis `packages/content-kit/src/curriculum/achievements.ts` (4 entri dengan `achievementText` verbatim, `sourceDocument`, `sourceUrl`, `retrievedAt`). Bila dokumen tidak dapat diakses, catat dan biarkan pelajaran terkait tanpa CP (tetap `DRAFT`)
- [X] T025 [US1] Buat `packages/ui/src/hooks/use-speech-synthesis.ts` — deteksi suara `id-*`, tunggu `voiceschanged`, `speak`/`cancel`, boolean ketersediaan + `packages/ui/src/hooks/__tests__/use-speech-synthesis.spec.ts`
- [X] T026 [US1] Buat `packages/ui/src/components/a11y/ListenButton.tsx` sesuai kontrak L1–L8 (Web Speech API bawaan, tanpa pihak ketiga)
- [X] T027 [P] [US1] Buat `packages/ui/src/components/interactive/registry.ts` (`widgetType → { component, paramsSchema, supportStatus }`, `resolveWidget`) dan `packages/ui/src/components/lesson/UnsupportedWidgetFallback.tsx` (tanpa lempar galat)
- [X] T028 [P] [US1] Implementasi `packages/ui/src/components/interactive/StepRevealExplainer.tsx` + `AnimatedWorkedExample.tsx` (keyboard, mode manual saat reduced-motion, i18n, token) + uji di `packages/ui/src/components/interactive/__tests__/`
- [X] T029 [P] [US1] Implementasi `packages/ui/src/components/interactive/NumberLineExplorer.tsx` + `ParameterExplorer.tsx` (`role="slider"` / `<input type="range">` native, `expressionId` enum tertutup) + uji
- [X] T030 [P] [US1] Implementasi `packages/ui/src/components/interactive/FractionBarBuilder.tsx` (navigasi panah, `aria-pressed`) + uji
- [X] T031 [P] [US1] Implementasi `packages/ui/src/components/interactive/ImageHotspot.tsx` (`<button>` sungguhan, koordinat `%`) + uji
- [X] T032 [P] [US1] Implementasi `packages/ui/src/components/interactive/SortIntoGroups.tsx` (select-then-place, `aria-live`) + uji
- [X] T033 [US1] Daftarkan 7 widget di `packages/ui/src/components/interactive/registry.ts`; tambah uji W10 "teks disembunyikan" untuk widget yang dipakai pelajaran TK
- [X] T034 [P] [US1] Buat komponen blok di `packages/ui/src/components/lesson/blocks/`: `RichTextBlock.tsx` (subset markdown aman, tanpa HTML mentah), `IllustrationBlock.tsx`, `ConceptAnimationBlock.tsx` (langkah SVG, play/pause/ulang, takarir tersinkron, disclosure transkrip, reduced-motion), `VideoBlock.tsx` (`<video preload="none">`, `<track kind="captions">`, tanpa autoplay), `InteractiveWidgetBlock.tsx` (validasi params + `next/dynamic` + `SkeletonState`)
- [X] T035 [US1] Buat `packages/ui/src/components/lesson/MediaFallback.tsx` dan `packages/ui/src/components/lesson/LessonContentRenderer.tsx` (iterasi blok terurut → komponen blok; `onError` media → `MediaFallback`)
- [X] T036 [US1] Ekspor komponen/hook baru dari `packages/ui/src/index.ts`; tambah kunci i18n blok/widget/kontrol "dengarkan" ke `packages/ui/src/locales/id.json` dan `packages/ui/src/locales/en.json`
- [X] T037 [US1] Susun 3 pelajaran TK `packages/content-kit/src/lessons/tk/tk-01.lesson.ts`..`tk-03.lesson.ts` (Numerasi & Literasi Dasar, fase `FOUNDATION`; opsi bergambar + `narrationText`; penelusuran konsep; 10 soal termasuk ≥1 interaktif; petunjuk bertingkat + pembahasan; konten orisinal)
- [X] T038 [P] [US1] Susun 3 pelajaran SD `packages/content-kit/src/lessons/sd/sd-01.lesson.ts`..`sd-03.lesson.ts` (Matematika, fase `FASE_B`)
- [X] T039 [P] [US1] Susun 3 pelajaran SMP `packages/content-kit/src/lessons/smp/smp-01.lesson.ts`..`smp-03.lesson.ts` (Matematika, fase `FASE_D`)
- [X] T040 [P] [US1] Susun 3 pelajaran SMA `packages/content-kit/src/lessons/sma/sma-01.lesson.ts`..`sma-03.lesson.ts` (Matematika, fase `FASE_E`)
- [X] T041 [US1] Buat `packages/content-kit/src/lessons/legacy.ts` (3 entri `HIDDEN_LEGACY` untuk `lesson_m1`/`lesson_m2`/`lesson_i1` dengan `supersededByLessonId` → padanan interaktif) dan `packages/content-kit/src/lessons/catalog.ts` (`getById`, `listForCatalog` = `LISTED` saja, `allIds` = semua); ekspor dari `packages/content-kit/src/index.ts`
- [X] T042 [US1] `apps/web/public/assets/lessons/**` — 28 SVG placeholder (bergaya per jenjang) untuk blok konsep - [ ] T042 [US1] Buat aset SVG frame animasi konsep di `apps/web/public/assets/lessons/**` yang dirujuk pelajaran/widget (self-hosted, orisinal); pastikan enum `animationId` di `content-block.schema.ts` cocok fallback. Artwork final + gambar opsi TK = follow-up.
- [X] T043 [US1] `apps/web/lib/guest-lessons.ts` — ditambah bridge ke `@aksicendekia/content-kit` (getInteractiveLesson, listExploreLessons, allLessonIds; legacy tetap 404-safe). Catalog LISTED-only + generateStaticParams siap dipakai T047/T048.
- [X] T044 [US1] Perluas `apps/api/src/modules/sync/public-content.controller.ts` — sertakan `contentBlocks` + `curriculumReference` + `listing` + slot narasi pada `GET /api/v1/public/lessons/:id`; tambah filter status yang menghormati `CONTENT_PREVIEW_INCLUDE_REVIEW` (default `false`)
- [X] T045 [US1] Buat `apps/api/prisma/seed-curriculum-achievements.ts` (upsert 4 baris dari `content-kit`); wire ke `apps/api/prisma/seed.ts` **sebelum** seed pelajaran
- [X] T046 [US1] Buat `apps/api/prisma/seed-interactive-content.ts` — upsert idempoten 12 pelajaran + `LessonContentBlock` + `QuestionItem` dari `content-kit`; **seluruhnya `status = REVIEW`**; tautkan `curriculumAchievementId`; tandai pelajaran legacy `listing = HIDDEN_LEGACY` + `supersededByLessonId`; wire ke `apps/api/prisma/seed.ts`
- [X] T047 [US1] Perbarui `apps/web/app/explore/[lessonId]/page.tsx` — `generateStaticParams` dari `content-kit` `allIds` (termasuk `HIDDEN_LEGACY`); `apps/web/app/explore/[lessonId]/LessonDetailClient.tsx` merender `LessonContentRenderer` + spanduk legacy yang menautkan `supersededByLessonId` (`NEXT_PUBLIC_CONTENT_PREVIEW` menggerbang visibilitas `REVIEW`)
- [X] T048 [US1] Perbarui `apps/web/app/explore/page.tsx` — sumber katalog dari `content-kit` `listForCatalog` (`LISTED` saja), pertahankan filter jenjang
- [X] T049 [US1] Verifikasi alur end-to-end per [quickstart.md](./quickstart.md) §3 + §5.5 + §9; jalankan `pnpm --filter @aksicendekia/content-kit test` + `pnpm --filter web test`

**Checkpoint**: US1 fungsional & teruji mandiri — MVP dapat didemokan (mode tamu tanpa backend).

---

## Phase 4: User Story 2 - Tim Konten Menyusun Materi Interaktif di CMS (Priority: P2)

**Goal**: Admin merangkai pelajaran dari blok konten + instans widget + media, melihat pratinjau, lalu menjalankan `DRAFT → REVIEW → PUBLISHED` dengan gerbang aksesibilitas + kurikulum yang ditegakkan; hanya aksi `publish` oleh manusia yang menghasilkan `PUBLISHED`.

**Independent Test**: [quickstart.md](./quickstart.md) §8. Buat pelajaran, tambah blok tanpa alt/tautan CP → ajukan review ditolak dengan `violations[]`; lengkapi → `REVIEW`; `publish` → `PUBLISHED`; unggah aset melebihi batas → ditolak.

### Tests for User Story 2 ⚠️ (tulis dulu, pastikan GAGAL)

- [X] T050 [P] [US2] `apps/api/src/modules/content-blocks/__tests__/content-block.test.ts` — kontrak CRUD + reorder (§1–§5): `400` payload/params tidak cocok, `404` `widgetType` tak dikenal, `409` saat pelajaran `PUBLISHED`
- [X] T051 [P] [US2] `apps/api/src/modules/content-blocks/__tests__/media-asset.test.ts` — allowlist format per `kind`, batas ukuran (512KB/2MB/20MB), `IMAGE` wajib `altText`, `VIDEO`>180s, `AUDIO`>60s, `storageKey` menyerupai URL eksternal → `422` (§6)
- [X] T052 [P] [US2] `apps/api/src/modules/content-blocks/__tests__/gates.test.ts` — `submit-review` mengembalikan `422` dengan `violations[]` terstruktur untuk A1–A8 + C1–C3; `200` saat semua lolos (§7)
- [X] T053 [P] [US2] `apps/api/src/modules/content-blocks/__tests__/publish-authority.spec.ts` — `publish` hanya dari `REVIEW` (`409` selain itu), menjalankan ulang gerbang (`422`), dan assertion statis bahwa tidak ada modul/seed/migrasi lain yang menulis `status: PUBLISHED` (§7a)
- [X] T054 [P] [US2] `apps/api/src/modules/content-blocks/__tests__/curriculum-achievement.test.ts` — `POST` validasi (field kosong → `400`, `sourceUrl` non-https/non-resmi → `400`, tuple duplikat → `409`), `GET` daftar (§7b)
- [X] T055 [P] [US2] `apps/api/src/modules/content-blocks/__tests__/widget-catalog.test.ts` — `GET /api/v1/admin/widget-catalog` mengembalikan 7 entri `SUPPORTED` dengan `paramsSchema` (§8)

### Implementation for User Story 2

- [X] T056 [US2] `apps/api/src/modules/content-blocks/content-block.schema.ts` — skema Zod request/response semua endpoint (pakai ulang skema `content-kit`)
- [X] T057 [US2] `apps/api/src/modules/content-blocks/content-block.repository.ts` — akses Prisma untuk blok, aset media, capaian pembelajaran, status/listing pelajaran
- [X] T058 [US2] `apps/api/src/modules/content-blocks/media-asset.service.ts` — validasi mime/ukuran/`altText`/durasi, tolak `storageKey` eksternal, persist `MediaAsset`
- [X] T059 [P] [US2] `apps/api/src/modules/content-blocks/accessibility-gate.ts` — fungsi murni A1–A8, kembalikan `violations[]`
- [X] T060 [P] [US2] `apps/api/src/modules/content-blocks/curriculum-gate.ts` — fungsi murni C1–C3
- [X] T061 [US2] `apps/api/src/modules/content-blocks/curriculum-achievement.service.ts` — CRUD + validasi `sourceUrl` https/domain resmi + unik `(phase, subjectCode, element)`
- [X] T062 [US2] `apps/api/src/modules/content-blocks/publish.service.ts` — satu-satunya transisi `REVIEW → PUBLISHED`; jalankan ulang kedua gerbang; simpan `reviewerNote`
- [X] T063 [US2] `apps/api/src/modules/content-blocks/content-block.service.ts` — CRUD blok + reorder atomik + orkestrasi `submit-review` (memanggil kedua gerbang) + guard `409` saat pelajaran `PUBLISHED` (delegasi versioning Feature 003)
- [X] T064 [US2] `apps/api/src/modules/content-blocks/content-block.controller.ts` — rute Fastify untuk endpoint §1–§8; JWT `ADMIN` + rate limit; daftarkan di `apps/api/src/app.ts`
- [X] T065 [US2] Seed baris `InteractiveWidgetType` dari `content-kit` widget-catalog di `apps/api/prisma/seed.ts` (upsert idempoten per `id`)
- [X] T066 [P] [US2] UI editor blok CMS di `apps/web/app/(admin)/admin/curriculum/` — daftar blok + tambah/reorder/hapus, pemilih `widgetType` dari `GET /admin/widget-catalog`, form parameter dari `paramsSchema` (payload sebagai editor JSON), unggah media (dropdown dari `GET /admin/media-assets`), pemilih capaian pembelajaran (via endpoint `PATCH .../curriculum/lessons/:id` Feature 003 yang diperluas)
- [X] T067 [P] [US2] Pratinjau Admin — render pelajaran tersusun via `LessonContentRenderer` persis seperti tampilan siswa (FR-006) di `apps/web/app/(admin)/admin/curriculum/[lessonId]/preview/page.tsx`
- [X] T068 [US2] Dasbor review di `apps/web/app/(admin)/admin/curriculum/[lessonId]/review/page.tsx` — menampilkan tipe widget + media yang dipakai + menandai yang bukan `SUPPORTED` (FR-009); pasang tombol `submit-review` + `publish` dengan tampilan `violations[]` terstruktur
- [X] T069 [US2] Verifikasi alur CMS per [quickstart.md](./quickstart.md) §8 (jalur otomatis: 58 test content-blocks + 10 test curriculum hijau, `next build` static export sukses termasuk 3 rute admin baru); jalankan `pnpm --filter api test`

**Checkpoint**: US1 + US2 berfungsi mandiri; jalur produksi/penerbitan bermakna (butuh manusia).

---

## Phase 5: User Story 3 - Latihan Soal dengan Interaksi Visual & Umpan Balik Beranimasi (Priority: P3)

**Goal**: Siswa mengerjakan tipe soal visual baru (seret-dan-letakkan pengelompokan, penempatan garis bilangan) dengan umpan balik taktil beranimasi; dinilai di server untuk sesi login dan di klien untuk Mode Tamu memakai grader bersama.

**Independent Test**: [quickstart.md](./quickstart.md) §3/§4 baris soal interaktif + keyboard-only. Susun satu soal tiap tipe; jawab; benar/salah konsisten server↔klien; umpan balik dimainkan; selesai tanpa tetikus.

### Tests for User Story 3 ⚠️ (tulis dulu, pastikan GAGAL)

- [X] T070 [P] [US3] `packages/content-kit/src/grading/__tests__/grade-drag-drop-grouping.spec.ts` — cocok persis saja, `requireAllPlaced`, id asing → salah (kontrak §2) — sudah tercakup di `interactive-questions.spec.ts` (ditulis di Fase Foundational sebagai bagian ekstraksi grader tunggal)
- [X] T071 [P] [US3] `packages/content-kit/src/grading/__tests__/grade-number-line.spec.ts` — `tolerance: 0` persis, epsilon `1e-9`, non-finite → salah, validasi `targetValue` dalam rentang (kontrak §3) — idem, tercakup di `interactive-questions.spec.ts`
- [X] T072 [P] [US3] `packages/ui/src/components/question/__tests__/questions.spec.tsx` — `DragDropGroupingQuestion` select-then-place keyboard + `aria-live` + axe; `NumberLinePlacementQuestion` `role="slider"` keyboard + axe; `InteractiveFeedback` benar=animasi emerald / salah=lembut + reduced-motion statis + ikon+teks (bukan warna saja)
- [X] T073 [P] [US3] `apps/api/src/modules/session/__tests__/interactive-question-grading.test.ts` — `session-grader` menangani `DRAG_DROP_GROUPING` + `NUMBER_LINE`; pembuangan kunci jawaban menghapus `correctMapping`/`targetValue`/`tolerance` sebelum penyajian
- [X] T074 [P] [US3] `apps/web/lib/gamification/__tests__/interactive-question-parity.spec.ts` — `local-session-engine` menilai tipe baru identik dengan server untuk input yang sama

### Implementation for User Story 3

- [X] T075 [US3] Perluas `packages/content-kit/src/schema/question-payload.schema.ts` + `packages/content-kit/src/grading/grade-question.ts` dengan `DRAG_DROP_GROUPING` + `NUMBER_LINE` (kontrak §2/§3) dan varian opsi bergambar TK (T1–T5) — sudah diimplementasikan di Fase Foundational
- [X] T076 [P] [US3] `packages/ui/src/components/question/DragDropGroupingQuestion.tsx` (select-then-place, roving tabindex, `aria-live`)
- [X] T077 [P] [US3] `packages/ui/src/components/question/NumberLinePlacementQuestion.tsx` (`role="slider"`, panah/`Home`/`End`/`PageUp`/`PageDown`)
- [X] T078 [P] [US3] `packages/ui/src/components/question/InteractiveFeedback.tsx` (token `tertiary`/emerald, ikon+teks, reduced-motion statis) + memakai ulang kunci i18n `interactive.feedback.*` yang sudah ada; ekspor dari `packages/ui/src/index.ts`
- [X] T079 [US3] `apps/api/src/modules/session/session-mapper.ts` diperluas (`toClientQuestionDTO`) — DTO klien untuk `DRAG_DROP_GROUPING`/`NUMBER_LINE` bersifat whitelist per-field (items/groups/requireAllPlaced, min/max/step/markers) sehingga `correctMapping`/`targetValue`/`tolerance` terbuang secara struktural, bukan lewat blocklist; `session.dto.ts` diperluas selaras
- [X] T080 [US3] Render komponen soal baru di `apps/web/app/(student)/session/[id]/ActiveSessionClient.tsx` dan `apps/web/app/explore/[lessonId]/session/GuestSessionClient.tsx` (payload jawaban, reset antar-soal, status tombol kirim)
- [X] T081 [US3] Verifikasi per [quickstart.md](./quickstart.md) §3/§4 baris soal interaktif; suite `content-kit` (108), `ui` (39), `api` (136), `web` (23) hijau; `next build` static export sukses

**Checkpoint**: US1 + US2 + US3 berfungsi mandiri; tipe soal lama tidak regresi.

---

## Phase 6: User Story 4 - Akses & Kinerja Setara untuk Semua Anak (Priority: P3)

**Goal**: Pelajaran interaktif tetap dapat dipakai pada profil perangkat menengah ter-throttle dan lolos WCAG 2.1 AA otomatis; kegagalan media terdegradasi anggun.

**Independent Test**: [quickstart.md](./quickstart.md) §5.1–5.4 (a11y) + §6 (throttle) + §7 (injeksi kegagalan). Layar konsep pertama ≤3 dtk, seluruh pelajaran ≤10 dtk; nol pelanggaran axe; media gagal → cadangan, pelajaran tetap selesai.

### Tests for User Story 4 ⚠️ (tulis dulu, pastikan GAGAL)

- [X] T082 [P] [US4] `apps/web/__tests__/bundle-budget.spec.ts` — tambahan JS per pelajaran ≤ 60 KB gzip di luar chunk bersama (assert terhadap statistik build; definisi "di luar chunk bersama" = berkas yang TIDAK muncul di ≥90% manifest rute lain)
- [X] T083 [P] [US4] `packages/ui/src/components/lesson/__tests__/media-fault-injection.spec.tsx` — media/aset 404 & storage tak tersedia → `MediaFallback` tampil, pelajaran tetap dapat diselesaikan (SC-009)
- [X] T084 [P] [US4] `packages/ui/src/components/__tests__/reduced-motion-coverage.spec.tsx` — tiap komponen beranimasi (`ConceptAnimationBlock`, `AnimatedWorkedExample`, `StepRevealExplainer`, `InteractiveFeedback`) punya padanan tanpa animasi saat `prefers-reduced-motion`
- [X] T085 [P] [US4] Direlokasi ke `packages/ui/src/components/lesson/__tests__/a11y-scan.spec.tsx` (bukan `packages/content-kit/...`) — content-kit sengaja bebas React/jsdom (lih. `packages/content-kit/src/index.ts`) sehingga `LessonContentRenderer` tak bisa diimpor di sana tanpa membalik arah dependensi; iterasi 12 pelajaran seed via `LessonContentRenderer` → nol pelanggaran `vitest-axe` (SC-005)
- [X] T086 [P] [US4] `apps/web/__tests__/production-guard.spec.ts` — menjalankan `scripts/assert-production-guards.js` langsung (bukan build penuh) dengan `NEXT_PUBLIC_CONTENT_PREVIEW=true` → keluar non-zero (FR-030b); sisi API (`CONTENT_PREVIEW_INCLUDE_REVIEW`) diuji terpisah di `apps/api/src/common/env/__tests__/production-guard.spec.ts`

### Implementation for User Story 4

- [X] T087 [US4] Lazy-load widget via `React.lazy` (bukan `next/dynamic` — `packages/ui` sengaja tanpa dependensi Next.js; `React.lazy` di-code-split identik oleh webpack) + `SkeletonState` di `packages/ui/src/components/lesson/blocks/InteractiveWidgetBlock.tsx` (`<Suspense>`); dihapus juga 7 re-export widget langsung dari `packages/ui/src/index.ts` yang sebelumnya membatalkan code-splitting (modul yang reachable statis **dan** dinamis dibundel statis oleh webpack); blok konsep pertama (judul/teks/ilustrasi) tetap statis, tidak digerbang Suspense
- [X] T088 [US4] `getInteractiveLesson`/`getGuestLessonFallback` (`apps/web/lib/guest-lessons.ts`, yang mengimpor seluruh 12 pelajaran content-kit) diubah dari import statis menjadi `await import('@/lib/guest-lessons')` di dalam `fetchLesson`/`loadLesson` pada `LessonDetailClient.tsx` dan `GuestSessionClient.tsx` — hanya dipanggil sebagai fallback saat API publik gagal, sehingga jalur sukses tidak pernah memuat katalog lokal; ukuran chunk khusus rute turun (mis. `/explore/[lessonId]` 4.38→2.61 KB). Pemecahan per-lesson-id granular di level file `catalog.ts` tidak dilakukan (analisis biaya/manfaat: total 12 pelajaran ≈1546 baris, dampak marginal, risiko regresi pada `generateStaticParams` yang butuh akses sinkron)
- [X] T089 [US4] `MediaFallback` sudah terpasang pada `onError` di `IllustrationBlock.tsx` dan `VideoBlock.tsx` (dibangun di Fase 3); dikunci dengan uji T083. `ConceptAnimationBlock` tidak memuat aset via jaringan (SVG digambar via `renderFrame`), sehingga tidak berlaku
- [X] T090 [US4] Guard produksi ditambahkan: `apps/web/scripts/assert-production-guards.js` dipanggil dari `pnpm build` (`package.json`), menggagalkan build bila `NEXT_PUBLIC_CONTENT_PREVIEW=true`; `apps/api/src/common/env/production-guard.ts` (`assertProductionPreviewGuards`) dipanggil di awal `buildApp()` (`src/app.ts`), melempar error bila `CONTENT_PREVIEW_INCLUDE_REVIEW=true` saat `NODE_ENV=production`; didokumentasikan di `apps/web/README.md` dan `apps/api/README.md` (baru dibuat)
- [X] T091 [US4] Verifikasi otomatis dijalankan (lihat catatan pengukuran di bawah); walkthrough manual browser+throttle penuh dari quickstart.md §5–§7 tidak dijalankan dalam sesi ini (tidak ada alat automasi browser tersedia) — direkomendasikan sebagai langkah manual berikutnya

**Checkpoint**: Seluruh user story fungsional & memenuhi target terukur.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T092 [P] Dibuat `apps/web/README.md`, `apps/api/README.md` (saklar pratinjau + alur penerbitan) dan `packages/content-kit/README.md` (panduan authoring lesson/widget/grading/publish flow, FR-030a)
- [X] T093 [P] Terverifikasi: `pnpm test` root sudah menjalankan seluruh 4 paket ber-test (content-kit, api, ui, web = 371 test) tanpa perubahan konfigurasi tambahan — `pnpm --filter "*" test` sudah otomatis mencakup paket baru
- [X] T094 `pnpm lint` (tsc `--noEmit`) bersih untuk `content-kit`+`ui` (nol error); `apps/web`/`apps/api` tsc `--noEmit` manual juga bersih dari error baru (`next lint` di `apps/web` gagal karena belum ada konfigurasi ESLint — gap pra-eksisting di luar cakupan fitur ini, bukan regresi). `pnpm test` root hijau (371 test). `@vitest/coverage-v8` ditambahkan ke `apps/api` (sebelumnya belum ada). Cakupan: `content-kit` 98.72% (ambang 80% di `vitest.config.ts` lolos), modul `content-blocks` 94.43% stmt (ditambah `content-block.controller.test.ts` — 7 test HTTP end-to-end via `app.inject`), `packages/ui` cakupan **komponen interaktif** (interactive/lesson/question/a11y/hooks — `vitest.config.ts` disempitkan ke sana karena desain sistem pra-Fitur-010 seperti Button/Card/Modal belum diuji sama sekali, di luar cakupan fitur ini) 80.22% branch / 98%+ lainnya, dengan ~25 test baru menutup celah (`ImageHotspot`, `AnimatedWorkedExample`, `ParameterExplorer`, `StepRevealExplainer`, `SortIntoGroups`, `RichTextBlock`, `LessonContentRenderer`, kedua komponen soal baru)
- [~] T095 Tinjauan orisinalitas & provenance CP **sebagian** — 4 baris `CurriculumAchievement` di `packages/content-kit/src/curriculum/achievements.ts` **secara eksplisit menandai diri** `needsPrimaryVerification: true`: domain resmi `kurikulum.kemdikbud.go.id` tidak dapat diakses saat pengambilan (Fase Foundational), sehingga teks diambil dari mirror pihak ketiga (`kurikulummerdeka.com`, `karyaanugrah.sch.id`, `blog.kejarcita.id`), bukan domain resmi kementerian. Ini **belum memenuhi** R9/FR-008a sepenuhnya dan wajib diverifikasi manusia terhadap salinan resmi BSKAP sebelum pelajaran mana pun beralih ke `PUBLISHED`. Skema Zod CMS baru (`createCurriculumAchievementSchema`) sengaja menolak domain non-resmi untuk kutipan BARU ke depan. 12 pelajaran tidak diperiksa ulang untuk orisinalitas verbatim (di luar kapasitas sesi ini); `licenseNote`/`attribution` pada `MediaAsset` sudah ada sebagai kolom skema tapi tidak ada aset pihak ketiga yang di-seed (seluruh 28 SVG placeholder self-hosted orisinal per T042)
- [~] T096 Verifikasi **otomatis** dijalankan penuh (bukan walkthrough manual browser): seluruh 371 test lintas 4 paket hijau, `next build` static export sukses (termasuk anggaran bundel T082), gerbang produksi (T086/T090) teruji. Walkthrough manual [quickstart.md](./quickstart.md) end-to-end dengan browser sungguhan + throttle jaringan **tidak dijalankan** dalam sesi ini (tidak ada alat automasi browser tersedia) — bukti SC-004/SC-006 (waktu muat pada perangkat ter-throttle) dan SC-013 (uji "teks disembunyikan" TK secara visual) memerlukan langkah manual lanjutan

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: tanpa dependensi — mulai segera
- **Foundational (Phase 2)**: butuh Setup selesai — **MEMBLOKIR semua user story**
- **User Stories (Phase 3–6)**: semua butuh Foundational selesai
  - US1 (P1) → US2 (P2) → US3 (P3) → US4 (P3) secara prioritas, ATAU paralel bila tim memadai (lihat catatan independensi di bawah)
- **Polish (Phase 7)**: butuh seluruh user story yang diinginkan selesai

### User Story Dependencies

- **US1 (P1)**: mulai setelah Foundational. Mandiri. Menghasilkan `LessonContentRenderer`, registry widget, 12 pelajaran, jalur publik + tamu.
- **US2 (P2)**: mulai setelah Foundational. Secara teknis mandiri (endpoint CMS + gerbang), namun **menggunakan ulang** `LessonContentRenderer` (T035) untuk pratinjau — bila US1 belum jalan, T067 memakai stub renderer sementara.
- **US3 (P3)**: mulai setelah Foundational. Mandiri; memperluas grader bersama (T012) dan menambah komponen soal. Tidak mengubah tipe soal lama.
- **US4 (P3)**: paling bermakna setelah US1 (mengoptimalkan komponen US1). Test (T082–T086) dapat ditulis lebih awal; implementasi menyempurnakan komponen yang sudah ada.

### Within Each User Story

- Test ditulis dan **GAGAL** sebelum implementasi (Prinsip III)
- Skema → service/pure-function → controller/endpoint → integrasi UI
- content-kit (data + logika murni) sebelum konsumennya di `apps/*`

### Parallel Opportunities

- Setup: T002, T003, T004 paralel
- Foundational: T008, T009, T010 paralel; T014, T015 paralel (setelah skema); T011→T012→T013 berurutan (satu concern)
- US1 tests T016–T023 semua paralel
- US1 widgets T028–T032 paralel (setelah T027); pelajaran T038/T039/T040 paralel (setelah T037)
- US2 tests T050–T055 semua paralel; gerbang murni T059/T060 paralel
- US3 tests T070–T074 paralel; komponen T076/T077/T078 paralel
- US4 tests T082–T086 semua paralel
- Setelah Foundational, tim berbeda dapat menggarap US1/US2/US3 bersamaan

---

## Parallel Example: User Story 1

```bash
# Tulis semua test US1 bersamaan (harus GAGAL dulu):
Task: "T016 achievements-provenance.spec.ts"
Task: "T017 lesson-catalog-validity.spec.ts"
Task: "T018 tk-readability.spec.ts"
Task: "T019 seed-status.spec.ts"
Task: "T020 ListenButton.spec.tsx"
Task: "T021 blocks.spec.tsx + renderer.spec.tsx"
Task: "T022 public-content.test.ts (perluasan)"
Task: "T023 static-params.spec.ts"

# Implementasi widget bersamaan (setelah T027 registry):
Task: "T028 StepRevealExplainer + AnimatedWorkedExample"
Task: "T029 NumberLineExplorer + ParameterExplorer"
Task: "T030 FractionBarBuilder"
Task: "T031 ImageHotspot"
Task: "T032 SortIntoGroups"

# Susun pelajaran bersamaan (setelah T037 menetapkan pola TK):
Task: "T038 3 pelajaran SD"
Task: "T039 3 pelajaran SMP"
Task: "T040 3 pelajaran SMA"
```

## Parallel Example: User Story 2

```bash
# Semua test kontrak CMS bersamaan (harus GAGAL dulu):
Task: "T050 content-block.test.ts (CRUD + reorder)"
Task: "T051 media-asset.test.ts"
Task: "T052 gates.test.ts (A1-A8, C1-C3)"
Task: "T053 publish-authority.spec.ts"
Task: "T054 curriculum-achievement.test.ts"
Task: "T055 widget-catalog.test.ts"

# Fungsi gerbang murni bersamaan:
Task: "T059 accessibility-gate.ts (A1-A8)"
Task: "T060 curriculum-gate.ts (C1-C3)"
```

---

## Implementation Strategy

### MVP First (User Story 1 saja)

1. Selesaikan Phase 1: Setup
2. Selesaikan Phase 2: Foundational (KRITIS — memblokir semua)
3. Selesaikan Phase 3: US1
4. **BERHENTI & VALIDASI**: [quickstart.md](./quickstart.md) §3 + §5.5 + §9
5. Demo mode tamu (tanpa backend) bila siap

> **Pemangkasan MVP bila perlu**: US1 dapat dipersempit ke **satu jenjang** (mis. hanya SD, T038) untuk demo lebih cepat; T037/T039/T040 menyusul. Renderer, registry, 7 widget, dan jalur publik tetap wajib.

### Incremental Delivery

1. Setup + Foundational → fondasi siap
2. US1 → uji mandiri → demo (MVP!)
3. US2 → uji mandiri → alur CMS + penerbitan
4. US3 → uji mandiri → tipe soal interaktif
5. US4 → uji mandiri → target kinerja & a11y terpenuhi
6. Polish → cakupan, dokumentasi, tinjauan orisinalitas

### Parallel Team Strategy

Setelah Foundational selesai:

- Developer A: US1 (frontend konten + content-kit)
- Developer B: US2 (backend CMS + gerbang)
- Developer C: US3 (tipe soal + grader) lalu bantu US4

---

## Notes

- `[P]` = berkas berbeda, tanpa dependensi belum selesai
- Label `[US#]` memetakan tugas ke user story untuk keterlacakan
- Verifikasi test **GAGAL** sebelum implementasi (Prinsip III, NON-NEGOTIABLE)
- Commit per tugas atau kelompok logis
- Berhenti di checkpoint mana pun untuk memvalidasi story secara mandiri
- Hindari: tugas kabur, konflik berkas sama, dependensi lintas-story yang merusak independensi
- **Jangan pernah** menulis `status = PUBLISHED` dari seed/migrasi/skrip (FR-030a) — hanya `publish.service.ts` (T062)
- Teks Capaian Pembelajaran (T024) **wajib kutipan resmi** dengan `sourceUrl` + `retrievedAt`; kolom kosong lebih baik daripada karangan
