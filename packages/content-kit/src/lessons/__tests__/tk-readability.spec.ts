import { describe, it, expect } from 'vitest';
import { TK_LESSONS } from '../tk';

/** T018 — TK lessons must be doable without reading (SC-013, gates A7/A8, T1-T5). */

const tkQuestions = TK_LESSONS.flatMap((l) => l.questions.map((q) => ({ lesson: l.id, q })));

describe('TK lessons — picture-first', () => {
  it('every content block has narrationText (gate A8)', () => {
    for (const lesson of TK_LESSONS) {
      for (const block of lesson.contentBlocks) {
        expect(block.narrationText?.trim().length, `${lesson.id} block ${block.blockType}`).toBeGreaterThan(0);
      }
    }
  });

  it('no SHORT_ANSWER questions in TK (T5)', () => {
    expect(tkQuestions.every(({ q }) => q.questionType !== 'SHORT_ANSWER')).toBe(true);
  });

  it.each(tkQuestions)('$lesson/$q.id — picture options + narration, 2-3 choices', ({ q }) => {
    expect(String(q.contentPayload.narrationText ?? '').trim().length).toBeGreaterThan(0);

    if (q.questionType === 'MULTIPLE_CHOICE') {
      const options = q.contentPayload.options as Array<{ illustrationAssetId?: string }>;
      expect(options.length).toBeGreaterThanOrEqual(2);
      expect(options.length).toBeLessThanOrEqual(3); // T4 — cognitive load
      // A7 — every option carries a picture so the item is answerable with text hidden
      expect(options.every((o) => Boolean(o.illustrationAssetId))).toBe(true);
    }

    if (q.questionType === 'DRAG_DROP_GROUPING') {
      const items = q.contentPayload.items as Array<{ illustrationAssetId?: string }>;
      expect(items.every((it) => Boolean(it.illustrationAssetId))).toBe(true);
    }
  });

  it('"text hidden" check — options stay distinguishable by their picture asset', () => {
    for (const { q } of tkQuestions) {
      if (q.questionType !== 'MULTIPLE_CHOICE') continue;
      const assets = (q.contentPayload.options as Array<{ illustrationAssetId: string }>).map(
        (o) => o.illustrationAssetId,
      );
      // distinct assets => a child can still tell the options apart with no text
      expect(new Set(assets).size).toBe(assets.length);
    }
  });
});
