# Research & Technical Decisions: Akses Mode Tamu & Penyimpanan Progres Lokal

**Feature Branch**: `009-guest-mode-local-storage` | **Date**: 2026-08-28

---

## 1. Strategi Storage Lokal Klien: IndexedDB vs LocalStorage

### Decision
- Menggunakan arsitektur **Storage Adapter Pattern** berbasis interface `IProgressStorageRepository`.
- Implementasi primer: **IndexedDB** (menggunakan wrapper ringan dan *promise-based* seperti `idb` atau wrapper kustom native tanpa dependensi berlebih) untuk menyimpan riwayat sesi belajar terperinci dan log jawaban.
- Implementasi sekunder/fallback: **LocalStorage** otomatis diaktifkan jika IndexedDB diblokir (misal pada konteks peramban *strict security* atau WebView lama).
- Skema data selalu dibungkus dengan metadata versi (`schema_version: 1`) dan divalidasi saat *load* menggunakan Zod (`GuestProgressStateSchema`).

### Rationale
- `LocalStorage` memiliki batasan kapasitas ketat (umumnya ~5MB per domain) dan bersifat sinkronus sehingga pembacaan payload besar berpotensi memblokir *main UI thread*.
- `IndexedDB` bersifat asinkronus, berkapasitas besar (ratusan MB), dan mampu menangani puluhan riwayat sesi pengerjaan soal tanpa degradasi performa.
- Fallback ke LocalStorage menjamin 100% kompatibilitas di seluruh peramban siswa tanpa *runtime crash*.

### Alternatives Considered
- *Hanya LocalStorage*: Ditolak karena jika siswa mengerjakan ratusan soal, riwayat jawaban dapat melampaui kuota 5MB dan menyebabkan exception `QuotaExceededError`.
- *In-Memory Only*: Ditolak karena data akan hilang begitu halaman di-*refresh* atau tab ditutup, melanggar kebutuhan utama pengguna.

---

## 2. Penilaian Jawaban & Mesin Sesi Belajar di Sisi Klien (Local Session Engine)

### Decision
- Pada Mode Tamu, evaluasi jawaban soal latihan kurikulum berstatus `PUBLISHED` dijalankan di sisi klien menggunakan modul murni yang di-*share* (`LocalSessionEngine`).
- Algoritma normalisasi teks isian singkat (`SHORT_ANSWER`) menerapkan aturan yang identik dengan backend (`004-learning-session-engine`):
  1. Trim spasi awal/akhir dan *collapse multiple whitespace*.
  2. Normalisasi huruf kecil (*lowercase*).
  3. Pembersihan tanda baca periferal di ujung kata (`/[.,!?]+$/`).
  4. Dekomposisi diakritik Unicode NFD.
  5. Pencocokan terhadap daftar `accepted_answers`.

### Rationale
- Memungkinkan pengalaman belajar yang instan, berlatensi 0ms, dan tetap dapat berfungsi saat koneksi internet siswa tidak stabil atau terputus (*offline-capable*).
- Menjamin konsistensi pedagogis antara evaluasi offline/tamu dan evaluasi server bagi siswa terdaftar.

### Alternatives Considered
- *Membuat akun tamu bayangan (Anonymous Shadow Account) di server database*: Ditolak karena membebani database PostgreSQL backend dengan jutaan akun anonim tak bertuan (*bloat database*) dan melanggar prinsip *Zero Server Data Collection* sebelum izin orang tua.

---

## 3. Protokol Migrasi Progres Tamu ke Akun Terdaftar (Cloud Sync)

### Decision
- Endpoint backend `POST /api/v1/sync/guest-progress` menerima payload `GuestSyncPayload` dari klien yang baru saja mendaftar (`/register`) atau login (`/login`).
- **Aturan Penggabungan (Merge Strategy)**:
  1. **XP**: Menambahkan delta XP lokal ke akun terdaftar dengan validasi batas atas wajar (*sanity rate-limiting*: maksimal 500 XP per sesi latihan atau 5000 XP total per migrasi untuk mencegah eksploitasi skrip).
  2. **Modul/Pelajaran Selesai**: Operasi *Set Union* (modul yang sudah selesai di lokal digabungkan dengan modul yang sudah selesai di akun cloud).
  3. **Streak**: Mengambil nilai streak tertinggi atau menghitung kesinambungan tanggal aktivitas terakhir dengan hari ini.
  4. **Riwayat Sesi**: Memasukkan rekaman sesi belajar tamu ke riwayat aktivitas siswa dengan penanda `source: 'GUEST_MIGRATION'`.
- Setelah konfirmasi sukses (HTTP 200 OK), klien mengosongkan state tamu lokal atau menandai flag `migrated_to_user_id: string`.

### Rationale
- Memberikan apresiasi penuh atas jerih payah belajar anak sebelum membuat akun, sehingga anak tidak frustrasi harus mengulang pelajaran dari awal.
- Validasi kewajaran data di backend mencegah manipulasi *client-side crafting* yang dapat merusak integritas papan peringkat.

### Alternatives Considered
- *Abaikan data lokal saat login*: Ditolak karena merugikan siswa yang sudah menyelesaikan banyak modul dalam Mode Tamu.
- *Otomatis timpa data cloud tanpa konfirmasi*: Ditolak karena jika akun cloud sudah memiliki level lebih tinggi (misal akun kakak yang dipinjamkan), penimpaan langsung dapat merusak data akun cloud. Dialog konfirmasi adalah pendekatan paling aman.

---

## 4. Penanganan Mode Penyamaran (Incognito) & Kuota Penuh (Quota Management)

### Decision
- **Deteksi Kuota & Pruning Otomatis**: Jika penyimpanan lokal mendekati kapasitas (> 80% kuota atau gagal menulis record), sistem mengaktifkan strategi *LRU Pruning* (menghapus log detail butir soal dari sesi yang lebih tua dari 30 hari) dengan tetap menjaga nilai agregat (`total_xp`, `streak`, `completed_modules`).
- **Deteksi Mode Penyamaran**: Jika `navigator.storage.estimate()` atau tes persistensi mendeteksi penyimpanan sementara, aplikasi memunculkan banner informatif yang ramah anak: *"Kamu sedang berada di Mode Penyamaran. Agar progresmu tersimpan selamanya, yuk buat akun gratis bersama orang tua!"*.

### Rationale
- Mencegah aplikasi mengalami error fatal atau kehilangan data agregat penting saat memori perangkat terbatas.
- Mengedukasi anak dan orang tua tentang sifat penyimpanan sementara pada peramban privat.
