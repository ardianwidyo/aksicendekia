import { describe, it, expect } from 'vitest';
import { makePatternsLesson, type PatternsLessonSpec } from '../patterns.js';
import {
  assertArchetypeContract,
  assertDistractors,
  assertAnswerKeysGrade,
  assertDeterministic,
} from './_contract.js';

const base = (over: Partial<PatternsLessonSpec> = {}): PatternsLessonSpec => ({
  id: 'sd-mtk-k3-18',
  gradeLevel: 3,
  curriculumAchievementId: 'cp-fase-b-matematika-aljabar',
  unitTitle: 'Pola Bilangan',
  title: 'Menemukan Aturan Pola',
  summary: 'Melanjutkan pola bilangan dan gambar dengan aturan tetap.',
  learningObjective: 'Siswa menemukan aturan sebuah pola dan melanjutkannya.',
  orderIndex: 17,
  videoEmbedId: 'yt-sd3-pola-01',
  params: {
    sequences: [
      { start: 2, diff: 3 },
      { start: 10, diff: -2 },
      { start: 5, diff: 5 },
      { start: 1, diff: 4 },
      { start: 20, diff: -3 },
    ],
  },
  ...over,
});

describe('makePatternsLesson', () => {
  it('kelas 3 satisfies the contract', () => {
    const lesson = makePatternsLesson(base());
    assertArchetypeContract(lesson);
    assertDistractors(lesson);
    assertAnswerKeysGrade(lesson);
    expect(lesson.archetype).toBe('PATTERNS');
  });

  it('kelas 1 picture-first satisfies the contract', () => {
    const lesson = makePatternsLesson(
      base({
        id: 'sd-mtk-k1-19',
        gradeLevel: 1,
        curriculumAchievementId: 'cp-fase-a-matematika-aljabar',
        params: {
          sequences: [
            { start: 1, diff: 1 },
            { start: 2, diff: 2 },
            { start: 10, diff: -1 },
            { start: 0, diff: 5 },
          ],
        },
      }),
    );
    assertArchetypeContract(lesson);
    assertAnswerKeysGrade(lesson);
  });

  it('the nth-term short answer matches start + diff*(n-1)', () => {
    const lesson = makePatternsLesson(base());
    for (const q of lesson.questions) {
      const m = q.promptText.match(/mulai ([\d.-]+) dengan selisih ([\d.-]+)\. Berapa suku ke-(\d+)/);
      if (!m) continue;
      const start = Number(m[1]!.replace(/\./g, ''));
      const diff = Number(m[2]!.replace(/\./g, ''));
      const n = Number(m[3]!);
      expect((q.contentPayload.acceptedAnswers as string[]).map((s) => Number(s.replace(/\./g, '')))).toContain(
        start + diff * (n - 1),
      );
    }
  });

  it('is deterministic', () => {
    assertDeterministic(() => makePatternsLesson(base()));
  });
});
