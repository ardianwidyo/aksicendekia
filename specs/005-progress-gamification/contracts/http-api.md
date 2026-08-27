# REST API Contracts: Sistem Progres dan Gamifikasi AksiCendekia

**Feature Branch**: `005-progress-gamification`

---

## 1. `GET /api/v1/curriculum/subjects/:subjectId/mission-map`

Mengembalikan graf simpul pelajaran terurut untuk tampilan Peta Misi beserta status visual progres siswa.

- **Headers**: `Authorization: Bearer <JWT>`
- **Response `200 OK`**:
```json
{
  "subjectId": "subj-sd-mtk-01",
  "subjectName": "Matematika SD Kelas 1",
  "nodes": [
    {
      "lessonId": "les-01",
      "title": "Mengenal Angka 1-10",
      "sequenceOrder": 1,
      "status": "COMPLETED",
      "bestScore": 100.0,
      "prerequisites": []
    },
    {
      "lessonId": "les-02",
      "title": "Penjumlahan Dasar 1-10",
      "sequenceOrder": 2,
      "status": "CURRENT",
      "bestScore": null,
      "prerequisites": ["les-01"]
    },
    {
      "lessonId": "les-03",
      "title": "Pengurangan Dasar 1-10",
      "sequenceOrder": 3,
      "status": "LOCKED",
      "bestScore": null,
      "prerequisites": ["les-02"]
    }
  ]
}
```

---

## 2. `GET /api/v1/students/achievements`

Mengembalikan ringkasan dashboard pencapaian siswa (level, XP, streak, saldo power-up, daftar badge, dan progres per mata pelajaran).

- **Headers**: `Authorization: Bearer <JWT>`
- **Response `200 OK`**:
```json
{
  "totalXp": 450,
  "level": 3,
  "xpToNextLevel": 520,
  "xpCurrentLevelProgress": 167,
  "currentStreak": 5,
  "longestStreak": 12,
  "formattedStreakText": "5 Hari Beruntun!",
  "powerupBalances": {
    "HINT_TOKEN": 4,
    "STREAK_FREEZE": 1
  },
  "badges": [
    {
      "badgeId": "bdg-first-lesson",
      "code": "FIRST_STEP",
      "name": "Langkah Pertama",
      "description": "Menyelesaikan 1 pelajaran pertama",
      "iconUrl": "/badges/first-step.png",
      "category": "LESSON_MILESTONE",
      "isUnlocked": true,
      "unlockedAt": "2026-08-25T10:00:00.000Z",
      "progressPercentage": 100
    },
    {
      "badgeId": "bdg-streak-7",
      "code": "STREAK_MASTER_7",
      "name": "Pejuang 7 Hari",
      "description": "Mencapai streak 7 hari berurut-turut",
      "iconUrl": "/badges/streak-7.png",
      "category": "STREAK_MILESTONE",
      "isUnlocked": false,
      "unlockedAt": null,
      "progressPercentage": 71
    }
  ],
  "subjectProgress": [
    {
      "subjectId": "subj-sd-mtk-01",
      "subjectName": "Matematika SD Kelas 1",
      "totalLessons": 10,
      "completedLessons": 3,
      "completionPercentage": 30,
      "totalXpEarned": 250
    }
  ]
}
```

---

## 3. `POST /api/v1/powerups/consume`

Mengonsumsi 1 token power-up secara atomik.

- **Headers**: `Authorization: Bearer <JWT>`
- **Request Body**:
```json
{
  "powerupType": "HINT_TOKEN",
  "sessionId": "sess-uuid-1234"
}
```
- **Response `200 OK`**:
```json
{
  "powerupType": "HINT_TOKEN",
  "remainingQuantity": 3,
  "consumedAt": "2026-08-27T13:08:00.000Z"
}
```
- **Response `400 Bad Request`** (jika saldo 0):
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "INSUFFICIENT_POWERUP: Saldo Token Petunjuk tidak mencukupi"
}
```
