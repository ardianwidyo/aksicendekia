/**
 * Feature 011 / T084 + T085 — generate the self-hosted SVG assets every SD
 * Matematika lesson block references: media images, static fallbacks, and video
 * posters. Every referenced `mediaStorageKey` / `fallbackStorageKey` /
 * `posterStorageKey` gets a real, valid, theme-neutral file under
 * `apps/web/public/assets/lessons/sd/kelas-{n}/` so the static-fallback path
 * (FR-015) and the video poster (Constitution VI butir 2) always resolve.
 *
 * The placeholders are parametric — a labelled card drawn from design-token-ish
 * neutral values with a <title>/<desc> for screen readers — not final artwork;
 * final illustration is produced from the `packages/ui` illustration primitives
 * during media production. Re-running is idempotent (overwrites in place).
 *
 * Usage: `pnpm tsx scripts/generate-sd-assets.ts`
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SD_LESSONS, SD_VIDEO_REFS } from '@aksicendekia/content-kit';

const PUBLIC_ROOT = join(process.cwd(), 'apps', 'web', 'public');

type Kind = 'media' | 'fallback' | 'poster';

function svgFor(key: string, kind: Kind): string {
  const label = key.split('/').pop()!.replace(/\.svg$/, '');
  const bg = kind === 'poster' ? '#0f172a' : kind === 'fallback' ? '#f1f5f9' : '#e0e7ff';
  const fg = kind === 'poster' ? '#e2e8f0' : '#1e293b';
  const accent = kind === 'poster' ? '#38bdf8' : '#6366f1';
  const heading =
    kind === 'poster' ? 'Pratinjau video' : kind === 'fallback' ? 'Gambar cadangan' : 'Ilustrasi materi';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" role="img" aria-labelledby="t d" preserveAspectRatio="xMidYMid meet">
  <title id="t">${heading}: ${label}</title>
  <desc id="d">Placeholder self-hosted ${kind} untuk pelajaran Matematika SD (${label}). Diganti dengan gambar final pada tahap produksi media.</desc>
  <rect width="320" height="180" fill="${bg}"/>
  <rect x="8" y="8" width="304" height="164" rx="12" fill="none" stroke="${accent}" stroke-width="2"/>
  ${kind === 'poster' ? '<circle cx="160" cy="90" r="26" fill="none" stroke="' + accent + '" stroke-width="3"/><path d="M152 78 152 102 174 90 Z" fill="' + accent + '"/>' : '<path d="M40 132 L104 84 L150 116 L200 68 L280 128" fill="none" stroke="' + accent + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'}
  <text x="160" y="156" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="${fg}">${label}</text>
</svg>
`;
}

function collectKeys(): Map<string, Kind> {
  const keys = new Map<string, Kind>();
  for (const lesson of SD_LESSONS) {
    for (const block of lesson.contentBlocks) {
      if (block.mediaStorageKey) keys.set(block.mediaStorageKey, 'media');
      if (block.fallbackStorageKey) keys.set(block.fallbackStorageKey, 'fallback');
      // widget media (IMAGE_HOTSPOT mediaAssetId, etc.)
      const widget = (block.payload as { widget?: { params?: Record<string, unknown> } }).widget;
      const mediaAssetId = widget?.params?.mediaAssetId;
      if (typeof mediaAssetId === 'string') keys.set(mediaAssetId, 'media');
    }
    // kelas 1-2 per-option / per-item picture companions
    for (const q of lesson.questions) {
      const p = q.contentPayload as {
        options?: Array<{ illustrationAssetId?: string }>;
        items?: Array<{ illustrationAssetId?: string }>;
      };
      for (const o of p.options ?? []) if (o.illustrationAssetId) keys.set(o.illustrationAssetId, 'media');
      for (const it of p.items ?? []) if (it.illustrationAssetId) keys.set(it.illustrationAssetId, 'media');
    }
  }
  for (const ref of SD_VIDEO_REFS) keys.set(ref.posterStorageKey, 'poster');
  return keys;
}

function main(): void {
  const keys = collectKeys();
  let written = 0;
  for (const [key, kind] of keys) {
    const target = join(PUBLIC_ROOT, key);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, svgFor(key, kind), 'utf8');
    written += 1;
  }
  console.log(`generate-sd-assets: wrote ${written} SVG asset(s) under apps/web/public/assets/lessons/sd/`);
}

main();
