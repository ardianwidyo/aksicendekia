import { describe, it, expect } from 'vitest';
import { buildGrade, type LessonBrief } from '../../sd/_authoring.js';

/**
 * Feature 011 / T129 (US6). `buildGrade` — the one place kelas-file data becomes
 * lessons — rejects an exact same-class duplicate title and a duplicate id up
 * front, so a bad edit fails the content build instead of shipping (edge case in
 * spec.md; data-model.md §4 invariant 6).
 */
const briefFor = (id: string, title: string): LessonBrief => ({
  id,
  archetype: 'geometry',
  element: 'geometri',
  unitTitle: 'U',
  title,
  summary: 's',
  learningObjective: 'lo',
  params: {
    shapes: [
      { name: 'segitiga', sides: 3, vertices: 3 },
      { name: 'persegi', sides: 4, vertices: 4 },
      { name: 'segi lima', sides: 5, vertices: 5 },
      { name: 'segi enam', sides: 6, vertices: 6 },
    ],
  },
});

describe('buildGrade — authoring guards', () => {
  it('rejects an exact duplicate lesson title within one grade', () => {
    expect(() =>
      buildGrade(3, [briefFor('sd-mtk-k3-a', 'Bangun Datar'), briefFor('sd-mtk-k3-b', 'Bangun Datar')]),
    ).toThrow(/judul duplikat/i);
  });

  it('treats titles case-insensitively when detecting duplicates', () => {
    expect(() =>
      buildGrade(3, [briefFor('sd-mtk-k3-a', 'Bangun Datar'), briefFor('sd-mtk-k3-b', 'BANGUN DATAR')]),
    ).toThrow(/judul duplikat/i);
  });

  it('rejects a duplicate lesson id', () => {
    expect(() =>
      buildGrade(3, [briefFor('sd-mtk-k3-x', 'A'), briefFor('sd-mtk-k3-x', 'B')]),
    ).toThrow(/id pelajaran duplikat/i);
  });

  it('assigns a contiguous 0..n-1 orderIndex', () => {
    const { lessons } = buildGrade(3, [
      briefFor('sd-mtk-k3-1', 'A'),
      briefFor('sd-mtk-k3-2', 'B'),
      briefFor('sd-mtk-k3-3', 'C'),
    ]);
    expect(lessons.map((l) => l.orderIndex)).toEqual([0, 1, 2]);
  });
});
