# Contract: Focus Configuration

**Module**: `packages/content-kit/src/focus/focus-config.ts`
**Consumers**: `apps/web` (build-time + client), `apps/api` (service layer)
**Requirements**: FR-001 … FR-006

Satu sumber kebenaran untuk "apa yang sedang menjadi fokus". Dipakai kedua aplikasi agar penyaringan web dan api tidak dapat menyimpang.

## Shape

```ts
export interface FocusConfig {
  readonly enabled: boolean;
  readonly stages: readonly EducationStage[];   // default: ['SD']
  readonly subjectCodes: readonly string[];     // default: ['MATH_SD']
  readonly redirectTarget: string;              // default: '/explore'
}
```

## Sources & precedence

1. Variabel lingkungan build — `NEXT_PUBLIC_FOCUS_ENABLED` (web), `FOCUS_ENABLED` (api). Nilai `'false'` mematikan; nilai lain atau tidak diset berarti **aktif**.
2. Default terkompilasi bila env tidak diset.

Nilai divalidasi Zod saat modul dimuat. Konfigurasi tidak valid (mis. `enabled` dengan `stages: []`) **melempar saat startup/build**, tidak diam-diam dilewati — batas sistem gagal cepat sesuai Konstitusi IV.

## Exported predicates

Seluruhnya fungsi murni, bebas React dan Prisma.

| Function | Signature | Behaviour |
|----------|-----------|-----------|
| `getFocusConfig` | `() => FocusConfig` | Konfigurasi aktif yang sudah tervalidasi. |
| `isStageInFocus` | `(stage: EducationStage) => boolean` | `true` untuk semua jenjang bila `enabled === false`. |
| `isSubjectInFocus` | `(code: string) => boolean` | Idem. |
| `isLessonInFocus` | `(l: Pick<InteractiveLesson,'educationStage'\|'subjectCode'>) => boolean` | Konjungsi keduanya. |
| `filterLessonsForFocus` | `<T extends {...}>(items: readonly T[]) => T[]` | Menjaga urutan masukan. Generik agar berlaku untuk baris Prisma maupun objek content-kit. |
| `focusRedirectTarget` | `() => string` | Tujuan pengalihan FR-005. |

## Behavioural guarantees

- **G1** — Saat `enabled === false`, setiap predikat mengembalikan `true` dan `filterLessonsForFocus` adalah identitas. Mematikan saklar mengembalikan seluruh permukaan tanpa perubahan kode (FR-004).
- **G2** — Predikat tidak pernah membaca jaringan, basis data, atau `localStorage`. Aman dipanggil saat `generateStaticParams`.
- **G3** — Penyaringan **tidak pernah** menghapus rute dari `generateStaticParams`. Rute di luar fokus tetap dibangun dan merender pengalihan ramah ke `focusRedirectTarget()` (FR-005).
- **G4** — Di `apps/api`, filter diterapkan di **lapisan service**, bukan per pemanggil, sehingga seluruh permukaan hilir mewarisinya (R8).

## Consumer obligations

| Consumer | Obligation |
|----------|------------|
| Navigasi / sidebar / level selector | Menyembunyikan entri jenjang & mapel di luar fokus (FR-002). |
| Halaman katalog & pencarian | Menyaring lewat `filterLessonsForFocus`, bukan predikat lokal (FR-002). |
| Rute pelajaran | Merender pengalihan ramah bila pelajaran di luar fokus (FR-005). |
| Dasbor hilir (peta misi, papan peringkat, pencapaian, orang tua, guru) | Menampilkan empty state ber-i18n saat hasil tersaring kosong — dilarang halaman kosong atau galat (FR-006). |

## Test contract

- Predikat identitas saat dimatikan (G1).
- Konfigurasi tidak valid melempar saat dimuat.
- Penelusuran navigasi dengan fokus aktif: nol tautan ke jenjang/mapel di luar fokus (SC-001).
- Rute di luar fokus mengembalikan pengalihan, bukan 404 (FR-005).
- Setiap permukaan hilir dirender dengan katalog tersaring habis tanpa lempar (FR-006).
