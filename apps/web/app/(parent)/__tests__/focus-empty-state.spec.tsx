import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@aksicendekia/ui';
import { resetFocusConfigCache } from '@aksicendekia/content-kit';
import ParentDashboardPage from '../parent-dashboard/page';
import ParentChildrenPage from '../children/page';

const wrap = (ui: React.ReactElement) =>
  render(<I18nProvider defaultLocale="id">{ui}</I18nProvider>);

function setFocus(enabled: boolean): void {
  process.env.NEXT_PUBLIC_FOCUS_ENABLED = enabled ? 'true' : 'false';
  resetFocusConfigCache();
}

afterEach(() => {
  delete process.env.NEXT_PUBLIC_FOCUS_ENABLED;
  resetFocusConfigCache();
});

/**
 * Feature 011 / T039 (US1, FR-006). With focus mode on, the parent surfaces
 * still open — they show an i18n empty state explaining the scope instead of
 * crashing or rendering a confusing blank. With focus off, the notice is gone.
 */
describe('Parent surfaces under focus mode', () => {
  it('parent dashboard renders the focus scope notice without crashing', () => {
    setFocus(true);
    expect(() => wrap(<ParentDashboardPage />)).not.toThrow();
    expect(screen.getAllByText(/Hanya tersedia untuk Matematika SD/i).length).toBeGreaterThan(0);
  });

  it('parent children page renders the focus scope notice without crashing', () => {
    setFocus(true);
    expect(() => wrap(<ParentChildrenPage />)).not.toThrow();
    expect(screen.getAllByText(/Hanya tersedia untuk Matematika SD/i).length).toBeGreaterThan(0);
  });

  it('drops the notice when focus mode is disabled', () => {
    setFocus(false);
    wrap(<ParentDashboardPage />);
    expect(screen.queryByText(/Hanya tersedia untuk Matematika SD/i)).not.toBeInTheDocument();
  });
});
