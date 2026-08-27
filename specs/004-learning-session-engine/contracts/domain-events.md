# Domain Event Contracts: Learning Session Engine (Feature 004 -> Feature 005)

**Feature Branch**: `004-learning-session-engine`  
**Publisher**: `apps/api` (Learning Session Engine)  
**Consumer**: `apps/api` (Feature 005 Gamification Engine / Event Bus)  
**Pattern**: Transactional Outbox Pattern (`outbox_events` table)

---

## 1. Event: `learning.session.started`

Diterbitkan saat sesi belajar baru berhasil dibuat oleh backend.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "LearningSessionStartedEvent",
  "type": "object",
  "properties": {
    "eventId": { "type": "string", "format": "uuid" },
    "eventType": { "type": "string", "enum": ["learning.session.started"] },
    "aggregateId": { "type": "string", "format": "uuid" },
    "timestamp": { "type": "string", "format": "date-time" },
    "payload": {
      "type": "object",
      "properties": {
        "sessionId": { "type": "string", "format": "uuid" },
        "studentId": { "type": "string", "format": "uuid" },
        "lessonId": { "type": "string", "format": "uuid" },
        "subjectId": { "type": "string", "format": "uuid" },
        "totalQuestions": { "type": "integer", "minimum": 1 }
      },
      "required": ["sessionId", "studentId", "lessonId", "subjectId", "totalQuestions"]
    }
  },
  "required": ["eventId", "eventType", "aggregateId", "timestamp", "payload"]
}
```

---

## 2. Event: `learning.session.question_answered`

Diterbitkan setiap kali siswa berhasil menjawab satu butir soal dan jawaban dinilai oleh server.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "LearningSessionQuestionAnsweredEvent",
  "type": "object",
  "properties": {
    "eventId": { "type": "string", "format": "uuid" },
    "eventType": { "type": "string", "enum": ["learning.session.question_answered"] },
    "aggregateId": { "type": "string", "format": "uuid" },
    "timestamp": { "type": "string", "format": "date-time" },
    "payload": {
      "type": "object",
      "properties": {
        "sessionId": { "type": "string", "format": "uuid" },
        "studentId": { "type": "string", "format": "uuid" },
        "lessonId": { "type": "string", "format": "uuid" },
        "questionId": { "type": "string", "format": "uuid" },
        "questionType": { "type": "string", "enum": ["MULTIPLE_CHOICE", "SHORT_ANSWER", "MATCHING_PAIRS"] },
        "isCorrect": { "type": "boolean" },
        "timeSpentSeconds": { "type": "integer", "minimum": 0 },
        "hintUsedCount": { "type": "integer", "minimum": 0 }
      },
      "required": ["sessionId", "studentId", "lessonId", "questionId", "questionType", "isCorrect", "timeSpentSeconds", "hintUsedCount"]
    }
  },
  "required": ["eventId", "eventType", "aggregateId", "timestamp", "payload"]
}
```

---

## 3. Event: `learning.session.completed`

Diterbitkan saat sesi belajar diselesaikan secara penuh oleh siswa.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "LearningSessionCompletedEvent",
  "type": "object",
  "properties": {
    "eventId": { "type": "string", "format": "uuid" },
    "eventType": { "type": "string", "enum": ["learning.session.completed"] },
    "aggregateId": { "type": "string", "format": "uuid" },
    "timestamp": { "type": "string", "format": "date-time" },
    "payload": {
      "type": "object",
      "properties": {
        "sessionId": { "type": "string", "format": "uuid" },
        "studentId": { "type": "string", "format": "uuid" },
        "lessonId": { "type": "string", "format": "uuid" },
        "subjectId": { "type": "string", "format": "uuid" },
        "score": { "type": "number", "minimum": 0, "maximum": 100 },
        "totalQuestions": { "type": "integer", "minimum": 1 },
        "correctCount": { "type": "integer", "minimum": 0 },
        "incorrectCount": { "type": "integer", "minimum": 0 },
        "totalDurationSeconds": { "type": "integer", "minimum": 0 }
      },
      "required": ["sessionId", "studentId", "lessonId", "subjectId", "score", "totalQuestions", "correctCount", "incorrectCount", "totalDurationSeconds"]
    }
  },
  "required": ["eventId", "eventType", "aggregateId", "timestamp", "payload"]
}
```

---

## 4. Event: `learning.session.expired`

Diterbitkan saat sesi belajar kedaluwarsa setelah 24 jam tanpa aktivitas.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "LearningSessionExpiredEvent",
  "type": "object",
  "properties": {
    "eventId": { "type": "string", "format": "uuid" },
    "eventType": { "type": "string", "enum": ["learning.session.expired"] },
    "aggregateId": { "type": "string", "format": "uuid" },
    "timestamp": { "type": "string", "format": "date-time" },
    "payload": {
      "type": "object",
      "properties": {
        "sessionId": { "type": "string", "format": "uuid" },
        "studentId": { "type": "string", "format": "uuid" },
        "lessonId": { "type": "string", "format": "uuid" },
        "lastActivityAt": { "type": "string", "format": "date-time" }
      },
      "required": ["sessionId", "studentId", "lessonId", "lastActivityAt"]
    }
  },
  "required": ["eventId", "eventType", "aggregateId", "timestamp", "payload"]
}
```
