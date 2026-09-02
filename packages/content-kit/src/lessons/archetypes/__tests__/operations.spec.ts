import { describe, it, expect } from 'vitest';
import { makeOperationsLesson, type OperationsLessonSpec } from '../operations.js';
import {
  assertArchetypeContract,
  assertDistractors,
  assertAnswerKeysGrade,
  assertDeterministic,
} from './_contract.js';

const base = (over: Partial<OperationsLessonSpec> = {}): OperationsLessonSpec => ({
  id: 'sd-mtk-k3-06',
  gradeLevel: 3,
  curriculumAchievementId: 'cp-fase-b-matematika-bilangan',
  unitTitle: 'Perkalian dan Pembagian',
  title: 'Perkalian sebagai Penjumlahan Berulang',
  summary: 'Memaknai perkalian dan pembagian melalui pengelompokan.',
  learningObjective: 'Siswa menyelesaikan perkalian dan pembagian bilangan cacah.',
  orderIndex: 5,
  videoEmbedId: 'yt-sd3-perkalian-01',
  params: {
    factPairs: [
      [4, 3],
      [6, 2],
      [5, 5],
      [7, 3],
      [8, 4],
      [9, 2],
    ],
  },
  ...over,
});

describe('makeOperationsLesson', () => {
  it('kelas 3 satisfies the contract', () => {
    const lesson = makeOperationsLesson(base());
    assertArchetypeContract(lesson);
    assertDistractors(lesson);
    assertAnswerKeysGrade(lesson);
    expect(lesson.archetype).toBe('OPERATIONS');
  });

  it('kelas 2 picture-first satisfies the contract', () => {
    const lesson = makeOperationsLesson(
      base({
        id: 'sd-mtk-k2-07',
        gradeLevel: 2,
        curriculumAchievementId: 'cp-fase-a-matematika-bilangan',
        params: { factPairs: [[2, 3], [3, 3], [2, 5], [4, 2], [5, 2]], operation: 'MUL' },
      }),
    );
    assertArchetypeContract(lesson);
    assertAnswerKeysGrade(lesson);
  });

  it('multiplication keys equal a*b and division keys equal the quotient', () => {
    const lesson = makeOperationsLesson(base());
    for (const q of lesson.questions) {
      if (q.questionType === 'MULTIPLE_CHOICE') {
        const mMul = q.promptText.match(/(\d+) x (\d+) = \.\.\./);
        const mDiv = q.promptText.match(/([\d.]+) : ([\d.]+) = \.\.\./);
        const opts = q.contentPayload.options as Array<{ id: string; text: string }>;
        const key = Number(
          opts.find((o) => o.id === q.contentPayload.correctOptionId)!.text.replace(/\./g, ''),
        );
        if (mMul) expect(key).toBe(Number(mMul[1]!) * Number(mMul[2]!));
        if (mDiv) {
          const dividend = Number(mDiv[1]!.replace(/\./g, ''));
          const divisor = Number(mDiv[2]!.replace(/\./g, ''));
          expect(key).toBe(dividend / divisor);
        }
      }
    }
  });

  it('is deterministic', () => {
    assertDeterministic(() => makeOperationsLesson(base()));
  });
});
