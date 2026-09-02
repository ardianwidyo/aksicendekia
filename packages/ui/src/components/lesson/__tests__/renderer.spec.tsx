import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { I18nProvider } from '../../../providers/i18n-provider';
import { LessonContentRenderer, type RenderableBlock } from '../LessonContentRenderer';
import { InteractiveWidgetBlock } from '../blocks/InteractiveWidgetBlock';
import { IllustrationBlock } from '../blocks/IllustrationBlock';
import { RichTextBlock } from '../blocks/RichTextBlock';

const wrap = (ui: React.ReactElement) => render(<I18nProvider defaultLocale="id">{ui}</I18nProvider>);

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.stubGlobal('speechSynthesis', {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: () => [{ lang: 'id-ID' }],
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

describe('RichTextBlock — safe subset only', () => {
  it('renders headings/bold/list and never interprets raw HTML', () => {
    wrap(<RichTextBlock markdown={'## Judul\n- **tebal**\n<script>alert(1)</script>'} />);
    expect(screen.getByRole('heading', { level: 4, name: 'Judul' })).toBeInTheDocument();
    expect(screen.getByText('tebal').tagName).toBe('STRONG');
    // the angle-bracket text is shown literally, not executed
    expect(screen.getByText(/<script>alert\(1\)<\/script>/)).toBeInTheDocument();
  });
});

describe('RichTextBlock — additional safe-subset elements', () => {
  it('renders a level-1 heading, italic, inline code, and blank-line spacing', () => {
    wrap(<RichTextBlock markdown={'# Judul Utama\n\nTeks *miring* dan `kode`.'} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Judul Utama' })).toBeInTheDocument();
    expect(screen.getByText('miring').tagName).toBe('EM');
    expect(screen.getByText('kode').tagName).toBe('CODE');
  });
});

describe('IllustrationBlock — fallback on load error (FR-015)', () => {
  it('swaps to a text fallback when the image errors', () => {
    wrap(
      <IllustrationBlock imageUrl="/broken.svg" altText="Batang puluhan" fallbackText="Empat puluhan dan lima satuan." />,
    );
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('Empat puluhan dan lima satuan.')).toBeInTheDocument();
  });
});

describe('InteractiveWidgetBlock — graceful fallback (FR-009)', () => {
  it('renders the fallback for an unknown widget type', () => {
    wrap(<InteractiveWidgetBlock widgetType="MADE_UP" params={{}} fallbackNote="Lihat gambar di atas." />);
    expect(screen.getByRole('note')).toHaveTextContent('Lihat gambar di atas.');
  });

  it('renders the fallback when params fail the schema', () => {
    wrap(
      <InteractiveWidgetBlock
        widgetType="NUMBER_LINE_EXPLORER"
        params={{ min: 10, max: 0, step: 1, initial: 0 }}
      />,
    );
    expect(screen.getByRole('note')).toBeInTheDocument();
  });

  it('renders the real widget for valid params (lazy-loaded — T087)', async () => {
    wrap(
      <InteractiveWidgetBlock
        widgetType="NUMBER_LINE_EXPLORER"
        params={{ min: 0, max: 10, step: 1, initial: 2 }}
      />,
    );
    expect(await screen.findByRole('slider')).toBeInTheDocument();
  });
});

describe('LessonContentRenderer', () => {
  const blocks: RenderableBlock[] = [
    { id: 'b1', blockType: 'RICH_TEXT', payload: { markdown: 'Halo dunia' } },
    {
      id: 'b2',
      blockType: 'ANIMATION',
      payload: {
        animationId: 'count-objects',
        steps: [
          { atMs: 0, caption: 'Mulai', frame: 'f0' },
          { atMs: 500, caption: 'Selesai', frame: 'f1' },
        ],
        transcriptText: 'Menghitung tiga apel.',
      },
      narrationText: 'Ada berapa apel di keranjang?',
    },
    {
      id: 'b3',
      blockType: 'INTERACTIVE_WIDGET',
      payload: { widget: { widgetType: 'FRACTION_BAR_BUILDER', params: { denominator: 3 } } },
    },
  ];

  it('renders blocks in order with a listen control where narration exists', async () => {
    wrap(<LessonContentRenderer blocks={blocks} />);
    expect(screen.getByText('Halo dunia')).toBeInTheDocument();
    expect(screen.getByText('Mulai')).toBeInTheDocument(); // animation caption
    expect(screen.getByRole('button', { name: /Dengarkan/ })).toBeInTheDocument();
    // transcript is behind a disclosure
    await userEvent.click(screen.getByRole('button', { name: /Lihat transkrip/ }));
    expect(screen.getByText('Menghitung tiga apel.')).toBeInTheDocument();
  });

  it('fires onBlockInteract when a widget is used', async () => {
    const onBlockInteract = vi.fn();
    wrap(<LessonContentRenderer blocks={blocks} onBlockInteract={onBlockInteract} />);
    await screen.findAllByRole('button', { name: /^Bagian \d+$/ });
    const parts = screen.getAllByRole('button', { name: /^Bagian \d+$/ });
    await userEvent.click(parts[0]);
    expect(onBlockInteract).toHaveBeenCalledWith('b3');
  });

  it('has no axe violations', async () => {
    const { container } = wrap(<LessonContentRenderer blocks={blocks} />);
    // Let the lazy-loaded widget chunk (FRACTION_BAR_BUILDER) resolve before scanning.
    await screen.findAllByRole('button', { name: /^Bagian \d+$/ });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders a VIDEO block (slot exists for v1 even though seed lessons use ANIMATION)', () => {
    wrap(
      <LessonContentRenderer
        blocks={[
          {
            id: 'v1',
            blockType: 'VIDEO',
            payload: {
              title: 'Video contoh',
              videoUrl: '/assets/lessons/example.mp4',
              captionUrl: '/assets/lessons/example.vtt',
              transcriptText: 'Transkrip video contoh.',
              fallbackImageUrl: '/assets/lessons/fallback.svg',
            },
          },
        ]}
      />,
    );
    expect(screen.getByLabelText('Video contoh')).toBeInTheDocument();
  });

  it('passes through optional caption/fallback fields when authored', async () => {
    wrap(
      <LessonContentRenderer
        blocks={[
          {
            id: 'i1',
            blockType: 'ILLUSTRATION',
            payload: {
              imageUrl: '/x.svg',
              altText: 'Ilustrasi',
              caption: 'Keterangan gambar',
              fallbackText: 'Penjelasan cadangan',
            },
          },
          {
            id: 'w1',
            blockType: 'INTERACTIVE_WIDGET',
            payload: {
              widget: { widgetType: 'GHOST_WIDGET', params: {} },
              fallbackText: 'Widget cadangan teks',
            },
          },
        ]}
      />,
    );
    expect(screen.getByText('Keterangan gambar')).toBeInTheDocument();
    expect(await screen.findByText('Widget cadangan teks')).toBeInTheDocument();
  });

  it('renders nothing for an unrecognized blockType instead of throwing', () => {
    const { container } = wrap(
      <LessonContentRenderer blocks={[{ id: 'x1', blockType: 'SOMETHING_NEW' as never, payload: {} }]} />,
    );
    expect(container.querySelector('section')).toBeInTheDocument();
  });
});
