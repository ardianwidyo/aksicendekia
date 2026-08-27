# Research & Technical Decisions: Mesin Sesi Belajar AksiCendekia

**Feature Branch**: `004-learning-session-engine`

---

## 1. Server-Side Grading & Zero Key Answer Leakage Architecture

### Decision
- Seluruh butir soal disajikan ke siswa melalui DTO terisolasi (`ClientQuestionDTO`) yang membuang (*strip/omit*) bidang kunci jawaban (`correct_option_id`, `accepted_answers`, `matching_mode`, `matching_pairs`) serta pembahasan (`explanation`) pada `apps/api`.
- Penilaian jawaban dilakukan 100% di backend (`session.service.ts`). Skor atau indikator benar/salah yang dikirim oleh peramban/klien diabaikan sepenuhnya.

### Rationale
- Memenuhi **Konstitusi AksiCendekia Prinsip IV (Keamanan & Defensive Design)** dan **Prinsip VIII (Integritas Konten Kurikulum)**.
- Mencegah siswa melakukan pembocoran soal melalui inspeksi *DevTools Network Tab* atau *Memory Inspection* pada peramban web.

### Alternatives Considered
- *Client-side grading dengan kunci terenkripsi*: Ditolak karena kunci terenkripsi yang ada di peramban tetap dapat didekripsi jika kunci dekripsi berada di client bundle JavaScript.

---

## 2. Algoritma Pencocokan Toleran Isian Singkat (`SHORT_ANSWER`)

### Decision
- Backend menyediakan fungsi normalisasi teks `normalizeAnswerText(input: string): string`:
  1. Trim spasi di awal dan akhir string.
  2. Ganti spasi berurutan ganda/banyak (`\s+`) dengan satu spasi tunggal (`" "`).
  3. Konversi seluruh karakter menjadi huruf kecil (`toLowerCase()`).
  4. Hapus tanda baca periferal di akhir string (`/[.,!?]+$/`).
  5. Penormalan diakritik Unicode NFD (`.normalize('NFD').replace(/[\u0300-\u036f]/g, '')`).
- Pencocokan dilakukan berdasarkan `matchingMode` yang terdaftar pada butir soal:
  - `EXACT`: Harus persis sama (*case-sensitive*, spasi persis).
  - `CASE_INSENSITIVE`: `input.trim().toLowerCase() === target.trim().toLowerCase()`.
  - `NORMALIZED`: `normalizeAnswerText(input)` dicocokkan terhadap daftar `acceptedAnswers` yang juga di-normalize.

### Rationale
- Memberikan toleransi ejaan dan variasi penulisan yang wajar untuk siswa TK, SD, SMP, dan SMA (misal: `" jakarta "` atau `"jakarta."` atau `"Ir. Soekarno"`).

### Alternatives Considered
- *Fuzzy matching (Levenshtein distance)*: Ditolak untuk v1 karena riskan menilai salah jawaban yang mirip namun berbeda arti (misal: "Jawa" vs "Jiwa"). Variasi ejaan terdaftar (`accepted_answers`) + normalisasi string jauh lebih presisi dan terkendali.

---

## 3. Transactional Outbox Pattern untuk Domain Events

### Decision
- Penulisan Domain Events (`learning.session.started`, `learning.session.question_answered`, `learning.session.completed`, `learning.session.expired`) dilakukan ke tabel `outbox_events` dalam **satu transaksi database Prisma (`prisma.$transaction`)** yang sama dengan pembuatan/pembaruan `LearningSession` atau `SessionAnswer`.

### Rationale
- Menjamin *At-Least-Once Delivery* tanpa risiko kehilangan event jika server restart atau mati di tengah pengiriman event.
- Mengisolasikan Feature 004 dari Feature 005 (Gamifikasi/Rewards) sehingga Feature 004 dapat diuji dan berjalan secara independen.

### Alternatives Considered
- *Direct HTTP / In-Memory Event Emitter*: Ditolak karena jika proses Node.js crash atau server restart, event yang belum terkirim ke Gamification service akan hilang selamanya.

---

## 4. Siklus Hidup Sesi, Jeda, & Auto-Expire 24 Jam

### Decision
- Inisialisasi sesi menetapkan `expiresAt = now + 24 hours`. Setiap aktivitas siswa memperbarui `lastActivityAt`.
- Penanganan Kedaluwarsa:
  1. **Lazy Check**: Setiap kali siswa memanggil API sesi (`GET` atau `POST`), backend memeriksa `if (now > session.expiresAt)`. Jika ya, status diubah ke `EXPIRED`, event `learning.session.expired` ditulis ke Outbox, dan API mengembalikan HTTP 409 Conflict.
  2. **Background Cron**: Worker berkala memicu query Prisma `UPDATE learning_sessions SET status = 'EXPIRED' WHERE status IN ('IN_PROGRESS', 'PAUSED') AND expires_at < NOW()` untuk membersihkan sesi terbengkalai secara massal.

### Rationale
- Efisien, tidak membebankan server dengan polling continuous, serta menjamin data kebersihan status sesi di basis data.

---

## 5. Idempotensi Submisi Jawaban & Anti-Double Completion Guard

### Decision
- Endpoint `POST /api/v1/sessions/:id/answers` mewajibkan header `Idempotency-Key` (UUIDv4).
- Tabel `session_answers` memiliki constraint `@unique([idempotencyKey])` dan `@unique([sessionId, questionId])`.
- Jika `Idempotency-Key` atau `(sessionId, questionId)` yang sama dikirimkan kembali:
  - Backend tidak menghitung ulang atau menambah skor.
  - Backend mengembalikan data respons `SessionAnswer` yang sudah tersimpan di database.
- Untuk endpoint penyelesaian sesi `POST /api/v1/sessions/:id/complete`: jika `session.status === 'COMPLETED'`, backend langsung mengembalikan summary yang ada tanpa menerbitkan event `learning.session.completed` kedua kalinya.

### Rationale
- Mencegah kecurangan atau kerusakan data akibat klik ganda (*double submit*), pengulangan *network retry*, atau serangan *replay request*.
