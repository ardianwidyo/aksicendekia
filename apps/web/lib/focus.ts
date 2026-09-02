/**
 * Feature 011 (US1, FR-001..FR-006) — the web App Router adaptor over
 * content-kit's framework-agnostic focus-config. Web routes address stages by
 * lowercase id (`sd`, `smp`, …); content-kit speaks `EducationStage`
 * (`SD`, `SMP`, …). This module is the one place that bridge lives.
 *
 * Every helper is a pure function (no I/O, no `window`) so it is safe to call
 * from `generateStaticParams`, a Server Component, or a Client Component alike.
 */
import {
  getFocusConfig,
  isStageInFocus,
  isSubjectInFocus,
  isLessonInFocus,
  filterLessonsForFocus,
  focusRedirectTarget,
  type FocusableLesson,
} from '@aksicendekia/content-kit';

export { isStageInFocus, isSubjectInFocus, isLessonInFocus, filterLessonsForFocus };
export type { FocusableLesson };

type EducationStageCode = 'TK' | 'SD' | 'SMP' | 'SMA';

const STAGE_CODE: Record<string, EducationStageCode> = {
  tk: 'TK',
  sd: 'SD',
  smp: 'SMP',
  sma: 'SMA',
};

export function isFocusModeEnabled(): boolean {
  return getFocusConfig().enabled;
}

/** Accepts either a lowercase web id (`'sd'`) or an EducationStage code (`'SD'`). */
export function isWebStageInFocus(stageId: string): boolean {
  const code = STAGE_CODE[stageId.toLowerCase()];
  return code ? isStageInFocus(code) : false;
}

/** Narrows a list of `{ id }` stage options to those in focus (identity when focus is off). */
export function filterStageOptions<T extends { id: string }>(stages: readonly T[]): T[] {
  return stages.filter((stage) => isWebStageInFocus(stage.id));
}

export function focusRedirectPath(): string {
  return focusRedirectTarget();
}

/**
 * For a lesson-detail route: the path to redirect to when `lesson` is out of
 * focus, or `null` when it is in focus (or unknown — the caller keeps the id in
 * `generateStaticParams` regardless, per R3, and lets the client redirect).
 */
export function outOfFocusRedirect(lesson: FocusableLesson | undefined | null): string | null {
  if (!lesson) return null;
  return isLessonInFocus(lesson) ? null : focusRedirectTarget();
}
