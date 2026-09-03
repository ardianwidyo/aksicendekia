import { describe, it, expect, afterEach } from 'vitest';
import { resetFocusConfigCache } from '@aksicendekia/content-kit';
import {
  isFocusModeEnabled,
  isWebStageInFocus,
  filterStageOptions,
  outOfFocusRedirect,
  focusRedirectPath,
} from '../focus';

function setFocus(enabled: boolean): void {
  process.env.NEXT_PUBLIC_FOCUS_ENABLED = enabled ? 'true' : 'false';
  resetFocusConfigCache();
}

afterEach(() => {
  delete process.env.NEXT_PUBLIC_FOCUS_ENABLED;
  resetFocusConfigCache();
});

const STAGES = [
  { id: 'tk', label: 'TK / PAUD' },
  { id: 'sd', label: 'Sekolah Dasar (SD)' },
  { id: 'smp', label: 'SMP / Sederajat' },
  { id: 'sma', label: 'SMA / SMK' },
];

/**
 * Feature 011 / T033 (US1). `apps/web/lib/focus.ts` is the thin web-route
 * adaptor over content-kit's focus-config — it maps lowercase web stage ids to
 * the EducationStage codes and exposes redirect helpers for the App Router.
 */
describe('apps/web focus adaptor — focus mode enabled', () => {
  it('reports focus mode as enabled', () => {
    setFocus(true);
    expect(isFocusModeEnabled()).toBe(true);
  });

  it('keeps only SD among the web stage ids', () => {
    setFocus(true);
    expect(isWebStageInFocus('sd')).toBe(true);
    expect(isWebStageInFocus('SD')).toBe(true);
    expect(isWebStageInFocus('tk')).toBe(false);
    expect(isWebStageInFocus('smp')).toBe(false);
    expect(isWebStageInFocus('sma')).toBe(false);
  });

  it('filters a stage-option list down to the in-focus stage', () => {
    setFocus(true);
    expect(filterStageOptions(STAGES).map((s) => s.id)).toEqual(['sd']);
  });

  it('returns the redirect target for an out-of-focus lesson and null for an in-focus one', () => {
    setFocus(true);
    expect(
      outOfFocusRedirect({ educationStage: 'SMP', subjectCode: 'MATH_SMP' }),
    ).toBe('/explore');
    expect(
      outOfFocusRedirect({ educationStage: 'SD', subjectCode: 'MATH_SD' }),
    ).toBeNull();
    expect(outOfFocusRedirect(null)).toBeNull();
    expect(focusRedirectPath()).toBe('/explore');
  });
});

describe('apps/web focus adaptor — focus mode disabled', () => {
  it('treats every stage as in focus and never redirects', () => {
    setFocus(false);
    expect(isFocusModeEnabled()).toBe(false);
    expect(filterStageOptions(STAGES).map((s) => s.id)).toEqual(['tk', 'sd', 'smp', 'sma']);
    expect(
      outOfFocusRedirect({ educationStage: 'SMA', subjectCode: 'PHYSICS' }),
    ).toBeNull();
  });
});
