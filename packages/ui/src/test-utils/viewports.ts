/**
 * Feature 011 / SC-013 — the four widths every responsive test in this
 * feature checks against, plus a helper to assert "no page-level horizontal
 * overflow" at whichever width is currently applied.
 *
 * Usage inside a jsdom test:
 *
 *   for (const width of VIEWPORT_WIDTHS) {
 *     setViewportWidth(width);
 *     render(<Lesson />);
 *     expectNoHorizontalOverflow(document.body);
 *   }
 */

export const VIEWPORT_WIDTHS = [320, 375, 768, 1280] as const;
export type ViewportWidth = (typeof VIEWPORT_WIDTHS)[number];

/** The narrowest, portrait-critical width (FR-042) — most tests should include it. */
export const PORTRAIT_CRITICAL_WIDTH: ViewportWidth = 320;

/**
 * Sets `window.innerWidth`/`innerHeight` and fires `resize` — jsdom does not
 * do actual layout, so this only drives code that reads `window.innerWidth`
 * (e.g. a `useViewportWidth` hook or a matchMedia-based check), not CSS
 * media queries or real box overflow.
 */
export function setViewportWidth(width: ViewportWidth, height = 800): void {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event('resize'));
}

/**
 * jsdom reports `scrollWidth`/`clientWidth` as 0 by default (no real layout
 * engine), so this is a structural check, not a pixel one: it fails when an
 * element's inline/explicit width would clearly exceed the given viewport
 * (e.g. `width: 2000px` in a style attribute), which is the class of bug
 * FR-041 exists to prevent. It intentionally does not attempt to replicate a
 * real browser's layout — that level of check belongs in Playwright/E2E,
 * not a unit test.
 */
export function expectNoDeclaredOverflow(root: Element, viewportWidth: ViewportWidth): void {
  const offenders: string[] = [];
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[style]'))) {
    const widthMatch = /(?:^|;)\s*width:\s*(\d+)px/.exec(el.getAttribute('style') ?? '');
    if (widthMatch && Number(widthMatch[1]) > viewportWidth && !isInsideScrollRegion(el)) {
      offenders.push(`${el.tagName.toLowerCase()} width:${widthMatch[1]}px at ${viewportWidth}px viewport`);
    }
  }
  if (offenders.length > 0) {
    throw new Error(
      `Elemen berikut melebihi lebar viewport ${viewportWidth}px tanpa berada di dalam ScrollableWide (FR-041):\n` +
        offenders.join('\n'),
    );
  }
}

function isInsideScrollRegion(el: Element): boolean {
  return el.closest('[role="region"].overflow-x-auto') !== null;
}
