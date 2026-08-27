import { z } from 'zod';

export const classLeaderboardParamSchema = z.object({
  classId: z.string().uuid({ message: 'Class ID harus berupa UUID valid' })
});

export const updateStudentPrivacySchema = z.object({
  isHiddenFromLeaderboard: z.boolean({ required_error: 'isHiddenFromLeaderboard harus berupa boolean' })
});

export const parentPrivacyLockParamSchema = z.object({
  studentId: z.string().uuid({ message: 'Student ID harus berupa UUID valid' })
});

export const parentPrivacyLockSchema = z.object({
  isPrivacyLocked: z.boolean({ required_error: 'isPrivacyLocked harus berupa boolean' }),
  overrideIsHiddenFromLeaderboard: z.boolean().optional()
});

export type ClassLeaderboardParamInput = z.infer<typeof classLeaderboardParamSchema>;
export type UpdateStudentPrivacyInput = z.infer<typeof updateStudentPrivacySchema>;
export type ParentPrivacyLockParamInput = z.infer<typeof parentPrivacyLockParamSchema>;
export type ParentPrivacyLockInput = z.infer<typeof parentPrivacyLockSchema>;
