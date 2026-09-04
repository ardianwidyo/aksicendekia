# Phase 0 Research: Fokus Jenjang SD — Revamp Matematika Interaktif

**Feature**: `011-sd-math-focus` | **Date**: 2026-09-02

Delapan hal yang tidak dapat ditentukan dari spec saja. Masing-masing ditutup di bawah ini sehingga Phase 1 tidak menyisakan `NEEDS CLARIFICATION`.

---

## R1 — Sumbu kelas (kelas 1–6) tidak ada di model mana pun

**Temuan**: `Lesson` hanya punya `educationStage` + `phase`. `CurriculumPhase` SD hanya sampai granularitas fase (`FASE_A` = kelas 1–2, `FASE_B` = kelas 3–4, `FASE_C` = kelas 5–6). `Unit` tidak menyimpan kelas. Tidak ada satu pun jalur untuk menjawab "materi kelas 4".

**Decision**: Tambah `gradeLevel Int?` pada `Lesson` (aditif, nullable, tanpa backfill paksa) dan `gradeLevel: 1..6` pada tipe authoring `InteractiveLesson`. Unit dipakai sebagai pengelompok topik di dalam kelas, bukan pembawa kelas. Katalog per kelas dibangun dari `gradeLevel`, bukan dari judul unit.

**Rationale**: Nullable + aditif berarti satu migrasi tanpa risiko terhadap data TK/SMP/SMA yang ada. Angka integer dapat diindeks, divalidasi Zod (`int().min(1).max(6)`), dan diurutkan tanpa parsing string. Relasi fase→kelas tetap dapat diturunkan (`gradeLevel 1|2 → FASE_A`) dan dijadikan invarian uji, bukan data ganda yang bisa saling bertentangan.

**Alternatives considered**:
- *Menurunkan kelas dari `Unit.title`* — ditolak: rapuh terhadap perubahan redaksi judul, tidak dapat diindeks, tidak dapat divalidasi skema.
- *Menambah nilai enum fase per kelas* (`FASE_B_KELAS_3`) — ditolak: merusak pemetaan resmi Kurikulum Merdeka dan memutus `CurriculumAchievement.@@unique([phase, subjectCode, element])`.
- *Tabel `Grade` tersendiri* — ditolak: YAGNI. Kelas SD adalah 6 nilai tetap tanpa atribut sendiri.

---

## R2 — Capaian Pembelajaran SD Matematika belum lengkap

**Temuan**: `packages/content-kit/src/curriculum/achievements.ts` hanya memuat **satu** baris SD (`cp-fase-b-matematika-bilangan`). Seluruh baris yang ada bertanda `needsPrimaryVerification: true` karena host PDF resmi tidak terjangkau dari lingkungan build saat Feature 010.

**Decision**: Perluas ke **15 baris** — Fase A, B, C × lima elemen Matematika SD (Bilangan; Aljabar; Pengukuran; Geometri; Analisis Data dan Peluang) — bersumber dari Keputusan Kepala BSKAP Kemendikbudristek No. 032/H/KR/2024. Teks diambil saat implementasi lewat pencarian web, disimpan **verbatim** beserta `sourceDocument`, `sourceUrl`, dan `retrievedAt`, dan ditandai `needsPrimaryVerification: true` sampai peninjau manusia mencocokkannya dengan salinan resmi. Mempertahankan pola dan konstanta yang sudah ada (`SK_BSKAP_032_2024`).

**Rationale**: Konstitusi VIII dan FR-032 menuntut ketertelusuran, bukan hafalan. Menulis CP dari ingatan model adalah cara tercepat menghasilkan katalog yang terlihat benar tetapi tidak dapat dipertanggungjawabkan ke guru. Bendera verifikasi menjaga agar ketidakpastian terlihat, bukan tersembunyi.

**Alternatives considered**:
- *Menulis CP dari pengetahuan model* — ditolak: melanggar FR-032, dan justru risiko terbesar fitur ini karena 60 pelajaran menggantung pada 15 baris tersebut.
- *Satu CP generik per fase* — ditolak: FR-011 menuntut seluruh elemen terwakili, yang hanya dapat diverifikasi bila elemen terdaftar terpisah.

---

## R3 — Mekanisme mode fokus pada aplikasi static export

**Temuan**: `apps/web` memakai `output: 'export'` — tidak ada runtime server, tidak ada middleware, tidak ada redirect sisi server. Katalog dibangun dari `@aksicendekia/content-kit` yang dibundel saat build. `apps/api` melayani jalur pengguna terdaftar dan CMS.

**Decision**: Satu modul `packages/content-kit/src/focus/focus-config.ts` sebagai sumber tunggal:

```
FOCUS_CONFIG = { enabled, stages: ['SD'], subjectCodes: ['MATH_SD'] }
```

dibaca dari variabel lingkungan build (`NEXT_PUBLIC_FOCUS_ENABLED`, dan padanannya di api) dengan **default aktif**, divalidasi Zod, lalu diekspor sebagai predikat murni (`isStageInFocus`, `isSubjectInFocus`, `filterLessonsForFocus`). `apps/web` memakainya di `generateStaticParams`, komponen navigasi, dan katalog; `apps/api` memakainya di service `curriculum` dan `sync`. Rute yang tersembunyi tetap dirender sebagai halaman pengalihan ramah sisi klien ke `/explore` (FR-005), bukan dihapus dari `generateStaticParams`.

**Rationale**: Satu predikat dipakai dua aplikasi mencegah drift antara apa yang disaring web dan apa yang disaring api — kegagalan paling mungkin dari fitur bertipe "sembunyikan". Merender rute tersembunyi sebagai pengalihan, bukan menghapusnya, memenuhi FR-005 tanpa server dan menghindari 404 pada tautan yang sudah beredar.

**Alternatives considered**:
- *Menghapus rute non-fokus dari `generateStaticParams`* — ditolak: menghasilkan 404 mentah, melanggar FR-005.
- *Feature flag runtime dari database* — ditolak: static export tidak dapat membacanya saat build, dan menambah kebutuhan jaringan pada jalur tamu.
- *Menyaring di komponen navigasi saja* — ditolak: konten tetap bocor lewat pencarian, tautan langsung, dan respons api.

---

## R4 — Fasad video YouTube yang memenuhi enam syarat Konstitusi VI

**Temuan**: `VideoBlock.tsx` yang ada memakai `<video preload="none">` untuk berkas self-hosted dan belum pernah diisi. Konstitusi v1.2.0 butir 2 mensyaratkan **nol permintaan jaringan ke domain penyedia sebelum klik putar**. Pratinjau bawaan YouTube dilayani dari `i.ytimg.com` — memakainya akan melanggar butir 2 sekaligus larangan hotlink.

**Decision**: Komponen baru `EmbeddedVideoBlock.tsx` berpola fasad:

1. Render awal: gambar pratinjau **self-hosted** dari `public/assets/lessons/sd/...`, judul, durasi, atribusi penerbit, dan tombol putar 44x44px yang dapat difokus keyboard. Tidak ada `<iframe>`, tidak ada `<link rel=preconnect>`, tidak ada skrip penyedia.
2. Setelah aktivasi sengaja: sisipkan `<iframe src="https://www.youtube-nocookie.com/embed/{videoId}?autoplay=1&rel=0&modestbranding=1">` dengan `allow` seminimal mungkin dan tanpa parameter identitas apa pun.
3. Selalu berdampingan dengan blok `ANIMATION` self-hosted pada pelajaran yang sama sehingga konsep tetap utuh bila sematan diblokir (butir 1).

Metadata sematan tidak disimpan di komponen melainkan di `lessons/video-registry.ts` dan direplikasi ke tabel `VideoEmbed` saat seed (butir 5).

**Rationale**: Fasad adalah satu-satunya pola yang memenuhi butir 2 secara harfiah dan dapat dibuktikan uji — uji dapat menegaskan bahwa DOM awal tidak memuat `iframe` dan tidak ada URL pihak ketiga. `youtube-nocookie.com` adalah varian privacy-enhanced yang disyaratkan butir 3. Pratinjau self-hosted menutup celah `i.ytimg.com` yang mudah terlewat.

**Alternatives considered**:
- *`<iframe>` langsung dengan `loading="lazy"`* — ditolak: `lazy` hanya menunda, tetap memuat tanpa tindakan pengguna; melanggar butir 2.
- *Pustaka `lite-youtube-embed` dari CDN* — ditolak: memuat aset pihak ketiga (Konstitusi VI) dan menambah dependensi untuk komponen ~80 baris.
- *Pratinjau dari `i.ytimg.com`* — ditolak: hotlink pihak ketiga dan permintaan jaringan pra-klik.

---

## R5 — Menghasilkan 60 pelajaran tanpa menulis 60 pelajaran

**Temuan**: Pola Feature 010 menulis pelajaran sebagai objek literal. Tiga pelajaran SD memakan ~370 baris. Diekstrapolasi ke 60 pelajaran → sekitar 7.400 baris literal, melanggar batas berkas 800 baris, FR-037, dan permintaan efisiensi pengguna.

**Decision**: Lapisan **arketipe berparameter**. Sekitar 10 pabrik (`place-value`, `number-line`, `fractions`, `operations`, `measurement`, `geometry`, `data-chart`, `time`, `money`, `patterns`), masing-masing sebuah fungsi murni:

```
makePlaceValueLesson(spec: PlaceValueSpec): InteractiveLesson
```

Berkas per kelas (`sd/kelas-4.ts`) hanya berisi **spesifikasi data** — judul, rentang angka, konteks cerita, id CP, id video, urutan — dan memanggil pabriknya. Pabrik yang menyusun blok konten, soal, distraktor, petunjuk bertahap, dan pembahasan. Ilustrasi mengikuti pola sama: komponen SVG generik (`PlaceValueBlocks`, `NumberLineStrip`, …) yang menerima data, bukan 60 berkas SVG tangan.

**Rationale**: Memindahkan pertumbuhan dari kode ke data. Menambah pelajaran ke-61 berarti menambah satu objek spec, bukan satu berkas. Kebenaran matematis diuji sekali per pabrik lalu berlaku untuk seluruh instansinya — satu-satunya cara memvalidasi ~1.800 butir soal secara mesin. Juga menjaga tiap berkas kelas jauh di bawah 800 baris (Konstitusi/coding-style).

**Alternatives considered**:
- *60 berkas pelajaran literal* — ditolak: tidak terverifikasi, drift kualitas antar kelas, melanggar FR-037.
- *Menghasilkan konten saat runtime dari LLM* — ditolak: tidak deterministik, tidak dapat ditinjau manusia sebelum `PUBLISHED`, melanggar Konstitusi VIII.
- *Mengimpor bank soal pihak ketiga* — ditolak: FR-035, risiko hak cipta.

---

## R6 — Anggaran payload 60 pelajaran pada static export

**Temuan**: `apps/web` membundel `INTERACTIVE_LESSONS` sebagai satu array. Pada 12 pelajaran ini tidak terasa; pada 60 pelajaran dengan ≥4 blok dan 10 soal masing-masing, mengimpor seluruh katalog ke halaman katalog akan menyeret seluruh badan pelajaran ke bundel pertama dan mengancam SC-007.

**Decision**: Pisahkan **indeks** dari **badan**. `catalog.ts` mengekspor `LESSON_INDEX` — hanya metadata (id, judul, ringkasan, kelas, durasi, kesulitan, urutan, id CP). Badan pelajaran (blok + soal) dimuat per rute lewat `import()` dinamis per modul kelas. Uji anggaran menegakkan ambang ukuran indeks.

**Rationale**: Halaman katalog hanya butuh metadata; hanya rute pelajaran yang butuh badan. Pemisahan ini membuat biaya per pelajaran tambahan mendekati nol untuk katalog dan menjaga rute pelajaran di bawah anggaran 120 KB.

**Alternatives considered**:
- *Mempertahankan satu array* — ditolak: melanggar anggaran kinerja pada volume target.
- *Mengambil konten dari api saat runtime* — ditolak: memutus jalur tamu offline-toleran (FR-026, Feature 009) dan menambah kegagalan jaringan pada jalur anak.

---

## R7 — Deteksi video mati tanpa runtime server

**Temuan**: FR-016d menuntut sistem mendeteksi dan melaporkan sematan yang dihapus, dijadikan privat, atau diblokir wilayah. `apps/web` tidak punya runtime server, dan memeriksa dari klien akan memicu permintaan pihak ketiga pra-klik (melanggar Konstitusi VI butir 2).

**Decision**: Pemeriksaan **saat build/CI**, bukan saat penyajian. Skrip `scripts/verify-video-embeds.ts` membaca `video-registry.ts`, memanggil endpoint oEmbed publik YouTube per id, dan gagal bila ada yang tidak mengembalikan 200. Dijalankan di CI dan sebelum rilis; hasilnya memperbarui `verifiedAt` di registri. Di sisi penyajian, kegagalan sematan ditangani lewat degradasi anggun yang sudah disyaratkan butir 1 — animasi self-hosted tetap menyampaikan konsep.

**Rationale**: Memindahkan deteksi ke lingkungan yang boleh berbicara dengan pihak ketiga (CI), menjauhkannya dari peramban anak. Memenuhi FR-016d tanpa menyentuh SC-011.

**Alternatives considered**:
- *Ping dari klien saat halaman dimuat* — ditolak: melanggar Konstitusi VI butir 2 dan SC-011.
- *Endpoint api proxy pemeriksa* — ditolak: jalur tamu statis tidak memanggil api; menambah permukaan tanpa manfaat.

---

## R8 — Dampak penyaringan fokus ke permukaan hilir

**Temuan**: Keputusan klarifikasi Q1 mempertahankan peta misi, papan peringkat, pencapaian, dasbor orang tua, dasbor guru, CMS, dan langganan tetap aktif. Permukaan-permukaan itu membaca pelajaran, tantangan harian, dan penugasan yang mungkin merujuk jenjang non-SD. Bila konten non-SD tersaring, kueri mereka dapat mengembalikan himpunan kosong dan merender halaman kosong atau galat.

**Decision**: Perlakukan "himpunan kosong" sebagai keadaan pertama-kelas, bukan kasus tepi. Setiap permukaan hilir yang membaca katalog wajib punya empty state ber-i18n dan uji yang menjalankannya dengan mode fokus aktif dan data non-SD tersaring habis. Filter fokus diterapkan di lapisan service (`curriculum`, `sync`) sehingga seluruh pembaca hilir mewarisinya tanpa duplikasi predikat. Data historis siswa jenjang lain **tidak** dihapus atau dimigrasi (FR-004).

**Rationale**: FR-006 secara eksplisit melarang halaman kosong atau galat. Menerapkan filter di service, bukan di tiap pemanggil, mencegah satu permukaan terlewat — mode kegagalan paling mungkin mengingat jumlah permukaan yang tetap aktif.

**Alternatives considered**:
- *Menyaring di setiap pemanggil* — ditolak: sembilan permukaan, sembilan peluang lupa.
- *Menyembunyikan permukaan hilir juga* — ditolak: bertentangan dengan keputusan klarifikasi Q1.
- *Memigrasi data jenjang lain* — ditolak: melanggar FR-004 (sembunyikan, bukan hapus).
