# Research & Technical Decisions: Sistem Progres dan Gamifikasi AksiCendekia

**Feature Branch**: `005-progress-gamification`

---

## 1. Event Consumer & Idempotency Engine

### Problem
Feature 004 menerbitkan event melalui Transactional Outbox (`outbox_events`). Event ini dikonsumsi secara asynchronous oleh Service Gamifikasi. Jika terjadi penyampaian event ganda (*at-least-once delivery*), XP, Level, dan Badge siswa dapat terhitung dua kali.

### Technical Decision
- Menerapkan **Transactional Event Deduplication Handler** menggunakan tabel `processed_event_logs`.
- Sebelum memproses event (`learning.session.completed` atau `learning.session.question_answered`), consumer mengeksekusi Prisma transaction:
  ```typescript
  const alreadyProcessed = await prisma.processedEventLog.findUnique({
    where: { eventId }
  });
  if (alreadyProcessed) {
    return; // Fast return (Idempotent ignore)
  }
  ```
- Seluruh pembaruan progres siswa (XP, level, streak, badge) dan insersi `processed_event_logs` dibungkus dalam satu transaksi Prisma atomik (`prisma.$transaction`).

---

## 2. Kalkulasi Streak Harian Lintas Zona Waktu (WIB, WITA, WIT)

### Problem
Siswa AksiCendekia tersebar di seluruh Indonesia:
- WIB: `Asia/Jakarta` (UTC+7)
- WITA: `Asia/Makassar` (UTC+8)
- WIT: `Asia/Jayapura` (UTC+9)

Kapan hari dianggap berganti (*date boundary*) harus mengikuti zona waktu lokal profil siswa, bukan UTC server atau WIB saja.

### Technical Decision
- Menggunakan `Intl.DateTimeFormat` atau `date-fns-tz` untuk mengonversi `completed_at` (UTC) ke string tanggal lokal `YYYY-MM-DD` sesuai `timezone` siswa.
- **Aturan Evaluasi Selisih Hari Kalender**:
  - `localDate === lastActiveDate`: Sesi kedua/ketiga pada hari yang sama. `currentStreak` tetap, XP tetap bertambah.
  - `localDate === lastActiveDate + 1 day`: Sesi hari berikutnya. `currentStreak` bertambah +1. `longestStreak = max(currentStreak, longestStreak)`.
  - `localDate > lastActiveDate + 1 day`: Siswa absen setidaknya 1 hari kalender.
    - Jika `student_powerups` memiliki `STREAK_FREEZE > 0`: sistem mengurangi 1 `STREAK_FREEZE` secara atomik, mempertahankan `currentStreak`, dan memperbarui `lastActiveDate = localDate - 1 day` (seolah-olah hari kemarin dilindungi).
    - Jika `STREAK_FREEZE === 0`: `currentStreak` di-reset menjadi 1.

---

## 3. Konfigurasi XP & Kurva Level Eksponensial

### Problem
Aturan XP dan ambang batas level tidak boleh di-hardcode di kode program agar dapat disesuaikan tanpa merilis ulang aplikasi.

### Technical Decision
- Konfigurasi disimpan di `apps/api/src/config/gamification-config.json` dan diproses oleh `GamificationConfigService`:
  ```json
  {
    "xpRules": {
      "correctAnswerBaseXp": 10,
      "lessonCompletionBonusXp": 50,
      "perfectScoreBonusXp": 20
    },
    "levelCurve": {
      "baseXp": 100,
      "exponent": 1.5
    }
  }
  ```
- **Formula Kurva Level**: $\text{Required XP for Level } L = \lfloor 100 \times L^{1.5} \rfloor$.
- Akumulasi total XP dihitung dan dibandingkan dengan ambang batas. Kenaikan level memicu pencatatan transaksi XP (`XpTransaction`) dan mengkreditkan *Milestone Rewards* (misal: 1 Token Petunjuk per kenaikan level).

---

## 4. Proteksi Transaksi Atomik Saldo Power-Up (Bebas Negative Balance)

### Problem
Jika siswa membuka dua tab peramban dan mengonsumsi Token Petunjuk / Pembeku Waktu secara simultan pada milidetik yang sama saat saldo = 1, *race condition* dapat menyebabkan saldo menjadi `-1`.

### Technical Decision
- Menggunakan query pembaruan atomik SQL via Prisma `$executeRaw` atau pembaruan kondisional:
  ```typescript
  const updatedCount = await prisma.studentPowerup.updateMany({
    where: {
      studentId,
      powerupType,
      quantity: { gte: amount }
    },
    data: {
      quantity: { decrement: amount }
    }
  });

  if (updatedCount.count === 0) {
    throw new InsufficientPowerupError('Saldo Power-up tidak mencukupi');
  }
  ```
- Karena `updateMany` dieksekusi secara atomik oleh engine database PostgreSQL, transaksi kedua yang mencoba mengonsumsi saldo 0 akan mengembalikan `count: 0` dan menghasilkan HTTP 400 Bad Request tanpa menghasilkan saldo negatif.

---

## 5. Resolusi Status Simpul Peta Misi (Mission Map Graph)

### Problem
Peta Misi harus merender simpul-simpul pelajaran dengan status visual yang akurat (`COMPLETED`, `CURRENT`, `UNLOCKED`, `LOCKED`).

### Technical Decision
1. Ambil seluruh `Lesson` dalam `Subject` terurut berdasarkan `sequenceOrder`.
2. Ambil `LessonPrerequisite` untuk seluruh pelajaran dalam subjek tersebut.
3. Ambil `StudentLessonProgress` untuk `studentId` terkait.
4. **Algoritma Resolusi Status**:
   - Jika `StudentLessonProgress.status === 'COMPLETED'`, status simpul = `COMPLETED`.
   - Jika belum completed, periksa apakah seluruh `prerequisiteLessonIds` sudah berstatus `COMPLETED` di `StudentLessonProgress`:
     - Jika belum semua completed, status simpul = `LOCKED`.
     - Jika semua prerequisite completed (atau tidak punya prerequisite):
       - Jika simpul ini adalah simpul unlocked pertama yang belum selesai, status simpul = `CURRENT`.
       - Jika ada simpul unlocked sebelumnya yang berstatus `CURRENT`, simpul ini = `UNLOCKED`.
