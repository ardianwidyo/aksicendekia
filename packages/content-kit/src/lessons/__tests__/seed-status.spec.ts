import { describe, it, expect } from 'vitest';
import { INTERACTIVE_LESSONS } from '../catalog';

/** T019 — the seed must never produce PUBLISHED content (FR-030a). */

describe('seed status guard', () => {
  it('no catalog entry is PUBLISHED (or any status other than REVIEW)', () => {
    const bad = INTERACTIVE_LESSONS.filter((l) => l.status !== 'REVIEW');
    expect(bad.map((l) => `${l.id}:${l.status}`)).toEqual([]);
  });

  it('the InteractiveLesson type only permits DRAFT | REVIEW', () => {
    // compile-time guarantee mirrored at runtime: assigning "PUBLISHED" is a type error.
    const statuses = new Set(INTERACTIVE_LESSONS.map((l) => l.status));
    for (const s of statuses) expect(['DRAFT', 'REVIEW']).toContain(s);
  });
});
