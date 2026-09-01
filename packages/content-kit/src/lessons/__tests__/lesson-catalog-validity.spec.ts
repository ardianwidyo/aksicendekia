import { describe, it, expect } from 'vitest';
import { INTERACTIVE_LESSONS, allLessonIds, listForCatalog, getLessonById } from '../catalog';
import { LEGACY_LESSON_REFS } from '../legacy';
import { conceptBlockCount, widgetBlockCount, interactiveQuestionCount } from '../types';
import { contentBlockPayloadSchema } from '../../schema/content-block.schema';
import { getAchievementById } from '../../curriculum/achievements';
import { gradeQuestion } from '../../grading/grade-question';

/** T017 — structural + curriculum + gradeable validity of all 12 lessons. */

describe('interactive lesson catalog', () => {
  it('has 12 lessons — 3 per stage', () => {
    expect(INTERACTIVE_LESSONS).toHaveLength(12);
    for (const stage of ['TK', 'SD', 'SMP', 'SMA'] as const) {
      expect(INTERACTIVE_LESSONS.filter((l) => l.educationStage === stage)).toHaveLength(3);
    }
  });

  it('every lesson id is unique and every question id is unique', () => {
    const lessonIds = INTERACTIVE_LESSONS.map((l) => l.id);
    expect(new Set(lessonIds).size).toBe(lessonIds.length);
    const questionIds = INTERACTIVE_LESSONS.flatMap((l) => l.questions.map((q) => q.id));
    expect(new Set(questionIds).size).toBe(questionIds.length);
  });

  it('NO lesson is PUBLISHED — content stops at REVIEW (FR-030a)', () => {
    expect(INTERACTIVE_LESSONS.every((l) => l.status === 'REVIEW')).toBe(true);
  });

  it.each(INTERACTIVE_LESSONS)('$id — concept walkthrough + curriculum + questions', (lesson) => {
    // FR-010: >=1 concept block AND >=1 interactive widget before practice
    expect(conceptBlockCount(lesson)).toBeGreaterThanOrEqual(1);
    expect(widgetBlockCount(lesson)).toBeGreaterThanOrEqual(1);

    // FR-027: >=5 questions, >=1 interactive question type
    expect(lesson.questions.length).toBeGreaterThanOrEqual(5);
    expect(interactiveQuestionCount(lesson)).toBeGreaterThanOrEqual(1);

    // FR-008a: linked to a real, fully-provenanced CP row
    const cp = getAchievementById(lesson.curriculumAchievementId);
    expect(cp, `${lesson.id} curriculumAchievementId`).toBeDefined();
    expect(cp!.phase).toBe(lesson.phase);

    // every question has an explanation + at least one hint
    for (const q of lesson.questions) {
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      expect(q.hints.length).toBeGreaterThanOrEqual(1);
    }
  });

  it.each(INTERACTIVE_LESSONS)('$id — content block payloads pass the Zod schema', (lesson) => {
    for (const block of lesson.contentBlocks) {
      const candidate =
        block.blockType === 'RICH_TEXT'
          ? { blockType: 'RICH_TEXT', ...block.payload }
          : block.blockType === 'ILLUSTRATION'
            ? { blockType: 'ILLUSTRATION', mediaAssetId: block.mediaStorageKey, altText: block.altText, ...block.payload }
            : block.blockType === 'ANIMATION'
              ? {
                  blockType: 'ANIMATION',
                  ...block.payload,
                  transcriptText: block.transcriptText,
                  fallbackAssetId: block.fallbackStorageKey,
                }
              : block.blockType === 'VIDEO'
                ? {
                    blockType: 'VIDEO',
                    ...block.payload,
                    mediaAssetId: block.mediaStorageKey,
                    captionAssetId: block.captionStorageKey,
                    transcriptText: block.transcriptText,
                    fallbackAssetId: block.fallbackStorageKey,
                  }
                : { blockType: 'INTERACTIVE_WIDGET', ...block.payload };
      const result = contentBlockPayloadSchema.safeParse(candidate);
      expect(result.success, `${lesson.id} block ${block.blockType}: ${JSON.stringify(result.error?.issues)}`).toBe(true);
    }
  });

  it.each(INTERACTIVE_LESSONS)('$id — every answer key grades its own correct answer as correct', (lesson) => {
    for (const q of lesson.questions) {
      const p = q.contentPayload;
      let studentAnswer: unknown;
      if (q.questionType === 'MULTIPLE_CHOICE') studentAnswer = { selectedOptionId: p.correctOptionId };
      else if (q.questionType === 'SHORT_ANSWER') studentAnswer = { text: (p.acceptedAnswers as string[])[0] };
      else if (q.questionType === 'NUMBER_LINE') studentAnswer = { value: p.targetValue };
      else studentAnswer = { placements: p.correctMapping };
      expect(gradeQuestion(q.questionType, p, studentAnswer).isCorrect, `${q.id}`).toBe(true);
    }
  });
});

describe('catalog + legacy routing (FR-031a)', () => {
  it('listForCatalog returns only LISTED lessons', () => {
    expect(listForCatalog().every((l) => l.listing === 'LISTED')).toBe(true);
    expect(listForCatalog('SD')).toHaveLength(3);
  });

  it('allLessonIds includes the 3 legacy ids so their routes do not 404', () => {
    const ids = allLessonIds();
    expect(ids).toHaveLength(15);
    for (const legacy of LEGACY_LESSON_REFS) {
      expect(ids).toContain(legacy.id);
      // legacy ids are NOT in the catalog listing
      expect(getLessonById(legacy.id)).toBeUndefined();
    }
  });

  it('every legacy lesson points at a real interactive replacement', () => {
    for (const legacy of LEGACY_LESSON_REFS) {
      expect(getLessonById(legacy.supersededByLessonId)).toBeDefined();
    }
  });
});
