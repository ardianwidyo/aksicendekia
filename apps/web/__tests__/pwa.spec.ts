import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import manifest from '../app/manifest';

const WEB_ROOT = path.resolve(__dirname, '..');

describe('PWA manifest', () => {
  const result = manifest();

  it('declares an installable standalone app scoped to the site root', () => {
    expect(result.name).toBeTruthy();
    expect(result.short_name).toBeTruthy();
    expect(result.display).toBe('standalone');
    expect(result.start_url).toBe('/');
    expect(result.scope).toBe('/');
    expect(result.theme_color).toBe('#0058be');
    expect(result.background_color).toBe('#f8f9ff');
  });

  it('provides the 192px and 512px icons Chrome requires, plus a maskable set', () => {
    const icons = result.icons ?? [];
    const sizes = icons.map((icon) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });

  it('points every icon at a file that exists in public/', () => {
    for (const icon of result.icons ?? []) {
      const iconPath = path.join(WEB_ROOT, 'public', String(icon.src));
      expect(existsSync(iconPath), `${icon.src} missing`).toBe(true);
    }
  });
});

describe('Service worker', () => {
  const swPath = path.join(WEB_ROOT, 'public', 'sw.js');

  it('ships a sw.js with lifecycle + fetch handlers and a versioned cache', () => {
    expect(existsSync(swPath)).toBe(true);
    const source = readFileSync(swPath, 'utf-8');
    for (const listener of ['install', 'activate', 'fetch']) {
      expect(source).toContain(`addEventListener('${listener}'`);
    }
    expect(source).toMatch(/CACHE_VERSION\s*=\s*'[^']+'/);
    expect(source).toContain('/offline.html');
  });
});
