import { describe, it, expect } from 'vitest';
import { makeMeasurementLesson, type MeasurementLessonSpec } from '../measurement.js';
import {
  assertArchetypeContract,
  assertDistractors,
  assertAnswerKeysGrade,
  assertDeterministic,
} from './_contract.js';

const base = (over: Partial<MeasurementLessonSpec> = {}): MeasurementLessonSpec => ({
  id: 'sd-mtk-k4-08',
  gradeLevel: 4,
  curriculumAchievementId: 'cp-fase-b-matematika-pengukuran',
  unitTitle: 'Pengukuran Panjang',
  title: 'Satuan Panjang Baku',
  summary: 'Mengukur panjang dan mengubah antar satuan cm dan m.',
  learningObjective: 'Siswa mengukur panjang dengan satuan baku dan mengonversinya.',
  orderIndex: 7,
  videoEmbedId: 'yt-sd4-pengukuran-01',
  params: {
    quantity: 'panjang',
    base: 'm',
    sub: 'cm',
    factor: 100,
    objects: [
      { name: 'pensil', sub: 15 },
      { name: 'meja', sub: 120 },
      { name: 'buku', sub: 25 },
      { name: 'papan tulis', sub: 300 },
      { name: 'penggaris', sub: 30 },
    ],
  },
  ...over,
});

describe('makeMeasurementLesson', () => {
  it('kelas 4 satisfies the contract', () => {
    const lesson = makeMeasurementLesson(base());
    assertArchetypeContract(lesson);
    assertDistractors(lesson);
    assertAnswerKeysGrade(lesson);
    expect(lesson.archetype).toBe('MEASUREMENT');
  });

  it('kelas 1 picture-first satisfies the contract', () => {
    const lesson = makeMeasurementLesson(
      base({
        id: 'sd-mtk-k1-09',
        gradeLevel: 1,
        curriculumAchievementId: 'cp-fase-a-matematika-pengukuran',
        params: {
          quantity: 'panjang',
          base: 'langkah',
          sub: 'jengkal',
          factor: 3,
          objects: [
            { name: 'meja', sub: 6 },
            { name: 'pintu', sub: 9 },
            { name: 'buku', sub: 2 },
            { name: 'lemari', sub: 12 },
          ],
        },
      }),
    );
    assertArchetypeContract(lesson);
    assertAnswerKeysGrade(lesson);
  });

  it('conversion keys equal sub / factor', () => {
    const lesson = makeMeasurementLesson(base());
    for (const q of lesson.questions) {
      const m = q.promptText.match(/([\d.]+) cm sama dengan berapa m/);
      if (!m) continue;
      const sub = Number(m[1]!.replace(/\./g, ''));
      const opts = q.contentPayload.options as Array<{ id: string; text: string }>;
      const keyText = opts.find((o) => o.id === q.contentPayload.correctOptionId)!.text;
      const key = Number(keyText.replace(/\./g, '').replace(',', '.'));
      expect(key).toBeCloseTo(sub / 100, 5);
    }
  });

  it('is deterministic', () => {
    assertDeterministic(() => makeMeasurementLesson(base()));
  });
});
