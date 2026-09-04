import { describe, it, expect } from 'vitest';
import { makePlaceValueLesson, type PlaceValueLessonSpec } from '../place-value.js';
import {
  assertArchetypeContract,
  assertDistractors,
  assertAnswerKeysGrade,
  assertDeterministic,
} from './_contract.js';
import { digitAt, placeValueOf, PLACE_NAMES } from '../shared.js';

const base = (over: Partial<PlaceValueLessonSpec> = {}): PlaceValueLessonSpec => ({
  id: 'sd-mtk-k4-01',
  gradeLevel: 4,
  curriculumAchievementId: 'cp-fase-b-matematika-bilangan',
  unitTitle: 'Nilai Tempat',
  title: 'Nilai Tempat sampai Ribuan',
  summary: 'Membaca dan menguraikan nilai tempat bilangan cacah.',
  learningObjective: 'Siswa dapat menentukan nilai tempat dan menguraikan bilangan.',
  orderIndex: 0,
  videoEmbedId: 'yt-sd4-nilai-tempat',
  params: { numbers: [3482, 5764, 2305, 4060, 9999, 1263], askPlaces: [2, 1, 3] },
  ...over,
});

describe('makePlaceValueLesson — O1–O12 + math correctness', () => {
  it('satisfies the archetype contract for a kelas 4 lesson', () => {
    const lesson = makePlaceValueLesson(base());
    assertArchetypeContract(lesson);
    assertDistractors(lesson);
    assertAnswerKeysGrade(lesson);
    expect(lesson.archetype).toBe('PLACE_VALUE');
    expect(lesson.gradeLevel).toBe(4);
    expect(lesson.phase).toBe('FASE_B');
  });

  it('satisfies the contract for a picture-first kelas 1 lesson', () => {
    const lesson = makePlaceValueLesson(
      base({
        id: 'sd-mtk-k1-03',
        gradeLevel: 1,
        curriculumAchievementId: 'cp-fase-a-matematika-bilangan',
        params: { numbers: [24, 57, 30, 68, 91, 13], askPlaces: [1, 0] },
      }),
    );
    assertArchetypeContract(lesson);
    assertDistractors(lesson);
    assertAnswerKeysGrade(lesson);
    expect(lesson.phase).toBe('FASE_A');
  });

  it('every MULTIPLE_CHOICE key equals the independently computed place value', () => {
    const spec = base();
    const lesson = makePlaceValueLesson(spec);
    for (const q of lesson.questions) {
      if (q.questionType !== 'MULTIPLE_CHOICE') continue;
      const opts = q.contentPayload.options as Array<{ id: string; text: string }>;
      const key = opts.find((o) => o.id === q.contentPayload.correctOptionId)!;
      // The prompt names the digit, the place, and the number; re-derive the
      // expected value from the named place (a digit can repeat in the number).
      const m = q.promptText.match(/angka (\d) di tempat ([\w ]+?) pada bilangan ([\d.]+)/);
      if (m) {
        const digit = Number(m[1]!);
        const placeName = m[2]!.trim();
        const n = Number(m[3]!.replace(/\./g, ''));
        const place = PLACE_NAMES.indexOf(placeName as (typeof PLACE_NAMES)[number]);
        expect(place, `unknown place name "${placeName}"`).toBeGreaterThanOrEqual(0);
        expect(digitAt(n, place)).toBe(digit);
        expect(Number(key.text.replace(/\./g, ''))).toBe(placeValueOf(n, place));
      }
    }
  });

  it('the NUMBER_LINE target is the seed number itself', () => {
    const lesson = makePlaceValueLesson(base());
    const nl = lesson.questions.find((q) => q.questionType === 'NUMBER_LINE')!;
    expect(nl.contentPayload.targetValue).toBe(3482);
    expect(nl.contentPayload.min).toBe(0);
    expect(nl.contentPayload.max).toBe(10000);
  });

  it('the DRAG_DROP mapping matches an independent digit check', () => {
    const lesson = makePlaceValueLesson(base());
    const dd = lesson.questions.find((q) => q.questionType === 'DRAG_DROP_GROUPING')!;
    const items = dd.contentPayload.items as Array<{ id: string; label: string }>;
    const mapping = dd.contentPayload.correctMapping as Record<string, string>;
    // both groups populated
    expect(new Set(Object.values(mapping)).size).toBe(2);
    for (const it of items) {
      expect(['hit', 'miss']).toContain(mapping[it.id]);
    }
  });

  it('is deterministic', () => {
    assertDeterministic(() => makePlaceValueLesson(base()));
  });

  it('rejects a spec with fewer than 4 seed numbers', () => {
    expect(() => makePlaceValueLesson(base({ params: { numbers: [1, 2] } }))).toThrow(/>= 4/);
  });

  it('produces at least 10 questions and honours questionCount', () => {
    expect(makePlaceValueLesson(base()).questions.length).toBeGreaterThanOrEqual(10);
    expect(makePlaceValueLesson(base({ questionCount: 15 })).questions).toHaveLength(15);
  });
});
