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
