import { expect } from 'vitest';
import type { InteractiveLesson } from '../../types.js';
import { conceptBlockCount, widgetBlockCount, interactiveQuestionCount } from '../../types.js';
import { getAchievementById } from '../../../curriculum/achievements.js';
import { contentBlockPayloadSchema } from '../../../schema/content-block.schema.js';
import { getWidgetCatalogEntry } from '../../../catalog/widget-catalog.js';
import { gradeQuestion } from '../../../grading/grade-question.js';

/**
 * Feature 011 (contracts/lesson-authoring.md "Test contract"). Re-derives
 * guarantees O1-O12 from the produced lesson - independent of the factory's own
 * assertions - so a regression in `assembleLesson` cannot hide behind itself.
 * Called once per generated instance in every archetype spec.
 */
export function assertArchetypeContract(lesson: InteractiveLesson): void {
  // O1 - never PUBLISHED
  expect(lesson.status).toBe('REVIEW');
  expect(lesson.listing).toBe('LISTED');

  // O2 - one of each block kind
  const kinds = new Set(lesson.contentBlocks.map((b) => b.blockType));
  for (const required of ['ILLUSTRATION', 'ANIMATION', 'INTERACTIVE_WIDGET', 'VIDEO'] as const) {
    expect(kinds, `${lesson.id} missing ${required}`).toContain(required);
  }
  expect(conceptBlockCount(lesson)).toBeGreaterThanOrEqual(1);
  expect(widgetBlockCount(lesson)).toBeGreaterThanOrEqual(1);

  // O3 - >=10 questions
  expect(lesson.questions.length).toBeGreaterThanOrEqual(10);

  // O4 - >=1 interactive question
  expect(interactiveQuestionCount(lesson)).toBeGreaterThanOrEqual(1);

  // O5 - explanation + >=1 staged hint per question
  for (const q of lesson.questions) {
    expect(q.explanation.trim().length, `${q.id} explanation`).toBeGreaterThan(0);
    expect(q.hints.length, `${q.id} hints`).toBeGreaterThanOrEqual(1);
    q.hints.forEach((h, i) => expect(h.stepOrder).toBe(i + 1));
  }

  // O6 - visual blocks carry altText; video blocks carry a transcript
  for (const b of lesson.contentBlocks) {
    if (b.blockType === 'ILLUSTRATION') expect(b.altText?.trim().length, `${lesson.id} illustration altText`).toBeGreaterThan(0);
    if (b.blockType === 'ANIMATION') expect(b.transcriptText?.trim().length, `${lesson.id} animation transcript`).toBeGreaterThan(0);
    if (b.blockType === 'VIDEO') {
      expect(b.transcriptText?.trim().length, `${lesson.id} video transcript`).toBeGreaterThan(0);
      expect(b.videoEmbedId?.length, `${lesson.id} video embed id`).toBeGreaterThan(0);
      expect(b.mediaStorageKey, `${lesson.id} embed video must not be self-hosted`).toBeUndefined();
    }
  }

  // O7 - every media block has a self-hosted fallback
  for (const b of lesson.contentBlocks) {
    if (b.blockType === 'ILLUSTRATION' || b.blockType === 'ANIMATION' || b.blockType === 'VIDEO') {
      expect(b.fallbackStorageKey, `${lesson.id} ${b.blockType} fallback`).toMatch(/^assets\/lessons\/sd\//);
    }
  }

  // O8 - kelas 1-2: every question + its options has a picture companion + narration
  if ((lesson.gradeLevel ?? 6) <= 2) {
    for (const q of lesson.questions) {
      expect(String(q.contentPayload.narrationText ?? '').trim().length, `${q.id} narration`).toBeGreaterThan(0);
      if (q.questionType === 'MULTIPLE_CHOICE') {
        const opts = q.contentPayload.options as Array<{ illustrationAssetId?: string }>;
        expect(opts.every((o) => Boolean(o.illustrationAssetId)), `${q.id} option pictures`).toBe(true);
      }
      if (q.questionType === 'DRAG_DROP_GROUPING') {
        const items = q.contentPayload.items as Array<{ illustrationAssetId?: string }>;
        expect(items.every((it) => Boolean(it.illustrationAssetId)), `${q.id} item pictures`).toBe(true);
      }
      expect(q.questionType).not.toBe('SHORT_ANSWER');
    }
  }

  // O9 - referenced widgets are SUPPORTED in the catalog + params pass their schema
  for (const b of lesson.contentBlocks) {
    if (b.blockType !== 'INTERACTIVE_WIDGET') continue;
    const widget = (b.payload as { widget: { widgetType: string } }).widget;
    const entry = getWidgetCatalogEntry(widget.widgetType);
    expect(entry, `${lesson.id} widget ${widget.widgetType}`).toBeDefined();
    expect(entry!.supportStatus).toBe('SUPPORTED');
    const parsed = contentBlockPayloadSchema.safeParse({ blockType: 'INTERACTIVE_WIDGET', ...b.payload });
    expect(parsed.success, `${lesson.id} widget params: ${JSON.stringify(parsed.error?.issues)}`).toBe(true);
  }

  // O10/O12 - drag-drop object/zone counts stay tappable at 320px
  for (const q of lesson.questions) {
    if (q.questionType !== 'DRAG_DROP_GROUPING') continue;
    const items = q.contentPayload.items as unknown[];
    const groups = q.contentPayload.groups as unknown[];
    const cap = (lesson.gradeLevel ?? 6) <= 2 ? { items: 4, groups: 2 } : { items: 6, groups: 3 };
    expect(items.length, `${q.id} items <= ${cap.items}`).toBeLessThanOrEqual(cap.items);
    expect(groups.length, `${q.id} groups <= ${cap.groups}`).toBeLessThanOrEqual(cap.groups);
  }

  // O11 - every placement question is answerable with a recorded correct mapping
  for (const q of lesson.questions) {
    if (q.questionType === 'DRAG_DROP_GROUPING') {
      expect(q.contentPayload.correctMapping, `${q.id} mapping`).toBeTruthy();
    }
  }

  // Number-line questions must be READABLE (labelled ticks) and REACHABLE:
  // the nearest slider step to the target must grade as correct.
  for (const q of lesson.questions) {
    if (q.questionType !== 'NUMBER_LINE') continue;
    const p = q.contentPayload as {
      min: number; max: number; step: number; targetValue: number; tolerance: number; markers?: number[];
    };
    expect(Array.isArray(p.markers) && p.markers.length >= 2, `${q.id} needs >= 2 markers`).toBe(true);
    expect((p.max - p.min) / p.step, `${q.id} tick count`).toBeLessThanOrEqual(100);
    // snap target to the nearest step, then it must be within tolerance
    const snapped = p.min + Math.round((p.targetValue - p.min) / p.step) * p.step;
    expect(
      Math.abs(snapped - p.targetValue) <= p.tolerance + 1e-9,
      `${q.id} target ${p.targetValue} unreachable at step ${p.step} (nearest ${snapped}, tol ${p.tolerance})`,
    ).toBe(true);
    expect(p.targetValue >= p.min && p.targetValue <= p.max, `${q.id} target in range`).toBe(true);
  }

  // curriculum link is live and phase-consistent
  const cp = getAchievementById(lesson.curriculumAchievementId);
  expect(cp, `${lesson.id} curriculumAchievementId`).toBeDefined();
  expect(cp!.phase).toBe(lesson.phase);
}

/** Distractor rules from the test contract: no wrong option equals the key; no dup options. */
export function assertDistractors(lesson: InteractiveLesson): void {
  for (const q of lesson.questions) {
    if (q.questionType === 'MULTIPLE_CHOICE') {
      const opts = q.contentPayload.options as Array<{ id: string; text: string }>;
      const correct = opts.find((o) => o.id === q.contentPayload.correctOptionId)!;
      const wrong = opts.filter((o) => o.id !== correct.id);
      for (const w of wrong) {
        expect(w.text.trim().toLowerCase(), `${q.id} distractor == key`).not.toBe(
          correct.text.trim().toLowerCase(),
        );
      }
      const all = opts.map((o) => o.text.trim().toLowerCase());
      expect(new Set(all).size, `${q.id} duplicate options`).toBe(all.length);
    }
  }
}

/** Every generated answer key grades its own correct answer as correct. */
export function assertAnswerKeysGrade(lesson: InteractiveLesson): void {
  for (const q of lesson.questions) {
    const p = q.contentPayload;
    let studentAnswer: unknown;
    if (q.questionType === 'MULTIPLE_CHOICE') studentAnswer = { selectedOptionId: p.correctOptionId };
    else if (q.questionType === 'SHORT_ANSWER') studentAnswer = { text: (p.acceptedAnswers as string[])[0] };
    else if (q.questionType === 'NUMBER_LINE') studentAnswer = { value: p.targetValue };
    else studentAnswer = { placements: p.correctMapping };
    expect(gradeQuestion(q.questionType, p, studentAnswer).isCorrect, `${q.id} self-grade`).toBe(true);
  }
}

/** Determinism (test contract): two identical calls produce identical objects. */
export function assertDeterministic<T>(make: () => T): void {
  expect(JSON.stringify(make())).toBe(JSON.stringify(make()));
}
