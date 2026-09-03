import { describe, it, expect } from 'vitest';
import { toRenderableBlocks } from '../LessonDetailClient';

/**
 * Regression test for a real bug found via manual testing on the deployed guest
 * site: sd-matematika-02's illustration showed the "media can't load" fallback
 * even though the SVG asset itself returned 200. Root cause — this function only
 * checked for mediaStorageKey/fallbackStorageKey INSIDE block.payload (the shape
 * the public API produces, since seed-interactive-content.ts's blockPayload()
 * folds them in at seed time), but the local Guest Mode fallback path
 * (content-kit's raw LessonBlockInput, used when the API is unreachable or the
 * lesson is still REVIEW-status) carries those same fields at the TOP LEVEL of
 * the block, sibling to `payload`, never inside it.
 */
describe('toRenderableBlocks — guest-fallback vs public-API block shapes', () => {
  it('resolves imageUrl from a top-level mediaStorageKey (content-kit / guest fallback shape)', () => {
    const raw = [
      {
        id: 'b1',
        blockType: 'ILLUSTRATION',
        payload: { caption: 'Sebuah pizza' },
        altText: 'Pizza dibagi empat',
        mediaStorageKey: 'assets/lessons/sd/sd-02-pizza.svg',
        fallbackStorageKey: 'assets/lessons/sd/sd-02-fallback.svg',
      },
    ];

    const [block] = toRenderableBlocks(raw);

    expect(block.payload.imageUrl).toBe('/assets/lessons/sd/sd-02-pizza.svg');
    expect(block.payload.fallbackImageUrl).toBe('/assets/lessons/sd/sd-02-fallback.svg');
    expect(block.payload.altText).toBe('Pizza dibagi empat');
  });

  it('still resolves imageUrl when it is pre-folded into payload (public API shape)', () => {
    const raw = [
      {
        id: 'b1',
        blockType: 'ILLUSTRATION',
        payload: {
          caption: 'Sebuah pizza',
          mediaStorageKey: 'assets/lessons/sd/sd-02-pizza.svg',
          imageUrl: '/assets/lessons/sd/sd-02-pizza.svg',
        },
        altText: 'Pizza dibagi empat',
      },
    ];

    const [block] = toRenderableBlocks(raw);

    expect(block.payload.imageUrl).toBe('/assets/lessons/sd/sd-02-pizza.svg');
  });

  it('does not overwrite an imageUrl already present in payload', () => {
    const raw = [
      {
        id: 'b1',
        blockType: 'ILLUSTRATION',
        payload: { imageUrl: '/already-resolved.svg' },
        mediaStorageKey: 'assets/lessons/sd/sd-02-pizza.svg',
      },
    ];

    const [block] = toRenderableBlocks(raw);

    expect(block.payload.imageUrl).toBe('/already-resolved.svg');
  });

  it('returns an empty array for non-array input', () => {
    expect(toRenderableBlocks(null as never)).toEqual([]);
    expect(toRenderableBlocks(undefined as never)).toEqual([]);
  });
});
