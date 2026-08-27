# Quickstart Guide: Sistem Progres dan Gamifikasi AksiCendekia

**Feature Branch**: `005-progress-gamification`

---

## Overview

Dokumen ini memberikan panduan cepat untuk menguji dan memverifikasi **Feature 005 - Sistem Progres dan Gamifikasi** secara lokal.

---

## 1. Persiapan Environment & Database

Pastikan tabel Prisma telah dimigrasikan dan seed data awal tersedia:

```bash
# Jalankan migrasi Prisma
pnpm --filter api exec prisma migrate dev --name init_progress_gamification

# Jalankan seeder konfigurasi gamifikasi & badge
pnpm --filter api exec prisma db seed
```

---

## 2. Struktur Konfigurasi Gamifikasi (`config/gamification.json`)

```json
{
  "xpRules": {
    "correctAnswerBaseXp": 10,
    "lessonCompletionBonusXp": 50,
    "perfectScoreBonusXp": 20
  },
  "levelCurve": {
    "baseXp": 100,
    "exponent": 1.5,
    "maxLevel": 50
  },
  "powerups": {
    "initialHintTokens": 3,
    "initialStreakFreezes": 1
  }
}
```

---

## 3. Menjalankan Server & Integration Tests

```bash
# Jalankan unit & integration tests untuk Feature 005
pnpm --filter api test -- progress-gamification

# Jalankan aplikasi secara lokal
pnpm dev
```

---

## 4. Pengujian Verifikasi Utama

### A. Uji Idempotensi Event
1. Kirim event `learning.session.completed` 2x dengan `eventId` yang sama.
2. Verifikasi XP di `/api/v1/students/achievements` hanya bertambah 1x.

### B. Uji Streak Harian Lintas Zona Waktu
1. Ubah timezone profil siswa ke `Asia/Jayapura` (WIT).
2. Selesaikan sesi pada jam 23:30 WIT (14:30 UTC), lalu selesaikan sesi berikutnya pada 00:30 WIT (15:30 UTC).
3. Verifikasi streak bertambah menjadi 2 Hari Beruntun.

### C. Uji Proteksi Race Condition Power-Up
1. Set saldo Token Petunjuk siswa = 1.
2. Kirim 2 request `POST /api/v1/powerups/consume` secara bersamaan (konkuren).
3. Verifikasi 1 request mengembalikan `200 OK` dan 1 request mengembalikan `400 Bad Request`. Saldo di database wajib 0 (tidak negatif).
