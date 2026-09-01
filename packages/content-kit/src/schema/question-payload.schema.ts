import { z } from 'zod';

/**
 * Canonical question-payload parser — Feature 010 / contracts/interactive-questions.contract.md §1.
 *
 * The repo currently carries TWO diverging key conventions:
 *   - apps/api/.../session-grader.ts    → camelCase  (correctOptionId, acceptedAnswers, matchingMode)
 *   - apps/web/.../local-session-engine.ts → snake_case (correct_option_id, accepted_answers, matching_pairs)
 *
 * This parser accepts BOTH and produces one internal shape so grading has a single source of truth.
 */

export const QUESTION_TYPES = [
  'MULTIPLE_CHOICE',
  'SHORT_ANSWER',
  'MATCHING_PAIRS',
  'DRAG_DROP_GROUPING',
  'NUMBER_LINE',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const MATCHING_MODES = ['EXACT', 'CASE_INSENSITIVE', 'NORMALIZED'] as const;
export type MatchingMode = (typeof MATCHING_MODES)[number];

export interface MultipleChoiceInternal {
  kind: 'MULTIPLE_CHOICE';
  correctOptionId: string | undefined;
}

export interface ShortAnswerInternal {
  kind: 'SHORT_ANSWER';
  acceptedAnswers: string[];
  matchingMode: MatchingMode;
}

export interface MatchingPairsInternal {
  kind: 'MATCHING_PAIRS';
  expectedPairs: Record<string, string>;
}

export interface DragDropGroupingInternal {
  kind: 'DRAG_DROP_GROUPING';
  correctMapping: Record<string, string>;
  requireAllPlaced: boolean;
}

export interface NumberLineInternal {
  kind: 'NUMBER_LINE';
  targetValue: number;
  tolerance: number;
}

export type QuestionInternal =
  | MultipleChoiceInternal
  | ShortAnswerInternal
  | MatchingPairsInternal
  | DragDropGroupingInternal
  | NumberLineInternal;

type Raw = Record<string, unknown>;

function asRecord(value: unknown): Raw {
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? (parsed as Raw) : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === 'object' ? (value as Raw) : {};
}

function pick<T>(raw: Raw, ...keys: string[]): T | undefined {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key] as T;
  }
  return undefined;
}

function normalizePairs(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(raw)) {
    for (const p of raw as Array<{ left?: unknown; right?: unknown }>) {
      if (typeof p?.left === 'string' && typeof p?.right === 'string') out[p.left] = p.right;
    }
  } else if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === 'string') out[k] = v;
    }
  }
  return out;
}

/**
 * Read a stored question payload (any convention) into a normalized internal shape.
 * Returns undefined only for an unknown question type.
 */
export function parseQuestionPayload(
  questionType: string,
  contentPayload: unknown,
): QuestionInternal | undefined {
  const raw = asRecord(contentPayload);

  switch (questionType) {
    case 'MULTIPLE_CHOICE': {
      let correctOptionId = pick<string>(raw, 'correctOptionId', 'correct_option_id');
      if (!correctOptionId) {
        const options = pick<Array<{ id?: string; isCorrect?: boolean }>>(raw, 'options', 'choices');
        correctOptionId = options?.find((o) => o?.isCorrect)?.id;
      }
      return { kind: 'MULTIPLE_CHOICE', correctOptionId };
    }
    case 'SHORT_ANSWER': {
      const acceptedAnswers = pick<string[]>(raw, 'acceptedAnswers', 'accepted_answers') ?? [];
      const modeRaw = pick<string>(raw, 'matchingMode', 'matching_mode') ?? 'NORMALIZED';
      const matchingMode = (MATCHING_MODES as readonly string[]).includes(modeRaw)
        ? (modeRaw as MatchingMode)
        : 'NORMALIZED';
      return { kind: 'SHORT_ANSWER', acceptedAnswers, matchingMode };
    }
    case 'MATCHING_PAIRS': {
      const expectedPairs = normalizePairs(pick(raw, 'matchingPairs', 'matching_pairs', 'pairs'));
      return { kind: 'MATCHING_PAIRS', expectedPairs };
    }
    case 'DRAG_DROP_GROUPING': {
      const correctMapping = (pick<Record<string, string>>(raw, 'correctMapping', 'correct_mapping') ??
        {}) as Record<string, string>;
      const requireAllPlaced = pick<boolean>(raw, 'requireAllPlaced', 'require_all_placed') ?? true;
      return { kind: 'DRAG_DROP_GROUPING', correctMapping, requireAllPlaced };
    }
    case 'NUMBER_LINE': {
      const targetValue = Number(pick<number>(raw, 'targetValue', 'target_value'));
      const tolerance = Number(pick<number>(raw, 'tolerance') ?? 0);
      return {
        kind: 'NUMBER_LINE',
        targetValue,
        tolerance: Number.isFinite(tolerance) ? tolerance : 0,
      };
    }
    default:
      return undefined;
  }
}

/** Authoring-time schema for a picture-option (TK) multiple-choice option. */
export const pictureOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().optional(),
  illustrationAssetId: z.string().min(1),
});
