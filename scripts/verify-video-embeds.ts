/**
 * Feature 011 / FR-016d, R7 — CI-only link-rot check for embedded videos.
 *
 * Reads every entry from the content-kit video registry and confirms each
 * is still reachable via YouTube's public oEmbed endpoint. Runs ONLY in
 * CI/build, never in the browser: a client-side check would itself be the
 * pre-click third-party request the Constitution VI v1.2.0 exception
 * forbids (butir 2). Exits non-zero and lists every dead id so it can be
 * replaced before release (SC-012).
 *
 * Usage: `pnpm verify:video-embeds` (root package.json).
 */

import { VIDEO_REGISTRY, type VideoEmbedRef } from '@aksicendekia/content-kit';

const OEMBED_ENDPOINT = 'https://www.youtube.com/oembed';

interface CheckResult {
  ref: VideoEmbedRef;
  ok: boolean;
  reason?: string;
}

/**
 * T083/T095 authoring placeholders: `externalId` derived from the lesson id and
 * padded with `_`. These are NOT real YouTube ids — media production replaces
 * each with a curated, human-reviewed video before merge (SC-012).
 */
function isPlaceholderId(externalId: string): boolean {
  // Not a well-formed YouTube id, or clearly derived from a lesson id
  // (`sd-…`, `…-k4-…`, padded with `_`).
  return (
    !/^[A-Za-z0-9_-]{11}$/.test(externalId) ||
    externalId.includes('_') ||
    externalId.startsWith('sd-') ||
    /-k[1-6]-/.test(externalId)
  );
}

async function checkOne(ref: VideoEmbedRef): Promise<CheckResult> {
  if (isPlaceholderId(ref.externalId)) {
    return { ref, ok: false, reason: 'PLACEHOLDER id — replace with a curated, reviewed video before merge' };
  }
  const url = `${OEMBED_ENDPOINT}?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${ref.externalId}`,
  )}&format=json`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { ref, ok: false, reason: `HTTP ${response.status}` };
    }
    return { ref, ok: true };
  } catch (error) {
    return { ref, ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

async function main(): Promise<void> {
  const refs = Object.values(VIDEO_REGISTRY);
  if (refs.length === 0) {
    console.log('verify-video-embeds: registry is empty — nothing to check.');
    return;
  }

  console.log(`verify-video-embeds: checking ${refs.length} embedded video(s)...`);
  const results = await Promise.all(refs.map(checkOne));
  const dead = results.filter((r) => !r.ok);

  for (const result of results) {
    const status = result.ok ? 'OK  ' : 'DEAD';
    console.log(`  [${status}] ${result.ref.id} (${result.ref.externalId})${result.reason ? ` — ${result.reason}` : ''}`);
  }

  if (dead.length > 0) {
    console.error(
      `\nverify-video-embeds: ${dead.length} of ${refs.length} video(s) are no longer reachable:`,
    );
    for (const result of dead) {
      console.error(`  - ${result.ref.id}: ${result.reason}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('\nverify-video-embeds: all embedded videos are reachable.');
}

main().catch((error: unknown) => {
  console.error('verify-video-embeds: unexpected failure', error);
  process.exitCode = 1;
});
