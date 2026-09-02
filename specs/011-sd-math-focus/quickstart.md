# Quickstart: Validating `011-sd-math-focus`

**Feature**: Fokus Jenjang SD — Revamp Matematika Interaktif Kelas 1–6
**Purpose**: Skenario yang dapat dijalankan untuk membuktikan fitur benar-benar bekerja ujung ke ujung. Detail bentuk data ada di [data-model.md](./data-model.md), detail antarmuka di [contracts/](./contracts/).

## Prerequisites

- Node.js LTS, pnpm, PostgreSQL berjalan
- Repo terpasang: `pnpm install`
- `apps/api/.env` terisi (`DATABASE_URL`, rahasia JWT). Tidak ada rahasia baru yang dibutuhkan fitur ini.

## Setup

```bash
pnpm install
pnpm --filter @aksicendekia/api prisma migrate dev     # migrasi aditif: grade_level, video_embeds
pnpm --filter @aksicendekia/api prisma db seed         # 60 pelajaran + 15 CP + registri video, semua REVIEW
```

Seed idempoten (upsert by id) dan **gagal keras** bila ada pelajaran berstatus `PUBLISHED` — guard FR-033 yang sudah ada, dipertahankan.

---

## Scenario 1 — Mode fokus menyembunyikan yang bukan fokus (US1, SC-001, SC-009)

```bash
pnpm --filter @aksicendekia/web dev                    # fokus aktif secara default
```

1. Buka `/` dan `/explore` sebagai tamu. **Harapkan**: hanya SD dan Matematika ditawarkan; tidak ada tautan TK/SMP/SMA di navigasi, filter, atau kartu katalog.
2. Buka langsung URL pelajaran non-SD (mis. `/explore/tk-numerasi-01`). **Harapkan**: pengalihan ramah ke `/explore`, bukan 404 mentah.
3. Masuk sebagai orang tua, lalu sebagai guru. **Harapkan**: dasbor tetap terbuka dan berfungsi; bila tidak ada data SD, tampil empty state ber-i18n — bukan halaman kosong atau galat.

Matikan saklar dan ulangi:

```bash
NEXT_PUBLIC_FOCUS_ENABLED=false pnpm --filter @aksicendekia/web dev
```

**Harapkan**: seluruh jenjang dan mata pelajaran kembali muncul, tanpa perubahan kode dan tanpa kehilangan data (SC-009).

---

## Scenario 2 — Katalog lengkap kelas 1–6 (US2, SC-002)

```bash
curl -s localhost:3001/api/v1/public/lessons?gradeLevel=4 | jq '.lessons | length'
```

Ulangi untuk `gradeLevel` 1–6. **Harapkan**: setiap kelas ≥10.

Laporan cakupan (butuh token admin/guru):

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  localhost:3001/api/v1/admin/curriculum/coverage | jq
```

**Harapkan**: setiap kelas `meetsMinimum: true` dan `elementsMissing: []` — inilah bukti SC-002 dan FR-011 tanpa hitung manual.

---

## Scenario 3 — Media, animasi, dan video tersemat (US3, SC-003, SC-011)

Buka sebuah pelajaran, mis. `/explore/sd-mtk-k4-05`.

1. **Harapkan**: terlihat ilustrasi, animasi konsep, komponen manipulatif, dan kartu video dengan pratinjau + tombol putar.
2. Buka DevTools → Network, muat ulang halaman, **jangan** tekan putar. **Harapkan**: nol permintaan ke `youtube.com`, `youtube-nocookie.com`, `ytimg.com`, atau domain Google mana pun (SC-011).
3. Tekan putar. **Harapkan**: tepat satu iframe muncul dengan host `www.youtube-nocookie.com`.
4. Blokir domain YouTube di DevTools (Network request blocking), muat ulang. **Harapkan**: pelajaran tetap dapat diselesaikan; animasi self-hosted tetap menyampaikan konsepnya (FR-015).
5. Aktifkan `prefers-reduced-motion` di OS. **Harapkan**: animasi non-esensial berganti ilustrasi statis atau kendali putar-atas-permintaan (FR-017).

---

## Scenario 4 — Interaktivitas dan keyboard (US4, SC-004)

1. Selesaikan satu pelajaran dari awal sampai ringkasan **hanya dengan keyboard** (Tab / Enter / panah). **Harapkan**: tuntas tanpa jebakan fokus. Urutan yang dipakai keyboard adalah pilih-objek lalu pilih-tujuan — mesin keadaan yang sama yang dipakai ketuk di Scenario 4b.
2. Ubah komponen manipulatif. **Harapkan**: tampilan berubah seketika tanpa muat ulang.
3. Jawab satu soal salah. **Harapkan**: umpan balik + pembahasan langkah demi langkah; petunjuk bertahap tersedia sebelum menjawab.
4. Buka pelajaran kelas 1. **Harapkan**: soal dan opsi dapat dipahami dari gambar/ikon, dan tombol "dengarkan" membacakan teks tanpa layanan pihak ketiga.

---

## Scenario 4b — Multi-perangkat dan sentuh (FR-040 … FR-045, SC-013, SC-014)

Buka DevTools → Device toolbar dan uji empat lebar: **320, 375, 768, 1280**.

1. Pada tiap lebar, telusuri katalog dan buka sebuah pelajaran. **Harapkan**: nol gulir horizontal pada halaman. Konten lebar (garis bilangan, tabel, diagram) menggulir di dalam wadahnya sendiri, bukan menggeser halaman.
2. Pada **320px potret**, selesaikan satu pelajaran penuh termasuk komponen manipulatif lebar. **Harapkan**: tuntas tanpa diminta memutar perangkat dan tanpa kendali yang tidak terjangkau.
3. Pada 320px, kerjakan soal seret-dan-letakkan dan soal garis bilangan **hanya dengan ketukan** — ketuk objek, ketuk tujuannya. **Harapkan**: objek berpindah dan jawaban terekam tanpa satu pun gerakan seret (SC-014).
4. Periksa ukuran target sentuh pada tiap lebar. **Harapkan**: setiap tombol, opsi jawaban, objek yang dapat dipindahkan, dan zona tujuan ≥44×44px dan tidak berdempetan.
5. Buka dasbor orang tua dan dasbor guru pada 320px. **Harapkan**: berfungsi penuh, bukan sekadar tidak pecah.
6. Buka CMS admin pada 320px. **Harapkan**: dapat dibuka dan dinavigasi tanpa tata letak rusak atau kendali yang tidak terjangkau — optimasi desktop-first diterima, kerusakan tidak.
7. Putar ke lanskap pada 375px. **Harapkan**: tetap dapat dipakai; lanskap adalah tampilan tambahan, bukan syarat.

Sebelum rilis, ulangi langkah 1–4 satu putaran pada **satu ponsel Android kelas bawah nyata** — emulator tidak menangkap masalah ukuran jari dan kelambatan sentuh (SC-013).

---

## Scenario 5 — Kesetaraan tamu vs terdaftar (US5, SC-005)

1. Buka pelajaran sebagai tamu, kerjakan sebagian, muat ulang. **Harapkan**: kemajuan masih ada.
2. Daftar dari kondisi itu. **Harapkan**: kemajuan pindah ke akun tanpa hilang.
3. Bandingkan muatan pelajaran tamu vs terdaftar. **Harapkan**: identik.
4. Nonaktifkan penyimpanan lokal peramban. **Harapkan**: pelajaran tetap dapat dikerjakan satu sesi, dengan pemberitahuan bahwa kemajuan tidak tersimpan.

---

## Scenario 6 — Kurikulum dan gerbang publikasi (US6, SC-006, SC-010, SC-012)

1. Periksa metadata sebuah pelajaran. **Harapkan**: kelas, fase, elemen, kutipan CP, `sourceUrl`, `retrievedAt` lengkap.
2. Konfirmasi seluruh pelajaran hasil seed berstatus `REVIEW`; tidak ada yang `PUBLISHED` (SC-010).
3. Coba terbitkan pelajaran yang blok sematannya belum `reviewedBy`. **Harapkan**: `422` yang menyebut syarat mana yang gagal.
4. Verifikasi tautan video:

```bash
pnpm tsx scripts/verify-video-embeds.ts
```

**Harapkan**: keluar nol; setiap video mati terdaftar beserta id-nya (SC-012, FR-016d).

---

## Full gate before calling it done

```bash
pnpm test                 # Vitest, coverage ≥80% (Konstitusi III)
pnpm typecheck            # nol galat tsc, tanpa `any`
pnpm lint
pnpm --filter @aksicendekia/web build   # static export harus berhasil pada 60 pelajaran
pnpm tsx scripts/verify-video-embeds.ts
```

Ambang yang harus lulus, bukan sekadar diamati:

| Gate | Ambang |
|------|--------|
| Cakupan uji | ≥80% baris/fungsi/cabang/pernyataan |
| Invarian katalog | 9 invarian di [data-model.md](./data-model.md) §4 lulus |
| Pemindaian a11y | Nol pelanggaran WCAG 2.1 AA pada seluruh arketipe |
| Pemindaian responsif | Pada 320/375/768/1280px: nol luapan gulir horizontal, nol target interaktif <44×44px, setiap pelajaran tuntas dalam potret (SC-013) |
| Masukan sentuh | 100% soal pemindahan objek tuntas hanya dengan ketukan (SC-014) |
| Anggaran payload | Rute pelajaran ≤120 KB terkompresi di luar runtime bersama |
| Sematan pihak ketiga | Nol permintaan pra-klik; keenam kondisi publish gate ditolak dengan benar |
