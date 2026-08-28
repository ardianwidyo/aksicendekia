import { z } from "zod";

export const GuestSessionAnswerSchema = z.object({
  questionId: z.string(),
  userAnswer: z.union([z.string(), z.array(z.string()), z.record(z.string(), z.string())]),
  isCorrect: z.boolean(),
  timeSpentSeconds: z.number().nonnegative(),
  hintsUsed: z.number().int().nonnegative().default(0),
});

export const GuestSessionRecordSyncSchema = z.object({
  sessionId: z.string().min(1),
  lessonId: z.string(),
  educationStage: z.enum(["TK", "SD", "SMP", "SMA"]),
  totalQuestions: z.number().int().positive(),
  correctCount: z.number().int().nonnegative(),
  scorePercentage: z.number().min(0).max(100),
  xpEarned: z.number().int().nonnegative(),
  startedAt: z.string(),
  completedAt: z.string(),
  timeSpentSeconds: z.number().nonnegative(),
  answers: z.array(GuestSessionAnswerSchema).default([]),
});

export const GuestSyncRequestSchema = z.object({
  guestId: z.string().uuid(),
  totalXp: z.number().int().min(0).max(10000), // Max 10.000 XP sanity check
  streakCount: z.number().int().min(0).max(365),
  completedLessonIds: z.array(z.string()).max(500),
  completedModuleIds: z.array(z.string()).max(100),
  unlockedBadgeIds: z.array(z.string()).max(50),
  sessionHistory: z.array(GuestSessionRecordSyncSchema).max(30),
});

export const GuestSyncResponseSchema = z.object({
  success: z.boolean(),
  mergedXp: z.number().int().nonnegative(),
  newLevel: z.number().int().positive(),
  totalCompletedLessons: z.number().int().nonnegative(),
  syncedAt: z.string(),
  message: z.string(),
});

export type GuestSyncRequest = z.infer<typeof GuestSyncRequestSchema>;
export type GuestSyncResponse = z.infer<typeof GuestSyncResponseSchema>;
