import { describe, it, expect } from 'vitest';
import { getVideoEmbed, buildVideoRegistry, VIDEO_REGISTRY } from '../video-registry';
import type { VideoEmbedRef } from '../../schema/video-embed.schema';

/**
 * T015 — written before video-registry.ts exists — must fail first (Constitution III).
 *
 * The real ~60 entries land in Phase 5 / US3 (T083), one per SD lesson, once
 * the kelas-1..6 lesson specs exist. This Foundational phase only builds and
 * proves the lookup mechanism itself, using a local fixture — it does not
 * assume any lesson content is present yet.
 */

const fixtureRef: VideoEmbedRef = {
  id: 'yt-fixture-01',
  provider: 'YOUTUBE',
  externalId: 'dQw4w9WgXcQ',
  title: 'Contoh',
  publisherName: 'Contoh Edukasi',
  posterStorageKey: 'assets/lessons/sd/kelas-1/fixture-poster.svg',
  transcriptText: 'Transkrip contoh.',
  verifiedAt: '2026-09-02',
  reviewedBy: 'guru.penunjuk@aksicendekia.id',
};

describe('buildVideoRegistry', () => {
  it('keys entries by their own id', () => {
    const registry = buildVideoRegistry([fixtureRef]);
    expect(registry[fixtureRef.id]).toEqual(fixtureRef);
  });

  it('rejects duplicate ids so two lessons never silently share one entry', () => {
    expect(() => buildVideoRegistry([fixtureRef, fixtureRef])).toThrow(/duplikat/i);
  });
});

describe('getVideoEmbed', () => {
  it('resolves an id present in a registry built from a fixture', () => {
    const registry = buildVideoRegistry([fixtureRef]);
    expect(getVideoEmbed(fixtureRef.id, registry)?.title).toBe('Contoh');
  });

  it('returns undefined for an id absent from the registry', () => {
    const registry = buildVideoRegistry([fixtureRef]);
    expect(getVideoEmbed('does-not-exist', registry)).toBeUndefined();
  });

  it('defaults to the real VIDEO_REGISTRY when no registry argument is given', () => {
    // Empty until US3 (T083) populates it from the real lesson catalog.
    expect(getVideoEmbed('anything')).toBeUndefined();
    expect(VIDEO_REGISTRY).toEqual({});
  });
});
