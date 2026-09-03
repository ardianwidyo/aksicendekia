import { describe, it, expect } from 'vitest';
import { makeFractionsLesson, type FractionsLessonSpec } from '../fractions.js';
import {
  assertArchetypeContract,
  assertDistractors,
  assertAnswerKeysGrade,
  assertDeterministic,
} from './_contract.js';

const base = (over: Partial<FractionsLessonSpec> = {}): FractionsLessonSpec => ({
  id: 'sd-mtk-k5-05',
  gradeLevel: 5,
  curriculumAchievementId: 'cp-fase-c-matematika-bilangan',
  unitTitle: 'Pecahan',
  title: 'Membandingkan Pecahan',
  summary: 'Membandingkan dan menyederhanakan pecahan.',
  learningObjective: 'Siswa membandingkan dua pecahan dan menemukan pecahan senilai.',
  orderIndex: 4,
  videoEmbedId: 'yt-sd5-pecahan-01',
  params: {
    denominators: [2, 3, 4, 6, 8],
    compares: [
      [1, 2, 1, 4],
      [2, 4, 1, 2],
      [3, 6, 1, 2],
      [2, 3, 3, 4],
      [1, 3, 2, 5],
    ],
  },
  ...over,
});

describe('makeFractionsLesson', () => {
  it('kelas 5 satisfies the contract', () => {
    const lesson = makeFractionsLesson(base());
    assertArchetypeContract(lesson);
    assertDistractors(lesson);
    assertAnswerKeysGrade(lesson);
    expect(lesson.archetype).toBe('FRACTIONS');
  });

  it('refuses kelas 1-2', () => {
    expect(() => makeFractionsLesson(base({ gradeLevel: 2 }))).toThrow(/kelas 1-2/);
  });

  it('comparison keys agree with cross-multiplication', () => {
    const lesson = makeFractionsLesson(base());
    for (const q of lesson.questions) {
      const m = q.promptText.match(/Mana yang lebih besar, (\d+)\/(\d+) atau (\d+)\/(\d+)/);
      if (!m) continue;
      const [n1, d1, n2, d2] = m.slice(1).map(Number) as [number, number, number, number];
      const opts = q.contentPayload.options as Array<{ id: string; text: string }>;
      const key = opts.find((o) => o.id === q.contentPayload.correctOptionId)!.text;
      const c = n1 * d2 - n2 * d1;
      const expected = c > 0 ? `${n1}/${d1}` : c < 0 ? `${n2}/${d2}` : 'Sama besar';
      expect(key).toBe(expected);
    }
  });

  it('the NUMBER_LINE target is the fraction value on 0..1', () => {
    const lesson = makeFractionsLesson(base());
    const nl = lesson.questions.find((q) => q.questionType === 'NUMBER_LINE')!;
    expect(nl.contentPayload.targetValue).toBeCloseTo(0.5, 5);
  });

  it('is deterministic', () => {
    assertDeterministic(() => makeFractionsLesson(base()));
  });
});
