import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { resetFocusConfigCache } from '@aksicendekia/content-kit';
import { I18nProvider } from '../../providers/i18n-provider';
import { ThemeProvider } from '../../providers/theme-provider';
import { LevelSelector } from '../level-selector';
import { Sidebar } from '../sidebar';
import { TopBar } from '../topbar';

const wrap = (ui: React.ReactElement) =>
  render(
    <I18nProvider defaultLocale="id">
      <ThemeProvider>{ui}</ThemeProvider>
    </I18nProvider>,
  );

function setFocus(enabled: boolean): void {
  process.env.NEXT_PUBLIC_FOCUS_ENABLED = enabled ? 'true' : 'false';
  resetFocusConfigCache();
}

afterEach(() => {
  delete process.env.NEXT_PUBLIC_FOCUS_ENABLED;
  resetFocusConfigCache();
});

/**
 * Feature 011 / T031 (US1, FR-001..FR-002). With focus mode enabled every
 * navigation surface offers only the in-focus stage (SD). Turning it off
 * restores every stage with no code change.
 */
describe('LevelSelector — focus filtering', () => {
  it('renders only the SD stage option when focus mode is enabled', () => {
    setFocus(true);
    wrap(<LevelSelector variant="grid" />);

    expect(screen.getByRole('radio', { name: /Sekolah Dasar/i })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /TK \/ PAUD/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /SMP/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /SMA/i })).not.toBeInTheDocument();
  });

  it('restores every stage option when focus mode is disabled', () => {
    setFocus(false);
    wrap(<LevelSelector variant="grid" />);

    expect(screen.getByRole('radio', { name: /TK \/ PAUD/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Sekolah Dasar/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /SMP/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /SMA/i })).toBeInTheDocument();
  });
});

describe('Sidebar — inherits focus filtering through LevelSelector', () => {
  it('lists only the SD stage when focus mode is enabled', () => {
    setFocus(true);
    wrap(<Sidebar />);

    expect(screen.getByRole('radio', { name: /Sekolah Dasar/i })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /SMP/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /SMA/i })).not.toBeInTheDocument();
  });
});

describe('TopBar — carries no off-focus stage/subject affordance', () => {
  it('renders without exposing any off-focus stage label under focus mode', () => {
    setFocus(true);
    wrap(<TopBar />);

    expect(screen.queryByText(/SMP \/ Sederajat/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SMA \/ SMK \/ MA/i)).not.toBeInTheDocument();
  });
});
