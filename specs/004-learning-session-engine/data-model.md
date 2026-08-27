# Data Model Architecture: Mesin Sesi Belajar AksiCendekia

**Feature Branch**: `004-learning-session-engine`

---

## 1. Entities & Prisma Database Schemas

```prisma
enum SessionStatus {
  IN_PROGRESS
  PAUSED
  COMPLETED
  EXPIRED
}

model LearningSession {
  id               String                 @id @default(uuid())
  studentId        String                 @map("student_id")
  lessonId         String                 @map("lesson_id")
  status           SessionStatus          @default(IN_PROGRESS)
  currentIndex     Int                    @default(0) @map("current_index")
  totalQuestions   Int                    @map("total_questions")
  correctCount     Int                    @default(0) @map("correct_count")
  incorrectCount   Int                    @default(0) @map("incorrect_count")
  score            Decimal?               @db.Decimal(5, 2)
  durationSeconds  Int                    @default(0) @map("duration_seconds")
  startedAt        DateTime               @default(now()) @map("started_at")
  lastActivityAt   DateTime               @default(now()) @map("last_activity_at")
  expiresAt        DateTime               @map("expires_at")
  completedAt      DateTime?              @map("completed_at")

  questionOrders   SessionQuestionOrder[]
  answers          SessionAnswer[]
  outboxEvents     OutboxEvent[]

  student          User                   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  lesson           Lesson                 @relation(fields: [lessonId], references: [id], onDelete: Restrict)

  @@index([studentId, status])
  @@index([expiresAt, status])
  @@map("learning_sessions")
}

model SessionQuestionOrder {
  id            String          @id @default(uuid())
  sessionId     String          @map("session_id")
  questionId    String          @map("question_id")
  sequenceOrder Int             @map("sequence_order")

  session       LearningSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  question      QuestionItem    @relation(fields: [questionId], references: [id], onDelete: Restrict)

  @@unique([sessionId, sequenceOrder])
  @@map("session_question_orders")
}

model SessionAnswer {
  id              String          @id @default(uuid())
  sessionId       String          @map("session_id")
  questionId      String          @map("question_id")
  studentAnswer   Json            @map("student_answer")
  isCorrect       Boolean         @map("is_correct")
  hintUsedCount   Int             @default(0) @map("hint_used_count")
  timeSpentSec    Int             @default(0) @map("time_spent_sec")
  idempotencyKey  String          @unique @map("idempotency_key")
  submittedAt     DateTime        @default(now()) @map("submitted_at")

  session         LearningSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  question        QuestionItem    @relation(fields: [questionId], references: [id], onDelete: Restrict)

  @@unique([sessionId, questionId])
  @@map("session_answers")
}

model OutboxEvent {
  id            String           @id @default(uuid())
  aggregateType String           @map("aggregate_type") // "LearningSession"
  aggregateId   String           @map("aggregate_id")
  eventType     String           @map("event_type")     // "learning.session.completed", etc.
  payload       Json
  published     Boolean          @default(false)
  createdAt     DateTime         @default(now()) @map("created_at")
  publishedAt   DateTime?        @map("published_at")

  session       LearningSession? @relation(fields: [aggregateId], references: [id], onDelete: Cascade)

  @@index([published, createdAt])
  @@map("outbox_events")
}
```

---

## 2. DTOs & Anti-Cheat Data Projection

### `ClientQuestionDTO` (Payload Disajikan ke Siswa - ZERO LEAKAGE)
```typescript
export interface ClientQuestionOption {
  id: string;
  text: string;
}

export interface ClientQuestionDTO {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'MATCHING_PAIRS';
  prompt: string;
  options?: ClientQuestionOption[];          // Hanya untuk MULTIPLE_CHOICE
  matchingItemsLeft?: string[];               // Hanya item kiri untuk MATCHING_PAIRS
  matchingItemsRight?: string[];              // Hanya item kanan teracak untuk MATCHING_PAIRS
  availableHintsCount: number;
  // STRICT OMIT: correct_option_id, accepted_answers, matching_mode, matching_pairs, explanation
}
```

### `AnswerEvaluationResultDTO` (Payload Dikembalikan SETELAH Submisi)
```typescript
export interface AnswerEvaluationResultDTO {
  sessionId: string;
  questionId: string;
  isCorrect: boolean;
  explanation: string;
  correctAnswer: {
    correctOptionId?: string;
    acceptedAnswers?: string[];
    matchingPairs?: Record<string, string>;
    matchingMode?: string;
  };
  sessionProgress: {
    currentIndex: number;
    totalQuestions: number;
    isCompleted: boolean;
  };
}
```

---

## 3. Zod Validation Schemas (`session.schema.ts`)

```typescript
import { z } from 'zod';

export const createSessionSchema = z.object({
  lessonId: z.string().uuid({ message: 'Lesson ID harus berupa UUID valid' })
});

export const submitAnswerSchema = z.object({
  questionId: z.string().uuid({ message: 'Question ID harus berupa UUID valid' }),
  answer: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('MULTIPLE_CHOICE'),
      selectedOptionId: z.string().min(1, 'Option ID wajib diisi')
    }),
    z.object({
      type: z.literal('SHORT_ANSWER'),
      text: z.string().min(1, 'Teks jawaban tidak boleh kosong')
    }),
    z.object({
      type: z.literal('MATCHING_PAIRS'),
      pairs: z.record(z.string(), z.string())
    })
  ]),
  timeSpentSeconds: z.number().int().min(0, 'Waktu pengerjaan harus >= 0')
});

export const getHintSchema = z.object({
  questionId: z.string().uuid({ message: 'Question ID harus berupa UUID valid' })
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type GetHintInput = z.infer<typeof getHintSchema>;
```
