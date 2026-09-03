import { describe, it, expect } from 'vitest';
import { INTERACTIVE_LESSONS, allLessonIds, listForCatalog, getLessonById, listForGrade } from '../catalog';
import { SD_VIDEO_REFS } from '../sd/index';
import { LEGACY_LESSON_REFS } from '../legacy';
import { conceptBlockCount, widgetBlockCount, interactiveQuestionCount } from '../types';
import { contentBlockPayloadSchema } from '../../schema/content-block.schema';
import { videoEmbedRefSchema } from '../../schema/video-embed.schema';
import { getAchievementById } from '../../curriculum/achievements';
import { gradeQuestion } from '../../grading/grade-question';
import { buildVideoRegistry } from '../video-registry';

/**
 * T017 (Feature 010) + T072/T073 (Feature 011). Structural / curriculum /
 * gradeable validity of the whole interactive catalog: 3 TK + 60 SD Matematika
 * (kelas 1-6) + 3 SMP + 3 SMA, plus the 9 SD catalog invariants from
 * data-model.md §4.
 */

const SD_LESSONS_VIEW = INTERACTIVE_LESSONS.filter((l) => l.educationStage === 'SD');
const SD_REGISTRY = buildVideoRegistry(SD_VIDEO_REFS);
const SD_ELEMENT_OF_CP: Record<string, string> = {
  bilangan: 'Bilangan',
  aljabar: 'Aljabar',
  pengukuran: 'Pengukuran',
  geometri: 'Geometri',
  'data-peluang': 'Analisis Data dan Peluang',
};

describe('interactive lesson catalog', () => {
  it('has 69 lessons — 3 TK + 60 SD + 3 SMP + 3 SMA', () => {
    expect(INTERACTIVE_LESSONS).toHaveLength(69);
    expect(INTERACTIVE_LESSONS.filter((l) => l.educationStage === 'TK')).toHaveLength(3);
    expect(INTERACTIVE_LESSONS.filter((l) => l.educationStage === 'SD')).toHaveLength(60);
    expect(INTERACTIVE_LESSONS.filter((l) => l.educationStage === 'SMP')).toHaveLength(3);
    expect(INTERACTIVE_LESSONS.filter((l) => l.educationStage === 'SMA')).toHaveLength(3);
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
    expect(conceptBlockCount(lesson)).toBeGreaterThanOrEqual(1);
    expect(widgetBlockCount(lesson)).toBeGreaterThanOrEqual(1);

    expect(lesson.questions.length).toBeGreaterThanOrEqual(5);
    expect(interactiveQuestionCount(lesson)).toBeGreaterThanOrEqual(1);

    const cp = getAchievementById(lesson.curriculumAchievementId);
    expect(cp, `${lesson.id} curriculumAchievementId`).toBeDefined();
    expect(cp!.phase).toBe(lesson.phase);

    for (const q of lesson.questions) {
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      expect(q.hints.length).toBeGreaterThanOrEqual(1);
    }
  });

  it.each(INTERACTIVE_LESSONS)('$id — content block payloads pass their schema', (lesson) => {
    for (const block of lesson.contentBlocks) {
      // Feature 011: a VIDEO block that embeds a third-party video carries a
      // `videoEmbedId` (never a self-hosted `mediaStorageKey`); it is validated
      // against the video registry, not the self-hosted videoPayload schema.
      if (block.blockType === 'VIDEO' && block.videoEmbedId) {
        const ref = SD_REGISTRY[block.videoEmbedId];
        expect(ref, `${lesson.id} video ${block.videoEmbedId} not in registry`).toBeDefined();
        expect(videoEmbedRefSchema.safeParse(ref).success, `${lesson.id} video ref invalid`).toBe(true);
        expect(block.transcriptText?.trim().length ?? 0).toBeGreaterThan(0);
        expect(block.fallbackStorageKey).toMatch(/^assets\/lessons\/sd\//);
        continue;
      }
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

describe('SD Matematika catalog — the 9 invariants (data-model.md §4)', () => {
  const grades = [1, 2, 3, 4, 5, 6] as const;

  it('1 — every grade 1-6 has >= 10 LISTED lessons', () => {
    for (const g of grades) {
      const lessons = listForGrade(g).filter((l) => l.listing === 'LISTED');
      expect(lessons.length, `kelas ${g}`).toBeGreaterThanOrEqual(10);
    }
  });

  it('2 — every SD lesson has >= 10 questions and >= 1 interactive question', () => {
    for (const l of SD_LESSONS_VIEW) {
      expect(l.questions.length, `${l.id} question count`).toBeGreaterThanOrEqual(10);
      expect(interactiveQuestionCount(l), `${l.id} interactive`).toBeGreaterThanOrEqual(1);
    }
  });

  it('US4/T107 — every SD practice item has an explanation and >= 1 staged hint', () => {
    for (const l of SD_LESSONS_VIEW) {
      for (const q of l.questions) {
        expect(q.explanation.trim().length, `${q.id} explanation`).toBeGreaterThan(0);
        expect(q.hints.length, `${q.id} hint count`).toBeGreaterThanOrEqual(1);
        q.hints.forEach((h, i) => {
          expect(h.stepOrder, `${q.id} hint stepOrder`).toBe(i + 1);
          expect(h.hintText.trim().length, `${q.id} hint text`).toBeGreaterThan(0);
        });
      }
    }
  });

  it('3 — every SD lesson has >= 1 ILLUSTRATION, ANIMATION, INTERACTIVE_WIDGET and VIDEO block', () => {
    for (const l of SD_LESSONS_VIEW) {
      const kinds = new Set(l.contentBlocks.map((b) => b.blockType));
      for (const req of ['ILLUSTRATION', 'ANIMATION', 'INTERACTIVE_WIDGET', 'VIDEO'] as const) {
        expect(kinds, `${l.id} missing ${req}`).toContain(req);
      }
    }
  });

  it('4 — every curriculumAchievementId resolves; every grade covers all 5 Matematika elements', () => {
    for (const l of SD_LESSONS_VIEW) {
      const cp = getAchievementById(l.curriculumAchievementId);
      expect(cp, `${l.id} cp`).toBeDefined();
      expect(cp!.subjectCode).toBe('MATH_SD');
    }
    for (const g of grades) {
      const elements = new Set(
        listForGrade(g).map((l) => getAchievementById(l.curriculumAchievementId)!.element),
      );
      for (const el of Object.values(SD_ELEMENT_OF_CP)) {
        expect(elements, `kelas ${g} missing element ${el}`).toContain(el);
      }
    }
  });

  it('5 — orderIndex is unique and dense (0..n-1) within each grade', () => {
    for (const g of grades) {
      const idx = listForGrade(g).map((l) => l.orderIndex).sort((a, b) => a - b);
      expect(idx, `kelas ${g}`).toEqual(idx.map((_, i) => i));
    }
  });

  it('6 — no exact duplicate lesson titles within one grade', () => {
    for (const g of grades) {
      const titles = listForGrade(g).map((l) => l.title.trim().toLowerCase());
      expect(new Set(titles).size, `kelas ${g}`).toBe(titles.length);
    }
  });

  it('7 — no seeded SD lesson is PUBLISHED', () => {
    expect(SD_LESSONS_VIEW.every((l) => l.status === 'REVIEW')).toBe(true);
  });

  it('8 — every embedded VIDEO block resolves to a registry row with a self-hosted poster', () => {
    for (const l of SD_LESSONS_VIEW) {
      for (const b of l.contentBlocks) {
        if (b.blockType !== 'VIDEO') continue;
        expect(b.videoEmbedId, `${l.id} VIDEO block has no embed id`).toBeTruthy();
        const ref = SD_REGISTRY[b.videoEmbedId!];
        expect(ref, `${l.id} -> ${b.videoEmbedId} missing from registry`).toBeDefined();
        expect(ref!.posterStorageKey).toMatch(/^assets\/lessons\/sd\//);
        expect(b.mediaStorageKey, `${l.id} embed VIDEO must not be self-hosted`).toBeUndefined();
      }
    }
    // one ref per lesson, ids unique
    expect(SD_VIDEO_REFS).toHaveLength(60);
    expect(new Set(SD_VIDEO_REFS.map((r) => r.id)).size).toBe(60);
  });

  it('every SD ILLUSTRATION block renders a real parametric primitive (not just a placeholder SVG)', () => {
    const PRIMITIVES = new Set([
      'PlaceValueBlocks', 'NumberLineStrip', 'FractionShape', 'ArrayGrid', 'ShapeFigure',
      'BarChartMini', 'ClockFace', 'MoneyStack', 'PatternRow', 'MeasureRuler',
    ]);
    for (const l of SD_LESSONS_VIEW) {
      for (const b of l.contentBlocks) {
        if (b.blockType !== 'ILLUSTRATION') continue;
        expect(b.illustrationPrimitive, `${l.id} ILLUSTRATION has no primitive`).toBeDefined();
        expect(PRIMITIVES.has(b.illustrationPrimitive!.name), `${l.id} bad primitive ${b.illustrationPrimitive!.name}`).toBe(true);
        expect(Object.keys(b.illustrationPrimitive!.props).length).toBeGreaterThan(0);
        // the static SVG remains as the load-failure fallback
        expect(b.mediaStorageKey).toMatch(/^assets\/lessons\/sd\//);
      }
    }
  });

  it('US3/T087 — 100% of media blocks carry a non-empty text equivalent', () => {
    for (const l of SD_LESSONS_VIEW) {
      for (const b of l.contentBlocks) {
        if (b.blockType === 'ILLUSTRATION') {
          expect(b.altText?.trim().length ?? 0, `${l.id} ILLUSTRATION altText`).toBeGreaterThan(0);
        }
        if (b.blockType === 'ANIMATION' || b.blockType === 'VIDEO') {
          expect(b.transcriptText?.trim().length ?? 0, `${l.id} ${b.blockType} transcript`).toBeGreaterThan(0);
        }
      }
      // FR-013: exactly the four media kinds, once each minimum
      const kinds = l.contentBlocks.map((b) => b.blockType);
      expect(kinds.filter((k) => k === 'ILLUSTRATION').length).toBeGreaterThanOrEqual(1);
      expect(kinds.filter((k) => k === 'ANIMATION').length).toBeGreaterThanOrEqual(1);
      expect(kinds.filter((k) => k === 'VIDEO').length).toBeGreaterThanOrEqual(1);
      expect(kinds.filter((k) => k === 'INTERACTIVE_WIDGET').length).toBeGreaterThanOrEqual(1);
    }
  });

  it('9 — kelas 1-2: every question + its options carry a picture companion + narration', () => {
    const young = SD_LESSONS_VIEW.filter((l) => (l.gradeLevel ?? 6) <= 2);
    expect(young.length).toBe(20);
    for (const l of young) {
      for (const q of l.questions) {
        expect(q.questionType, `${q.id}`).not.toBe('SHORT_ANSWER');
        expect(String(q.contentPayload.narrationText ?? '').trim().length, `${q.id} narration`).toBeGreaterThan(0);
        if (q.questionType === 'MULTIPLE_CHOICE') {
          const opts = q.contentPayload.options as Array<{ illustrationAssetId?: string }>;
          expect(opts.every((o) => Boolean(o.illustrationAssetId)), `${q.id} option pictures`).toBe(true);
        }
        if (q.questionType === 'DRAG_DROP_GROUPING') {
          const items = q.contentPayload.items as Array<{ illustrationAssetId?: string }>;
          expect(items.every((it) => Boolean(it.illustrationAssetId)), `${q.id} item pictures`).toBe(true);
        }
      }
    }
  });
});

describe('catalog + legacy routing (FR-031a)', () => {
  it('listForCatalog returns only LISTED lessons; SD has 60', () => {
    expect(listForCatalog().every((l) => l.listing === 'LISTED')).toBe(true);
    expect(listForCatalog('SD')).toHaveLength(60);
  });

  it('allLessonIds includes the 3 legacy ids so their routes do not 404', () => {
    const ids = allLessonIds();
    expect(ids).toHaveLength(69 + 3);
    for (const legacy of LEGACY_LESSON_REFS) {
      expect(ids).toContain(legacy.id);
      expect(getLessonById(legacy.id)).toBeUndefined();
    }
  });

  it('every legacy lesson points at a real interactive replacement', () => {
    for (const legacy of LEGACY_LESSON_REFS) {
      expect(getLessonById(legacy.supersededByLessonId)).toBeDefined();
    }
  });
});
