import { describe, it, expect } from 'vitest';
import { makeTimeLesson, type TimeLessonSpec } from '../time.js';
import {
  assertArchetypeContract,
  assertDistractors,
  assertAnswerKeysGrade,
  assertDeterministic,
} from './_contract.js';

const base = (over: Partial<TimeLessonSpec> = {}): TimeLessonSpec => ({
  id: 'sd-mtk-k3-14',
  gradeLevel: 3,
  curriculumAchievementId: 'cp-fase-b-matematika-pengukuran',
  unitTitle: 'Waktu',
  title: 'Membaca Jam dan Menghitung Durasi',
  summary: 'Membaca jam analog dan menghitung lama kegiatan.',
  learningObjective: 'Siswa membaca waktu pada jam analog dan menghitung durasi sederhana.',
  orderIndex: 13,
  videoEmbedId: 'yt-sd3-waktu-01',
  params: {
    times: [
      { h: 7, m: 15 },
      { h: 13, m: 30 },
      { h: 9, m: 45 },
      { h: 16, m: 0 },
      { h: 6, m: 20 },
    ],
    durations: [
      [7, 0, 45],
      [13, 15, 90],
      [9, 30, 40],
    ],
  },
  ...over,
});

describe('makeTimeLesson', () => {
  it('kelas 3 satisfies the contract', () => {
    const lesson = makeTimeLesson(base());
    assertArchetypeContract(lesson);
    assertDistractors(lesson);
    assertAnswerKeysGrade(lesson);
    expect(lesson.archetype).toBe('TIME');
  });

  it('kelas 1 picture-first satisfies the contract', () => {
    const lesson = makeTimeLesson(
      base({
        id: 'sd-mtk-k1-15',
        gradeLevel: 1,
        curriculumAchievementId: 'cp-fase-a-matematika-pengukuran',
        params: {
          times: [
            { h: 7, m: 0 },
            { h: 12, m: 0 },
            { h: 8, m: 30 },
            { h: 15, m: 0 },
          ],
        },
      }),
    );
    assertArchetypeContract(lesson);
    assertAnswerKeysGrade(lesson);
  });

  it('duration short answers land on the correct end time', () => {
    const lesson = makeTimeLesson(base());
    for (const q of lesson.questions) {
      const m = q.promptText.match(/mulai pukul (\d\d)\.(\d\d) selama (\d+) menit/);
      if (!m) continue;
      const total = Number(m[1]!) * 60 + Number(m[2]!) + Number(m[3]!);
      const eh = Math.floor(total / 60) % 24;
      const em = total % 60;
      expect(q.contentPayload.acceptedAnswers).toContain(
        `${String(eh).padStart(2, '0')}.${String(em).padStart(2, '0')}`,
      );
    }
  });

  it('is deterministic', () => {
    assertDeterministic(() => makeTimeLesson(base()));
  });
});
