# HTTP API Specification: Learning Session Engine

**Feature Branch**: `004-learning-session-engine`  
**Base URL**: `/api/v1`  
**Auth**: Bearer JWT (Role: `SISWA`)

---

## 1. `POST /api/v1/sessions` - Inisialisasi Sesi Belajar Baru

### Request
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Body**:
  ```json
  {
    "lessonId": "usr_lesson_12345"
  }
  ```

### Response Success (201 Created)
```json
{
  "sessionId": "sess_889a01bf-45bc",
  "lessonId": "usr_lesson_12345",
  "status": "IN_PROGRESS",
  "currentIndex": 0,
  "totalQuestions": 10,
  "expiresAt": "2026-08-28T12:00:00.000Z",
  "currentQuestion": {
    "id": "q_001",
    "type": "MULTIPLE_CHOICE",
    "prompt": "Berapakah hasil dari 12 + 15?",
    "options": [
      { "id": "opt_a", "text": "25" },
      { "id": "opt_b", "text": "27" },
      { "id": "opt_c", "text": "30" },
      { "id": "opt_d", "text": "22" }
    ],
    "availableHintsCount": 2
  }
}
```

### Error Responses
- `400 Bad Request`: Validation error (Zod)
- `403 Forbidden`: Pelajaran masih terkunci (`is_locked: true`)
- `404 Not Found`: Pelajaran tidak ditemukan atau tidak berstatus `PUBLISHED`

---

## 2. `GET /api/v1/sessions/:id` - Ambil Sesi & Soal Aktif

### Request
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`

### Response Success (200 OK)
```json
{
  "sessionId": "sess_889a01bf-45bc",
  "lessonId": "usr_lesson_12345",
  "status": "IN_PROGRESS",
  "currentIndex": 2,
  "totalQuestions": 10,
  "correctCount": 2,
  "currentQuestion": {
    "id": "q_003",
    "type": "SHORT_ANSWER",
    "prompt": "Sebutkan ibu kota negara Indonesia saat ini!",
    "availableHintsCount": 1
  }
}
```

---

## 3. `POST /api/v1/sessions/:id/answers` - Submisi Jawaban Soal

### Request
- **Headers**:
  - `Authorization: Bearer <JWT_TOKEN>`
  - `Idempotency-Key: c9b8f2a1-631d-4b92-94a1-1234567890ab`
- **Body**:
  ```json
  {
    "questionId": "q_003",
    "answer": {
      "type": "SHORT_ANSWER",
      "text": "  jakarta "
    },
    "timeSpentSeconds": 14
  }
  ```

### Response Success (200 OK)
```json
{
  "sessionId": "sess_889a01bf-45bc",
  "questionId": "q_003",
  "isCorrect": true,
  "explanation": "Ibu kota negara Indonesia adalah Jakarta.",
  "correctAnswer": {
    "acceptedAnswers": ["Jakarta", "DKI Jakarta"],
    "matchingMode": "NORMALIZED"
  },
  "sessionProgress": {
    "currentIndex": 3,
    "totalQuestions": 10,
    "isCompleted": false
  }
}
```

---

## 4. `POST /api/v1/sessions/:id/hints` - Minta Petunjuk Bertingkat

### Request
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Body**:
  ```json
  {
    "questionId": "q_003"
  }
  ```

### Response Success (200 OK)
```json
{
  "questionId": "q_003",
  "hintTier": 1,
  "hintText": "Kota ini terletak di pulau Jawa bagian barat.",
  "remainingHints": 0
}
```

---

## 5. `POST /api/v1/sessions/:id/pause` & `POST /api/v1/sessions/:id/resume`

### Request
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`

### Response Success (200 OK)
```json
{
  "sessionId": "sess_889a01bf-45bc",
  "status": "PAUSED",
  "updatedAt": "2026-08-27T12:30:00.000Z"
}
```

---

## 6. `POST /api/v1/sessions/:id/complete` - Penyelesaian Sesi Belajar

### Request
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`

### Response Success (200 OK)
```json
{
  "sessionId": "sess_889a01bf-45bc",
  "lessonId": "usr_lesson_12345",
  "status": "COMPLETED",
  "score": 90.00,
  "totalQuestions": 10,
  "correctCount": 9,
  "incorrectCount": 1,
  "durationSeconds": 340,
  "completedAt": "2026-08-27T12:45:00.000Z",
  "incorrectQuestionsSummary": [
    {
      "questionId": "q_007",
      "prompt": "Berapakah 7 x 8?",
      "studentAnswer": "54",
      "correctAnswer": "56",
      "explanation": "7 dikali 8 sama dengan 56."
    }
  ]
}
```

---

## 7. `GET /api/v1/students/me/sessions` - Riwayat Sesi Siswa

### Request
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Query Params**: `page=1&limit=10`

### Response Success (200 OK)
```json
{
  "data": [
    {
      "sessionId": "sess_889a01bf-45bc",
      "lessonTitle": "Penjumlahan & Pengurangan Dasar",
      "subjectName": "Matematika",
      "score": 90.00,
      "status": "COMPLETED",
      "completedAt": "2026-08-27T12:45:00.000Z",
      "durationSeconds": 340
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```
