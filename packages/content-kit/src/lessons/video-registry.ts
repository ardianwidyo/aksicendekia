import type { VideoEmbedRef } from '../schema/video-embed.schema.js';
import { SD_VIDEO_REFS } from './sd/index.js';

/**
 * Feature 011 — the registry of embedded third-party (YouTube) videos
 * (contracts/video-embed.md). Keyed by each ref's own `id` so a lesson's
 * `LessonBlockInput.videoEmbedId` resolves to its metadata without ever
 * carrying a bare URL through the authoring layer.
 *
 * T083 (US3): populated from the 60 kelas-1..6 lesson specs — each grade file
 * supplies its own list of `VideoEmbedRef`s (via `buildGrade`), aggregated in
 * `sd/index.ts` as `SD_VIDEO_REFS`, mirroring how `lessons/catalog.ts`
 * aggregates lessons. Real YouTube ids + curated `reviewedBy` land during media
 * production; the CI link-rot check is `scripts/verify-video-embeds.ts` (T095).
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

export const VIDEO_REGISTRY: Record<string, VideoEmbedRef> = buildVideoRegistry(SD_VIDEO_REFS);

export function getVideoEmbed(
  id: string,
  registry: Record<string, VideoEmbedRef> = VIDEO_REGISTRY,
): VideoEmbedRef | undefined {
  return registry[id];
}
