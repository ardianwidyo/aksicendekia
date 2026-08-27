# Quickstart & Validation Guide: Mesin Sesi Belajar AksiCendekia

**Feature Branch**: `004-learning-session-engine`

---

## 1. Prerequisites & Setup Commands

Pastikan dependensi monorepo dan basis data PostgreSQL sudah siap:

```bash
# 1. Pastikan server PostgreSQL lokal berjalan
pnpm --filter api prisma migrate dev

# 2. Seed data kurikulum (dari Feature 003)
pnpm --filter api prisma db seed

# 3. Jalankan pengujian Vitest di backend
pnpm --filter api test
```

---

## 2. Manual & End-to-End Validation Scenarios

### Scenario 1: Zero Key Answer Leakage (Anti-Cheat) Verification
1. Login sebagai siswa di `apps/web` atau gunakan Postman JWT token `SISWA`.
2. Buat sesi belajar baru via `POST /api/v1/sessions` dengan `lessonId` berstatus `PUBLISHED`.
3. Periksa JSON payload respons `currentQuestion`:
   - ✅ Memuat `id`, `type`, `prompt`, dan `options`.
   - ❌ **TIDAK MEMUAT** `correct_option_id`, `accepted_answers`, `matching_pairs`, atau `explanation`.

---

### Scenario 2: Server-Side Grading & Normalized Short Answer Tolerance
1. Kirim submisi jawaban untuk soal `SHORT_ANSWER` dengan kunci `"Jakarta"`:
   ```bash
   POST /api/v1/sessions/:id/answers
   Header: Idempotency-Key: <UUIDv4>
   Body: { "questionId": "...", "answer": { "type": "SHORT_ANSWER", "text": "  JAKARTA. " } }
   ```
2. Verify response:
   - ✅ `isCorrect: true`
   - ✅ `explanation` disajikan setelah jawaban dikirim.

---

### Scenario 3: Tactile UI & Emerald Theme Verification (Frontend)
1. Buka halaman sesi belajar di `apps/web` (`/session/:id`).
2. Pilih salah satu opsi jawaban:
   - ✅ Tombol memperlihatkan animasi "depress" (bayangan bawah menghilang dan tombol bergeser 2px ke bawah).
3. Setelah menekan "Kirim Jawaban":
   - ✅ Opsi benar ditandai dengan warna **Emerald (`#00855b`)**.
   - ❌ Jika salah, opsi pilihan siswa berwarna **Rose (`#ba1a1a`)** dan jawaban benar disorot warna Emerald.

---

### Scenario 4: Pause, Resume, & 24h Auto-Expire
1. Tekan "Jeda Sesi" -> memanggil `POST /api/v1/sessions/:id/pause`. Status sesi menjadi `PAUSED`.
2. Tekan "Lanjutkan Belajar" -> memanggil `POST /api/v1/sessions/:id/resume`. Status sesi kembali `IN_PROGRESS` pada soal yang sama.
3. Ubah `expiresAt` sesi di basis data menjadi masa lalu (`NOW() - 1 hour`).
4. Coba kirim jawaban -> API mengembalikan `409 Conflict` (`Session has expired after 24 hours of inactivity`).

---

### Scenario 5: Layar Hasil & Double-Completion Guard
1. Jawab butir soal terakhir -> memanggil `POST /api/v1/sessions/:id/complete`.
2. Verify response:
   - ✅ `score` dihitung otomatis oleh server `(correctCount / totalQuestions) * 100`.
   - ✅ Ringkasan soal yang salah disajikan beserta pembahasan.
   - ✅ Event `learning.session.completed` tercatat di tabel `outbox_events`.
3. Panggil ulang `POST /api/v1/sessions/:id/complete` (pengulangan klik/network retry):
   - ✅ Server mengembalikan respons ringkasan yang sama tanpa membuat event `outbox_events` ganda.

---

## 3. Automated Verification Commands

```bash
# Pengujian Unit & Integrasi Backend (Vitest)
pnpm --filter api test apps/api/src/modules/session/__tests__/session.test.ts

# Pengujian Linting & Typecheck Monorepo
pnpm check
```
