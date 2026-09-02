import { describe, it, expect } from 'vitest';
import { makeGeometryLesson, type GeometryLessonSpec } from '../geometry.js';
import {
  assertArchetypeContract,
  assertDistractors,
  assertAnswerKeysGrade,
  assertDeterministic,
} from './_contract.js';

const base = (over: Partial<GeometryLessonSpec> = {}): GeometryLessonSpec => ({
  id: 'sd-mtk-k4-10',
  gradeLevel: 4,
  curriculumAchievementId: 'cp-fase-b-matematika-geometri',
  unitTitle: 'Bangun Datar',
  title: 'Ciri Bangun Datar dan Keliling',
  summary: 'Mengenali ciri bangun datar serta menghitung keliling dan luas.',
  learningObjective: 'Siswa mendeskripsikan bangun datar dan menghitung keliling/luas persegi panjang.',
  orderIndex: 9,
  videoEmbedId: 'yt-sd4-geometri-01',
  params: {
    shapes: [
      { name: 'segitiga', sides: 3, vertices: 3 },
      { name: 'persegi', sides: 4, vertices: 4 },
      { name: 'segi lima', sides: 5, vertices: 5 },
      { name: 'segi enam', sides: 6, vertices: 6 },
    ],
    rects: [
      [5, 3],
      [8, 2],
      [6, 6],
    ],
  },
  ...over,
});

describe('makeGeometryLesson', () => {
  it('kelas 4 satisfies the contract', () => {
    const lesson = makeGeometryLesson(base());
    assertArchetypeContract(lesson);
    assertDistractors(lesson);
    assertAnswerKeysGrade(lesson);
    expect(lesson.archetype).toBe('GEOMETRY');
  });

  it('kelas 1 picture-first satisfies the contract', () => {
    const lesson = makeGeometryLesson(
      base({
        id: 'sd-mtk-k1-11',
        gradeLevel: 1,
        curriculumAchievementId: 'cp-fase-a-matematika-geometri',
        params: {
          shapes: [
            { name: 'lingkaran', sides: 0, vertices: 0 },
            { name: 'segitiga', sides: 3, vertices: 3 },
            { name: 'persegi', sides: 4, vertices: 4 },
            { name: 'persegi panjang', sides: 4, vertices: 4 },
          ],
        },
      }),
    );
    assertArchetypeContract(lesson);
    assertAnswerKeysGrade(lesson);
  });

  it('perimeter/area short answers are computed correctly', () => {
    const lesson = makeGeometryLesson(base());
    for (const q of lesson.questions) {
      if (q.questionType !== 'SHORT_ANSWER') continue;
      const mP = q.promptText.match(/berukuran (\d+) x (\d+)\. Berapa kelilingnya/);
      const mA = q.promptText.match(/berukuran (\d+) x (\d+)\. Berapa luasnya/);
      const acc = (q.contentPayload.acceptedAnswers as string[]).map((a) => Number(a.replace(/\./g, '')));
      if (mP) expect(acc).toContain(2 * (Number(mP[1]) + Number(mP[2])));
      if (mA) expect(acc).toContain(Number(mA[1]) * Number(mA[2]));
    }
  });

  it('is deterministic', () => {
    assertDeterministic(() => makeGeometryLesson(base()));
  });
});
