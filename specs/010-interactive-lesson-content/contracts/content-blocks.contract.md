# API Contract: Blok Konten & Aset Media (Admin CMS)

**Feature**: `010-interactive-lesson-content` | **Date**: 2026-09-01

Modul: `apps/api/src/modules/content-blocks/`
Seluruh endpoint di bawah **memerlukan JWT dengan peran `ADMIN`**, melewati rate limit global Fastify, dan memvalidasi seluruh payload dengan Zod sebelum mencapai controller (Prinsip IV).

---

## 1. `GET /api/v1/admin/lessons/:lessonId/blocks`

Mengambil seluruh blok konten sebuah pelajaran, terurut menaik menurut `orderIndex`.

**Response `200`**

```jsonc
{
  "blocks": [
    {
      "id": "uuid",
      "lessonId": "uuid",
      "orderIndex": 0,
      "blockType": "ANIMATION",
      "payload": { "animationId": "place-value-split", "steps": [], "loop": false },
      "altText": null,
      "transcriptText": "Angka 45 dipecah menjadi 4 puluhan dan 5 satuan...",
      "mediaAssetId": null,
      "captionAssetId": null,
      "fallbackAssetId": "uuid",
      "narrationText": "Angka empat puluh lima punya empat puluhan dan lima satuan.",
      "narrationAssetId": null,
      "status": "DRAFT"
    }
  ]
}
```

---

## 2. `POST /api/v1/admin/lessons/:lessonId/blocks`

Menambahkan satu blok. `orderIndex` yang bentrok menggeser blok sesudahnya.

**Request**

```jsonc
{
  "orderIndex": 2,
  "blockType": "INTERACTIVE_WIDGET",
  "payload": {
    "widgetType": "NUMBER_LINE_EXPLORER",
    "params": { "min": 0, "max": 20, "step": 1, "initial": 0, "markers": [5, 10, 15] }
  }
}
```

**Validasi**

| Kode | Kondisi |
|---|---|
| `400` | `payload` tidak sesuai bentuk `blockType`-nya |
| `400` | `blockType = INTERACTIVE_WIDGET` dan `params` gagal skema tipe widget |
| `404` | `widgetType` tidak ada di katalog |
| `409` | Pelajaran berstatus `PUBLISHED` — sunting memerlukan versi baru (Feature 003) |

**Response `201`**: objek blok yang dibuat.

---

## 3. `PATCH /api/v1/admin/blocks/:blockId`

Memperbarui sebagian field blok. Aturan validasi sama dengan `POST`.

**Response `200`**: objek blok terbaru. **`409`** bila pelajaran induk sudah `PUBLISHED`.

---

## 4. `DELETE /api/v1/admin/blocks/:blockId`

**Response `204`**. `orderIndex` blok-blok sesudahnya dirapatkan dalam satu transaksi.

---

## 5. `PUT /api/v1/admin/lessons/:lessonId/blocks/order`

Mengurutkan ulang seluruh blok dalam satu operasi atomik.

**Request**

```jsonc
{ "orderedBlockIds": ["uuid-a", "uuid-c", "uuid-b"] }
```

**Validasi**: daftar MUST memuat **persis** seluruh id blok milik pelajaran tersebut — tanpa duplikat, tanpa yang hilang, tanpa id asing. Pelanggaran → `400`.

**Response `200`**: daftar blok dengan urutan baru.

---

## 6. `POST /api/v1/admin/media-assets`

Mengunggah satu aset media milik platform (FR-003, FR-005).

**Request**: `multipart/form-data` — `file`, `kind`, `altText?`, `licenseNote?`, `attribution?`.

**Validasi**

| Kode | Kondisi |
|---|---|
| `400` | `mimeType` tidak ada dalam daftar izin untuk `kind` tersebut |
| `400` | `byteSize` melebihi batas (gambar 512 KB, audio 2 MB, video 20 MB) |
| `400` | `kind = IMAGE` tanpa `altText` |
| `400` | `kind = VIDEO` dengan `durationSeconds > 180` |
| `400` | `kind = AUDIO` dengan `durationSeconds > 60` (slot narasi, tidak diisi di v1) |
| `422` | Nilai menyerupai URL eksternal terdeteksi pada `storageKey` — hotlink ditolak |

**Response `201`**

```jsonc
{
  "id": "uuid",
  "kind": "IMAGE",
  "storageKey": "assets/lessons/sd-01/place-value.svg",
  "mimeType": "image/svg+xml",
  "byteSize": 8421,
  "altText": "Batang puluhan dan satuan yang menyusun angka 45"
}
```

`storageKey` selalu **relatif**. Klien menyusun URL akhir dari basis milik platform sendiri; nilai absolut berskema `http`/`https` ditolak di lapisan service.

---

## 7. `POST /api/v1/admin/lessons/:lessonId/submit-review`

Menjalankan gerbang aksesibilitas + kurikulum lalu memindahkan pelajaran `DRAFT → REVIEW` (FR-004, FR-030).

**Response `200` (lolos)**

```jsonc
{ "lessonId": "uuid", "status": "REVIEW" }
```

**Response `422` (gagal gerbang)** — daftar pelanggaran terstruktur, bukan pesan tunggal, agar CMS dapat menampilkan checklist yang bisa ditindaklanjuti:

```jsonc
{
  "error": "ACCESSIBILITY_GATE_FAILED",
  "message": "Pelajaran belum memenuhi syarat untuk diajukan ke review.",
  "violations": [
    { "rule": "A1", "blockId": "uuid-1", "blockType": "ILLUSTRATION",
      "field": "altText", "message": "Ilustrasi belum memiliki teks alternatif." },
    { "rule": "A4", "blockId": "uuid-3", "blockType": "ANIMATION",
      "field": "fallbackAssetId", "message": "Animasi belum memiliki ilustrasi cadangan." },
    { "rule": "C2", "blockId": null, "blockType": null,
      "field": null, "message": "Pelajaran belum memiliki komponen interaktif pada penelusuran konsep." },
    { "rule": "C3", "blockId": null, "blockType": null,
      "field": "curriculumAchievementId", "message": "Pelajaran belum ditautkan ke capaian pembelajaran resmi." },
    { "rule": "A7", "blockId": null, "blockType": null,
      "field": "questionItems[2].options[1].illustrationAssetId",
      "message": "Soal jenjang TK belum memiliki pilihan jawaban bergambar." }
  ]
}
```

Kode aturan `A1`–`A8` dan `C1`–`C3` didefinisikan di [data-model.md § 5](../data-model.md#5-transisi-status--gerbang-aksesibilitas).

---

## 7a. `POST /api/v1/admin/lessons/:lessonId/publish`

Transisi `REVIEW → PUBLISHED`. **Hanya endpoint ini** yang boleh menghasilkan status `PUBLISHED` (FR-030a).

**Request**

```jsonc
{ "reviewerNote": "Sudah diperiksa guru Matematika SD, 2026-09-05." }
```

**Aturan**

| Kode | Kondisi |
|---|---|
| `200` | Pelajaran berstatus `REVIEW` dan seluruh gerbang masih lolos saat diverifikasi ulang |
| `409` | Pelajaran tidak berstatus `REVIEW` |
| `422` | Gerbang gagal saat verifikasi ulang (konten berubah setelah diajukan) |

**Catatan penegakan**: skrip seed, migrasi, dan tugas terjadwal apa pun MUST TIDAK menulis `status = PUBLISHED` secara langsung ke basis data. Penerbitan adalah aksi manusia melalui endpoint ini. Larangan ini diuji, bukan sekadar disepakati.

---

## 7b. `GET` / `POST /api/v1/admin/curriculum-achievements`

Mengelola kutipan capaian pembelajaran resmi yang dirujuk pelajaran (FR-008a).

**Request `POST`**

```jsonc
{
  "educationStage": "SD",
  "phase": "FASE_B",
  "subjectCode": "MATH_SD",
  "element": "Bilangan",
  "achievementText": "<kutipan verbatim dari dokumen resmi>",
  "sourceDocument": "Kepmendikbudristek No. ... Lampiran ...",
  "sourceUrl": "https://kurikulum.kemdikbud.go.id/...",
  "retrievedAt": "2026-09-01T00:00:00Z"
}
```

**Validasi**

| Kode | Kondisi |
|---|---|
| `400` | Salah satu dari `achievementText`, `sourceDocument`, `sourceUrl`, `retrievedAt` kosong |
| `400` | `sourceUrl` bukan URL berskema `https` pada domain resmi kementerian |
| `409` | Kombinasi (`phase`, `subjectCode`, `element`) sudah ada |

**Response `201`**: objek `CurriculumAchievement` yang dibuat.

---

## 8. `GET /api/v1/admin/widget-catalog`

Daftar tipe widget untuk pemilih di editor dan penandaan tipe usang di dasbor review (FR-009).

**Response `200`**

```jsonc
{
  "widgets": [
    {
      "id": "NUMBER_LINE_EXPLORER",
      "displayName": "Penjelajah Garis Bilangan",
      "description": "Garis bilangan yang dapat digeser siswa untuk menjelajah nilai.",
      "supportStatus": "SUPPORTED",
      "catalogVersion": 1,
      "paramsSchema": { "$schema": "http://json-schema.org/draft-07/schema#", "type": "object" },
      "a11yNotes": "role=slider; panah kiri/kanan; Home/End ke ujung."
    }
  ]
}
```

---

## 9. Kontrak error bersama

Seluruh endpoint memakai bentuk error yang sama seperti modul lain (`apps/api/src/common/errors/app-error.ts`):

```jsonc
{ "error": "KODE_MESIN", "message": "Pesan ramah pengguna dalam Bahasa Indonesia" }
```

Pesan `message` ditujukan untuk ditampilkan ke Admin dan tidak boleh membocorkan detail internal (nama tabel, stack trace, atau query).
