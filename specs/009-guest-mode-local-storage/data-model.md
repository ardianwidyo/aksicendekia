# Data Model: Akses Mode Tamu & Penyimpanan Progres Lokal

**Feature Branch**: `009-guest-mode-local-storage` | **Date**: 2026-08-28

---

## 1. Client-Side Local State Schema (Zod Validation)

Data model lokal yang disimpan pada `IndexedDB` / `LocalStorage` pada peramban klien.

### A. `GuestProgressState` (Root Schema)
```typescript
import { z } from 'zod';

export const EducationStageSchema = z.enum(['TK', 'SD', 'SMP', 'SMA']);

export const GuestProfileSchema = z.object({
  displayName: z.string().min(1).max(30).default('Siswa Hebat'),
  educationStage: EducationStageSchema.default('SD'),
  gradeLevel: z.number().int().min(1).max(12).default(1),
  avatarId: z.string().default('avatar_default_kancil'),
});

export const GuestStreakSchema = z.object({
  currentStreak: z.number().int().nonnegative().default(0),
  longestStreak: z.number().int().nonnegative().default(0),
  lastActivityDate: z.string().nullable().default(null), // Format: YYYY-MM-DD
  activityHistory: z.array(z.string()).default([]), // List of ISO Date Strings (YYYY-MM-DD)
});

export const GuestGamificationSchema = z.object({
  totalXp: z.number().int().nonnegative().default(0),
  currentLevel: z.number().int().positive().default(1),
  streak: GuestStreakSchema.default(() => ({
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    activityHistory: [],
  })),
  unlockedBadgeIds: z.array(z.string()).default([]),
});

export const GuestLessonScoreSchema = z.object({
  bestScore: z.number().min(0).max(100),
  attempts: z.number().int().positive(),
  lastCompletedAt: z.string().datetime(),
  timeSpentSeconds: z.number().nonnegative(),
});

export const GuestCurriculumProgressSchema = z.object({
  completedLessonIds: z.array(z.string()).default([]),
  completedModuleIds: z.array(z.string()).default([]),
  lessonScores: z.record(z.string(), GuestLessonScoreSchema).default({}),
});

export const GuestSessionAnswerRecordSchema = z.object({
  questionId: z.string(),
  userAnswer: z.union([z.string(), z.array(z.string()), z.record(z.string(), z.string())]),
  isCorrect: z.boolean(),
  timeSpentSeconds: z.number().nonnegative(),
  hintsUsed: z.number().int().nonnegative().default(0),
});

export const GuestSessionRecordSchema = z.object({
  sessionId: z.string().uuid(),
  lessonId: z.string(),
  educationStage: EducationStageSchema,
  totalQuestions: z.number().int().positive(),
  correctCount: z.number().int().nonnegative(),
  scorePercentage: z.number().min(0).max(100),
  xpEarned: z.number().int().nonnegative(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  timeSpentSeconds: z.number().nonnegative(),
  answers: z.array(GuestSessionAnswerRecordSchema).default([]),
});

export const GuestProgressStateSchema = z.object({
  guestId: z.string().uuid(),
  schemaVersion: z.literal(1).default(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  profile: GuestProfileSchema.default(() => ({
    displayName: 'Siswa Hebat',
    educationStage: 'SD',
    gradeLevel: 1,
    avatarId: 'avatar_default_kancil',
  })),
  gamification: GuestGamificationSchema.default(() => ({
    totalXp: 0,
    currentLevel: 1,
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      activityHistory: [],
    },
    unlockedBadgeIds: [],
  })),
  curriculumProgress: GuestCurriculumProgressSchema.default(() => ({
    completedLessonIds: [],
    completedModuleIds: [],
    lessonScores: {},
  })),
  recentSessions: z.array(GuestSessionRecordSchema).max(30).default([]),
  isMigrated: z.boolean().default(false),
  migratedToUserId: z.string().nullable().default(null),
});

export type GuestProgressState = z.infer<typeof GuestProgressStateSchema>;
export type GuestProfile = z.infer<typeof GuestProfileSchema>;
export type GuestGamification = z.infer<typeof GuestGamificationSchema>;
export type GuestSessionRecord = z.infer<typeof GuestSessionRecordSchema>;
```

---

## 2. Server-Side DTOs for Migration & Sync

### A. `GuestSyncRequestSchema` (`POST /api/v1/sync/guest-progress`)
```typescript
import { z } from 'zod';
import { GuestSessionRecordSchema } from './guest-progress.schema';

export const GuestSyncRequestSchema = z.object({
  guestId: z.string().uuid(),
  totalXp: z.number().int().min(0).max(10000), // Max 10.000 XP sanity check
  streakCount: z.number().int().min(0).max(365),
  completedLessonIds: z.array(z.string()).max(500),
  completedModuleIds: z.array(z.string()).max(100),
  unlockedBadgeIds: z.array(z.string()).max(50),
  sessionHistory: z.array(GuestSessionRecordSchema).max(30),
});

export const GuestSyncResponseSchema = z.object({
  success: z.boolean(),
  mergedXp: z.number().int().nonnegative(),
  newLevel: z.number().int().positive(),
  totalCompletedLessons: z.number().int().nonnegative(),
  syncedAt: z.string().datetime(),
  message: z.string(),
});

export type GuestSyncRequest = z.infer<typeof GuestSyncRequestSchema>;
export type GuestSyncResponse = z.infer<typeof GuestSyncResponseSchema>;
```

---

## 3. Database Sync Representation (Prisma Backend)

Ketika data tamu dimigrasikan ke backend:
- XP digabungkan ke tabel `StudentProfile.xp` dan `UserGamification`.
- Sesi latihan dicatat ke tabel `LearningSession` dengan kolom `metadata: { source: "GUEST_MIGRATION", original_guest_id: guestId }`.
- Status pelajaran selesai dicatat ke tabel `LessonProgress` per siswa.
