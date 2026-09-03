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
  it('allLessonIds covers 69 interactive + 3 legacy = 72', () => {
    const ids = allLessonIds();
    expect(ids).toHaveLength(72);
    for (const legacy of LEGACY_IDS) expect(ids).toContain(legacy);
  });

  it('generateStaticParams-shaped output includes every routable id + preview', () => {
    const params = [...allLessonIds(), 'preview'].map((lessonId) => ({ lessonId }));
    expect(params).toHaveLength(73);
    expect(params).toContainEqual({ lessonId: 'lesson_m1' });
    expect(params).toContainEqual({ lessonId: 'tk-numerasi-01' });
  });

  it('the /explore catalog listing excludes legacy ids', () => {
    for (const stage of ['TK', 'SD', 'SMP', 'SMA']) {
      const listed = listExploreLessons(stage).map((l) => l.id);
      for (const legacy of LEGACY_IDS) expect(listed).not.toContain(legacy);
    }
    expect(listExploreLessons('SD')).toHaveLength(60);
  });

  it('opening a legacy route resolves to its interactive replacement + keeps the legacy id', () => {
    const view = getInteractiveLesson('lesson_m1');
    expect(view).toBeDefined();
    expect(view!.id).toBe('lesson_m1');
    expect(view!.supersededByLessonId).toBe('sd-matematika-01');
    expect(view!.contentBlocks.length).toBeGreaterThan(0);
  });
});

describe('every /explore/[lessonId] sub-route is statically generated for the whole catalog', () => {
  it('detail, session, and session/summary all enumerate the same 72 lesson ids + preview', async () => {
    const detail = (await import('../[lessonId]/page')).generateStaticParams();
    const session = (await import('../[lessonId]/session/page')).generateStaticParams();
    const summary = (await import('../[lessonId]/session/summary/page')).generateStaticParams();

    const expected = [...allLessonIds(), 'preview'].sort();
    for (const [name, params] of [
      ['detail', detail],
      ['session', session],
      ['summary', summary],
    ] as const) {
      expect(
        params.map((p: { lessonId: string }) => p.lessonId).sort(),
        `${name} route static params`,
      ).toEqual(expected);
    }

    // regression guard: the reassigned legacy id must have a session page
    expect(session.map((p: { lessonId: string }) => p.lessonId)).toContain('sd-matematika-03');
  });
});
