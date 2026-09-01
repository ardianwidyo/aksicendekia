import { describe, it, expect } from 'vitest';
import {
  allLessonIds,
  listExploreLessons,
  getInteractiveLesson,
} from '../../../lib/guest-lessons';

/**
 * T023 — the /explore/[lessonId] static params must include the 3 legacy ids so
 * their routes never 404 (FR-031a), while the /explore catalog listing must NOT
 * show them.
 */

const LEGACY_IDS = ['lesson_m1', 'lesson_m2', 'lesson_i1'];

describe('explore static params vs catalog listing', () => {
  it('allLessonIds covers 12 interactive + 3 legacy = 15', () => {
    const ids = allLessonIds();
    expect(ids).toHaveLength(15);
    for (const legacy of LEGACY_IDS) expect(ids).toContain(legacy);
  });

  it('generateStaticParams-shaped output includes every routable id + preview', () => {
    const params = [...allLessonIds(), 'preview'].map((lessonId) => ({ lessonId }));
    expect(params).toHaveLength(16);
    expect(params).toContainEqual({ lessonId: 'lesson_m1' });
    expect(params).toContainEqual({ lessonId: 'tk-numerasi-01' });
  });

  it('the /explore catalog listing excludes legacy ids', () => {
    for (const stage of ['TK', 'SD', 'SMP', 'SMA']) {
      const listed = listExploreLessons(stage).map((l) => l.id);
      for (const legacy of LEGACY_IDS) expect(listed).not.toContain(legacy);
    }
    expect(listExploreLessons('SD')).toHaveLength(3);
  });

  it('opening a legacy route resolves to its interactive replacement + keeps the legacy id', () => {
    const view = getInteractiveLesson('lesson_m1');
    expect(view).toBeDefined();
    expect(view!.id).toBe('lesson_m1');
    expect(view!.supersededByLessonId).toBe('sd-matematika-01');
    expect(view!.contentBlocks.length).toBeGreaterThan(0);
  });
});
