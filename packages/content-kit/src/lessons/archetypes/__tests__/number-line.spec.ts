import { describe, it, expect } from 'vitest';
import { makeNumberLineLesson, type NumberLineLessonSpec } from '../number-line.js';
import {
  assertArchetypeContract,
  assertDistractors,
  assertAnswerKeysGrade,
  assertDeterministic,
} from './_contract.js';

const base = (over: Partial<NumberLineLessonSpec> = {}): NumberLineLessonSpec => ({
  id: 'sd-mtk-k2-04',
  gradeLevel: 2,
  curriculumAchievementId: 'cp-fase-a-matematika-aljabar',
  unitTitle: 'Operasi pada Garis Bilangan',
  title: 'Penjumlahan dan Pengurangan pada Garis Bilangan',
  summary: 'Menjumlah dan mengurang dengan melompat pada garis bilangan.',
  learningObjective: 'Siswa menyelesaikan penjumlahan/pengurangan sampai 20 dengan garis bilangan.',
  orderIndex: 3,
  videoEmbedId: 'yt-sd2-garis-bilangan',
  params: {
    min: 0,
    max: 20,
    step: 1,
    jumps: [
      [8, 6],
      [15, -9],
      [12, 5],
      [20, -7],
      [3, 9],
      [18, -4],
    ],
  },
  ...over,
});

describe('makeNumberLineLesson', () => {
  it('kelas 2 (picture-first) satisfies the contract', () => {
    const lesson = makeNumberLineLesson(base());
    assertArchetypeContract(lesson);
    assertDistractors(lesson);
    assertAnswerKeysGrade(lesson);
    expect(lesson.archetype).toBe('NUMBER_LINE');
    expect(lesson.phase).toBe('FASE_A');
  });

  it('kelas 6 with negative jumps satisfies the contract', () => {
    const lesson = makeNumberLineLesson(
      base({
        id: 'sd-mtk-k6-07',
        gradeLevel: 6,
        curriculumAchievementId: 'cp-fase-c-matematika-bilangan',
        params: {
          min: -10,
          max: 10,
          step: 1,
          allowNegative: true,
          jumps: [
            [3, -8],
            [-5, 7],
            [0, -6],
            [9, -14],
            [-2, 5],
          ],
        },
      }),
    );
    assertArchetypeContract(lesson);
    assertAnswerKeysGrade(lesson);
    expect(lesson.phase).toBe('FASE_C');
  });

  it('every NUMBER_LINE target equals start + jump', () => {
    const spec = base();
    const lesson = makeNumberLineLesson(spec);
    const targets = lesson.questions
      .filter((q) => q.questionType === 'NUMBER_LINE')
      .map((q) => q.contentPayload.targetValue);
    expect(targets).toContain(14); // 8 + 6
    expect(targets).toContain(6); // 15 - 9
    expect(targets).toContain(17); // 12 + 5
  });

  it('is deterministic', () => {
    assertDeterministic(() => makeNumberLineLesson(base()));
  });
});
