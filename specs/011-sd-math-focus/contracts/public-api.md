# Contract: Public & CMS API Surface

**Modules**: `apps/api/src/modules/sync/public-content.controller.ts`, `apps/api/src/modules/curriculum/*`, `apps/api/src/modules/content-blocks/*`
**Requirements**: FR-002, FR-005 … FR-007, FR-012, FR-026, FR-027, FR-033, FR-034

Seluruh perubahan bersifat aditif dan kompatibel mundur. Tidak ada endpoint dihapus dan tidak ada field respons dihilangkan.

> **Catatan utang teknis**: `public-content.controller.ts` saat ini memanggil Prisma langsung dari controller, melanggar Konstitusi Prinsip II. Fitur ini **tidak** memperluas pola tersebut. Logika fokus dan kueri per-kelas WAJIB masuk lapisan service baru (`curriculum.service`), dan kueri yang disentuh dipindahkan ke sana seiring jalan. Refactor menyeluruh controller ini di luar cakupan.

## Modified endpoints

### `GET /api/v1/public/subjects`

Tambahan: hasil disaring lewat `filterLessonsForFocus` di lapisan service saat mode fokus aktif. `stage` di luar fokus mengembalikan `{ subjects: [] }` dengan `200`, bukan galat — pemanggil (dasbor hilir) wajib menangani himpunan kosong (FR-006).

### `GET /api/v1/public/units/:unitId/lessons`

Tambahan field respons per pelajaran: `gradeLevel: number | null`. Disaring fokus.

### `GET /api/v1/public/lessons/:id`

Tambahan pada blok `VIDEO`: objek `videoEmbed` bila blok memakai sematan.

```jsonc
{
  "blockType": "VIDEO",
  "videoEmbed": {
    "provider": "YOUTUBE",
    "externalId": "…",           // id, bukan URL — klien menyusun URL nocookie
    "title": "…",
    "publisherName": "…",
    "durationSeconds": 240,
    "posterUrl": "/assets/lessons/sd/…",   // self-hosted
    "transcriptText": "…"
  }
}
```

MUST NOT mengembalikan URL sematan yang sudah jadi — klien menyusunnya lewat komponen sehingga varian nocookie tidak dapat dilewati (lihat [video-embed.md](./video-embed.md)).

Pelajaran di luar fokus mengembalikan `404` seperti sebelumnya; jalur webnya menangani pengalihan ramah (FR-005).

## New endpoints

### `GET /api/v1/public/lessons?gradeLevel={1..6}`

Katalog per kelas (FR-007). Query tervalidasi Zod (`int` 1–6); nilai di luar rentang → `400` dengan pesan yang tidak membocorkan internal. Mengembalikan metadata saja, bukan blok atau soal — badan pelajaran diambil lewat endpoint detail (sejalan pemisahan indeks/badan di R6).

### `GET /api/v1/admin/curriculum/coverage`

Laporan cakupan (FR-012). Terlindungi JWT + peran admin/guru, mewarisi rate limit global.

```jsonc
{
  "subjectCode": "MATH_SD",
  "grades": [
    { "gradeLevel": 1, "publishedCount": 10, "reviewCount": 0, "meetsMinimum": true,
      "elementsCovered": ["Bilangan", "…"], "elementsMissing": [] }
  ],
  "overallMeetsMinimum": false
}
```

Inilah yang membuat SC-002 dapat diverifikasi tanpa menghitung manual 60 pelajaran.

### `POST /api/v1/admin/lessons/:id/publish` — perluasan perilaku

Endpoint publish yang ada memperoleh `Embedded Media Gate`. Menolak `422` dengan alasan terenumerasi bila salah satu dari enam kondisi pemblokir di [video-embed.md](./video-embed.md) terpenuhi. Pesan galat menyebut syarat mana yang gagal — cukup untuk diperbaiki peninjau, tanpa membocorkan internal sistem.

`REVIEW → PUBLISHED` tetap hanya untuk manusia berperan pemilik produk atau guru yang ditunjuk (FR-033). Tidak ada jalur otomatis, dan seed tidak boleh menulis `PUBLISHED` (guard yang sudah ada dipertahankan).

## Cross-cutting requirements

| Aspek | Aturan |
|-------|--------|
| Validasi | Seluruh query/param/body baru lewat Zod sebelum mencapai controller (Konstitusi IV). |
| Otorisasi | Endpoint admin memeriksa relasi peran, bukan sekadar validitas JWT (Konstitusi VII). |
| Rate limit | Endpoint baru mewarisi konfigurasi global; tanpa pengecualian. |
| Status konten | Jalur publik hanya menyajikan `PUBLISHED` (FR-034). Perilaku `publicStatuses()` yang ada dipertahankan. |
| Kesetaraan tamu | Muatan pelajaran untuk tamu dan pengguna terdaftar identik (FR-027) — diuji dengan membandingkan kedua respons. |
| Galat | Pesan ramah pengguna, tanpa membocorkan detail internal (Konstitusi/keamanan). |

## Test contract

- Kontrak setiap endpoint baru: skema respons, kode status, penolakan input tidak valid.
- Fokus aktif: pelajaran non-SD/non-Matematika tidak pernah muncul di respons publik mana pun.
- Fokus dimatikan: respons identik dengan perilaku sebelum fitur ini (regresi FR-004).
- Kesetaraan tamu vs terdaftar untuk pelajaran yang sama (FR-027).
- Publish gate menolak keenam kondisi pemblokir dengan `422` dan alasan spesifik.
- Laporan cakupan melaporkan `meetsMinimum: false` saat sebuah kelas punya 9 pelajaran (edge case spec).
