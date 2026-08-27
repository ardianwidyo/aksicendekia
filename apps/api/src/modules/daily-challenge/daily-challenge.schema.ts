import { z } from 'zod';

export const claimChallengeParamSchema = z.object({
  challengeId: z.string().uuid({ message: 'Challenge ID harus berupa UUID valid' })
});

export type ClaimChallengeParamInput = z.infer<typeof claimChallengeParamSchema>;
