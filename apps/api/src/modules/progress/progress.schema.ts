import { z } from 'zod';

export const consumePowerupSchema = z.object({
  powerupType: z.enum(['HINT_TOKEN', 'STREAK_FREEZE'], {
    errorMap: () => ({ message: 'Tipe power-up harus HINT_TOKEN atau STREAK_FREEZE' })
  }),
  sessionId: z.string().uuid({ message: 'Session ID harus berupa UUID valid' }).optional()
});

export const missionMapParamSchema = z.object({
  subjectId: z.string().uuid({ message: 'Subject ID harus berupa UUID valid' })
});

export type ConsumePowerupInput = z.infer<typeof consumePowerupSchema>;
export type MissionMapParamInput = z.infer<typeof missionMapParamSchema>;
