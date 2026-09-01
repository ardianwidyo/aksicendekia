import { describe, it, expect } from 'vitest';
import { CURRICULUM_ACHIEVEMENTS, getAchievement } from '../achievements';

/** T016 — every CP quote must be traceable (FR-008a). */

describe('curriculum achievements provenance', () => {
  it('covers the 4 phases used by the seeded lessons', () => {
    const phases = CURRICULUM_ACHIEVEMENTS.map((a) => a.phase).sort();
    expect(phases).toEqual(['FASE_B', 'FASE_D', 'FASE_E', 'FOUNDATION']);
  });

  it.each(CURRICULUM_ACHIEVEMENTS)('$id has complete, traceable provenance', (a) => {
    expect(a.achievementText.trim().length).toBeGreaterThan(40);
    expect(a.sourceDocument).toMatch(/BSKAP/i);
    expect(a.sourceUrl).toMatch(/^https:\/\//);
    expect(a.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(a.element.trim().length).toBeGreaterThan(0);
  });

  it('flags every row for primary-source verification until a reviewer confirms it', () => {
    // These quotes came from mirrors, not the primary kemdikbud PDF. A human must
    // confirm them verbatim before the lessons that cite them are PUBLISHED.
    expect(CURRICULUM_ACHIEVEMENTS.every((a) => a.needsPrimaryVerification)).toBe(true);
  });

  it('getAchievement resolves by (phase, subjectCode, element)', () => {
    expect(getAchievement('FASE_B', 'MATH_SD', 'Bilangan')?.id).toBe('cp-fase-b-matematika-bilangan');
    expect(getAchievement('FASE_B', 'MATH_SD', 'Aljabar')).toBeUndefined();
  });
});
