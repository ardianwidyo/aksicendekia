# Phase 1 Data Model: Materi Belajar Interaktif

**Feature**: `010-interactive-lesson-content` | **Date**: 2026-09-01 | **Plan**: [plan.md](./plan.md)

Seluruh perubahan bersifat **additive** terhadap `apps/api/prisma/schema.prisma`. Tidak ada kolom yang dihapus atau diubah tipenya, sehingga pelajaran non-interaktif yang sudah ada tetap tampil apa adanya (FR-031).

---

## 1. Enum baru

### `ContentBlockType`

```prisma
enum ContentBlockType {
  RICH_TEXT
  ILLUSTRATION
  ANIMATION
  VIDEO
  INTERACTIVE_WIDGET
}
```

### `MediaAssetKind`

```prisma
enum MediaAssetKind {
  IMAGE
  ANIMATION
  VIDEO
  AUDIO        // slot narasi terekam — disediakan, tidak diisi di v1 (FR-017d)
  CAPTION
  TRANSCRIPT
}
```

### `WidgetSupportStatus`

```prisma
enum WidgetSupportStatus {
  SUPPORTED
  DEPRECATED
  REMOVED
}
```

### `LessonListing`

```prisma
enum LessonListing {
  LISTED          // tampil di katalog eksplorasi
  HIDDEN_LEGACY   // rute tetap hidup, disembunyikan dari katalog (FR-031a)
}
```

---

## 2. Perluasan enum yang sudah ada

### `QuestionType` — tambah dua nilai

```prisma
enum QuestionType {
  MULTIPLE_CHOICE
  SHORT_ANSWER
  MATCHING_PAIRS
  DRAG_DROP_GROUPING   // BARU
  NUMBER_LINE          // BARU
}
```

Penambahan nilai enum di PostgreSQL bersifat additive dan tidak merusak baris yang ada. Kolom `QuestionItem.contentPayload` sudah bertipe `Json`, sehingga payload tipe baru tidak memerlukan perubahan bentuk kolom — lihat [contracts/interactive-questions.contract.md](./contracts/interactive-questions.contract.md).

---

## 3. Entitas baru

### 3.1 `MediaAsset`

Berkas milik platform. Menegakkan Prinsip VI (self-hosted, anti-hotlink) dan FR-003/FR-005.

```prisma
model MediaAsset {
  id              String         @id @default(uuid())
  kind            MediaAssetKind
  storageKey      String         @unique @map("storage_key")   // path relatif di storage sendiri
  mimeType        String         @map("mime_type")
  byteSize        Int            @map("byte_size")
  widthPx         Int?           @map("width_px")
  heightPx        Int?           @map("height_px")
  durationSeconds Int?           @map("duration_seconds")
  altText         String?        @map("alt_text")
  licenseNote     String?        @map("license_note")           // FR-029 / SC-012
  attribution     String?
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  blocksAsMedia      LessonContentBlock[] @relation("BlockMedia")
  blocksAsCaption    LessonContentBlock[] @relation("BlockCaption")
  blocksAsFallback   LessonContentBlock[] @relation("BlockFallback")
  blocksAsNarration  LessonContentBlock[] @relation("BlockNarration")

  @@index([kind])
  @@map("media_assets")
}
```

**Aturan validasi** (ditegakkan di `media-asset.service.ts`, divalidasi Zod di batas sistem):

| Aturan | Nilai |
|---|---|
| `storageKey` MUST relatif (tidak boleh diawali `http://`, `https://`, atau `//`) | Menolak hotlink pihak ketiga — FR-003 |
| `mimeType` untuk `IMAGE` | `image/svg+xml`, `image/png`, `image/webp`, `image/jpeg` |
| `mimeType` untuk `VIDEO` | `video/mp4`, `video/webm` |
| `mimeType` untuk `AUDIO` | `audio/mpeg`, `audio/ogg`, `audio/wav` |
| `mimeType` untuk `CAPTION` | `text/vtt` |
| `byteSize` maksimum — gambar | 512 KB |
| `byteSize` maksimum — audio | 2 MB |
| `byteSize` maksimum — video | 20 MB |
| `altText` wajib bila `kind = IMAGE` | FR-004 |
| `durationSeconds` maksimum untuk `VIDEO` | 180 detik (asumsi spec: video pendek) |

---

### 3.2 `LessonContentBlock`

Unit terurut penyusun badan pelajaran (FR-001).

```prisma
model LessonContentBlock {
  id                String           @id @default(uuid())
  lessonId          String           @map("lesson_id")
  orderIndex        Int              @map("order_index")
  blockType         ContentBlockType @map("block_type")
  payload           Json                                        // bentuk bergantung blockType
  altText           String?          @map("alt_text")
  transcriptText    String?          @map("transcript_text")
  mediaAssetId      String?          @map("media_asset_id")
  captionAssetId    String?          @map("caption_asset_id")
  fallbackAssetId   String?          @map("fallback_asset_id")  // FR-015
  narrationText     String?          @map("narration_text")     // teks yang dibacakan (FR-017b)
  narrationAssetId  String?          @map("narration_asset_id") // slot audio terekam (FR-017d)
  status            ContentStatus    @default(DRAFT)
  createdAt         DateTime         @default(now()) @map("created_at")
  updatedAt         DateTime         @updatedAt @map("updated_at")

  lesson         Lesson      @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  mediaAsset     MediaAsset? @relation("BlockMedia", fields: [mediaAssetId], references: [id], onDelete: SetNull)
  captionAsset   MediaAsset? @relation("BlockCaption", fields: [captionAssetId], references: [id], onDelete: SetNull)
  fallbackAsset  MediaAsset? @relation("BlockFallback", fields: [fallbackAssetId], references: [id], onDelete: SetNull)
  narrationAsset MediaAsset? @relation("BlockNarration", fields: [narrationAssetId], references: [id], onDelete: SetNull)

  @@unique([lessonId, orderIndex])
  @@index([lessonId, status])
  @@map("lesson_content_blocks")
}
```

Field dan relasi yang ditambahkan pada model `Lesson` yang sudah ada — seluruhnya nullable atau berdefault, sehingga tidak merusak baris lama:

```prisma
model Lesson {
  // ... field yang sudah ada tidak berubah

  listing                  LessonListing @default(LISTED)                  // FR-031a
  supersededByLessonId     String?       @map("superseded_by_lesson_id")   // padanan interaktif
  curriculumAchievementId  String?       @map("curriculum_achievement_id") // FR-008a

  contentBlocks         LessonContentBlock[]
  supersededBy          Lesson?                @relation("LessonSupersede", fields: [supersededByLessonId], references: [id], onDelete: SetNull)
  supersedes            Lesson[]               @relation("LessonSupersede")
  curriculumAchievement CurriculumAchievement? @relation(fields: [curriculumAchievementId], references: [id], onDelete: Restrict)
}
```

**Bentuk `payload` per `blockType`** (skema Zod di `packages/content-kit/src/schema/content-block.schema.ts`):

| `blockType` | Bentuk `payload` | Field pendamping yang wajib |
|---|---|---|
| `RICH_TEXT` | `{ markdown: string }` — subset aman: heading, paragraf, tebal/miring, daftar, kode inline. Tanpa HTML mentah. | — |
| `ILLUSTRATION` | `{ caption?: string }` | `mediaAssetId`, `altText` |
| `ANIMATION` | `{ animationId: string, steps: AnimationStep[], loop: boolean }` | `transcriptText` |
| `VIDEO` | `{ title: string }` | `mediaAssetId`, `captionAssetId`, `transcriptText`, `fallbackAssetId` |
| `INTERACTIVE_WIDGET` | `{ widgetType: string, params: object }` — `params` divalidasi oleh skema tipe widget terkait | — |

`AnimationStep` = `{ atMs: number, caption: string, frame: string }` — `frame` merujuk nama keadaan yang dikenali komponen animasi, bukan markup bebas.

---

### 3.3 `InteractiveWidgetType`

Cermin metadata katalog agar CMS dan reviewer dapat menampilkan/memfilter tipe widget dan menandai yang usang (FR-009). **Bukan** sumber kebenaran untuk perilaku — perilaku dan skema parameter tetap di kode (`packages/content-kit` + `packages/ui`).

```prisma
model InteractiveWidgetType {
  id             String              @id                         // mis. "NUMBER_LINE_EXPLORER"
  displayName    String              @map("display_name")
  description    String
  paramsSchema   Json                @map("params_schema")       // JSON Schema hasil derivasi dari Zod
  supportStatus  WidgetSupportStatus @default(SUPPORTED) @map("support_status")
  catalogVersion Int                 @default(1) @map("catalog_version")
  a11yNotes      String?             @map("a11y_notes")
  createdAt      DateTime            @default(now()) @map("created_at")
  updatedAt      DateTime            @updatedAt @map("updated_at")

  @@map("interactive_widget_types")
}
```

Di-seed dari `packages/content-kit/src/catalog/widget-catalog.ts` pada setiap `prisma db seed`, sehingga tabel tidak pernah menyimpang dari kode.

---

### 3.4 `CurriculumAchievement`

Kutipan capaian pembelajaran resmi beserta rujukan sumbernya (FR-008, FR-008a). Dipisahkan dari `Lesson` karena satu CP berlaku untuk beberapa pelajaran sefase — tiga pelajaran SD berbagi CP Fase B yang sama.

```prisma
model CurriculumAchievement {
  id              String          @id @default(uuid())
  educationStage  EducationStage  @map("education_stage")
  phase           CurriculumPhase
  subjectCode     String          @map("subject_code")
  element         String                                        // mis. "Bilangan", "Aljabar"
  achievementText String          @map("achievement_text")       // KUTIPAN dokumen resmi, bukan parafrase
  sourceDocument  String          @map("source_document")        // mis. "Kepmendikbudristek No. ... Lampiran ..."
  sourceUrl       String          @map("source_url")
  retrievedAt     DateTime        @map("retrieved_at")
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  lessons Lesson[]

  @@unique([phase, subjectCode, element])
  @@index([educationStage, phase])
  @@map("curriculum_achievements")
}
```

**Aturan validasi**

| Aturan | Nilai |
|---|---|
| `achievementText` MUST tidak kosong dan MUST berupa kutipan verbatim | Bukan rumusan bebas — R9 |
| `sourceUrl` MUST berupa URL domain resmi pemerintah/kementerian | Dapat ditelusuri kembali |
| `retrievedAt` MUST terisi | Memungkinkan audit ulang saat kurikulum direvisi |
| `onDelete: Restrict` pada relasi `Lesson` | Mencegah CP terhapus selagi masih dirujuk pelajaran |

**Cakupan v1**: 4 baris — satu per fase yang dipakai (`FOUNDATION`, `FASE_B`, `FASE_D`, `FASE_E`) untuk elemen yang relevan.

---

## 4. Katalog widget v1

| `id` | Nama | Parameter inti | Pola keyboard |
|---|---|---|---|
| `STEP_REVEAL` | Pengungkapan Bertahap | `steps[]{ title, body, illustration? }` | `Enter`/`Space` untuk langkah berikutnya; `Backspace` mundur |
| `PARAMETER_EXPLORER` | Penjelajah Parameter | `expression`, `variables[]{ key, min, max, step, initial }` | `<input type="range">` native |
| `NUMBER_LINE_EXPLORER` | Penjelajah Garis Bilangan | `min`, `max`, `step`, `markers[]`, `initial` | `role="slider"` + panah/`Home`/`End` |
| `FRACTION_BAR_BUILDER` | Perakit Batang Pecahan | `denominator`, `maxParts`, `targetFraction?` | Panah untuk memilih bagian, `Enter` mengaktifkan |
| `IMAGE_HOTSPOT` | Titik-Sentuh Gambar | `mediaAssetId`, `hotspots[]{ x, y, label, body }` | Tiap hotspot adalah `<button>` dalam urutan `Tab` |
| `SORT_INTO_GROUPS` | Kelompokkan Objek | `items[]{ id, label }`, `groups[]{ id, label }` | Select-then-place (lihat R5) |
| `ANIMATED_WORKED_EXAMPLE` | Contoh Pengerjaan Beranimasi | `steps[]{ atMs, caption, frame }`, `loop` | Play/pause/ulang sebagai `<button>` |

Kontrak lengkap: [contracts/widget-catalog.contract.md](./contracts/widget-catalog.contract.md).

---

## 5. Transisi status & gerbang aksesibilitas

Blok konten mewarisi `ContentStatus` dan versioning immutable milik `Lesson` (Feature 003). Blok tidak diberi garis versi sendiri; menyunting pelajaran `PUBLISHED` menyalin seluruh bloknya ke versi `Lesson` baru.

```text
DRAFT ──(gerbang a11y + gerbang kurikulum)──▶ REVIEW ──(persetujuan MANUSIA)──▶ PUBLISHED ──(versi baru terbit)──▶ ARCHIVED
                                                 ▲
                                    konten produksi fitur ini berhenti di sini
```

**Batas kewenangan (FR-030a)**: seed dan skrip otomatis apa pun MUST TIDAK dapat menghasilkan status `PUBLISHED`. Transisi `REVIEW → PUBLISHED` hanya tersedia melalui aksi Admin di CMS. Ini ditegakkan dua lapis: skrip seed hanya menulis `REVIEW`, dan uji memverifikasi bahwa seluruh 12 pelajaran hasil seed berstatus `REVIEW`.

**Gerbang aksesibilitas** (`accessibility-gate.ts`) memblokir `DRAFT → REVIEW` dan mengembalikan daftar item yang kurang bila salah satu terlanggar — FR-004, FR-030:

| # | Aturan |
|---|---|
| A1 | Setiap blok `ILLUSTRATION` memiliki `altText` tidak kosong |
| A2 | Setiap blok `VIDEO` memiliki `captionAssetId` **dan** `transcriptText` tidak kosong |
| A3 | Setiap blok `ANIMATION` memiliki `transcriptText` tidak kosong |
| A4 | Setiap blok `VIDEO` dan `ANIMATION` memiliki `fallbackAssetId` (ilustrasi statis) — FR-015 |
| A5 | Setiap blok `INTERACTIVE_WIDGET` memakai `widgetType` yang ada di katalog dengan `supportStatus = SUPPORTED` |
| A6 | `params` setiap blok `INTERACTIVE_WIDGET` lolos validasi skema tipe widgetnya |
| A7 | **Khusus `educationStage = TK`**: setiap butir soal memiliki pilihan jawaban bergambar (setiap `options[].illustrationAssetId` terisi), sehingga soal dapat dijawab tanpa membaca — FR-017a |
| A8 | **Khusus `educationStage = TK`**: setiap blok konten dan setiap butir soal memiliki `narrationText` tidak kosong sebagai bahan kontrol "dengarkan" — FR-017b |

**Gerbang kurikulum** (aturan Feature 003 yang tetap berlaku, diperluas) — FR-008, FR-008a:

| # | Aturan |
|---|---|
| C1 | `Lesson` memiliki `educationStage`, `phase`, `learningObjective` terisi, dan berada di bawah `Subject` yang valid |
| C2 | Pelajaran memiliki ≥1 blok konsep (`ILLUSTRATION` atau `ANIMATION`) **dan** ≥1 blok `INTERACTIVE_WIDGET` sebelum latihan — FR-010 |
| C3 | `curriculumAchievementId` terisi, dan `CurriculumAchievement` yang dirujuk memiliki `achievementText`, `sourceDocument`, `sourceUrl`, dan `retrievedAt` lengkap — FR-008a |

Kegagalan gerbang mengembalikan `422` dengan daftar pelanggaran terstruktur, bukan pesan tunggal — lihat [contracts/content-blocks.contract.md](./contracts/content-blocks.contract.md).

---

## 6. Entitas sisi klien (tanpa persistensi baru)

Interaksi widget bersifat **efemeral** — hanya berada di state React selama pelajaran berlangsung dan tidak pernah dikirim ke server maupun disimpan (Prinsip VII, FR-025/FR-026). Yang tercatat hanyalah hasil jawaban butir soal, persis seperti tipe soal lama:

- Sesi terautentikasi → `SessionAnswer` (Feature 004), tanpa kolom baru.
- Mode Tamu → `GuestSessionAnswerRecord` di IndexedDB/LocalStorage (Feature 009), tanpa perubahan skema; `answerPayload` yang sudah bertipe bebas cukup menampung bentuk jawaban tipe soal baru.

---

## 7. Strategi migrasi

1. **Migrasi additive** membuat empat tabel baru (`lesson_content_blocks`, `media_assets`, `interactive_widget_types`, `curriculum_achievements`), empat enum baru (`ContentBlockType`, `MediaAssetKind`, `WidgetSupportStatus`, `LessonListing`), dua nilai tambahan pada `QuestionType`, serta tiga kolom nullable/berdefault pada `lessons` (`listing`, `superseded_by_lesson_id`, `curriculum_achievement_id`). Nol perubahan destruktif.
2. **Seed capaian pembelajaran** — 4 baris `CurriculumAchievement` hasil pengambilan dokumen resmi (R9). Langkah ini **mendahului** seed pelajaran, karena gerbang C3 merujuknya.
3. **Seed katalog widget** dari `content-kit` (idempoten, `upsert` per `id`).
4. **Seed 12 pelajaran interaktif** (`seed-interactive-content.ts`) — idempoten berdasarkan kode pelajaran yang stabil. Seluruhnya ditulis dengan `status = REVIEW`; skrip ini **tidak boleh** menulis `PUBLISHED` (FR-030a).
5. **Backfill terbatas**: tiga pelajaran contoh lama ditandai `listing = HIDDEN_LEGACY` dan diberi `supersededByLessonId` ke padanan interaktifnya (FR-031a). Selain itu tidak ada backfill — pelajaran lama lain tetap tanpa blok konten dan dirender jalur lama. Kehadiran `contentBlocks` yang tidak kosong adalah penanda "pelajaran interaktif".

---

## 8. Ringkasan pemetaan entitas spec → model

| Entitas di spec | Realisasi |
|---|---|
| Interactive Lesson | `Lesson` yang sudah ada + relasi `contentBlocks` tidak kosong |
| Content Block | `LessonContentBlock` |
| Media Asset | `MediaAsset` |
| Interactive Widget Type | `InteractiveWidgetType` (cermin) + `packages/content-kit/src/catalog/widget-catalog.ts` (sumber kebenaran) |
| Interactive Widget Instance | Baris `LessonContentBlock` dengan `blockType = INTERACTIVE_WIDGET` dan `payload = { widgetType, params }` |
| Interactive Question | `QuestionItem` dengan `questionType ∈ { DRAG_DROP_GROUPING, NUMBER_LINE }` |
| Curriculum Reference | `CurriculumAchievement` + kolom `Lesson.curriculumAchievementId` |
| Accessibility Metadata | Kolom `altText`, `transcriptText`, `captionAssetId`, `fallbackAssetId`, `narrationText`, `narrationAssetId` + aturan gerbang A1–A8 |

---

## 9. Catatan payload soal jenjang TK

Tipe soal TK **tidak** memerlukan enum baru — yang berubah hanya isi `contentPayload` (kolom `Json`, jadi tanpa migrasi):

```jsonc
{
  "options": [
    { "id": "opt_a", "text": "Tiga",  "illustrationAssetId": "uuid-3-apel" },
    { "id": "opt_b", "text": "Lima",  "illustrationAssetId": "uuid-5-apel" }
  ],
  "correctOptionId": "opt_a",
  "narrationText": "Ada berapa apel di keranjang?",
  "narrationAssetId": null
}
```

- `illustrationAssetId` wajib pada setiap opsi untuk pelajaran TK (gerbang A7); `text` tetap ada sebagai pelengkap dan bahan pembacaan, bukan pembawa makna tunggal.
- `narrationAssetId` adalah slot audio terekam yang kosong di v1; ketika terisi, komponen memutarnya alih-alih memanggil sintesis suara peramban (FR-017d).
- Untuk jenjang SD/SMP/SMA, `illustrationAssetId` bersifat opsional dan gerbang A7/A8 tidak berlaku.
