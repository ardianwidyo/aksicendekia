import { normalizeAnswerText } from './normalize.js';
import { parseQuestionPayload } from '../schema/question-payload.schema.js';

/**
 * Single pure grader — Feature 010 / contracts/interactive-questions.contract.md.
 * Consumed by apps/api (session-grader) and apps/web (local-session-engine).
 * No I/O, synchronous. Any payload it cannot make sense of grades as incorrect.
 */

export interface GradeResult {
  isCorrect: boolean;
  correctAnswerDetails: Record<string, unknown>;
}

const FLOAT_EPSILON = 1e-9;

function readString(answer: unknown, ...keys: string[]): string {
  if (typeof answer === 'string') return answer;
  if (answer && typeof answer === 'object') {
    const obj = answer as Record<string, unknown>;
    for (const key of keys) {
      if (typeof obj[key] === 'string') return obj[key] as string;
    }
  }
  return '';
}

function readMap(answer: unknown, ...keys: string[]): Record<string, string> {
  const source =
    answer && typeof answer === 'object' && !Array.isArray(answer)
      ? (answer as Record<string, unknown>)
      : {};
  for (const key of keys) {
    const nested = source[key];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return coerceStringMap(nested as Record<string, unknown>);
    }
  }
  return coerceStringMap(source);
}

function coerceStringMap(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

function mapsEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k) => a[k] === b[k]);
}

export function gradeQuestion(
  questionType: string,
  contentPayload: unknown,
  studentAnswer: unknown,
): GradeResult {
  const internal = parseQuestionPayload(questionType, contentPayload);
  if (!internal) return { isCorrect: false, correctAnswerDetails: {} };

  switch (internal.kind) {
    case 'MULTIPLE_CHOICE': {
      const selected = readString(studentAnswer, 'selectedOptionId', 'optionId', 'id').trim();
      const correct = (internal.correctOptionId ?? '').trim();
      return {
        isCorrect: Boolean(selected) && Boolean(correct) && selected === correct,
        correctAnswerDetails: { correctOptionId: internal.correctOptionId },
      };
    }

    case 'SHORT_ANSWER': {
      const raw = readString(studentAnswer, 'text', 'answer');
      const { acceptedAnswers, matchingMode } = internal;
      let isCorrect = false;
      if (matchingMode === 'EXACT') {
        isCorrect = acceptedAnswers.some((a) => a === raw);
      } else if (matchingMode === 'CASE_INSENSITIVE') {
        const lowered = raw.trim().toLowerCase();
        isCorrect = acceptedAnswers.some((a) => a.trim().toLowerCase() === lowered);
      } else {
        const normalized = normalizeAnswerText(raw);
        isCorrect = acceptedAnswers.some((a) => normalizeAnswerText(a) === normalized);
      }
      return { isCorrect, correctAnswerDetails: { acceptedAnswers, matchingMode } };
    }

    case 'MATCHING_PAIRS': {
      const expected = internal.expectedPairs;
      const student = readMap(studentAnswer, 'pairs');
      const isCorrect = Object.keys(expected).length > 0 && mapsEqual(student, expected);
      return { isCorrect, correctAnswerDetails: { matchingPairs: expected } };
    }

    case 'DRAG_DROP_GROUPING': {
      const expected = internal.correctMapping;
      const placements = readMap(studentAnswer, 'placements');
      const isCorrect = Object.keys(expected).length > 0 && mapsEqual(placements, expected);
      return { isCorrect, correctAnswerDetails: { correctMapping: expected } };
    }

    case 'NUMBER_LINE': {
      const rawValue =
        typeof studentAnswer === 'number'
          ? studentAnswer
          : Number((studentAnswer as { value?: unknown } | null)?.value);
      const isCorrect =
        Number.isFinite(rawValue) &&
        Number.isFinite(internal.targetValue) &&
        Math.abs(rawValue - internal.targetValue) <= internal.tolerance + FLOAT_EPSILON;
      return {
        isCorrect,
        correctAnswerDetails: { targetValue: internal.targetValue, tolerance: internal.tolerance },
      };
    }

    default:
      return { isCorrect: false, correctAnswerDetails: {} };
  }
}

export { normalizeAnswerText };
