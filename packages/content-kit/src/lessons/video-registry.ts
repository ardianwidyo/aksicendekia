import type { VideoEmbedRef } from '../schema/video-embed.schema.js';

/**
 * Feature 011 — the registry of embedded third-party (YouTube) videos
 * (contracts/video-embed.md). Keyed by each ref's own `id` so a lesson's
 * `LessonBlockInput.videoEmbedId` resolves to its metadata without ever
 * carrying a bare URL through the authoring layer.
 *
 * Populated from kelas-1..6 lesson specs as they're authored (Phase 5 / US3,
 * T083) via `buildVideoRegistry` — each kelas module supplies its own list of
 * `VideoEmbedRef`s, mirroring how `lessons/catalog.ts` aggregates lessons.
 * Empty here in Foundational: no lesson content exists yet at this phase.
 */

/** Pure — builds a registry from a flat list, rejecting duplicate ids up front. */
export function buildVideoRegistry(
  entries: readonly VideoEmbedRef[],
): Record<string, VideoEmbedRef> {
  const registry: Record<string, VideoEmbedRef> = {};
  for (const entry of entries) {
    if (registry[entry.id]) {
      throw new Error(`Id video duplikat pada registri: "${entry.id}".`);
    }
    registry[entry.id] = entry;
  }
  return registry;
}

export const VIDEO_REGISTRY: Record<string, VideoEmbedRef> = buildVideoRegistry([]);

export function getVideoEmbed(
  id: string,
  registry: Record<string, VideoEmbedRef> = VIDEO_REGISTRY,
): VideoEmbedRef | undefined {
  return registry[id];
}
