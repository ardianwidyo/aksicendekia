import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { I18nProvider } from '../../../providers/i18n-provider';
import { IllustrationBlock } from '../blocks/IllustrationBlock';
import { VideoBlock } from '../blocks/VideoBlock';
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
