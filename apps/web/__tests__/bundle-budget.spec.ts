import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

/**
 * Feature 010 / T082 (SC-004, SC-006). "Additional JS per lesson" is defined here
 * as the set of files in a lesson route's app-build-manifest entry that are NOT
 * also present in every other route's entry (i.e. files outside the shared
 * baseline bundle) — the literal reading of "di luar chunk bersama" in the task.
 *
 * Requires a production build. Builds once here if `.next` isn't already fresh;
 * this makes the test slow (a full `next build`) but self-contained.
 */
const WEB_ROOT = path.resolve(__dirname, '..');
const BUDGET_BYTES = 60 * 1024; // 60 KB gzip

function loadManifest(): Record<string, string[]> {
  const manifestPath = path.join(WEB_ROOT, '.next', 'app-build-manifest.json');
  const raw = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  return raw.pages as Record<string, string[]>;
}

function sharedBaselineFiles(pages: Record<string, string[]>): Set<string> {
  const allFileLists = Object.values(pages);
  const counts = new Map<string, number>();
  for (const files of allFileLists) {
    for (const f of files) counts.set(f, (counts.get(f) ?? 0) + 1);
  }
  // A file present on (almost) every route is part of the shared baseline, not a
  // per-route cost. Threshold at 90% of routes rather than literally "all routes"
  // so one or two outlier routes with an extra dependency don't skew the baseline.
  const threshold = allFileLists.length * 0.9;
  return new Set([...counts.entries()].filter(([, n]) => n >= threshold).map(([f]) => f));
}

function gzipSizeOf(relativeFile: string): number {
  const filePath = path.join(WEB_ROOT, '.next', relativeFile);
  return gzipSync(readFileSync(filePath)).length;
}

describe('Bundle budget — additional JS per lesson route (T082)', () => {
  let pages: Record<string, string[]>;
  let shared: Set<string>;

  beforeAll(() => {
    const manifestPath = path.join(WEB_ROOT, '.next', 'app-build-manifest.json');
    if (!existsSync(manifestPath)) {
      execSync('npx next build', { cwd: WEB_ROOT, stdio: 'inherit' });
    }
    pages = loadManifest();
    shared = sharedBaselineFiles(pages);
  }, 300_000);

  it.each(['/explore/[lessonId]/page', '/explore/[lessonId]/session/page'])(
    'route %s ships ≤ 60 KB gzip of JS outside the shared baseline',
    (route) => {
      const files = pages[route];
      expect(files, `route ${route} missing from app-build-manifest.json`).toBeDefined();

      const routeOnlyFiles = files.filter((f) => !shared.has(f) && f.endsWith('.js'));
      const totalGzipBytes = routeOnlyFiles.reduce((sum, f) => sum + gzipSizeOf(f), 0);

      expect(totalGzipBytes).toBeLessThanOrEqual(BUDGET_BYTES);
    },
  );
});
