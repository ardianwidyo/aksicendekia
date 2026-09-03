#!/usr/bin/env node
/**
 * Generate the raster PWA icon set from `public/icons/icon.svg`.
 *
 * Cloudflare Pages builds on Linux and has no access to the local `sharp`
 * win32 binary, so the PNGs this produces are committed to the repo — run this
 * only when the source SVG changes, then commit the regenerated files.
 *
 *   node scripts/generate-pwa-icons.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ICONS_DIR = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../public/icons');
const SOURCE = path.join(ICONS_DIR, 'icon.svg');

const BRAND_BG = '#0058be';

/** Full-bleed square icons (purpose "any"). */
const ANY_SIZES = [192, 512];
/** Maskable icons keep the artwork inside the safe zone (center ~80%). */
const MASKABLE_SIZES = [192, 512];
const APPLE_TOUCH_SIZE = 180;
const MASKABLE_SAFE_RATIO = 0.8;

async function renderAny(svg, size) {
  const png = await sharp(svg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: BRAND_BG })
    .png()
    .toBuffer();
  await writeFile(path.join(ICONS_DIR, `icon-${size}.png`), png);
}

async function renderMaskable(svg, size) {
  const inner = Math.round(size * MASKABLE_SAFE_RATIO);
  const pad = Math.round((size - inner) / 2);
  const art = await sharp(svg, { density: 384 }).resize(inner, inner, { fit: 'contain', background: BRAND_BG }).toBuffer();
  const png = await sharp({
    create: { width: size, height: size, channels: 4, background: BRAND_BG },
  })
    .composite([{ input: art, top: pad, left: pad }])
    .png()
    .toBuffer();
  await writeFile(path.join(ICONS_DIR, `icon-maskable-${size}.png`), png);
}

async function renderAppleTouch(svg) {
  // iOS masks the icon itself and dislikes transparency — flatten onto brand blue.
  const png = await sharp(svg, { density: 384 })
    .resize(APPLE_TOUCH_SIZE, APPLE_TOUCH_SIZE, { fit: 'contain', background: BRAND_BG })
    .flatten({ background: BRAND_BG })
    .png()
    .toBuffer();
  await writeFile(path.join(ICONS_DIR, 'apple-touch-icon.png'), png);
}

async function main() {
  const svg = await readFile(SOURCE);
  await Promise.all([
    ...ANY_SIZES.map((size) => renderAny(svg, size)),
    ...MASKABLE_SIZES.map((size) => renderMaskable(svg, size)),
    renderAppleTouch(svg),
  ]);
  const written = [
    ...ANY_SIZES.map((s) => `icon-${s}.png`),
    ...MASKABLE_SIZES.map((s) => `icon-maskable-${s}.png`),
    'apple-touch-icon.png',
  ];
  console.log(`Generated ${written.length} icons in public/icons:\n  ${written.join('\n  ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
