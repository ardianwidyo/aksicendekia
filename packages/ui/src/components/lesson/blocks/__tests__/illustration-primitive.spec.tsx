import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { I18nProvider } from '../../../../providers/i18n-provider';
import { IllustrationBlock } from '../IllustrationBlock';
import { EmbeddedVideoBlock } from '../EmbeddedVideoBlock';

const wrap = (ui: React.ReactElement) => render(<I18nProvider defaultLocale="id">{ui}</I18nProvider>);

/**
 * Feature 011 fix — the concept ILLUSTRATION renders a real parametric primitive
 * (an actual number line / array / clock), not a placeholder SVG that prints its
 * own file slug.
 */
describe('IllustrationBlock — parametric primitive', () => {
  it('renders the primitive component (an <svg role="img">) instead of the fallback image', () => {
    wrap(
      <IllustrationBlock
        imageUrl="/assets/lessons/sd/kelas-4/x-fig.svg"
        altText="Garis bilangan"
        caption="Garis bilangan 0–100"
        primitive={{ name: 'NumberLineStrip', props: { title: 'Garis bilangan 0–100', min: 0, max: 100, step: 10, highlightValues: [30, 70] } }}
      />,
    );
    const svg = screen.getByRole('img', { name: /garis bilangan/i });
    expect(svg.tagName.toLowerCase()).toBe('svg');
    // no <img> fallback in the DOM when the primitive renders
    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('figcaption')?.textContent).toBe('Garis bilangan 0–100');
  });

  it('falls back to the <img> when the primitive name is unknown', () => {
    wrap(
      <IllustrationBlock
        imageUrl="/x.svg"
        altText="Cadangan"
        primitive={{ name: 'NotARealPrimitive', props: {} }}
      />,
    );
    expect(screen.getByRole('img', { name: 'Cadangan' }).tagName.toLowerCase()).toBe('img');
  });

  it('has no axe violations', async () => {
    const { container } = wrap(
      <IllustrationBlock
        imageUrl="/x.svg"
        altText="Larik 3 x 4"
        primitive={{ name: 'ArrayGrid', props: { title: '3 baris x 4 kolom', rows: 3, cols: 4 } }}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

/**
 * Feature 011 fix — an authoring-placeholder video id must not load a broken
 * YouTube player ("Error 153"). Show a calm "coming soon" state instead.
 */
describe('EmbeddedVideoBlock — authoring placeholder id', () => {
  const placeholder = {
    title: 'Video: Perkalian',
    externalId: 'sd-mtk-k4-0', // T083 placeholder shape
    publisherName: 'AksiCendekia Studio',
    posterImageUrl: '/assets/lessons/sd/kelas-4/x-poster.svg',
    transcriptText: 'Ringkasan video perkalian bersusun.',
    durationSeconds: 180,
  };

  it('renders a "coming soon" state — no iframe, no play button', () => {
    wrap(<EmbeddedVideoBlock {...placeholder} />);
    expect(document.querySelector('iframe')).toBeNull();
    expect(screen.queryByRole('button', { name: /putar/i })).not.toBeInTheDocument();
    expect(screen.getByText(/segera tersedia/i)).toBeInTheDocument();
    expect(screen.getByText(placeholder.transcriptText)).toBeInTheDocument();
  });

  it('a real 11-char id still renders the normal poster + play button', () => {
    wrap(<EmbeddedVideoBlock {...placeholder} externalId="dQw4w9WgXcQ" />);
    expect(screen.getByRole('button', { name: /putar video: perkalian/i })).toBeInTheDocument();
    expect(screen.queryByText(/segera tersedia/i)).not.toBeInTheDocument();
  });
});
