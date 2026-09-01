# Quickstart & Validation Guide: Materi Belajar Interaktif

**Feature**: `010-interactive-lesson-content` | **Date**: 2026-09-01 | **Plan**: [plan.md](./plan.md)

Panduan menjalankan dan **membuktikan** fitur bekerja end-to-end. Setiap bagian memetakan langsung ke kriteria sukses di [spec.md](./spec.md). Ini bukan panduan implementasi — detail tugas ada di `tasks.md`.

---

## 0. Prasyarat

| Kebutuhan | Catatan |
|---|---|
| Node.js LTS + `pnpm@9.15.0` | Sesuai `packageManager` di `package.json` |
| PostgreSQL berjalan | Hanya untuk jalur CMS/terautentikasi. Jalur Mode Tamu **tidak** memerlukannya. |
| `apps/api/.env` berisi `DATABASE_URL` dan secret JWT | Ikuti pola yang sudah dipakai fitur sebelumnya |
| Peramban dengan DevTools throttling | Untuk verifikasi SC-004 |

```bash
pnpm install
```

---

## 1. Migrasi & seed konten

```bash
# Terapkan migrasi additive (4 tabel baru, 4 enum baru, 2 nilai QuestionType baru,
# 3 kolom tambahan pada lessons)
pnpm --filter api prisma:migrate

# Seed: capaian pembelajaran -> katalog widget -> 12 pelajaran (idempoten)
pnpm --filter api seed
```

**Hasil yang diharapkan**

- Tabel `curriculum_achievements`, `lesson_content_blocks`, `media_assets`, `interactive_widget_types` terbentuk.
- `curriculum_achievements` berisi **4 baris** (satu per fase: `FOUNDATION`, `FASE_B`, `FASE_D`, `FASE_E`), masing-masing dengan `achievementText`, `sourceDocument`, `sourceUrl`, dan `retrievedAt` terisi.
- `interactive_widget_types` berisi **7 baris** berstatus `SUPPORTED`.
- Terdapat **12 pelajaran** berstatus **`REVIEW`** (3 per jenjang TK/SD/SMP/SMA), masing-masing dengan ≥1 blok konsep, ≥1 blok `INTERACTIVE_WIDGET`, dan **10 butir soal**.
- **Nol pelajaran berstatus `PUBLISHED`** dari hasil seed — penerbitan adalah aksi manusia (FR-030a).
- Tiga pelajaran contoh lama bertanda `listing = HIDDEN_LEGACY` dengan `supersededByLessonId` terisi.
- Menjalankan ulang `seed` tidak menggandakan baris.

**Verifikasi cepat**

```bash
pnpm --filter api exec prisma studio
```

- `lessons` → filter `status = REVIEW`, hitung **12**; filter `status = PUBLISHED`, hitung **0**.
- Buka satu pelajaran → `contentBlocks` terurut `orderIndex` mulai 0, dan `curriculumAchievementId` terisi.
- Buka satu pelajaran TK → setiap butir soal punya `options[].illustrationAssetId` dan `narrationText`.

---

## 2. Menjalankan aplikasi

Karena seluruh konten berstatus `REVIEW`, jalur produksi belum akan menampilkannya. Untuk validasi lokal, nyalakan **saklar pratinjau** (default mati, dan wajib mati di build produksi):

```bash
# Terminal 1 — backend
CONTENT_PREVIEW_INCLUDE_REVIEW=true pnpm --filter api dev     # http://localhost:4000

# Terminal 2 — frontend
NEXT_PUBLIC_CONTENT_PREVIEW=true pnpm dev                     # http://localhost:3000
```

> Di PowerShell: `$env:CONTENT_PREVIEW_INCLUDE_REVIEW='true'; pnpm --filter api dev`

**Kriteria lulus saklar**

- [ ] Tanpa kedua variabel, `/explore` **tidak** menampilkan 12 pelajaran baru (hanya yang `PUBLISHED`).
- [ ] Ada uji otomatis yang gagal bila build produksi dijalankan dengan salah satu saklar bernilai `true`.

---

## 3. Validasi Mode Tamu — tanpa login, tanpa backend (SC-010, FR-012)

> Hentikan `apps/api` terlebih dahulu. Jalur ini WAJIB tetap berfungsi penuh karena produksi adalah static export tanpa API.

1. Buka `http://localhost:3000/explore`.
2. Ganti jenjang ke **TK**, lalu **SD**, **SMP**, **SMA** — masing-masing menampilkan 3 pelajaran.
3. Buka satu pelajaran per jenjang.

**Kriteria lulus**

- [ ] Penelusuran konsep tampil sebelum latihan, memuat ≥1 ilustrasi/animasi **dan** ≥1 komponen interaktif (FR-010).
- [ ] Menggeser/menyentuh komponen interaktif memperbarui visual seketika tanpa memuat ulang halaman (FR-011).
- [ ] Tidak ada permintaan jaringan keluar sama sekali di tab Network selain aset milik sendiri (FR-025, Prinsip VII).
- [ ] Blok animasi memiliki tombol Putar/Jeda/Ulang dan transkrip yang dapat dibuka (FR-014).
- [ ] Menyelesaikan 10 soal menghasilkan layar ringkasan, dan progres tersimpan setelah refresh (Feature 009 tidak regresi).

---

## 4. Validasi jalur terautentikasi (FR-019, anti-cheat)

Jalankan kembali `apps/api`, login sebagai siswa, mulai sesi pada pelajaran interaktif.

**Kriteria lulus**

- [ ] Konten penelusuran konsep **identik** dengan yang tampil di Mode Tamu (SC-010).
- [ ] Di tab Network, respons penyajian soal **tidak memuat** `correctMapping`, `targetValue`, `tolerance`, `correctOptionId`, `acceptedAnswers`, maupun `matchingPairs` sebelum siswa menjawab.
- [ ] Mengirim skor palsu dari klien tidak memengaruhi hasil — nilai tetap dihitung server.
- [ ] Jawaban benar/salah untuk `DRAG_DROP_GROUPING` dan `NUMBER_LINE` dinilai konsisten dengan Mode Tamu untuk input yang sama.

**Uji konsistensi klien-server** (paling penting setelah unifikasi grader):

```bash
pnpm --filter content-kit test
```
Suite ini menjalankan tabel kasus yang sama terhadap `gradeQuestion` — satu implementasi, dipakai kedua sisi.

---

## 5. Validasi aksesibilitas (SC-005, SC-006, FR-022, FR-023)

### 5.1 Otomatis

```bash
pnpm --filter @aksicendekia/ui test
pnpm --filter web test
```

**Kriteria lulus**

- [ ] Nol pelanggaran `vitest-axe` pada seluruh komponen di `components/interactive/`, `components/lesson/`, dan `components/question/`.
- [ ] Setiap komponen punya uji yang menyelesaikan alur interaksi **tanpa pointer**.

### 5.2 Manual — keyboard saja

Cabut/abaikan tetikus. Untuk setiap pelajaran interaktif:

- [ ] `Tab` menjangkau seluruh kontrol dengan indikator fokus yang terlihat jelas.
- [ ] Garis bilangan: panah kiri/kanan melangkah, `Home`/`End` ke ujung, nilai terbaca via `aria-valuetext`.
- [ ] Seret-dan-letakkan: pilih item dengan `Enter`, pindah ke kelompok dengan `Tab`, tempatkan dengan `Enter`; perubahan diumumkan.
- [ ] Seluruh 10 soal dapat diselesaikan tanpa tetikus (SC-006).

### 5.3 Manual — reduced motion (FR-013)

Aktifkan *Reduce motion* di OS (Windows: Settings → Accessibility → Visual effects → Animation effects → Off), lalu muat ulang.

- [ ] Animasi konsep terbuka dalam mode langkah manual, tanpa gerak otomatis.
- [ ] Umpan balik jawaban benar memakai perubahan statis (ikon + warna + teks), bukan animasi.
- [ ] Seluruh informasi konsep tetap tersedia sebagai teks.

### 5.4 Manual — kontras & target sentuh

- [ ] Kontras teks ≥ 4.5:1 pada keempat tema jenjang (`data-jenjang` = `tk`/`sd`/`smp`/`sma`).
- [ ] Seluruh target interaktif ≥ 44×44px pada viewport 360px.

### 5.5 Jenjang TK — dapat dikerjakan tanpa membaca (SC-013, FR-017a–d)

Buka ketiga pelajaran TK.

**Uji "teks disembunyikan"** — di DevTools, jalankan penyembunyian seluruh teks pada area soal (mis. setel `color: transparent` pada kontainer soal), lalu coba jawab:

- [ ] Setiap butir soal tetap dapat dijawab benar hanya dari gambar/ikon (SC-013).
- [ ] Setiap pilihan jawaban punya pembeda visual, bukan hanya label teks.
- [ ] Jumlah pilihan per soal 2–3, bukan 4–5.
- [ ] Tidak ada soal isian singkat (`SHORT_ANSWER`) di jenjang TK.

**Kontrol "dengarkan"**:

- [ ] Tombol muncul dan membacakan soal saat ditekan (pada perangkat yang punya suara Bahasa Indonesia).
- [ ] Menekan berulang-cepat tidak menghasilkan suara bertindih — pembacaan sebelumnya dihentikan.
- [ ] Tombol dapat difokus dan diaktifkan dengan keyboard.
- [ ] Tidak ada permintaan jaringan keluar saat tombol ditekan (bukan layanan pihak ketiga).
- [ ] Tidak ada pembacaan otomatis saat halaman dimuat.

**Degradasi tanpa suara Bahasa Indonesia** — simulasikan dengan meng-override `speechSynthesis.getVoices()` agar mengembalikan daftar tanpa `lang` berawalan `id`:

- [ ] Tombol "dengarkan" tidak dirender sama sekali (bukan tombol mati yang membingungkan).
- [ ] Pelajaran tetap dapat diselesaikan penuh lewat gambar/ikon.

---

## 6. Validasi kinerja (SC-004)

```bash
pnpm build
pnpm --filter web start     # atau layani apps/web/out dengan server statis
```

Di DevTools: **Network → Fast 3G**, **Performance → CPU 4× slowdown**, centang *Disable cache*.

- [ ] Layar konsep pertama terbaca dan interaktif ≤ **3 detik**.
- [ ] Seluruh pelajaran (termasuk widget lazy) siap ≤ **10 detik**.
- [ ] Tidak ada permintaan video/animasi berat sebelum siswa menekan Putar (FR-014).
- [ ] Tambahan JS per pelajaran ≤ **60 KB gzip** di luar chunk bersama — periksa di tab Network, filter JS.

---

## 7. Validasi ketahanan media (SC-009, FR-015)

Di DevTools → Network, blokir pola permintaan `*/assets/*` (Block request pattern), lalu muat ulang pelajaran.

- [ ] Ilustrasi cadangan/teks penjelasan tampil menggantikan media yang gagal.
- [ ] Pelajaran tetap dapat **diselesaikan sampai layar ringkasan**.
- [ ] Tidak ada layar putih, galat tak tertangani, atau komponen yang crash.

**Uji widget usang**: ubah sementara satu blok agar memakai `widgetType` yang tidak ada (mis. `TIDAK_ADA`).

- [ ] `UnsupportedWidgetFallback` tampil dengan penjelasan teks; pelajaran tetap selesai (FR-009).

---

## 8. Validasi alur CMS & gerbang aksesibilitas (FR-004, FR-030)

Login sebagai `ADMIN`, buka editor pelajaran.

- [ ] Menambah blok `ILLUSTRATION` **tanpa** teks alternatif, lalu menekan *Ajukan ke Review* → ditolak `422` dengan daftar pelanggaran yang menyebut `A1` dan blok terkait.
- [ ] Melengkapi teks alternatif, takarir, transkrip, dan ilustrasi cadangan → transisi ke `REVIEW` berhasil.
- [ ] Mengunggah gambar > 512 KB atau format tidak diizinkan → ditolak dengan pesan spesifik (FR-005).
- [ ] Mencoba menyimpan `storageKey` berupa URL eksternal → ditolak (FR-003, anti-hotlink).
- [ ] Menyunting pelajaran `PUBLISHED` → `409`, dan alur versi baru berjalan tanpa mengubah versi yang sedang tampil ke siswa (FR-007).
- [ ] Pratinjau merender blok dan widget persis seperti tampilan siswa (FR-006).
- [ ] Pelajaran tanpa `curriculumAchievementId` ditolak dengan pelanggaran `C3` (FR-008a).
- [ ] Pelajaran TK dengan pilihan jawaban tanpa gambar ditolak dengan pelanggaran `A7`.

**Gerbang penerbitan (FR-030a)** — ini yang menjaga tinjauan manusia tetap bermakna:

- [ ] `POST /api/v1/admin/lessons/:id/publish` berhasil hanya dari status `REVIEW`; dari status lain → `409`.
- [ ] Setelah penerbitan, pelajaran tampil di jalur produksi **tanpa** saklar pratinjau.
- [ ] Ada uji yang membuktikan skrip seed tidak pernah menghasilkan `status = PUBLISHED`.
- [ ] Tidak ada jalur lain (migrasi, tugas terjadwal, endpoint lain) yang dapat menulis `PUBLISHED`.

---

## 9. Validasi regresi pelajaran lama (FR-031)

- [ ] Pelajaran lama tanpa `contentBlocks` tetap tampil dan dapat diselesaikan seperti sebelumnya.
- [ ] Rute `/explore/lesson_m1`, `/explore/lesson_m2`, `/explore/lesson_i1` tetap dapat diakses (**tidak 404**) — ini pembeda antara "disembunyikan" dan "dihapus".
- [ ] Ketiganya **tidak muncul** di daftar katalog `/explore` (FR-031a).
- [ ] Membuka rute legacy menampilkan tautan/spanduk menuju padanan interaktifnya (`supersededByLessonId`).
- [ ] Seluruh id pelajaran — **termasuk yang tersembunyi** — muncul di hasil `generateStaticParams`; dijamin oleh uji, bukan daftar manual.

```bash
pnpm --filter web test    # memuat uji "setiap id katalog ada di generateStaticParams"
```

---

## 10. Gerbang kualitas akhir

```bash
pnpm lint                 # tsc --noEmit di seluruh paket; nol error, nol `any`
pnpm test                 # seluruh suite Vitest
pnpm --filter api test:coverage
```

- [ ] Nol error TypeScript di seluruh workspace (Prinsip III).
- [ ] Cakupan **≥80%** pada `packages/content-kit`, modul `content-blocks` di API, dan komponen interaktif di `packages/ui`.
- [ ] `packages/ui` benar-benar ikut terjalankan oleh `pnpm test` (script `test` sudah ditambahkan — sebelumnya paket ini hanya punya `lint`).

---

## 11. Tinjauan orisinalitas konten (SC-012, FR-029)

Sebelum menandai fitur selesai, lakukan tinjauan manual atas 12 pelajaran:

- [ ] Naskah, angka soal, dan ilustrasi tidak menyalin Mathigon, AdaptedMind, IXL, atau sumber berhak cipta lain.
- [ ] Setiap aset yang bukan buatan sendiri memiliki `licenseNote` dan `attribution` terisi.
- [ ] Setiap pelajaran memiliki `learningObjective` yang terpetakan ke capaian pembelajaran Kurikulum Merdeka pada fase yang benar (SC-008).

**Verifikasi kutipan capaian pembelajaran (FR-008a, SC-008)** — bagian ini tidak boleh dilewati, karena inilah yang membedakan pemetaan kurikulum yang sah dari yang terdengar benar:

- [ ] Buka `sourceUrl` setiap baris `curriculum_achievements`; halaman benar-benar dapat diakses dan berasal dari domain resmi kementerian.
- [ ] `achievementText` **sama persis** dengan teks di dokumen sumber — bukan parafrase, bukan ringkasan.
- [ ] Fase dan elemen pada baris CP cocok dengan fase dan topik pelajaran yang merujuknya.
- [ ] `retrievedAt` terisi, sehingga kutipan dapat diaudit ulang bila kurikulum direvisi.

---

## Ringkasan pemetaan validasi → kriteria sukses

| Bagian | Membuktikan |
|---|---|
| §1, §2 | SC-011 (12 pelajaran di `REVIEW`), FR-030a, FR-030b |
| §3, §4 | SC-010, FR-010–FR-012, FR-019 |
| §5.1–5.4 | SC-005, SC-006, FR-013, FR-022, FR-023 |
| §5.5 | SC-013, FR-017a–FR-017d |
| §6 | SC-004, FR-014, FR-016 |
| §7 | SC-009, FR-009, FR-015 |
| §8 | FR-003–FR-008a, FR-030, FR-030a |
| §9 | FR-031, FR-031a |
| §10 | Prinsip III (TDD & cakupan 80%) |
| §11 | SC-008, SC-012, FR-008a, FR-029 |

Belum tercakup di panduan ini karena memerlukan responden manusia: **SC-001** (pemahaman konsep), **SC-002** (penilaian menyenangkan), **SC-003** (tingkat penyelesaian), dan **SC-007** (waktu penulis menyusun pelajaran). Keempatnya diukur lewat pengujian termoderasi setelah rilis percontohan.
