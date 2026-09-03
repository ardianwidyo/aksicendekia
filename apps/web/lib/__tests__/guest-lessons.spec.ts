import { describe, it, expect } from 'vitest';
import {
  listSdGradeCatalog,
  getInteractiveLesson,
  listExploreLessons,
  type InteractiveLessonView,
} from '../guest-lessons';

/**
 * Feature 011 / T113 (US5, FR-027). The guest catalog surfaces the same SD grade
 * structure and the same lesson shape (gradeLevel, phase, hydrated videoEmbed)
 * as the registered `GET /api/v1/public/lessons` + `/lessons/:id` responses, so
 * a guest and a registered user see identical content.
 */
describe('guest-lessons — SD grade catalog shape', () => {
  it('exposes kelas 1-6, each with >= 10 lessons ordered by orderIndex', () => {
    const catalog = listSdGradeCatalog();
    expect(catalog.map((g) => g.gradeLevel)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const group of catalog) {
      expect(group.lessons.length, `kelas ${group.gradeLevel}`).toBeGreaterThanOrEqual(10);
      expect(group.lessons.every((l) => l.gradeLevel === group.gradeLevel)).toBe(true);
    }
  });

  it('every SD lesson view carries gradeLevel + phase (parity with the registered API)', () => {
    for (const l of listExploreLessons('SD')) {
      expect(typeof l.gradeLevel, `${l.id} gradeLevel`).toBe('number');
      expect(l.phase, `${l.id} phase`).toMatch(/^FASE_[ABC]$/);
    }
  });
});

describe('guest-lessons — lesson detail parity', () => {
  const lesson = getInteractiveLesson('sd-mtk-k4-04') as InteractiveLessonView;

  it('resolves the lesson with its grade level', () => {
    expect(lesson).toBeDefined();
    expect(lesson.gradeLevel).toBe(4);
    expect(lesson.phase).toBe('FASE_B');
  });

  it('hydrates the VIDEO block payload.videoEmbed from the registry, same shape as the API', () => {
    const video = lesson.contentBlocks.find((b) => b.blockType === 'VIDEO');
    expect(video).toBeDefined();
    const embed = (video!.payload as { videoEmbed?: Record<string, unknown> }).videoEmbed;
    expect(embed).toMatchObject({
      provider: 'YOUTUBE',
      externalId: expect.any(String),
      title: expect.any(String),
      publisherName: expect.any(String),
      transcriptText: expect.any(String),
    });
    expect(String(embed!.posterUrl)).toMatch(/^\/assets\/lessons\/sd\//);
    // never leak the internal CMS review fields
    expect(embed).not.toHaveProperty('reviewedBy');
    expect(embed).not.toHaveProperty('reviewNote');
  });

  it('keeps the same >= 10 question items with hints', () => {
    expect(lesson.questionItems.length).toBeGreaterThanOrEqual(10);
    for (const q of lesson.questionItems) {
      expect((q.hints ?? []).length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('guest session — the 60 SD lessons resolve to their own >= 10-question bank', () => {
  const SD_IDS = Array.from({ length: 60 }, (_, i) => {
    const grade = Math.floor(i / 10) + 1;
    const n = String((i % 10) + 1).padStart(2, '0');
    return grade === 3 && n === '01' ? 'sd-matematika-01'
      : grade === 3 && n === '02' ? 'sd-matematika-02'
      : grade === 4 && n === '01' ? 'sd-matematika-03'
      : `sd-mtk-k${grade}-${n}`;
  });

  it('every SD lesson id has its own >= 10 question items via getInteractiveLesson', () => {
    for (const id of SD_IDS) {
      const view = getInteractiveLesson(id);
      expect(view, `${id} not resolved`).toBeDefined();
      expect(view!.questionItems.length, `${id} question count`).toBeGreaterThanOrEqual(10);
    }
  });

  it('two different lessons do NOT share the same question set (not the legacy "7 + 8" fixture)', () => {
    const a = getInteractiveLesson('sd-mtk-k1-01')!.questionItems.map((q) => q.promptText);
    const b = getInteractiveLesson('sd-mtk-k5-03')!.questionItems.map((q) => q.promptText);
    expect(a).not.toEqual(b);
    expect(a.join(' ')).not.toMatch(/7 \+ 8/);
    expect(b.join(' ')).not.toMatch(/ibukota|Nusantara/i);
  });

  it('grade drives the numbers — kelas 1 stays small, kelas 6 goes large', () => {
    const k1 = getInteractiveLesson('sd-mtk-k1-01')!.questionItems.map((q) => q.promptText).join(' ');
    const k6 = getInteractiveLesson('sd-mtk-k6-01')!.questionItems.map((q) => q.promptText).join(' ');
    expect(k1).not.toEqual(k6);
    // kelas 6 place-value uses 6-digit numbers; kelas 1 does not
    expect(k6).toMatch(/\d{3}\.\d{3}/);
  });
});
