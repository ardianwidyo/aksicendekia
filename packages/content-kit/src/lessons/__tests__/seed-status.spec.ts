import { describe, it, expect } from 'vitest';
import { INTERACTIVE_LESSONS } from '../catalog';

/** T019 (Feature 010) + T075 (Feature 011) — the seed must never produce PUBLISHED content (FR-030a). */

describe('seed status guard', () => {
  it('no catalog entry is PUBLISHED (or any status other than REVIEW)', () => {
    const bad = INTERACTIVE_LESSONS.filter((l) => l.status !== 'REVIEW');
    expect(bad.map((l) => `${l.id}:${l.status}`)).toEqual([]);
  });

  it('seeds 60 SD Matematika lessons (kelas 1-6 × 10), every one at REVIEW with a gradeLevel', () => {
    const sd = INTERACTIVE_LESSONS.filter((l) => l.educationStage === 'SD');
    expect(sd).toHaveLength(60);
    expect(sd.every((l) => l.status === 'REVIEW')).toBe(true);
    expect(sd.every((l) => l.subjectCode === 'MATH_SD')).toBe(true);
    for (const grade of [1, 2, 3, 4, 5, 6]) {
      expect(sd.filter((l) => l.gradeLevel === grade), `kelas ${grade}`).toHaveLength(10);
    }
    expect(sd.some((l) => (l.status as string) === 'PUBLISHED')).toBe(false);
  });

  it('the InteractiveLesson type only permits DRAFT | REVIEW', () => {
    // compile-time guarantee mirrored at runtime: assigning "PUBLISHED" is a type error.
    const statuses = new Set(INTERACTIVE_LESSONS.map((l) => l.status));
    for (const s of statuses) expect(['DRAFT', 'REVIEW']).toContain(s);
  });
});
