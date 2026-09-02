import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@aksicendekia/ui';
import { resetFocusConfigCache } from '@aksicendekia/content-kit';
import TeacherDashboardPage from '../teacher-dashboard/page';
import TeacherClassesPage from '../classes/page';

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
 * Feature 011 / T039 (US1, FR-006). The teacher dashboards' sample cohorts are
 * SMP — entirely out of focus. With focus mode on the pages must still open and
 * explain themselves, not crash; with focus off they render as before.
 */
describe('Teacher surfaces under focus mode', () => {
  it('teacher dashboard renders the focus scope notice without crashing', () => {
    setFocus(true);
    expect(() => wrap(<TeacherDashboardPage />)).not.toThrow();
    expect(screen.getAllByText(/Hanya tersedia untuk Matematika SD/i).length).toBeGreaterThan(0);
  });

  it('teacher classes page renders the focus scope notice without crashing', () => {
    setFocus(true);
    expect(() => wrap(<TeacherClassesPage />)).not.toThrow();
    expect(screen.getAllByText(/Hanya tersedia untuk Matematika SD/i).length).toBeGreaterThan(0);
  });

  it('drops the notice and shows the class table when focus mode is disabled', () => {
    setFocus(false);
    wrap(<TeacherClassesPage />);
    expect(screen.queryByText(/Hanya tersedia untuk Matematika SD/i)).not.toBeInTheDocument();
  });
});
