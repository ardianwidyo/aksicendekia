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
}

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
