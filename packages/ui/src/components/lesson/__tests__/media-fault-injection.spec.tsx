import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { I18nProvider } from '../../../providers/i18n-provider';
import { IllustrationBlock } from '../blocks/IllustrationBlock';
import { VideoBlock } from '../blocks/VideoBlock';
import { EmbeddedVideoBlock } from '../blocks/EmbeddedVideoBlock';
import { MediaFallback } from '../MediaFallback';

const wrap = (ui: React.ReactElement) => render(<I18nProvider defaultLocale="id">{ui}</I18nProvider>);

/**
 * Feature 010 / T083 (SC-009). A 404'd or otherwise-unavailable media asset must
 * never strand the student mid-lesson — every block that loads a network asset
 * swaps to MediaFallback's text explanation, keeping the lesson completable.
 */
describe('IllustrationBlock — 404/storage failure falls back to text (SC-009)', () => {
  it('swaps to MediaFallback text on <img> error, keeping the concept explained', () => {
    wrap(
      <IllustrationBlock
        imageUrl="/assets/lessons/does-not-exist.svg"
        altText="Batang puluhan dan satuan"
        fallbackText="Empat puluhan dan lima satuan membentuk angka 45."
      />,
    );
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('Empat puluhan dan lima satuan membentuk angka 45.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('falls back to the altText when no explicit fallbackText is authored', () => {
    wrap(<IllustrationBlock imageUrl="/broken.svg" altText="Dua apel di atas meja" />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('Dua apel di atas meja')).toBeInTheDocument();
  });
});

describe('VideoBlock — 404/storage failure falls back to transcript text (SC-009)', () => {
  it('swaps to MediaFallback on <video> error, keeping the transcript readable', () => {
    wrap(
      <VideoBlock
        title="Video penjumlahan"
        videoUrl="/assets/lessons/missing.mp4"
        captionUrl="/assets/lessons/missing.vtt"
        transcriptText="Langkah 1: jumlahkan satuan. Langkah 2: jumlahkan puluhan."
      />,
    );
    fireEvent.error(screen.getByLabelText('Video penjumlahan'));
    expect(
      screen.getByText('Langkah 1: jumlahkan satuan. Langkah 2: jumlahkan puluhan.'),
    ).toBeInTheDocument();
  });

  it('shows a fallback illustration when one is provided', () => {
    wrap(
      <VideoBlock
        title="Video"
        videoUrl="/missing.mp4"
        captionUrl="/missing.vtt"
        transcriptText="Penjelasan teks."
        fallbackImageUrl="/assets/lessons/fallback.svg"
        fallbackAlt="Ilustrasi cadangan"
      />,
    );
    fireEvent.error(screen.getByLabelText('Video'));
    expect(screen.getByAltText('Ilustrasi cadangan')).toBeInTheDocument();
  });
});

/**
 * Feature 011 / T089 (FR-015). A blocked or removed embedded video must never
 * strand the student: the Bahasa Indonesia transcript is always in the DOM, and
 * the paired self-hosted animation carries the same concept.
 */
describe('EmbeddedVideoBlock — blocked / removed embed keeps the lesson completable', () => {
  const props = {
    title: 'Video Pecahan',
    externalId: 'dQw4w9WgXcQ',
    publisherName: 'Contoh Edukasi',
    posterImageUrl: '/assets/lessons/sd/kelas-4/missing-poster.svg',
    transcriptText: 'Pecahan adalah bagian yang sama besar dari keseluruhan.',
  };

  it('shows the transcript even when the poster image 404s', () => {
    wrap(<EmbeddedVideoBlock {...props} />);
    fireEvent.error(screen.getByRole('img', { hidden: true }));
    expect(screen.getByText(props.transcriptText)).toBeInTheDocument();
  });

  it('keeps the transcript readable after activation (iframe present but content-blocked)', () => {
    wrap(<EmbeddedVideoBlock {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /putar video pecahan/i }));
    // Even if the iframe never loads (CSP / network block), the text equivalent stays.
    expect(screen.getByText(props.transcriptText)).toBeInTheDocument();
  });

  it('never removes the transcript from the DOM in any state', () => {
    const { rerender } = wrap(<EmbeddedVideoBlock {...props} />);
    expect(screen.getByText(props.transcriptText)).toBeInTheDocument();
    rerender(
      <I18nProvider defaultLocale="id">
        <EmbeddedVideoBlock {...props} transcriptText={props.transcriptText} />
      </I18nProvider>,
    );
    expect(screen.getByText(props.transcriptText)).toBeInTheDocument();
  });
});

describe('MediaFallback — accessible in both text-only and illustrated form', () => {
  it('has no axe violations without a fallback image', async () => {
    const { container } = wrap(<MediaFallback text="Penjelasan teks pengganti." />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations with a fallback image', async () => {
    const { container } = wrap(
      <MediaFallback text="Penjelasan teks." fallbackImageUrl="/x.svg" fallbackAlt="Ilustrasi" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
