# Phase 1 Data Model: Fokus Jenjang SD — Revamp Matematika Interaktif

**Feature**: `011-sd-math-focus` | **Date**: 2026-09-02

Seluruh perubahan skema bersifat **aditif dan nullable**. Tidak ada kolom dihapus, tidak ada nilai enum dihapus, tidak ada backfill wajib — sehingga data TK/SMP/SMA dan progres pengguna yang ada tetap utuh sesuai FR-004.

---

## 1. Perubahan pada entitas yang sudah ada

### `Lesson` (Prisma) — 1 kolom baru

| Field | Type | Null | Aturan |
|-------|------|------|--------|
| `gradeLevel` | `Int?` `@map("grade_level")` | ya | Bila `educationStage = SD` maka WAJIB terisi 1–6. Wajib konsisten dengan `phase`: `1,2 → FASE_A`; `3,4 → FASE_B`; `5,6 → FASE_C`. |

Indeks baru: `@@index([educationStage, gradeLevel, status])` — melayani kueri katalog per kelas.

**Kenapa nullable**: pelajaran TK/SMP/SMA tidak punya sumbu kelas SD. Nullable menghindari migrasi merusak. Konsistensi ditegakkan di lapisan validasi dan uji invarian, bukan lewat constraint yang akan menolak baris jenjang lain.

### `InteractiveLesson` (tipe authoring content-kit) — 3 field baru

| Field | Type | Wajib | Aturan |
|-------|------|-------|--------|
| `gradeLevel` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | ya untuk SD | Sumber kebenaran untuk pengelompokan katalog. |
| `archetype` | `LessonArchetypeId` | ya | Pabrik yang menghasilkan pelajaran ini; dipakai uji untuk memvalidasi per-arketipe. |
| `videoEmbed` | `VideoEmbedRef?` | ya untuk SD (FR-013) | Rujukan ke registri sematan, bukan URL mentah. |

### `CurriculumAchievement` — tanpa perubahan bentuk, +14 baris data

Bertambah dari 1 baris SD menjadi 15: Fase A, B, C × elemen {Bilangan, Aljabar, Pengukuran, Geometri, Analisis Data dan Peluang}. `@@unique([phase, subjectCode, element])` yang ada sudah menampung ini tanpa perubahan.

---

## 2. Entitas baru

### `VideoEmbed` (Prisma) + `VideoEmbedRef` (content-kit)

Registri sematan pihak ketiga. Ada karena Konstitusi VI butir 5 menuntut setiap sematan tercatat dan tertinjau sebelum `published`, dan karena FR-016d menuntut ketertelusuran video mati.

| Field | Type | Null | Aturan |
|-------|------|------|--------|
| `id` | `String @id` | tidak | Id stabil, mis. `yt-sd4-pecahan-01`. |
| `provider` | `VideoProvider` | tidak | Enum baru; v1 hanya `YOUTUBE`. Penyedia lain butuh amandemen konstitusi tersendiri. |
| `externalId` | `String` | tidak | Id video penyedia. Bukan URL penuh — URL disusun komponen agar varian nocookie tidak dapat dilewati. |
| `title` | `String` | tidak | Judul sebagaimana diterbitkan. |
| `publisherName` | `String` | tidak | Atribusi wajib tampil di UI. |
| `durationSeconds` | `Int?` | ya | Untuk label pratinjau. |
| `posterStorageKey` | `String` | tidak | Pratinjau **self-hosted**. Konstitusi VI butir 2 melarang pratinjau dari domain penyedia. |
| `transcriptText` | `String` | tidak | Padanan teks Bahasa Indonesia (FR-014). |
| `verifiedAt` | `DateTime` | tidak | Kapan tautan terakhir terbukti hidup (skrip CI, FR-016d). |
| `reviewedBy` | `String?` | ya | Peninjau manusia yang menyatakan isinya layak anak SD. Wajib terisi sebelum pelajaran `PUBLISHED`. |
| `reviewNote` | `String?` | ya | Catatan kelayakan. |

Relasi: `LessonContentBlock.videoEmbedId String?` → `VideoEmbed`. Blok `VIDEO` memakai **salah satu** dari `mediaAssetId` (berkas self-hosted) **atau** `videoEmbedId` (sematan), tidak keduanya.

**Transisi status yang diatur**: sebuah `Lesson` tidak boleh berpindah `REVIEW → PUBLISHED` bila punya blok bersematan yang `reviewedBy` masih null atau `verifiedAt` lebih lama dari ambang kesegaran. Ini adalah `Embedded Media Gate` yang ditambahkan Konstitusi v1.2.0.

### `FocusConfig` (konfigurasi, bukan tabel)

Bukan entitas basis data — nilai konfigurasi tervalidasi Zod yang hidup di `packages/content-kit/src/focus/focus-config.ts` dan dibaca kedua aplikasi.

| Field | Type | Default | Aturan |
|-------|------|---------|--------|
| `enabled` | `boolean` | `true` | Dari env build. Mematikannya mengembalikan seluruh permukaan (FR-004). |
| `stages` | `EducationStage[]` | `['SD']` | Tidak boleh kosong saat `enabled`. |
| `subjectCodes` | `string[]` | `['MATH_SD']` | Tidak boleh kosong saat `enabled`. |
| `redirectTarget` | `string` | `/explore` | Tujuan pengalihan ramah (FR-005). |

**Kenapa bukan tabel**: `apps/web` adalah static export dan tidak dapat membaca basis data saat build. Konfigurasi build-time adalah satu-satunya bentuk yang dapat dipatuhi kedua aplikasi tanpa memaksa jalur tamu memanggil jaringan.

### `LessonArchetypeSpec` (tipe authoring, bukan tabel)

Masukan berbentuk data untuk pabrik pelajaran (R5). Satu varian per arketipe; seluruhnya berbagi bidang inti:

| Field | Type | Aturan |
|-------|------|--------|
| `id` | `string` | Id pelajaran stabil, mis. `sd-mtk-k4-05`. |
| `gradeLevel` | `1..6` | Menentukan penempatan katalog. |
| `curriculumAchievementId` | `string` | WAJIB merujuk baris yang ada; uji menegakkan referensi hidup. |
| `unitTitle`, `title`, `summary`, `learningObjective` | `string` | Teks Bahasa Indonesia. |
| `orderIndex` | `int` | Urutan dalam kelas (FR-010); unik per kelas. |
| `videoEmbedId` | `string` | Rujukan ke registri. |
| `params` | varian per arketipe | Angka, rentang, konteks cerita, jumlah soal. |

---

## 3. Aturan validasi (Zod, di batas sistem)

- `gradeLevel`: `z.number().int().min(1).max(6)`; wajib bila `educationStage === 'SD'`.
- Konsistensi kelas↔fase: ditolak bila `gradeLevel` dan `phase` tidak sepadan.
- `VideoEmbedRef.provider`: `z.literal('YOUTUBE')` di v1 — penyedia baru sengaja gagal validasi sampai konstitusi diamandemen lagi.
- `VideoEmbedRef.externalId`: `z.string().regex(/^[A-Za-z0-9_-]{11}$/)` — id YouTube, bukan URL, agar varian nocookie tidak dapat dilewati pemanggil.
- `posterStorageKey`: wajib diawali `assets/lessons/sd/` — menegakkan pratinjau self-hosted.
- Payload blok `VIDEO`: tepat satu dari `mediaStorageKey` atau `videoEmbedId`.
- `FocusConfig`: `stages` dan `subjectCodes` tidak boleh array kosong saat `enabled`.

## 4. Invarian katalog (ditegakkan uji, bukan tipe)

Uji ini ditulis **sebelum** konten dibuat (Konstitusi III) sehingga 60 pelajaran divalidasi mesin:

1. Setiap `gradeLevel` 1–6 memiliki ≥10 pelajaran `LISTED` (FR-008).
2. Setiap pelajaran SD memiliki ≥10 butir soal (FR-021) dan ≥1 soal interaktif (FR-023).
3. Setiap pelajaran SD memiliki ≥1 blok `ILLUSTRATION`, ≥1 `ANIMATION`, ≥1 `INTERACTIVE_WIDGET`, ≥1 `VIDEO` (FR-013).
4. Setiap `curriculumAchievementId` merujuk baris yang ada; setiap kelas mencakup seluruh 5 elemen kurikulumnya (FR-011).
5. `orderIndex` unik dan rapat dalam tiap kelas (FR-010).
6. Tidak ada judul duplikat persis dalam satu kelas (edge case spec).
7. Tidak ada pelajaran seed berstatus `PUBLISHED` (FR-033 — guard yang sudah ada, diperluas).
8. Setiap blok `VIDEO` bersematan merujuk baris registri yang ada dan pratinjau self-hosted.
9. Kelas 1–2: setiap soal dan opsinya lolos ambang keterbacaan dan punya padanan gambar/ikon (FR-024 — memperluas pola `tk-readability.spec.ts`).

## 5. Relasi

```
Subject (MATH_SD)
  └── Unit (pengelompok topik)
        └── Lesson  ── gradeLevel 1..6  ── curriculumAchievementId ─→ CurriculumAchievement
              ├── LessonContentBlock (RICH_TEXT | ILLUSTRATION | ANIMATION | VIDEO | INTERACTIVE_WIDGET)
              │      ├── mediaAssetId ─→ MediaAsset        (self-hosted)
              │      └── videoEmbedId ─→ VideoEmbed        (sematan pihak ketiga, BARU)
              └── QuestionItem ── QuestionHint
```
