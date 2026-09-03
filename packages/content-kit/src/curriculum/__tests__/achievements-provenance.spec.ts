import { describe, it, expect } from 'vitest';
import { CURRICULUM_ACHIEVEMENTS, getAchievement } from '../achievements';

/** T016 (Feature 010) / T011 (Feature 011) — every CP quote must be traceable (FR-008a, FR-032). */

const SD_ELEMENTS = ['Bilangan', 'Aljabar', 'Pengukuran', 'Geometri', 'Analisis Data dan Peluang'];
const SD_PHASES = ['FASE_A', 'FASE_B', 'FASE_C'] as const;

describe('curriculum achievements provenance', () => {
  it('covers the phases used by the seeded lessons (TK/SMP/SMA sample + full SD Fase A/B/C)', () => {
    const phases = new Set(CURRICULUM_ACHIEVEMENTS.map((a) => a.phase));
    expect(phases).toEqual(new Set(['FOUNDATION', 'FASE_A', 'FASE_B', 'FASE_C', 'FASE_D', 'FASE_E']));
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
    expect(getAchievement('FASE_B', 'MATH_SD', 'Kewarganegaraan')).toBeUndefined();
  });

  // --- Feature 011 / data-model.md §1 & FR-011: every SD grade must be able to
  // cover all 5 Matematika elements. That is only possible if all 3 SD phases
  // × 5 elements exist here — this is the guard against a grade shipping with
  // an element nobody wrote a CP row for.
  describe('SD Matematika spans all 3 phases x 5 elements (FR-011)', () => {
    const sdRows = CURRICULUM_ACHIEVEMENTS.filter(
      (a) => a.educationStage === 'SD' && a.subjectCode === 'MATH_SD',
    );

    it('has exactly 15 rows (3 phases x 5 elements, no gaps, no duplicates)', () => {
      expect(sdRows).toHaveLength(15);
    });

    it.each(SD_PHASES)('Fase %s has all 5 Matematika elements represented', (phase) => {
      const elements = sdRows.filter((a) => a.phase === phase).map((a) => a.element).sort();
      expect(elements).toEqual([...SD_ELEMENTS].sort());
    });

    it('has no duplicate (phase, element) pair', () => {
      const keys = sdRows.map((a) => `${a.phase}::${a.element}`);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });
});
