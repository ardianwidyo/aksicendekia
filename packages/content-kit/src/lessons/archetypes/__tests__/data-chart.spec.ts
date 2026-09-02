import { describe, it, expect } from 'vitest';
import { makeDataChartLesson, type DataChartLessonSpec } from '../data-chart.js';
import {
  assertArchetypeContract,
  assertDistractors,
  assertAnswerKeysGrade,
  assertDeterministic,
} from './_contract.js';

const base = (over: Partial<DataChartLessonSpec> = {}): DataChartLessonSpec => ({
  id: 'sd-mtk-k4-12',
  gradeLevel: 4,
  curriculumAchievementId: 'cp-fase-b-matematika-data-peluang',
  unitTitle: 'Penyajian Data',
  title: 'Membaca Diagram Batang',
  summary: 'Membaca dan menafsirkan piktogram serta diagram batang.',
  learningObjective: 'Siswa membaca data pada diagram batang dan menemukan nilai terbanyak.',
  orderIndex: 11,
  videoEmbedId: 'yt-sd4-data-01',
  params: {
    categories: [
      { name: 'Sepak bola', count: 12 },
      { name: 'Basket', count: 8 },
      { name: 'Voli', count: 5 },
      { name: 'Renang', count: 9 },
    ],
  },
  ...over,
});

describe('makeDataChartLesson', () => {
  it('kelas 4 satisfies the contract', () => {
    const lesson = makeDataChartLesson(base());
    assertArchetypeContract(lesson);
    assertDistractors(lesson);
    assertAnswerKeysGrade(lesson);
    expect(lesson.archetype).toBe('DATA_CHART');
  });

  it('kelas 2 picture-first satisfies the contract', () => {
    const lesson = makeDataChartLesson(
      base({
        id: 'sd-mtk-k2-13',
        gradeLevel: 2,
        curriculumAchievementId: 'cp-fase-a-matematika-data-peluang',
        params: {
          categories: [
            { name: 'Apel', count: 4 },
            { name: 'Jeruk', count: 6 },
            { name: 'Mangga', count: 3 },
            { name: 'Pisang', count: 5 },
          ],
        },
      }),
    );
    assertArchetypeContract(lesson);
    assertAnswerKeysGrade(lesson);
  });

  it('the "terbanyak" key is the max category and the total short-answer is the sum', () => {
    const lesson = makeDataChartLesson(base());
    const most = lesson.questions.find((q) => q.promptText.includes('terbanyak'))!;
    const opts = most.contentPayload.options as Array<{ id: string; text: string }>;
    expect(opts.find((o) => o.id === most.contentPayload.correctOptionId)!.text).toBe('Sepak bola');
    const totalQ = lesson.questions.find((q) => q.promptText.includes('jumlah seluruh data'));
    if (totalQ) {
      expect((totalQ.contentPayload.acceptedAnswers as string[]).map((s) => Number(s.replace(/\./g, '')))).toContain(34);
    }
  });

  it('is deterministic', () => {
    assertDeterministic(() => makeDataChartLesson(base()));
  });
});
