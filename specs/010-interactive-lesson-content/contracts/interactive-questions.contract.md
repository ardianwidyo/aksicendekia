# Contract: Tipe Soal Interaktif & Penilaian Bersama

**Feature**: `010-interactive-lesson-content` | **Date**: 2026-09-01

Sumber kebenaran penilaian: `packages/content-kit/src/grading/`
Konsumen: `apps/api/src/modules/session/session-grader.ts` (server) dan `apps/web/lib/gamification/local-session-engine.ts` (klien, Mode Tamu).

---

## 1. Kontrak fungsi penilaian bersama

```typescript
// packages/content-kit/src/grading/grade-question.ts
export type CanonicalQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'SHORT_ANSWER'
  | 'MATCHING_PAIRS'
  | 'DRAG_DROP_GROUPING'
  | 'NUMBER_LINE';

export interface GradeResult {
  isCorrect: boolean;
  correctAnswerDetails: Record<string, unknown>;
}

/** Murni, sinkron, tanpa I/O. Payload apa pun yang tidak valid menghasilkan isCorrect: false. */
export function gradeQuestion(
  questionType: CanonicalQuestionType,
  contentPayload: unknown,
  studentAnswer: unknown
): GradeResult;

export function normalizeAnswerText(input: string): string;
```

### Aturan normalisasi kunci payload

Parser kanonik MUST menerima **kedua konvensi** yang saat ini beredar di repo, lalu menghasilkan satu bentuk internal:

| Bentuk internal | Diterima dari |
|---|---|
| `correctOptionId` | `correctOptionId`, `correct_option_id`, `options[].isCorrect` |
| `acceptedAnswers` | `acceptedAnswers`, `accepted_answers` |
| `matchingMode` | `matchingMode`, `matching_mode` (default `NORMALIZED`) |
| `matchingPairs` | `pairs`, `matching_pairs` |

Ini menutup divergensi nyata antara `session-grader.ts` (camelCase) dan `local-session-engine.ts` (snake_case).

### Aturan `normalizeAnswerText`

Satu implementasi, menggantikan dua versi yang berbeda hari ini:

```text
trim → collapse spasi ganda → lowercase → buang tanda baca periferal [.,!?;:]+$ → NFD → buang diakritik
```

Daftar tanda baca mengikuti versi klien yang lebih lengkap (`[.,!?;:]`), karena versi server (`[.,!?]`) menilai jawaban berakhiran `;` sebagai salah — perilaku yang tidak diinginkan.

---

## 2. `DRAG_DROP_GROUPING`

Siswa menempatkan setiap objek ke dalam kelompok yang benar.

### `contentPayload`

```jsonc
{
  "items": [
    { "id": "it_1", "label": "1/2", "illustrationAssetId": null },
    { "id": "it_2", "label": "2/4" },
    { "id": "it_3", "label": "1/3" }
  ],
  "groups": [
    { "id": "grp_half", "label": "Senilai dengan setengah" },
    { "id": "grp_other", "label": "Tidak senilai dengan setengah" }
  ],
  "correctMapping": { "it_1": "grp_half", "it_2": "grp_half", "it_3": "grp_other" },
  "requireAllPlaced": true
}
```

**Batasan**: 2–12 `items`, 2–4 `groups`, setiap `items[].id` MUST muncul sebagai kunci di `correctMapping`, dan setiap nilai `correctMapping` MUST merujuk `groups[].id` yang ada.

### Bentuk jawaban siswa

```jsonc
{ "placements": { "it_1": "grp_half", "it_2": "grp_half", "it_3": "grp_other" } }
```

### Aturan penilaian

- Benar bila `placements` **persis sama** dengan `correctMapping` — tidak ada nilai sebagian.
- `requireAllPlaced: true` dan ada item belum ditempatkan → salah.
- Objek `placements` yang memuat id asing → salah.

### `correctAnswerDetails`

```jsonc
{ "correctMapping": { "it_1": "grp_half", "it_2": "grp_half", "it_3": "grp_other" } }
```

---

## 3. `NUMBER_LINE`

Siswa menempatkan penanda pada posisi yang benar di garis bilangan.

### `contentPayload`

```jsonc
{
  "min": -10,
  "max": 10,
  "step": 1,
  "targetValue": -3,
  "tolerance": 0,
  "labelEvery": 5,
  "showFractions": false
}
```

**Batasan**: `max > min`; `step > 0`; `(max - min) / step <= 100`; `targetValue` MUST berada dalam `[min, max]` dan MUST kelipatan `step` dari `min`; `tolerance >= 0`.

### Bentuk jawaban siswa

```jsonc
{ "value": -3 }
```

### Aturan penilaian

- Benar bila `Math.abs(value - targetValue) <= tolerance`.
- `tolerance: 0` (default) berarti pencocokan persis.
- `value` bukan angka berhingga → salah.
- Perbandingan memakai toleransi epsilon internal `1e-9` agar pecahan desimal tidak gagal karena galat pembulatan floating point.

### `correctAnswerDetails`

```jsonc
{ "targetValue": -3, "tolerance": 0 }
```

---

## 3a. Varian jenjang TK — pilihan bergambar

Pelajaran TK **tidak memakai tipe soal baru**. Yang berbeda hanyalah isi `contentPayload`, karena anak 4–6 tahun umumnya belum bisa membaca (FR-017a).

```jsonc
{
  "options": [
    { "id": "opt_a", "text": "Tiga", "illustrationAssetId": "uuid-3-apel" },
    { "id": "opt_b", "text": "Lima", "illustrationAssetId": "uuid-5-apel" }
  ],
  "correctOptionId": "opt_a",
  "narrationText": "Ada berapa apel di keranjang?",
  "narrationAssetId": null
}
```

**Aturan tambahan untuk `educationStage = TK`**

| # | Aturan |
|---|---|
| T1 | Setiap `options[].illustrationAssetId` MUST terisi — gerbang A7 memblokir `REVIEW` bila ada yang kosong |
| T2 | `narrationText` MUST terisi pada setiap butir soal — gerbang A8 |
| T3 | Soal MUST dapat dijawab benar dengan seluruh teks disembunyikan; diuji secara mekanis, bukan dinilai subjektif |
| T4 | Jumlah pilihan MUST 2–3 (beban kognitif untuk usia TK), bukan 4–5 seperti jenjang lain |
| T5 | `SHORT_ANSWER` DILARANG untuk TK — mensyaratkan mengetik, yang belum dikuasai |

**Penilaian tidak berubah**: `gradeQuestion` memperlakukan soal TK persis seperti `MULTIPLE_CHOICE` biasa. `illustrationAssetId` dan `narrationText` adalah metadata penyajian, tidak ikut dinilai.

---

## 4. Pembagian klien/server (anti-cheat)

| Aspek | Sesi terautentikasi (Feature 004) | Mode Tamu (Feature 009) |
|---|---|---|
| Lokasi penilaian | Server (`session-grader.ts` → `content-kit`) | Klien (`local-session-engine.ts` → `content-kit`) |
| Kunci jawaban sebelum submisi | **Tidak pernah dikirim** — `correctMapping`, `targetValue`, `tolerance` dibuang dari payload penyajian | Ikut dikirim (trade-off yang disadari di Feature 009) |
| Skor dari klien | Diabaikan 100% | Tidak relevan |
| Petunjuk bertingkat | `POST /api/v1/sessions/:id/hints` | Lokal dari payload |

**Konsekuensi implementasi**: fungsi *stripping* pada penyajian soal untuk sesi terautentikasi WAJIB diperluas agar membuang `correctMapping`, `targetValue`, dan `tolerance` — bukan hanya `correct_option_id`/`accepted_answers`/`matching_pairs` seperti sekarang. Ini adalah titik regresi anti-cheat yang paling mungkin terlewat dan wajib punya uji sendiri.

---

## 5. Kontrak umpan balik visual (FR-020)

```typescript
// packages/ui/src/components/question/InteractiveFeedback.tsx
export interface InteractiveFeedbackProps {
  state: 'idle' | 'correct' | 'incorrect';
  explanation?: string;
  onRequestHint?: () => void;
}
```

| Keadaan | Perlakuan visual | Token |
|---|---|---|
| `correct` | Animasi positif singkat (≤600 ms), ikon centang | `tertiary` / `tertiary-container` (emerald `#006947` / `#00855b`) |
| `incorrect` | Tanpa animasi menghentak; pesan lembut + tombol petunjuk & pembahasan | `error` / `error-container` |

- Dengan `prefers-reduced-motion: reduce`, keadaan `correct` memakai perubahan keadaan statis (ikon + warna + teks), tanpa gerak — FR-013.
- Status benar/salah **tidak boleh** disampaikan lewat warna saja: selalu disertai ikon dan teks (FR-023).
- Tombol jawaban memakai `TactileOptionButton` yang sudah ada di `packages/ui` agar konsisten dengan efek taktil `DESIGN.md`.

---

## 6. Uji karakterisasi wajib (sebelum refactor)

Sebelum logika dipindahkan ke `content-kit`, tulis uji yang mengunci perilaku **saat ini** untuk `MULTIPLE_CHOICE`, `SHORT_ANSWER`, dan `MATCHING_PAIRS` pada kedua implementasi, mencakup minimal:

1. Payload camelCase (bentuk server) dan snake_case (bentuk klien) untuk tiap tipe.
2. `matchingMode` `EXACT`, `CASE_INSENSITIVE`, dan `NORMALIZED`.
3. Jawaban dengan spasi ganda, kapitalisasi berbeda, diakritik, dan tanda baca akhir `.`/`,`/`;`.
4. `MATCHING_PAIRS` dengan pasangan kurang, lebih, dan tertukar.

Uji ini menjadi jaring pengaman bahwa unifikasi tidak diam-diam mengubah nilai siswa pada konten yang sudah terbit. Satu-satunya perubahan perilaku yang **disengaja** adalah penyeragaman tanda baca periferal ke `[.,!?;:]` — perubahan ini didokumentasikan dan diuji secara eksplisit.
