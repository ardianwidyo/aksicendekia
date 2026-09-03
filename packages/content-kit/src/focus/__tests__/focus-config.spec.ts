import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getFocusConfig,
  isStageInFocus,
  isSubjectInFocus,
  isLessonInFocus,
  filterLessonsForFocus,
  focusRedirectTarget,
  resetFocusConfigCache,
} from '../focus-config';

/**
 * Feature 011 — contracts/focus-config.md guarantees G1-G4.
 * T012: written before focus-config.ts exists — must fail first (Constitution III).
 */

const ENV_KEYS = ['NEXT_PUBLIC_FOCUS_ENABLED', 'FOCUS_ENABLED'] as const;
const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
  resetFocusConfigCache();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
  resetFocusConfigCache();
});

describe('getFocusConfig', () => {
  it('defaults to enabled with SD/MATH_SD in focus when no env var is set', () => {
    delete process.env.NEXT_PUBLIC_FOCUS_ENABLED;
    delete process.env.FOCUS_ENABLED;
    resetFocusConfigCache();
    const config = getFocusConfig();
    expect(config.enabled).toBe(true);
    expect(config.stages).toEqual(['SD']);
    expect(config.subjectCodes).toEqual(['MATH_SD']);
    expect(config.redirectTarget).toBe('/explore');
  });

  it('reads NEXT_PUBLIC_FOCUS_ENABLED=false as disabled', () => {
    process.env.NEXT_PUBLIC_FOCUS_ENABLED = 'false';
    resetFocusConfigCache();
    expect(getFocusConfig().enabled).toBe(false);
  });

  it('reads FOCUS_ENABLED=false as disabled', () => {
    delete process.env.NEXT_PUBLIC_FOCUS_ENABLED;
    process.env.FOCUS_ENABLED = 'false';
    resetFocusConfigCache();
    expect(getFocusConfig().enabled).toBe(false);
  });
});

describe('G1 — identity when disabled', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_FOCUS_ENABLED = 'false';
    resetFocusConfigCache();
  });

  it('isStageInFocus/isSubjectInFocus return true for everything', () => {
    expect(isStageInFocus('TK')).toBe(true);
    expect(isStageInFocus('SMA')).toBe(true);
    expect(isSubjectInFocus('MATH_SMP')).toBe(true);
  });

  it('filterLessonsForFocus is the identity function, preserving order', () => {
    const items = [
      { educationStage: 'TK' as const, subjectCode: 'NUMERASI_TK' },
      { educationStage: 'SD' as const, subjectCode: 'MATH_SD' },
      { educationStage: 'SMA' as const, subjectCode: 'MATH_SMA' },
    ];
    expect(filterLessonsForFocus(items)).toEqual(items);
  });
});

describe('G2 — pure, no I/O side effects', () => {
  it('predicates are synchronous and return plain booleans', () => {
    resetFocusConfigCache();
    expect(typeof isStageInFocus('SD')).toBe('boolean');
    expect(typeof isSubjectInFocus('MATH_SD')).toBe('boolean');
  });
});

describe('G3/G4 — focused behavior when enabled (default)', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_FOCUS_ENABLED;
    delete process.env.FOCUS_ENABLED;
    resetFocusConfigCache();
  });

  it('isStageInFocus is true only for SD', () => {
    expect(isStageInFocus('SD')).toBe(true);
    expect(isStageInFocus('TK')).toBe(false);
    expect(isStageInFocus('SMP')).toBe(false);
    expect(isStageInFocus('SMA')).toBe(false);
  });

  it('isSubjectInFocus is true only for MATH_SD', () => {
    expect(isSubjectInFocus('MATH_SD')).toBe(true);
    expect(isSubjectInFocus('MATH_SMP')).toBe(false);
  });

  it('isLessonInFocus requires both stage and subject in focus', () => {
    expect(isLessonInFocus({ educationStage: 'SD', subjectCode: 'MATH_SD' })).toBe(true);
    expect(isLessonInFocus({ educationStage: 'SD', subjectCode: 'BAHASA_SD' })).toBe(false);
    expect(isLessonInFocus({ educationStage: 'TK', subjectCode: 'MATH_SD' })).toBe(false);
  });

  it('filterLessonsForFocus keeps only in-focus items, preserving order', () => {
    const items = [
      { educationStage: 'TK' as const, subjectCode: 'NUMERASI_TK' },
      { educationStage: 'SD' as const, subjectCode: 'MATH_SD' },
      { educationStage: 'SD' as const, subjectCode: 'BAHASA_SD' },
      { educationStage: 'SMA' as const, subjectCode: 'MATH_SMA' },
    ];
    expect(filterLessonsForFocus(items)).toEqual([
      { educationStage: 'SD', subjectCode: 'MATH_SD' },
    ]);
  });

  it('focusRedirectTarget points at the SD Matematika catalog', () => {
    expect(focusRedirectTarget()).toBe('/explore');
  });
});
