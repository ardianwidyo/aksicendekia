# Contract: Embedded Third-Party Video

**Components**: `packages/ui/src/components/lesson/blocks/EmbeddedVideoBlock.tsx`, `packages/content-kit/src/lessons/video-registry.ts`, `packages/content-kit/src/schema/video-embed.schema.ts`, `scripts/verify-video-embeds.ts`
**Requirements**: FR-013, FR-016, FR-016a–d, FR-035a, FR-039
**Governing rule**: Konstitusi v1.2.0, Prinsip VI — "Pengecualian Tunggal — Video Edukasi Tersemat" (6 syarat kumulatif)

Kontrak ini ada karena pengecualian konstitusi bersifat **berkondisi**. Setiap butir di bawah memetakan ke satu syarat, dan setiap syarat punya uji yang dapat gagal.

## Registry entry

```ts
export interface VideoEmbedRef {
  readonly id: string;                 // 'yt-sd4-pecahan-01'
  readonly provider: 'YOUTUBE';        // v1 hanya YouTube
  readonly externalId: string;         // /^[A-Za-z0-9_-]{11}$/ — id, BUKAN URL
  readonly title: string;
  readonly publisherName: string;      // atribusi wajib tampil
  readonly durationSeconds?: number;
  readonly posterStorageKey: string;   // wajib diawali 'assets/lessons/sd/'
  readonly transcriptText: string;     // padanan teks Bahasa Indonesia
  readonly verifiedAt: string;         // ISO — diperbarui skrip CI
  readonly reviewedBy?: string;        // wajib terisi sebelum PUBLISHED
  readonly reviewNote?: string;
}
```

Menyimpan `externalId` dan bukan URL penuh disengaja: URL disusun komponen sehingga pemanggil **tidak dapat** melewati varian nocookie.

## Component contract — `EmbeddedVideoBlock`

### State 1 — sebelum aktivasi (default)

MUST render: gambar pratinjau self-hosted dari `posterStorageKey`, judul, nama penerbit, durasi, dan tombol putar.

MUST NOT ada dalam DOM atau permintaan jaringan: `<iframe>`, `<script>` penyedia, `<link rel="preconnect"\|"dns-prefetch">` ke domain penyedia, gambar dari `i.ytimg.com` atau domain penyedia mana pun.

Tombol putar MUST: ≥44×44px, dapat dijangkau `Tab`, aktif dengan `Enter`/`Space`, `aria-label` bermakna yang menyebut judul video.

Pratinjau MUST menskala responsif dengan rasio aspek tetap pada 320px–1280px+ tanpa memicu gulir horizontal halaman (FR-040, FR-041), dan tombol putar MUST tetap ≥44×44px pada lebar terkecil — bukan mengecil mengikuti pratinjau (FR-044).

### State 2 — setelah aktivasi sengaja

Menyisipkan tepat satu iframe:

```
https://www.youtube-nocookie.com/embed/{externalId}?autoplay=1&rel=0&modestbranding=1&playsinline=1
```

MUST NOT menyertakan parameter kueri apa pun yang membawa identitas, profil, sesi, atau progres belajar. MUST NOT meneruskan `referrerPolicy` bawaan tanpa pembatasan — gunakan `referrerpolicy="no-referrer"` (deviasi wajib dicatat).

`autoplay=1` diizinkan **hanya** karena aktivasi sudah merupakan tindakan sengaja pengguna; ini tidak melanggar FR-018 yang melarang putar otomatis **saat halaman dimuat**.

### Always

Transkrip `transcriptText` MUST dapat diakses di kedua state (FR-014). Blok MUST berdampingan dengan blok `ANIMATION` self-hosted pada pelajaran yang sama; pelajaran MUST tetap dapat diselesaikan bila sematan diblokir (Konstitusi VI butir 1, FR-015).

## Publish gate — `Embedded Media Gate`

Sebuah `Lesson` DILARANG berpindah `REVIEW → PUBLISHED` bila salah satu berikut benar:

| # | Kondisi pemblokir | Syarat konstitusi |
|---|-------------------|-------------------|
| 1 | Pelajaran punya blok sematan tetapi tidak punya blok `ANIMATION` self-hosted | butir 1 |
| 2 | Uji render awal menemukan iframe atau permintaan pihak ketiga | butir 2 |
| 3 | URL tersusun bukan varian `youtube-nocookie.com` | butir 3 |
| 4 | Parameter sematan memuat field identitas/progres | butir 4 |
| 5 | `reviewedBy` null, atau `verifiedAt` lebih lama dari ambang kesegaran | butir 5 |
| 6 | Ada berkas video penyedia yang di-host ulang di repo | butir 6 |

Gate ini berjalan sebagai uji otomatis, bukan checklist manusia — sebuah pengecualian yang hanya dijaga niat baik bukanlah pengecualian yang dijaga.

## Link-rot verification — `scripts/verify-video-embeds.ts`

Berjalan di **CI dan build**, tidak pernah di peramban (R7 — pemeriksaan dari klien akan memicu permintaan pra-klik dan melanggar butir 2).

Membaca registri, memanggil endpoint oEmbed publik YouTube per `externalId`, keluar bukan-nol bila ada yang gagal, dan mencetak daftar id yang dihapus/diprivatkan/diblokir wilayah untuk diganti (FR-016d). Sukses memperbarui `verifiedAt`.

## Test contract

- Render awal: snapshot DOM tidak memuat `iframe`; pemantau jaringan mencatat nol permintaan pihak ketiga (SC-011).
- Setelah klik: tepat satu iframe, host `www.youtube-nocookie.com`, tanpa parameter identitas.
- Keyboard: fokus mencapai tombol putar; `Enter` mengaktifkan; ukuran ≥44×44px (FR-019).
- Responsif: pada 320px potret, pratinjau dan iframe termuat tidak meluap horizontal, dan tombol putar tetap ≥44×44px (FR-040, FR-041, FR-044).
- Fault injection: sematan diblokir → pelajaran tetap tuntas lewat animasi self-hosted (FR-015, memperluas `media-fault-injection.spec.tsx`).
- Skema: `externalId` berupa URL ditolak; `posterStorageKey` di luar `assets/lessons/sd/` ditolak; `provider` selain `YOUTUBE` ditolak.
- Publish gate: setiap satu dari enam kondisi pemblokir menghasilkan penolakan.
