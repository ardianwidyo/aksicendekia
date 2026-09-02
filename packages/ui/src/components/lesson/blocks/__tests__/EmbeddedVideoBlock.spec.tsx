import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../../../../providers/i18n-provider';
import { EmbeddedVideoBlock } from '../EmbeddedVideoBlock';

/**
 * Feature 011 / Constitution VI v1.2.0, contracts/video-embed.md.
 * T017 — written before EmbeddedVideoBlock.tsx exists — must fail first (Constitution III).
 *
 * These assertions ARE the Embedded Media Gate's automated proof, not decoration:
 * a facade that fails State 1 silently violates the constitutional exception.
 */

const wrap = (ui: React.ReactElement) => render(<I18nProvider defaultLocale="id">{ui}</I18nProvider>);

const baseProps = {
  title: 'Mengenal Pecahan',
  externalId: 'dQw4w9WgXcQ',
  publisherName: 'Contoh Edukasi',
  posterImageUrl: '/assets/lessons/sd/kelas-4/pecahan-01-poster.svg',
  transcriptText: 'Transkrip video dalam Bahasa Indonesia.',
  durationSeconds: 240,
};

describe('EmbeddedVideoBlock — State 1 (before activation)', () => {
  it('renders a self-hosted poster and a play button, with no iframe in the DOM', () => {
    wrap(<EmbeddedVideoBlock {...baseProps} />);
    expect(screen.queryByTitle(/mengenal pecahan/i)).not.toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
    const poster = screen.getByRole('img', { hidden: true });
    expect(poster.getAttribute('src')).toBe(baseProps.posterImageUrl);
  });

  it('never references a third-party domain before activation', () => {
    const { container } = wrap(<EmbeddedVideoBlock {...baseProps} />);
    expect(container.innerHTML).not.toMatch(/youtube|ytimg|google/i);
  });

  it('exposes a keyboard-operable play button sized for touch (>=44px via class hook)', () => {
    wrap(<EmbeddedVideoBlock {...baseProps} />);
    const button = screen.getByRole('button', { name: /putar mengenal pecahan/i });
    expect(button).toHaveAttribute('aria-label');
    expect(button.className).toMatch(/min-h-\[44px\]|h-11|min-w-\[44px\]|w-11/);
  });

  it('shows the transcript regardless of activation state', () => {
    wrap(<EmbeddedVideoBlock {...baseProps} />);
    expect(screen.getByText(baseProps.transcriptText)).toBeInTheDocument();
  });
});

describe('EmbeddedVideoBlock — State 2 (after activation)', () => {
  it('inserts exactly one iframe pointed at youtube-nocookie.com, composed from externalId', () => {
    wrap(<EmbeddedVideoBlock {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /putar mengenal pecahan/i }));
    const iframes = document.querySelectorAll('iframe');
    expect(iframes).toHaveLength(1);
    const src = iframes[0]!.getAttribute('src') ?? '';
    expect(src.startsWith('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe(true);
    expect(src).not.toContain('youtube.com/watch');
  });

  it('never passes an identity/progress query parameter to the embed', () => {
    wrap(<EmbeddedVideoBlock {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /putar mengenal pecahan/i }));
    const src = document.querySelector('iframe')!.getAttribute('src') ?? '';
    expect(src).not.toMatch(/user|student|progress|session|token/i);
  });

  it('activates on Enter as well as click (keyboard-operable)', () => {
    wrap(<EmbeddedVideoBlock {...baseProps} />);
    const button = screen.getByRole('button', { name: /putar mengenal pecahan/i });
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    expect(document.querySelector('iframe')).not.toBeNull();
  });
});
