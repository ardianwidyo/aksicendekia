import { describe, it, expect } from 'vitest';
import { VIEWPORT_WIDTHS, setViewportWidth, expectNoDeclaredOverflow } from '../viewports';

describe('viewports test helper (SC-013)', () => {
  it('exposes exactly the 4 required widths', () => {
    expect(VIEWPORT_WIDTHS).toEqual([320, 375, 768, 1280]);
  });

  it('setViewportWidth updates window.innerWidth and fires resize', () => {
    let resized = false;
    window.addEventListener('resize', () => (resized = true), { once: true });
    setViewportWidth(320);
    expect(window.innerWidth).toBe(320);
    expect(resized).toBe(true);
  });

  it('expectNoDeclaredOverflow passes when nothing exceeds the viewport', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div style="width: 200px">ok</div>';
    expect(() => expectNoDeclaredOverflow(root, 320)).not.toThrow();
  });

  it('expectNoDeclaredOverflow fails on an element wider than the viewport', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div style="width: 2000px">too wide</div>';
    expect(() => expectNoDeclaredOverflow(root, 320)).toThrow(/FR-041/);
  });

  it('expectNoDeclaredOverflow allows overflow inside a ScrollableWide region', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<div role="region" class="overflow-x-auto"><div style="width: 2000px">wide but contained</div></div>';
    expect(() => expectNoDeclaredOverflow(root, 320)).not.toThrow();
  });
});
