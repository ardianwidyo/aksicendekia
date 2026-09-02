import { z } from "zod";
import { EducationStage, CurriculumPhase, ContentStatus, DifficultyLevel, QuestionType, MatchingMode } from "@prisma/client";

// Subject Schemas
export const createSubjectSchema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(2).max(100),
  educationStage: z.nativeEnum(EducationStage),
  phase: z.nativeEnum(CurriculumPhase),
});

export const updateSubjectSchema = createSubjectSchema.partial();

// Unit Schemas
export const createUnitSchema = z.object({
  subjectId: z.string().uuid(),
  title: z.string().min(2).max(150),
  description: z.string().optional(),
  orderIndex: z.number().int().min(1),
});

export const updateUnitSchema = createUnitSchema.partial().omit({ subjectId: true });

// Lesson Schemas
export const createLessonSchema = z.object({
  unitId: z.string().uuid(),
  title: z.string().min(2).max(150),
  summary: z.string().min(5),
  learningObjective: z.string().min(5),
  educationStage: z.nativeEnum(EducationStage),
  phase: z.nativeEnum(CurriculumPhase),
  difficultyLevel: z.nativeEnum(DifficultyLevel),
  estimatedDurationMinutes: z.number().int().min(1).max(300),
  orderIndex: z.number().int().min(1),
  prerequisiteLessonIds: z.array(z.string().uuid()).optional(),
  // Feature 010 — link to the official curriculum-achievement quote (FR-008a, gate C3).
  curriculumAchievementId: z.string().uuid().optional(),
});

export const updateLessonSchema = createLessonSchema.partial().omit({ unitId: true });

export const setPrerequisitesSchema = z.object({
  prerequisiteLessonIds: z.array(z.string().uuid()),
});

// Question Item Schemas
export const multipleChoiceChoiceSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

export const matchingPairSchema = z.object({
  id: z.string(),
  left: z.string().min(1),
  right: z.string().min(1),
});

export const questionHintSchema = z.object({
  stepOrder: z.number().int().min(1),
  hintText: z.string().min(1),
});

export const baseQuestionItemSchema = z.object({
  lessonId: z.string().uuid(),
  questionType: z.nativeEnum(QuestionType),
  promptText: z.string().min(3),
  explanation: z.string().min(3),
  orderIndex: z.number().int().min(1),
  hints: z.array(questionHintSchema).min(1, "Setidaknya 1 petunjuk bertingkat wajib disediakan"),
  multipleChoicePayload: z.object({
    choices: z.array(multipleChoiceChoiceSchema).min(2, "Pilihan ganda minimal memiliki 2 opsi"),
  }).optional(),
  shortAnswerPayload: z.object({
    acceptedAnswers: z.array(z.string().min(1)).min(1, "Isian singkat minimal memiliki 1 jawaban benar"),
    matchingMode: z.nativeEnum(MatchingMode),
  }).optional(),
  matchingPairsPayload: z.object({
    pairs: z.array(matchingPairSchema).min(2, "Mencocokkan pasangan minimal memiliki 2 pasang"),
  }).optional(),
});

export const createQuestionItemSchema = baseQuestionItemSchema.refine((data) => {
  if (data.questionType === QuestionType.MULTIPLE_CHOICE) {
    if (!data.multipleChoicePayload || data.multipleChoicePayload.choices.length < 2) return false;
    return data.multipleChoicePayload.choices.some((c) => c.isCorrect);
  }
  if (data.questionType === QuestionType.SHORT_ANSWER) {
    return !!data.shortAnswerPayload && data.shortAnswerPayload.acceptedAnswers.length > 0;
  }
  if (data.questionType === QuestionType.MATCHING_PAIRS) {
    return !!data.matchingPairsPayload && data.matchingPairsPayload.pairs.length >= 2;
  }
  return true;
}, {
  message: "Payload konten butir soal tidak sesuai dengan tipe soal yang dipilih",
  path: ["questionType"],
});

export const updateQuestionItemSchema = baseQuestionItemSchema.partial().omit({ lessonId: true });

// Status Transition Schema
export const updateStatusSchema = z.object({
  status: z.nativeEnum(ContentStatus),
});

// CSV Import Request Schema
export const csvImportSchema = z.object({
  lessonId: z.string().uuid(),
  csvContent: z.string().min(1, "Konten CSV tidak boleh kosong"),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type CreateQuestionItemInput = z.infer<typeof createQuestionItemSchema>;
export type UpdateQuestionItemInput = z.infer<typeof updateQuestionItemSchema>;
export type CsvImportInput = z.infer<typeof csvImportSchema>;
