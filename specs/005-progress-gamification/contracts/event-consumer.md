# Event Consumer Contracts: Sistem Progres dan Gamifikasi AksiCendekia

**Feature Branch**: `005-progress-gamification`

---

## Overview

Dokumen ini mendefinisikan kontrak event yang dikonsumsi oleh Service Gamifikasi dari Transactional Outbox Feature 004 (`004-learning-session-engine`).

---

## 1. `learning.session.completed`

Paling utama: Pemicu kalkulasi XP penyelesaian sesi, bonus skor sempurna, evaluasi streak harian multi-timezone, pembukaan pelajaran berprasyarat, dan evaluasi badge.

- **Payload Schema**:
```json
{
  "eventId": "evt-uuid-9999",
  "eventType": "learning.session.completed",
  "aggregateId": "sess-uuid-1234",
  "timestamp": "2026-08-27T13:00:00.000Z",
  "data": {
    "sessionId": "sess-uuid-1234",
    "studentId": "usr-student-5555",
    "lessonId": "les-sd-mtk-01",
    "score": 100.0,
    "correctCount": 5,
    "incorrectCount": 0,
    "totalQuestions": 5,
    "durationSeconds": 180,
    "completedAt": "2026-08-27T13:00:00.000Z"
  }
}
```

- **Alur Pemrosesan Handler**:
  1. Periksa `ProcessedEventLog` menggunakan `eventId`. Jika sudah ada, hentikan (Idempotent ignore).
  2. Hitung perolehan XP (`correctCount * 10 + 50 bonus + 20 perfect_bonus = 120 XP`).
  3. Catat `XpTransaction`. Update `StudentProgress.totalXp`.
  4. Periksa Kenaikan Level (XP vs Kurva Level Eksponensial). Jika level naik, kreditkan milestone power-up.
  5. Hitung Streak Harian berdasarkan `student.timezone`. Jika perlu, konsumsi otomatis `STREAK_FREEZE`. Update `StudentProgress.currentStreak`.
  6. Evaluasi Badge yang relevan (`LESSONS_COMPLETED`, `STREAK_LENGTH`, `ACCURACY_RATE`, `SUBJECT_COMPLETION`). Insersi `StudentBadge` jika terpenuhi.
  7. Periksa downstream `LessonPrerequisite`. Jika seluruh prasyarat terpenuhi, update status `StudentLessonProgress` ke `UNLOCKED`.
  8. Catat `eventId` ke `ProcessedEventLog`.

---

## 2. `learning.session.question_answered`

Pemicu kalkulasi XP per jawaban benar jika dihitung secara per-soal.

- **Payload Schema**:
```json
{
  "eventId": "evt-uuid-8888",
  "eventType": "learning.session.question_answered",
  "aggregateId": "sess-uuid-1234",
  "timestamp": "2026-08-27T12:55:00.000Z",
  "data": {
    "sessionId": "sess-uuid-1234",
    "studentId": "usr-student-5555",
    "lessonId": "les-sd-mtk-01",
    "questionId": "q-101",
    "isCorrect": true,
    "hintUsedCount": 0,
    "timeSpentSec": 25
  }
}
```
