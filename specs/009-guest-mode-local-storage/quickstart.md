# Quickstart & Developer Guide: Akses Mode Tamu & Penyimpanan Progres Lokal

**Feature Branch**: `009-guest-mode-local-storage` | **Date**: 2026-08-28

---

## 1. Menjalankan Lingkungan Lokal

Pastikan dependensi monorepo telah terpasang:
```bash
pnpm install
```

Jalankan aplikasi frontend dan backend secara bersamaan:
```bash
pnpm dev
```

Akses aplikasi web di `http://localhost:3000`.

---

## 2. Menguji Mode Tamu Secara Manual

1. **Buka Peramban Baru (Tanpa Login)**:
   - Akses `http://localhost:3000`.
   - Perhatikan bahwa aplikasi langsung menyajikan halaman jelajah materi dan seleksi jenjang (TK, SD, SMP, SMA) tanpa meminta login.
2. **Ubah Profil Tamu**:
   - Klik avatar di pojok kanan atas, ubah nama panggilan menjadi "Budi Cerdas" dan pilih avatar Kancil.
   - Refresh halaman browser, pastikan nama dan avatar tetap muncul.
3. **Kerjakan Latihan Soal**:
   - Pilih modul "Matematika SD Kelas 1 - Berhitung 1-10".
   - Jawab butir soal hingga selesai.
   - Periksa layar hasil: XP bertambah 50 XP, streak harian menjadi 1 hari.
4. **Verifikasi Persistensi Storage**:
   - Tutup tab atau restart browser, lalu buka kembali `http://localhost:3000`.
   - Pastikan XP tetap 50 dan modul matematika bertanda selesai (centang hijau).
5. **Uji Reset Data**:
   - Buka Pengaturan -> "Reset Progres Lokal".
   - Konfirmasi reset.
   - Pastikan XP kembali menjadi 0.
6. **Uji Migrasi Akun**:
   - Kumpulkan minimal 50 XP di Mode Tamu.
   - Klik tombol "Daftar / Simpan Progres" di banner atas.
   - Selesaikan pendaftaran akun siswa baru.
   - Konfirmasi dialog migrasi: *"Simpan progres belajarmu ke akun barumu"*.
   - Verifikasi bahwa profil cloud memiliki total XP yang sudah dikumpulkan.

---

## 3. Menjalankan Automated Tests (Vitest)

Jalankan seluruh pengujian unit & integrasi untuk modul penyimpanan lokal:
```bash
# Jalankan test storage repository & local gamification engine
pnpm --filter @aksicendekia/web test

# Jalankan test endpoint sync backend
pnpm --filter @aksicendekia/api test
```
