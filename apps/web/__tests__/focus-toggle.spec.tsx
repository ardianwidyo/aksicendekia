import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider, ThemeProvider, LevelSelector } from '@aksicendekia/ui';
import { resetFocusConfigCache } from '@aksicendekia/content-kit';
import { filterStageOptions, isFocusModeEnabled, outOfFocusRedirect } from '../lib/focus';
import { FocusScopeNotice } from '../components/FocusScopeNotice';

const STAGES = [
  { id: 'tk', label: 'TK / PAUD' },
  { id: 'sd', label: 'Sekolah Dasar (SD)' },
  { id: 'smp', label: 'SMP / Sederajat' },
  { id: 'sma', label: 'SMA / SMK' },
];

const wrap = (ui: React.ReactElement) =>
  render(
    <I18nProvider defaultLocale="id">
      <ThemeProvider>{ui}</ThemeProvider>
    </I18nProvider>,
  );

function setFocus(value: 'true' | 'false' | undefined): void {
  if (value === undefined) delete process.env.NEXT_PUBLIC_FOCUS_ENABLED;
  else process.env.NEXT_PUBLIC_FOCUS_ENABLED = value;
  resetFocusConfigCache();
}

afterEach(() => setFocus(undefined));

/**
 * Feature 011 / T042 (US1, SC-009). Setting NEXT_PUBLIC_FOCUS_ENABLED=false
 * must restore every stage/subject across the web surfaces with no other code
 * change. The flag is the only lever.
 */
describe('focus toggle — NEXT_PUBLIC_FOCUS_ENABLED=false restores everything', () => {
  it('reports focus mode disabled', () => {
    setFocus('false');
    expect(isFocusModeEnabled()).toBe(false);
  });

  it('restores all four stage options', () => {
    setFocus('false');
    expect(filterStageOptions(STAGES).map((s) => s.id)).toEqual(['tk', 'sd', 'smp', 'sma']);
  });

  it('LevelSelector renders every stage again', () => {
    setFocus('false');
    wrap(<LevelSelector variant="grid" />);
    expect(screen.getByRole('radio', { name: /TK \/ PAUD/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /SMP/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /SMA/i })).toBeInTheDocument();
  });

  it('FocusScopeNotice renders nothing', () => {
    setFocus('false');
    const { container } = wrap(<FocusScopeNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it('never redirects an out-of-focus lesson', () => {
    setFocus('false');
    expect(outOfFocusRedirect({ educationStage: 'SMA', subjectCode: 'PHYSICS' })).toBeNull();
  });
});

describe('focus toggle — default (unset) keeps focus mode on', () => {
  it('treats an unset flag as enabled and narrows to SD', () => {
    setFocus(undefined);
    expect(isFocusModeEnabled()).toBe(true);
    expect(filterStageOptions(STAGES).map((s) => s.id)).toEqual(['sd']);
  });
});
