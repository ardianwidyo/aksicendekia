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

async function checkOne(ref: VideoEmbedRef): Promise<CheckResult> {
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
