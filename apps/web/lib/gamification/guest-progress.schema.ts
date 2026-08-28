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
  lastActivityDate: z.string().nullable().default(null), // YYYY-MM-DD
  activityHistory: z.array(z.string()).default([]),
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
  lastCompletedAt: z.string(),
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
  sessionId: z.string().min(1),
  lessonId: z.string(),
  educationStage: EducationStageSchema,
  totalQuestions: z.number().int().positive(),
  correctCount: z.number().int().nonnegative(),
  scorePercentage: z.number().min(0).max(100),
  xpEarned: z.number().int().nonnegative(),
  startedAt: z.string(),
  completedAt: z.string(),
  timeSpentSeconds: z.number().nonnegative(),
  answers: z.array(GuestSessionAnswerRecordSchema).default([]),
});

export const GuestProgressStateSchema = z.object({
  guestId: z.string().uuid(),
  schemaVersion: z.literal(1).default(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  profile: GuestProfileSchema.default(() => ({
    displayName: 'Siswa Hebat',
    educationStage: 'SD' as const,
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

export type EducationStage = z.infer<typeof EducationStageSchema>;
export type GuestProfile = z.infer<typeof GuestProfileSchema>;
export type GuestStreak = z.infer<typeof GuestStreakSchema>;
export type GuestGamification = z.infer<typeof GuestGamificationSchema>;
export type GuestLessonScore = z.infer<typeof GuestLessonScoreSchema>;
export type GuestCurriculumProgress = z.infer<typeof GuestCurriculumProgressSchema>;
export type GuestSessionAnswerRecord = z.infer<typeof GuestSessionAnswerRecordSchema>;
export type GuestSessionRecord = z.infer<typeof GuestSessionRecordSchema>;
export type GuestProgressState = z.infer<typeof GuestProgressStateSchema>;
