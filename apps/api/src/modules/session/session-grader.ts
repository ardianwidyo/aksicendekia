/**
 * Server-side question grading.
 *
 * Feature 010 moved the grading logic into `@aksicendekia/content-kit` so the
 * authenticated session path and the Guest Mode client path share ONE
 * implementation (previously they had diverged on key convention and on which
 * trailing punctuation was stripped). This module is now a thin re-export that
 * keeps the historical import path stable for `session.service.ts`.
 */
export { gradeQuestion, normalizeAnswerText } from '@aksicendekia/content-kit';
export type { GradeResult } from '@aksicendekia/content-kit';
