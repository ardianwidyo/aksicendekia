# Data Model Specification: Tantangan Harian dan Papan Peringkat Kelas AksiCendekia

**Feature Branch**: `006-daily-challenges-class-leaderboard`
**Date**: 2026-08-27
**Spec**: [spec.md](file:///d:/Source%20Code/Personal/aksicendekia/specs/006-daily-challenges-class-leaderboard/spec.md)

---

## 1. Prisma Schema Amendments

Modul ini menambah entitas baru pada `apps/api/prisma/schema.prisma` dan memperbarui relasi entitas `User`.

```prisma
// ==========================================
// Daily Challenge Enums & Models
// ==========================================

enum ChallengeTargetType {
  QUESTION_COUNT
  LESSON_COUNT
  ACCURACY_TARGET
}

enum ChallengeStatus {
  IN_PROGRESS
  COMPLETED
  CLAIMED
}

model DailyChallenge {
  id                 String              @id @default(uuid())
  educationStage     EducationStage      @map("education_stage")
  challengeDate      DateTime            @db.Date @map("challenge_date")
  title              String
  description        String
  targetType         ChallengeTargetType @map("target_type")
  targetValue        Int                 @map("target_value")
  rewardXp           Int                 @default(50) @map("reward_xp")
  rewardPowerupType  PowerupType?        @map("reward_powerup_type")
  rewardPowerupQty   Int                 @default(0) @map("reward_powerup_qty")
  createdAt          DateTime            @default(now()) @map("created_at")

  studentProgresses StudentDailyChallenge[]

  @@unique([educationStage, challengeDate])
  @@map("daily_challenges")
}

model StudentDailyChallenge {
  id               String          @id @default(uuid())
  studentUserId    String          @map("student_user_id")
  dailyChallengeId String          @map("daily_challenge_id")
  currentProgress  Int             @default(0) @map("current_progress")
  status           ChallengeStatus @default(IN_PROGRESS)
  completedAt      DateTime?       @map("completed_at")
  claimedAt        DateTime?       @map("claimed_at")
  createdAt        DateTime        @default(now()) @map("created_at")
  updatedAt        DateTime        @updatedAt @map("updated_at")

  studentUser    User           @relation(fields: [studentUserId], references: [id], onDelete: Cascade)
  dailyChallenge DailyChallenge @relation(fields: [dailyChallengeId], references: [id], onDelete: Cascade)

  @@unique([studentUserId, dailyChallengeId])
  @@map("student_daily_challenges")
}

// ==========================================
// Student Privacy Settings Model
// ==========================================

model StudentPrivacySetting {
  studentUserId           String   @id @map("student_user_id")
  isHiddenFromLeaderboard Boolean  @default(false) @map("is_hidden_from_leaderboard")
  isPrivacyLocked         Boolean  @default(false) @map("is_privacy_locked")
  updatedAt               DateTime @updatedAt @map("updated_at")

  studentUser User @relation(fields: [studentUserId], references: [id], onDelete: Cascade)

  @@map("student_privacy_settings")
}
```

---

## 2. DTO & Data Transfer Objects

### Daily Challenge DTOs
```typescript
export interface DailyChallengeResponseDto {
  id: string;
  educationStage: 'TK' | 'SD' | 'SMP' | 'SMA';
  challengeDate: string; // YYYY-MM-DD
  title: string;
  description: string;
  targetType: 'QUESTION_COUNT' | 'LESSON_COUNT' | 'ACCURACY_TARGET';
  targetValue: number;
  currentProgress: number;
  rewardXp: number;
  rewardPowerupType?: 'HINT_TOKEN' | 'STREAK_FREEZE';
  rewardPowerupQty?: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CLAIMED';
  completedAt?: string;
  claimedAt?: string;
}

export interface ClaimRewardResponseDto {
  success: boolean;
  challengeId: string;
  status: 'CLAIMED';
  xpAwarded: number;
  powerupAwarded?: {
    type: 'HINT_TOKEN' | 'STREAK_FREEZE';
    quantity: number;
  };
  claimedAt: string;
}
```

### Class Leaderboard DTOs
```typescript
export interface LeaderboardEntryDto {
  rank: number;
  displayName: string;  // Pseudonym / nickname (NO FULL NAME)
  avatarToken: string;  // Visual SVG token (NO REAL PHOTO URL)
  weeklyXp: number;
}

export interface ClassLeaderboardResponseDto {
  classId: string;
  className: string;
  weekStartDate: string; // YYYY-MM-DD (Senin 00:00:00)
  topStudents: LeaderboardEntryDto[];
  myRank?: LeaderboardEntryDto & {
    isHidden: boolean;
  };
}
```

### Student Privacy Setting DTOs
```typescript
export interface StudentPrivacySettingResponseDto {
  studentUserId: string;
  isHiddenFromLeaderboard: boolean;
  isPrivacyLocked: boolean;
  updatedAt: string;
}

export interface UpdateStudentPrivacyRequestDto {
  isHiddenFromLeaderboard: boolean;
}
```
