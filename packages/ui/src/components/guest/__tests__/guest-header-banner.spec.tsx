import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../../../providers/i18n-provider';
import { GuestHeaderBanner } from '../guest-header-banner';

const wrap = (ui: React.ReactElement) => render(<I18nProvider defaultLocale="id">{ui}</I18nProvider>);

/**
 * Feature 011 / T121 (FR-030). When browser storage is unavailable (private /
 * incognito mode, or full quota), the guest can still complete a lesson
 * in-session and a persistent "kemajuan tidak tersimpan" notice is visible —
 * at every viewport, including the 320px portrait critical width.
 */
describe('GuestHeaderBanner — storage-unavailable notice (FR-030)', () => {
  it('shows a role="status" "kemajuan tidak tersimpan" notice when isIncognito', () => {
    wrap(<GuestHeaderBanner displayName="Budi" isIncognito />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/kemajuan tidak tersimpan/i);
    expect(status).toHaveTextContent(/mode penyamaran/i);
  });

  it('the notice has no lg-only / hidden class, so it is visible at 320px', () => {
    wrap(<GuestHeaderBanner displayName="Budi" isIncognito />);
    const status = screen.getByRole('status');
    expect(status.className).not.toMatch(/\bhidden\b/);
    expect(status.className).not.toMatch(/lg:flex/);
  });

  it('renders no such notice when storage is available', () => {
    wrap(<GuestHeaderBanner displayName="Budi" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
