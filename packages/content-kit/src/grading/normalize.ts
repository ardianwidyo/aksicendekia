/**
 * Single canonical answer-text normaliser — Feature 010 / contracts/interactive-questions.contract.md §1.
 *
 * Replaces two diverging implementations:
 *   - session-grader.ts       stripped trailing [.,!?]
 *   - local-session-engine.ts stripped trailing [.,!?;:]
 *
 * Unified on the fuller list (deliberate, tested change): a short answer ending in
 * ";" is now graded the same in Guest Mode and in an authenticated session.
 */
const WHITESPACE_RUN = /\s+/g;
const TRAILING_PUNCTUATION = /[.,!?;:]+$/;
const DIACRITICS = /\p{Diacritic}/gu;

export function normalizeAnswerText(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .replace(WHITESPACE_RUN, ' ')
    .toLowerCase()
    .replace(TRAILING_PUNCTUATION, '')
    .normalize('NFD')
    .replace(DIACRITICS, '');
}
