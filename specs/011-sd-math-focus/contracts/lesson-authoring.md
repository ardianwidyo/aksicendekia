# Contract: Lesson Authoring via Archetypes

**Modules**: `packages/content-kit/src/lessons/archetypes/*`, `packages/content-kit/src/lessons/sd/kelas-{1..6}.ts`
**Requirements**: FR-008 … FR-013, FR-020 … FR-025, FR-031, FR-036, FR-037

Kontrak antara **berkas kelas** (data) dan **pabrik arketipe** (kode). Ini adalah pengendali biaya utama fitur: menambah pelajaran ke-61 berarti menambah satu objek spec, bukan satu berkas.

## Factory signature

Setiap arketipe mengekspor satu fungsi murni:

```ts
export function makeXxxLesson(spec: XxxLessonSpec): InteractiveLesson;
```

MUST murni dan deterministik — masukan sama menghasilkan pelajaran identik. Dilarang `Math.random`, `Date.now`, atau I/O. Determinisme itulah yang membuat 600 butir soal dapat diuji.

## Shared spec fields

| Field | Type | Aturan |
|-------|------|--------|
| `id` | `string` | Pola `sd-mtk-k{grade}-{nn}`. Unik global. |
| `gradeLevel` | `1..6` | Menentukan berkas kelas dan penempatan katalog. |
| `curriculumAchievementId` | `string` | WAJIB merujuk baris yang ada di `CURRICULUM_ACHIEVEMENTS`. |
| `unitTitle`, `title`, `summary`, `learningObjective` | `string` | Bahasa Indonesia, lewat i18n di sisi render. |
| `orderIndex` | `int` | Unik dan rapat dalam satu kelas (FR-010). |
| `videoEmbedId` | `string` | Merujuk `video-registry.ts`. |
| `difficultyLevel` | `BEGINNER \| INTERMEDIATE \| ADVANCED` | |
| `estimatedDurationMinutes` | `int` | |
| `params` | varian per arketipe | Angka, rentang, konteks cerita, jumlah soal. |

## Factory output guarantees

Setiap pelajaran yang dikembalikan MUST memenuhi seluruh butir berikut — dijamin pabrik, diverifikasi uji, sehingga penulis kelas tidak dapat lupa:

| # | Jaminan | FR |
|---|---------|-----|
| O1 | `status: 'REVIEW'`, tidak pernah `PUBLISHED` | FR-033 |
| O2 | ≥1 blok `ILLUSTRATION`, ≥1 `ANIMATION`, ≥1 `INTERACTIVE_WIDGET`, ≥1 `VIDEO` | FR-013 |
| O3 | ≥10 butir soal | FR-021 |
| O4 | ≥1 soal `DRAG_DROP_GROUPING` atau `NUMBER_LINE` | FR-023 |
| O5 | Setiap soal punya `explanation` dan ≥1 petunjuk bertahap | FR-022 |
| O6 | Setiap blok visual punya `altText`; blok video punya transkrip | FR-014 |
| O7 | Setiap blok media punya `fallbackStorageKey` | FR-015 |
| O8 | Kelas 1–2: setiap soal dan opsinya punya pendamping gambar/ikon dan `narrationText` | FR-024 |
| O9 | Widget yang dirujuk ada di `WIDGET_CATALOG` dengan `supportStatus: SUPPORTED` | FR-036 |
| O10 | Setiap blok dan soal dapat diselesaikan pada 320px potret; pabrik tidak boleh menghasilkan konten yang mensyaratkan lanskap | FR-042 |
| O11 | Setiap soal pemindahan objek dapat diselesaikan hanya dengan ketukan (pilih objek → pilih tujuan) | FR-043 |
| O12 | Jumlah objek dan zona tujuan yang dihasilkan tetap dalam batas yang memungkinkan target 44x44px tanpa berdempetan pada 320px | FR-044 |

O12 adalah pembatas yang mudah terlewat: sebuah soal pengelompokan dengan 8 objek dan 4 grup mungkin nyaman di desktop tetapi mustahil disentuh di 320px. Batas dihitung dari lebar terkecil, bukan dari tampilan pengembang, dan ditegakkan di pabrik sehingga penulis spec kelas tidak dapat melanggarnya tanpa sengaja.

## Archetype catalogue (v1)

| Id | Cakupan | Widget utama | Kelas tipikal |
|----|---------|--------------|----------------|
| `place-value` | Nilai tempat, komposisi bilangan | `STEP_REVEAL` | 1–4 |
| `number-line` | Penjumlahan, pengurangan, urutan, bilangan negatif | `NUMBER_LINE_EXPLORER` | 1–6 |
| `fractions` | Pecahan, senilai, perbandingan, desimal | `FRACTION_BAR_BUILDER` | 3–6 |
| `operations` | Perkalian, pembagian, sifat operasi | `ANIMATED_WORKED_EXAMPLE` | 2–6 |
| `measurement` | Panjang, berat, volume, satuan | `PARAMETER_EXPLORER` | 1–5 |
| `geometry` | Bangun datar dan ruang, keliling, luas | `IMAGE_HOTSPOT` | 1–6 |
| `data-chart` | Piktogram, diagram batang, modus | `SORT_INTO_GROUPS` | 2–6 |
| `time` | Jam, kalender, durasi | `IMAGE_HOTSPOT` | 1–4 |
| `money` | Nilai uang, kembalian | `SORT_INTO_GROUPS` | 2–4 |
| `patterns` | Pola bilangan dan gambar | `STEP_REVEAL` | 1–5 |

Menambah arketipe baru adalah pekerjaan engineering (sejalan dengan keputusan Q1 Feature 010: authoring tanpa-kode di atas katalog yang dirawat engineering).

## Illustration primitives

Ilustrasi dan animasi diproduksi dari komponen SVG berparameter di `packages/ui/src/components/illustration/`, bukan 60 berkas SVG tangan. Setiap primitif MUST: memakai token dari `@aksicendekia/design-tokens` (dilarang hex hardcoded, Konstitusi VI), menerima `title`/`desc` untuk pembaca layar, menghormati `prefers-reduced-motion` (FR-017), dan **menskala lewat `viewBox` dengan lebar relatif** — dilarang lebar piksel tetap, karena itulah penyebab paling umum luapan horizontal pada 320px (FR-041).

Primitif yang secara alami lebar (`NumberLineStrip`, `MeasureRuler`, `BarChartMini`) MUST menyediakan dua tata letak: rentang penuh untuk layar lega, dan bentuk ringkas atau bergulir-di-dalam-wadah untuk 320px. Keduanya MUST tetap dapat dijawab; bentuk ringkas bukan versi lumpuh.

Berkas SVG statis tetap dipakai **hanya** sebagai `fallbackStorageKey` dan pratinjau video — keduanya butuh berkas nyata.

## Test contract

Per arketipe (bukan per pelajaran) — inilah yang membuat 60 pelajaran terverifikasi dengan biaya 10 berkas uji:

- Kebenaran matematis: kunci jawaban tiap soal yang dihasilkan diverifikasi terhadap perhitungan independen di dalam uji.
- Jaminan O1–O12 ditegaskan untuk setiap instansi yang dihasilkan pabrik.
- Render tiap arketipe pada 320/375/768/1280px: nol luapan horizontal, nol target interaktif di bawah 44x44px (SC-013).
- Penyelesaian potret 320px per arketipe, tanpa kendali yang tidak terjangkau (FR-042).
- Penyelesaian hanya-ketuk per arketipe interaktif: urutan pilih-objek lalu pilih-tujuan menghasilkan jawaban terekam tanpa satu pun peristiwa seret (FR-043, SC-014).
- Determinisme: dua pemanggilan dengan spec sama menghasilkan objek identik.
- Distraktor: opsi salah tidak pernah sama dengan kunci; tidak ada opsi duplikat.

Per katalog (lintas kelas): sembilan invarian di [data-model.md](../data-model.md) §4.
