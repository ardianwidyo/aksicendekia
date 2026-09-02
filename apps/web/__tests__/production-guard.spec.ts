import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * Feature 010 / T086 (FR-030b). `pnpm build` (apps/web) runs
 * scripts/assert-production-guards.js before `next build`; this exercises that
 * script directly rather than paying for a full production build per assertion.
 */
const SCRIPT_PATH = path.resolve(__dirname, '..', 'scripts', 'assert-production-guards.js');

function runGuard(env: Record<string, string>): { status: number; stderr: string } {
  try {
    execFileSync('node', [SCRIPT_PATH], { env: { ...process.env, ...env }, stdio: 'pipe' });
    return { status: 0, stderr: '' };
  } catch (error) {
    const err = error as { status: number; stderr: Buffer };
    return { status: err.status, stderr: err.stderr.toString() };
  }
}

describe('assert-production-guards.js (FR-030b)', () => {
  it('fails the build when NEXT_PUBLIC_CONTENT_PREVIEW=true', () => {
    const result = runGuard({ NEXT_PUBLIC_CONTENT_PREVIEW: 'true' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/FR-030b/);
  });

  it('passes when NEXT_PUBLIC_CONTENT_PREVIEW is unset or false', () => {
    expect(runGuard({ NEXT_PUBLIC_CONTENT_PREVIEW: '' }).status).toBe(0);
    expect(runGuard({ NEXT_PUBLIC_CONTENT_PREVIEW: 'false' }).status).toBe(0);
  });
});
