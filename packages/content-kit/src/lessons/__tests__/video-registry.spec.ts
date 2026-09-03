import { describe, it, expect } from 'vitest';
import { getVideoEmbed, buildVideoRegistry, VIDEO_REGISTRY } from '../video-registry';
import { videoEmbedRefSchema, type VideoEmbedRef } from '../../schema/video-embed.schema';
import { SD_LESSONS } from '../sd/index';

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

  it('defaults to the real VIDEO_REGISTRY, populated from the 60 SD lessons (T083)', () => {
    const ids = Object.keys(VIDEO_REGISTRY);
    expect(ids).toHaveLength(60);
    expect(getVideoEmbed('anything')).toBeUndefined();
    // every entry resolves and passes the ref schema
    for (const id of ids) {
      const ref = getVideoEmbed(id)!;
      expect(ref.id).toBe(id);
      expect(videoEmbedRefSchema.safeParse(ref).success, `${id} invalid`).toBe(true);
    }
  });

  it('has exactly one registry row per SD lesson id (yt-<lessonId>)', () => {
    for (const lesson of SD_LESSONS) {
      expect(VIDEO_REGISTRY[`yt-${lesson.id}`], `${lesson.id} has no video`).toBeDefined();
    }
  });
});
