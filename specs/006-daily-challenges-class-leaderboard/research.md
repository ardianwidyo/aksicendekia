# Research & Technical Decisions: Tantangan Harian dan Papan Peringkat Kelas AksiCendekia

**Feature Branch**: `006-daily-challenges-class-leaderboard`
**Date**: 2026-08-27
**Spec**: [spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/006-daily-challenges-class-leaderboard/spec.md)

---

## 1. Daily Challenge Generator Strategy

### Context & Need
Fitur memerlukan 1 (satu) tantangan harian per jenjang pendidikan (`TK`, `SD`, `SMP`, `SMA`) per hari kalender yang otomatis dibuat dari butir soal berstatus `PUBLISHED` dari Feature 003.

### Technical Decision
- **Generator Scheduler**: Cron job / Fastify scheduled job yang dieksekusi setiap pukul 00:00:00 (atau secara lazily ketika siswa pertama dari jenjang tersebut mengakses API tantangan hari ini).
- **Lazy Evaluation Strategy (Fail-safe)**: Ketika endpoint `GET /api/v1/daily-challenges/today` dipanggil oleh siswa dari jenjang tertentu, service mengecek apakah entitas `DailyChallenge` untuk `(education_level, challenge_date)` hari ini sudah ada. Jika belum, generator langsung membuat entitas `DailyChallenge` secara otomatis *in-flight* dengan memilih butir soal `PUBLISHED` dari database Prisma.
- **Kategori Target Tantangan**:
  1. `QUESTION_COUNT`: Menyelesaikan $N$ soal (contoh: 10 soal cerita).
  2. `LESSON_COUNT`: Menyelesaikan $N$ sesi/pelajaran.
  3. `ACCURACY_TARGET`: Mencapai akurasi $\ge X\%$ pada $N$ soal.
- **Fallback Guarantee**: Jika jenjang pendidikan belum memiliki butir soal `PUBLISHED` yang cukup untuk kriteria spesifik, generator menggunakan template tantangan generik ("Selesaikan 2 sesi belajar jenjang SD hari ini") dengan hadiah 50 XP & 1 Token Petunjuk.

---

## 2. Atomic Reward Claiming & Idempotency

### Context & Need
Penyelesaian tantangan harian memberikan hadiah (XP / Power-up). Request klaim dari siswa tidak boleh menghasilkan klaim ganda, bahkan jika terjadi *concurrent network retries* atau klik beruntun dari peramban.

### Technical Decision
- **Atomic SQL Update**: Endpoint `POST /api/v1/daily-challenges/:challengeId/claim` mengeksekusi operasi transaksi atomik melalui Prisma ORM:
  ```sql
  UPDATE student_daily_challenges 
  SET status = 'CLAIMED', claimed_at = NOW() 
  WHERE id = $1 AND student_id = $2 AND status = 'COMPLETED';
  ```
- **Kredit Hadiah Atomik**: Hanya jika baris data ter-update (`count === 1`), transaksi mengkreditkan XP ke `xp_transactions` dan menambahkan power-up ke `student_powerups`.
- **Response Handling**: Jika `count === 0`, backend langsung melempar exception `400 Bad Request` dengan kode error `REWARD_ALREADY_CLAIMED` atau `CHALLENGE_NOT_COMPLETED`.

---

## 3. Class Leaderboard Aggregation & Windowing

### Context & Need
Papan peringkat kelas menampilkan XP mingguan siswa yang terdaftar dalam `class_id` yang sama, di-reset setiap hari Senin pukul 00:00:00 waktu lokal siswa.

### Technical Decision
- **Dynamic Window Query**: Papan peringkat menghitung XP secara dinamis dari tabel `xp_transactions` berdasarkan rentang waktu mingguan:
  - `week_start`: Hari Senin paling awal untuk minggu berjalan pukul 00:00:00 waktu lokal kelas/siswa.
  - `week_end`: Hari Minggu akhir minggu pukul 23:59:59.999.
- **Filter Enrolment & Visibilitas**:
  Query SQL/Prisma memfilter siswa yang:
  1. Terdaftar aktif pada `class_id` yang ditentukan (`StudentClassEnrollment.class_id = :classId`).
  2. TIDAK mengaktifkan opsi tersembunyi (`StudentPrivacySetting.is_hidden_from_leaderboard = false`).
- **Tie-Breaking Rule**: Mengurutkan berdasarkan `total_weekly_xp DESC`, lalu `first_xp_timestamp ASC` (siswa yang mencapai total XP tersebut lebih awal menduduki peringkat lebih tinggi).

---

## 4. Top 10 + Pinned Current Student Rank Pattern

### Context & Need
API Papan Peringkat Kelas mengembalikan 10 siswa teratas (*Top 10*), tetapi posisi siswa yang sedang login harus SELALU terlihat di bagian bawah UI meskipun siswa berada di luar 10 besar (misal: posisi #18).

### Technical Decision
- **Two-Part Query & Aggregation**:
  1. **Part 1 (Top 10)**: `SELECT student_id, display_name, avatar_token, SUM(amount) as weekly_xp FROM ... LIMIT 10`.
  2. **Part 2 (Current Student Rank)**: Window function SQL atau kalkulasi indeks peringkat untuk `current_student_id`.
     ```sql
     WITH ranked_students AS (
       SELECT 
         s.id as student_id,
         s.display_name,
         s.avatar_token,
         COALESCE(SUM(x.amount), 0) as weekly_xp,
         RANK() OVER (ORDER BY COALESCE(SUM(x.amount), 0) DESC, MIN(x.created_at) ASC) as rank
       FROM students s
       JOIN student_class_enrollments e ON e.student_id = s.id
       LEFT JOIN xp_transactions x ON x.student_id = s.id AND x.created_at >= :weekStart
       LEFT JOIN student_privacy_settings p ON p.student_id = s.id
       WHERE e.class_id = :classId AND (p.is_hidden_from_leaderboard IS NULL OR p.is_hidden_from_leaderboard = false)
       GROUP BY s.id
     )
     SELECT * FROM ranked_students;
     ```
- **Response Structure**:
  ```json
  {
    "classId": "uuid",
    "weekStartDate": "2026-08-24",
    "topStudents": [ /* Array 1..10 */ ],
    "myRank": {
      "rank": 18,
      "weeklyXp": 240,
      "displayName": "Bintang Cerdas",
      "avatarToken": "avatar_fox_01",
      "isHidden": false
    }
  }
  ```

---

## 5. Child Privacy Protection & Data Minimization (UU PDP No. 27/2022 & Konstitusi VII)

### Context & Need
AksiCendekia melayani anak-anak di bawah umur. Papan peringkat kelas TIDAK BOLEH membocorkan data pribadi (nama lengkap, nama sekolah, umur, foto asli).

### Technical Decision
- **DTO Projection Strictness**: Modul repository dan controller memproyeksikan HANYA 4 field publik siswa:
  - `rank`: Number
  - `display_name`: String (pseudonym/nickname siswa)
  - `avatar_token`: String (identitas visual SVG avatar non-foto)
  - `weekly_xp`: Number
- **Excluded Attributes**: Field `full_name`, `email`, `school_name`, `birth_date`, `avatar_url` (foto fisik/kamera) diabaikan total pada level query SQL & Zod response schema serialization.

---

## 6. Parental Privacy Lock Mechanism

### Context & Need
Orang tua dapat mengunci pengaturan privasi siswa agar siswa tidak bisa sembarangan mengubah visibilitas papan peringkat.

### Technical Decision
- **Relational Role Authorization**:
  Endpoint `PATCH /api/v1/students/me/privacy` mengecek status `StudentPrivacySetting.is_privacy_locked`.
  - Jika `is_privacy_locked === true` dan pengirim request adalah role `STUDENT`, backend mengembalikan `403 Forbidden` (`PRIVACY_SETTINGS_LOCKED_BY_PARENT`).
  - Hanya request dari peran `PARENT` yang terverifikasi terhubung dengan `student_id` tersebut yang dapat mengubah `is_privacy_locked` atau mengubah `is_hidden_from_leaderboard` ketika sedang terkunci.
