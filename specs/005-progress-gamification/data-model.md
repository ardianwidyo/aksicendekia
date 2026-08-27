# Data Model Architecture: Sistem Progres dan Gamifikasi AksiCendekia

**Feature Branch**: `005-progress-gamification`

---

## 1. Prisma Database Schemas

```prisma
enum ProgressStatus {
  LOCKED
  UNLOCKED
  IN_PROGRESS
  COMPLETED
}

enum PowerupType {
  HINT_TOKEN
  STREAK_FREEZE
}

enum PowerupAction {
  EARNED
  CONSUMED
}

enum XpSourceType {
  QUESTION_CORRECT
  LESSON_BONUS
  PERFECT_SCORE_BONUS
  MILESTONE_BONUS
}

enum BadgeCategory {
  LESSON_MILESTONE
  STREAK_MILESTONE
  ACCURACY_MASTER
  SUBJECT_MASTER
}

model StudentProgress {
  id            String   @id @default(uuid())
  studentId     String   @unique @map("student_id")
  totalXp       Int      @default(0) @map("total_xp")
  level         Int      @default(1)
  currentStreak Int      @default(0) @map("current_streak")
  longestStreak Int      @default(0) @map("longest_streak")
  lastActiveDate String? @map("last_active_date") // Format YYYY-MM-DD zona waktu lokal siswa
  timezone      String   @default("Asia/Jakarta")

  updatedAt     DateTime @updatedAt @map("updated_at")

  student       User     @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@map("student_progress")
}

model XpTransaction {
  id          String       @id @default(uuid())
  studentId   String       @map("student_id")
  amount      Int
  source      XpSourceType
  referenceId String?      @map("reference_id") // sessionId atau lessonId
  createdAt   DateTime     @default(now()) @map("created_at")

  student     User         @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId, createdAt])
  @@map("xp_transactions")
}

model BadgeDefinition {
  id                 String        @id @default(uuid())
  code               String        @unique
  name               String
  description        String
  iconUrl            String        @map("icon_url")
  category           BadgeCategory
  conditionType      String        @map("condition_type") // LESSONS_COMPLETED, STREAK_LENGTH, ACCURACY_RATE, SUBJECT_COMPLETION
  conditionParameter Json          @map("condition_parameter") // e.g. { "count": 10 }, { "subjectId": "xxx" }

  createdAt          DateTime      @default(now()) @map("created_at")
  studentBadges      StudentBadge[]

  @@map("badge_definitions")
}

model StudentBadge {
  id             String          @id @default(uuid())
  studentId      String          @map("student_id")
  badgeId        String          @map("badge_id")
  triggerEventId String?         @map("trigger_event_id")
  unlockedAt     DateTime        @default(now()) @map("unlocked_at")

  student        User            @relation(fields: [studentId], references: [id], onDelete: Cascade)
  badge          BadgeDefinition @relation(fields: [badgeId], references: [id], onDelete: Restrict)

  @@unique([studentId, badgeId])
  @@index([studentId])
  @@map("student_badges")
}

model StudentPowerup {
  id          String      @id @default(uuid())
  studentId   String      @map("student_id")
  powerupType PowerupType @map("powerup_type")
  quantity    Int         @default(0)
  updatedAt   DateTime    @updatedAt @map("updated_at")

  student     User        @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([studentId, powerupType])
  @@index([studentId])
  @@map("student_powerups")
}

model PowerupTransaction {
  id          String        @id @default(uuid())
  studentId   String        @map("student_id")
  powerupType PowerupType   @map("powerup_type")
  actionType  PowerupAction @map("action_type")
  amount      Int
  source      String        // e.g. "LEVEL_UP_REWARD", "SESSION_CONSUME"
  referenceId String?       @map("reference_id")
  createdAt   DateTime      @default(now()) @map("created_at")

  student     User          @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId, createdAt])
  @@map("powerup_transactions")
}

model StudentLessonProgress {
  id             String         @id @default(uuid())
  studentId      String         @map("student_id")
  lessonId       String         @map("lesson_id")
  status         ProgressStatus @default(LOCKED)
  bestScore      Decimal?       @db.Decimal(5, 2) @map("best_score")
  attemptsCount  Int            @default(0) @map("attempts_count")
  completedAt    DateTime?      @map("completed_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")

  student        User           @relation(fields: [studentId], references: [id], onDelete: Cascade)
  lesson         Lesson         @relation(fields: [lessonId], references: [id], onDelete: Restrict)

  @@unique([studentId, lessonId])
  @@index([studentId, status])
  @@map("student_lesson_progress")
}

model ProcessedEventLog {
  eventId       String   @id @map("event_id")
  eventType     String   @map("event_type")
  aggregateId   String   @map("aggregate_id")
  processedAt   DateTime @default(now()) @map("processed_at")

  @@map("processed_event_logs")
}
```

---

## 2. DTOs & Domain Schemas

```typescript
export interface MissionMapNodeDTO {
  lessonId: string;
  title: string;
  sequenceOrder: number;
  status: 'COMPLETED' | 'CURRENT' | 'UNLOCKED' | 'LOCKED';
  bestScore: number | null;
  prerequisites: string[]; // List of lesson IDs
}

export interface AchievementBadgeDTO {
  badgeId: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string;
  category: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progressPercentage: number;
}

export interface SubjectProgressSummaryDTO {
  subjectId: string;
  subjectName: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  totalXpEarned: number;
}

export interface StudentAchievementDashboardDTO {
  totalXp: number;
  level: number;
  xpToNextLevel: number;
  xpCurrentLevelProgress: number;
  currentStreak: number;
  longestStreak: number;
  formattedStreakText: string;
  powerupBalances: Record<PowerupType, number>;
  badges: AchievementBadgeDTO[];
  subjectProgress: SubjectProgressSummaryDTO[];
}
```
