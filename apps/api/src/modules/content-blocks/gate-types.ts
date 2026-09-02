import type { ContentBlockType, EducationStage, CurriculumPhase } from "@prisma/client";

/**
 * Shared input/output shapes for accessibility-gate.ts and curriculum-gate.ts.
 * Both gates are pure functions (T059/T060) — they take a fully-loaded snapshot
 * of a lesson and return structured violations, never touching Prisma directly.
 */

export interface GateBlock {
  id: string;
  blockType: ContentBlockType;
  payload: unknown;
  altText: string | null;
  transcriptText: string | null;
  captionAssetId: string | null;
  fallbackAssetId: string | null;
  narrationText: string | null;
}

export interface GateQuestionOption {
  id: string;
  illustrationAssetId?: string | null;
}

export interface GateQuestionItem {
  id: string;
  contentPayload: {
    options?: GateQuestionOption[];
    narrationText?: string | null;
  } | null;
}

export interface GateLesson {
  id: string;
  educationStage: EducationStage;
  phase: CurriculumPhase | null;
  learningObjective: string | null;
  unitId: string | null;
  curriculumAchievementId: string | null;
  curriculumAchievement: {
    achievementText: string | null;
    sourceDocument: string | null;
    sourceUrl: string | null;
    retrievedAt: Date | null;
  } | null;
}

export interface GateSnapshot {
  lesson: GateLesson;
  blocks: GateBlock[];
  questionItems: GateQuestionItem[];
}

export interface GateViolation {
  rule: string;
  blockId: string | null;
  blockType: ContentBlockType | null;
  field: string | null;
  message: string;
}
