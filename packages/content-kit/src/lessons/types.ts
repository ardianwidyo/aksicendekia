import type { CurriculumPhase, EducationStage } from '../curriculum/achievements.js';

/** Authoring shape for one content block (asset ids are relative storage keys). */
export interface LessonBlockInput {
  blockType: 'RICH_TEXT' | 'ILLUSTRATION' | 'ANIMATION' | 'VIDEO' | 'INTERACTIVE_WIDGET';
  payload: Record<string, unknown>;
  altText?: string;
  transcriptText?: string;
  mediaStorageKey?: string;
  captionStorageKey?: string;
  fallbackStorageKey?: string;
  narrationText?: string;
  /**
   * Feature 011 — set on VIDEO blocks that embed a third-party video instead
   * of serving a self-hosted asset. Resolves via `getVideoEmbed` in
   * video-registry.ts. Mutually exclusive with `mediaStorageKey` on the same
   * block (Constitution VI v1.2.0 exception; contracts/video-embed.md).
   */
  videoEmbedId?: string;
}

/**
 * Feature 011 — the 10 reusable lesson factories (contracts/lesson-authoring.md).
 * Every SD lesson records which one produced it so per-archetype invariants
 * (O1-O12) can be traced back to their generator.
 */
export type LessonArchetypeId =
  | 'PLACE_VALUE'
  | 'NUMBER_LINE'
  | 'FRACTIONS'
  | 'OPERATIONS'
  | 'MEASUREMENT'
  | 'GEOMETRY'
  | 'DATA_CHART'
  | 'TIME'
  | 'MONEY'
  | 'PATTERNS';

/** SD grade levels 1-6 (data-model.md §1). Must stay consistent with `phase`. */
export type SdGradeLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface LessonQuestionInput {
  id: string;
  questionType: 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'DRAG_DROP_GROUPING' | 'NUMBER_LINE';
  promptText: string;
  /** Includes the answer key + `explanation`. Served verbatim only on the public/Guest path. */
  contentPayload: Record<string, unknown>;
  explanation: string;
  hints: Array<{ stepOrder: number; hintText: string }>;
}

export type LessonStatus = 'DRAFT' | 'REVIEW';
export type LessonListing = 'LISTED' | 'HIDDEN_LEGACY';

export interface InteractiveLesson {
  /** Stable id used across web + api. */
  id: string;
  educationStage: EducationStage;
  phase: CurriculumPhase;
  subjectCode: string;
  subjectName: string;
  unitTitle: string;
  title: string;
  summary: string;
  learningObjective: string;
  /** References a row in CURRICULUM_ACHIEVEMENTS (FR-008a). */
  curriculumAchievementId: string;
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedDurationMinutes: number;
  orderIndex: number;
  /**
   * Content produced by this feature stops at REVIEW — never PUBLISHED.
   * REVIEW -> PUBLISHED is a human action via the CMS publish endpoint (FR-030a).
   */
  status: LessonStatus;
  listing: LessonListing;
  supersededByLessonId?: string;
  contentBlocks: LessonBlockInput[];
  questions: LessonQuestionInput[];
  /** Feature 011 — set for SD lessons; absent for TK/SMP/SMA (no grade axis there). */
  gradeLevel?: SdGradeLevel;
  /** Feature 011 — which factory in lessons/archetypes/ produced this lesson. */
  archetype?: LessonArchetypeId;
}

export function conceptBlockCount(lesson: InteractiveLesson): number {
  return lesson.contentBlocks.filter(
    (b) => b.blockType === 'ILLUSTRATION' || b.blockType === 'ANIMATION',
  ).length;
}

export function widgetBlockCount(lesson: InteractiveLesson): number {
  return lesson.contentBlocks.filter((b) => b.blockType === 'INTERACTIVE_WIDGET').length;
}

export function interactiveQuestionCount(lesson: InteractiveLesson): number {
  return lesson.questions.filter(
    (q) => q.questionType === 'DRAG_DROP_GROUPING' || q.questionType === 'NUMBER_LINE',
  ).length;
}

/** Feature 011 / FR-013 — true when the lesson has an embedded third-party video block. */
export function hasEmbeddedVideo(lesson: InteractiveLesson): boolean {
  return lesson.contentBlocks.some((b) => b.blockType === 'VIDEO' && Boolean(b.videoEmbedId));
}
