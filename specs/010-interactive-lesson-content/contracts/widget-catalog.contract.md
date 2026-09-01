# Component Contract: Katalog Komponen Interaktif v1

**Feature**: `010-interactive-lesson-content` | **Date**: 2026-09-01

Sumber kebenaran perilaku: `packages/ui/src/components/interactive/`
Sumber kebenaran metadata & skema parameter: `packages/content-kit/src/catalog/widget-catalog.ts` dan `packages/content-kit/src/schema/widget-params.schema.ts`

---

## 1. Kontrak registry

```typescript
// packages/ui/src/components/interactive/registry.ts
import type { ZodType } from 'zod';

export interface InteractiveWidgetProps<TParams> {
  params: TParams;
  /** Dipanggil saat siswa berinteraksi; dipakai untuk menandai penelusuran konsep selesai. */
  onInteract?: () => void;
}

export interface WidgetRegistryEntry<TParams = unknown> {
  id: string;
  paramsSchema: ZodType<TParams>;
  component: React.ComponentType<InteractiveWidgetProps<TParams>>;
  supportStatus: 'SUPPORTED' | 'DEPRECATED' | 'REMOVED';
}

export const WIDGET_REGISTRY: Readonly<Record<string, WidgetRegistryEntry>>;
export function resolveWidget(widgetType: string): WidgetRegistryEntry | undefined;
```

**Aturan resolusi** (`InteractiveWidgetBlock`):

1. `resolveWidget(widgetType)` mengembalikan `undefined` → render `UnsupportedWidgetFallback`.
2. Entri ditemukan tetapi `supportStatus !== 'SUPPORTED'` → render `UnsupportedWidgetFallback`.
3. `paramsSchema.safeParse(params)` gagal → render `UnsupportedWidgetFallback`.
4. Selain itu → render komponen secara lazy (`next/dynamic`) dengan `SkeletonState`.

`UnsupportedWidgetFallback` **tidak pernah melempar galat**: ia menampilkan ilustrasi/teks pendamping blok sehingga pelajaran tetap dapat diselesaikan (FR-009, FR-015, dan edge case widget usang).

---

## 2. Kontrak wajib untuk SETIAP komponen

Setiap entri katalog MUST memenuhi seluruh butir ini. Butir-butir ini diuji per komponen; komponen yang belum memenuhinya tidak boleh masuk registry.

| # | Kontrak | Cara verifikasi |
|---|---|---|
| W1 | Dapat dioperasikan penuh dengan keyboard saja (FR-022) | Uji `user-event` tanpa `pointer`, menyelesaikan alur interaksi utama |
| W2 | Memaparkan peran, nama, dan keadaan ke teknologi bantu | `vitest-axe` bersih + assertion peran/`aria-*` eksplisit |
| W3 | Menghormati `prefers-reduced-motion: reduce` (FR-013) | Uji dengan `matchMedia` ter-mock; transisi non-esensial nonaktif |
| W4 | Target sentuh interaktif ≥ 44×44px (Prinsip IX) | Kelas utilitas `min-h-11 min-w-11` diverifikasi di uji snapshot kelas |
| W5 | Tidak ada nilai warna/ukuran hardcoded (Prinsip VI) | Lint: tanpa literal hex; hanya kelas token |
| W6 | Seluruh teks yang tampil melalui `useI18n()` (Prinsip VIII) | Lint: tanpa string literal di JSX |
| W7 | Tidak melakukan permintaan jaringan atau menulis storage (Prinsip VII) | Uji: `fetch`/`localStorage` ter-mock tidak pernah terpanggil |
| W8 | Merespons input dalam ≤100 ms tanpa `setTimeout` buatan | Tinjauan kode + uji interaksi sinkron |
| W9 | Berfungsi tanpa `params` opsional (default aman) | Uji dengan parameter minimum |
| W10 | Bila dipakai pada jenjang TK: makna tersampaikan tanpa membaca — label bergambar/ikon, bukan teks saja (FR-017a) | Uji "teks disembunyikan": render dengan seluruh node teks dikosongkan, pastikan masih ada pembeda visual antar-pilihan |

---

## 3. Skema parameter per tipe

### 3.1 `STEP_REVEAL`

```typescript
{
  steps: Array<{ title: string; body: string; illustrationAssetId?: string }>; // 2..8
  autoAdvance: boolean; // default false — WAJIB false bila reduced-motion aktif
}
```
Keyboard: `Enter`/`Space` maju, `Backspace` mundur. Kemajuan diumumkan lewat `aria-live="polite"` ("Langkah 2 dari 5").

### 3.2 `PARAMETER_EXPLORER`

```typescript
{
  expressionId: string;                       // id rumus yang dikenali komponen, bukan kode arbitrer
  variables: Array<{ key: string; label: string; min: number; max: number; step: number; initial: number }>; // 1..3
  showValueReadout: boolean;                  // default true
}
```
`expressionId` sengaja berupa **enum tertutup**, bukan ekspresi yang dievaluasi — tidak ada eksekusi string dari konten (Prinsip IV).
Keyboard: `<input type="range">` native per variabel.

### 3.3 `NUMBER_LINE_EXPLORER`

```typescript
{
  min: number; max: number; step: number;     // max > min; step > 0; (max-min)/step <= 100
  initial: number;
  markers: number[];                          // 0..10 penanda berlabel
  showFractions: boolean;                     // default false
}
```
Keyboard: `role="slider"`, `aria-valuemin/max/now/text`; panah kiri/kanan satu `step`, `PageUp`/`PageDown` sepuluh `step`, `Home`/`End` ke ujung.

### 3.4 `FRACTION_BAR_BUILDER`

```typescript
{
  denominator: number;                        // 2..12
  targetFraction?: { numerator: number; denominator: number };
  allowCompare: boolean;                      // default false — tampilkan batang kedua
}
```
Keyboard: panah untuk memindah fokus antar-bagian, `Enter`/`Space` mengarsir/menghapus arsiran. Keadaan tiap bagian memakai `aria-pressed`.

### 3.5 `IMAGE_HOTSPOT`

```typescript
{
  mediaAssetId: string;
  hotspots: Array<{ id: string; xPercent: number; yPercent: number; label: string; body: string }>; // 1..8
}
```
Setiap hotspot adalah `<button>` sungguhan dengan `aria-expanded`, muncul dalam urutan `Tab` yang wajar. `xPercent`/`yPercent` dalam rentang 0–100 agar responsif di layar kecil.

### 3.6 `SORT_INTO_GROUPS`

```typescript
{
  items: Array<{ id: string; label: string; illustrationAssetId?: string }>;  // 2..12
  groups: Array<{ id: string; label: string }>;                               // 2..4
  correctMapping?: Record<string, string>;    // hanya untuk mode latihan mandiri, bukan penilaian
}
```
Keyboard: pola **select-then-place** (lihat [research.md § R5](../research.md#r5--pola-interaksi-yang-aksesibel)). HTML5 Drag-and-Drop API **DILARANG**.
Catatan: bila dipakai sebagai butir soal yang dinilai, gunakan tipe soal `DRAG_DROP_GROUPING` — bukan widget ini — agar penilaian melewati jalur resmi.

### 3.7 `ANIMATED_WORKED_EXAMPLE`

```typescript
{
  animationId: string;                        // enum tertutup, dipetakan ke keadaan visual di komponen
  steps: Array<{ atMs: number; caption: string; frame: string }>;             // 2..12, atMs menaik
  loop: boolean;                              // default false
  totalDurationMs: number;                    // <= 60000
}
```
Kontrol `Putar`, `Jeda`, `Ulang` sebagai `<button>`. Takarir `caption` selalu tampil sebagai teks (bukan hanya audio). Bila `prefers-reduced-motion` aktif, komponen membuka dalam mode **langkah manual** — siswa menekan tombol untuk maju, tanpa gerak otomatis.

---

## 4. Tipe animasi konsep (blok `ANIMATION`)

Blok `ANIMATION` memakai kontrak yang sama dengan `ANIMATED_WORKED_EXAMPLE` (`animationId` + `steps`), namun dirender oleh `ConceptAnimationBlock` di luar registry widget, karena ia berperan sebagai pengganti video dan wajib menyertakan `transcriptText` di tingkat blok.

**Daftar `animationId` v1** (enum tertutup, satu per pelajaran yang membutuhkannya) didefinisikan di `packages/content-kit/src/schema/content-block.schema.ts`. Menambah animasi baru = menambah nilai enum + implementasi keadaan visual di `packages/ui` — pekerjaan engineering, konsisten dengan FR-028.

---

## 4a. Kontrak kontrol "dengarkan" (`ListenButton`)

Komponen pendamping untuk jenjang TK (FR-017b–d). Bukan entri registry widget, melainkan primitif yang dipakai oleh blok konten dan komponen soal.

```typescript
// packages/ui/src/components/a11y/ListenButton.tsx
export interface ListenButtonProps {
  /** Teks yang dibacakan bila tidak ada aset audio terekam. */
  text: string;
  /** Slot audio terekam; bila terisi, diputar menggantikan sintesis suara peramban. */
  narrationAssetUrl?: string;
  lang?: string; // default 'id-ID'
}
```

**Aturan wajib**

| # | Aturan |
|---|---|
| L1 | Memakai `window.speechSynthesis` bawaan peramban. Memanggil layanan text-to-speech pihak ketiga **DILARANG** (Prinsip VI & VII). |
| L2 | Sebelum render, periksa ketersediaan: `speechSynthesis` ada **dan** `getVoices()` memuat minimal satu suara dengan `lang` diawali `id`. Bila tidak, komponen **tidak dirender sama sekali** (FR-017c). |
| L3 | `getVoices()` sering kosong pada pemanggilan pertama — komponen MUST menunggu event `voiceschanged` sebelum menyimpulkan tidak ada suara. |
| L4 | Menekan tombol saat sedang membaca MUST memanggil `cancel()` lebih dulu, sehingga pembacaan tidak bertindih (edge case di spec). |
| L5 | Pembacaan MUST selalu dipicu gestur pengguna — tidak pernah otomatis saat halaman dimuat (konsisten dengan FR-014). |
| L6 | Tombol MUST dapat difokus dan diaktifkan dengan keyboard, memiliki nama aksesibel dari layer i18n, dan `aria-pressed` mencerminkan keadaan sedang membaca. |
| L7 | Bila `narrationAssetUrl` terisi, komponen memutar berkas tersebut dan **tidak** memanggil sintesis suara (FR-017d). |
| L8 | Komponen MUST tetap berfungsi (atau menghilang dengan anggun) di lingkungan uji jsdom tempat `speechSynthesis` tidak tersedia. |

**Catatan desain**: pelajaran TK **tidak boleh** bergantung pada komponen ini. Ketersediaan suara Bahasa Indonesia bervariasi antar-perangkat, sehingga kontrol ini adalah penyempurna; pembawa makna utamanya adalah gambar dan ikon (gerbang A7).

---

## 5. Versi katalog

`catalogVersion` dinaikkan ketika bentuk parameter sebuah tipe berubah secara tidak kompatibel. Konten yang mereferensikan versi lama tetap merender fallback alih-alih rusak, dan dasbor review menandainya untuk diperbarui (FR-009).
