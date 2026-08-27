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

export const sessionHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type GetHintInput = z.infer<typeof getHintSchema>;
export type SessionHistoryQueryInput = z.infer<typeof sessionHistoryQuerySchema>;
