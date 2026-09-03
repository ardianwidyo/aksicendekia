import { describe, it, expect } from 'vitest';
import { makeMoneyLesson, type MoneyLessonSpec } from '../money.js';
import {
  assertArchetypeContract,
  assertDistractors,
  assertAnswerKeysGrade,
  assertDeterministic,
} from './_contract.js';

const base = (over: Partial<MoneyLessonSpec> = {}): MoneyLessonSpec => ({
  id: 'sd-mtk-k3-16',
  gradeLevel: 3,
  curriculumAchievementId: 'cp-fase-b-matematika-pengukuran',
  unitTitle: 'Uang',
  title: 'Menghitung Kembalian',
  summary: 'Mengenal nilai uang rupiah dan menghitung kembalian.',
  learningObjective: 'Siswa menghitung total belanja dan kembalian.',
  orderIndex: 15,
  videoEmbedId: 'yt-sd3-uang-01',
  params: {
    prices: [
      { item: 'pensil', price: 2500 },
      { item: 'penghapus', price: 1500 },
      { item: 'buku', price: 4000 },
      { item: 'penggaris', price: 3000 },
    ],
    paidWith: 5000,
  },
  ...over,
});

describe('makeMoneyLesson', () => {
  it('kelas 3 satisfies the contract', () => {
    const lesson = makeMoneyLesson(base());
    assertArchetypeContract(lesson);
    assertDistractors(lesson);
    assertAnswerKeysGrade(lesson);
    expect(lesson.archetype).toBe('MONEY');
  });

  it('kelas 2 picture-first satisfies the contract', () => {
    const lesson = makeMoneyLesson(
      base({
        id: 'sd-mtk-k2-17',
        gradeLevel: 2,
        curriculumAchievementId: 'cp-fase-a-matematika-bilangan',
        params: {
          prices: [
            { item: 'permen', price: 500 },
            { item: 'roti', price: 3000 },
            { item: 'susu', price: 4000 },
            { item: 'biskuit', price: 2000 },
          ],
          paidWith: 5000,
        },
      }),
    );
    assertArchetypeContract(lesson);
    assertAnswerKeysGrade(lesson);
  });

  it('change keys equal paidWith - price', () => {
    const lesson = makeMoneyLesson(base());
    for (const q of lesson.questions) {
      const m = q.promptText.match(/Harga .+ Rp([\d.]+)\. Dibayar Rp([\d.]+)\. Berapa kembaliannya/);
      if (!m) continue;
      const price = Number(m[1]!.replace(/\./g, ''));
      const paid = Number(m[2]!.replace(/\./g, ''));
      const opts = q.contentPayload.options as Array<{ id: string; text: string }>;
      const key = Number(
        opts.find((o) => o.id === q.contentPayload.correctOptionId)!.text.replace(/Rp/, '').replace(/\./g, ''),
      );
      expect(key).toBe(paid - price);
    }
  });

  it('is deterministic', () => {
    assertDeterministic(() => makeMoneyLesson(base()));
  });
});
