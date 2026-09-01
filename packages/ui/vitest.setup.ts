import '@testing-library/jest-dom/vitest';
import * as matchers from 'vitest-axe/matchers';
import { expect, vi } from 'vitest';

expect.extend(matchers);

// jsdom has no canvas; axe-core's color-contrast check probes getContext.
// Stub it so a11y assertions run without noise (contrast is verified manually).
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}
