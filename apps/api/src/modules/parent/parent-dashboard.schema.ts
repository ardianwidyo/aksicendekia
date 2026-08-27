import { z } from "zod";

export const UpdateParentalControlSchema = z.object({
  dailyTimeLimitMinutes: z.number().nullable().optional(), // 15, 30, 45, 60, 90, 120, or null
  isPrivacyLocked: z.boolean().optional(),
});

export type UpdateParentalControlDTO = z.infer<typeof UpdateParentalControlSchema>;
