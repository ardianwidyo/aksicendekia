import { describe, it, expect } from 'vitest';
import { KELAS_1_LESSONS, KELAS_2_LESSONS } from '../sd/index';

/**
 * Feature 011 / T110 (FR-024, SC-004). Mirrors `tk-readability.spec.ts`: kelas 1-2
 * Matematika lessons must be doable without reading — every question and every
 * option carries a picture companion and a `narrationText` so a listen control
 * and icon-first options can be rendered (wired in GuestSessionClient, T109/T111).
 */
const youngLessons = [...KELAS_1_LESSONS, ...KELAS_2_LESSONS];
const youngQuestions = youngLessons.flatMap((l) => l.questions.map((q) => ({ lesson: l.id, q })));

describe('SD kelas 1-2 — picture-first, listen-ready', () => {
  it('covers all 20 kelas 1-2 lessons', () => {
    expect(youngLessons).toHaveLength(20);
    expect(youngLessons.every((l) => (l.gradeLevel ?? 9) <= 2)).toBe(true);
  });

  it('no SHORT_ANSWER questions in kelas 1-2 (must be answerable by picture)', () => {
    expect(youngQuestions.every(({ q }) => q.questionType !== 'SHORT_ANSWER')).toBe(true);
  });

  it.each(youngQuestions)('$lesson/$q.id — narration + picture options', ({ q }) => {
    expect(String(q.contentPayload.narrationText ?? '').trim().length).toBeGreaterThan(0);

    if (q.questionType === 'MULTIPLE_CHOICE') {
      const options = q.contentPayload.options as Array<{ illustrationAssetId?: string }>;
      expect(options.length).toBeGreaterThanOrEqual(2);
      expect(options.length).toBeLessThanOrEqual(3);
      expect(options.every((o) => Boolean(o.illustrationAssetId))).toBe(true);
    }

    if (q.questionType === 'DRAG_DROP_GROUPING') {
      const items = q.contentPayload.items as Array<{ illustrationAssetId?: string }>;
      expect(items.every((it) => Boolean(it.illustrationAssetId))).toBe(true);
    }
  });

  it('"text hidden" check — MC options stay distinguishable by a distinct picture', () => {
    for (const { q } of youngQuestions) {
      if (q.questionType !== 'MULTIPLE_CHOICE') continue;
      const assets = (q.contentPayload.options as Array<{ illustrationAssetId: string }>).map(
        (o) => o.illustrationAssetId,
      );
      expect(new Set(assets).size).toBe(assets.length);
    }
  });

  it('every kelas 1-2 media asset key points under assets/lessons/sd/', () => {
    for (const { q } of youngQuestions) {
      const opts = (q.contentPayload.options as Array<{ illustrationAssetId?: string }> | undefined) ?? [];
      const items = (q.contentPayload.items as Array<{ illustrationAssetId?: string }> | undefined) ?? [];
      for (const a of [...opts, ...items]) {
        if (a.illustrationAssetId) {
          expect(a.illustrationAssetId).toMatch(/^assets\/lessons\/sd\/kelas-[12]\//);
        }
      }
    }
  });
});
