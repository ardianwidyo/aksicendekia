import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { INTERACTIVE_LESSONS, type LessonBlockInput } from '@aksicendekia/content-kit';
import { I18nProvider } from '../../../providers/i18n-provider';
import { LessonContentRenderer, type RenderableBlock } from '../LessonContentRenderer';
import { EmbeddedVideoBlock } from '../blocks/EmbeddedVideoBlock';
import { PlaceValueBlocks } from '../../illustration/PlaceValueBlocks';
import { NumberLineStrip } from '../../illustration/NumberLineStrip';
import { FractionShape } from '../../illustration/FractionShape';
import { ArrayGrid } from '../../illustration/ArrayGrid';
import { ShapeFigure } from '../../illustration/ShapeFigure';
import { BarChartMini } from '../../illustration/BarChartMini';
import { ClockFace } from '../../illustration/ClockFace';
import { MoneyStack } from '../../illustration/MoneyStack';
import { PatternRow } from '../../illustration/PatternRow';
import { MeasureRuler } from '../../illustration/MeasureRuler';

/**
 * Feature 010 / T085 (SC-005). Scans all 12 seeded lessons through the exact
 * renderer students see. Relocated from the path named in tasks.md
 * (packages/content-kit/.../a11y-scan.spec.tsx) to packages/ui: content-kit is
 * deliberately React/jsdom-free (see packages/content-kit/src/index.ts) so both
 * apps/web (static export) and apps/api (seed/grading) can import it without a UI
 * runtime — pulling LessonContentRenderer into a content-kit test would require
 * content-kit to depend on packages/ui, inverting that intentional boundary.
 * packages/ui already depends on content-kit at runtime, so scanning here is the
 * non-circular direction.
 */

const wrap = (ui: React.ReactElement) => render(<I18nProvider defaultLocale="id">{ui}</I18nProvider>);

beforeEach(() => {
  vi.stubGlobal('speechSynthesis', {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: () => [{ lang: 'id-ID' }],
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});

function toRenderableBlocks(blocks: LessonBlockInput[]): RenderableBlock[] {
  return blocks.map((b, i) => {
    const payload: Record<string, unknown> = { ...b.payload };
    if (b.altText) payload.altText = b.altText;
    if (b.transcriptText) payload.transcriptText = b.transcriptText;
    if (b.mediaStorageKey) payload.imageUrl = payload.videoUrl = `/${b.mediaStorageKey}`;
    if (b.captionStorageKey) payload.captionUrl = `/${b.captionStorageKey}`;
    if (b.fallbackStorageKey) {
      payload.fallbackImageUrl = payload.fallbackText = `/${b.fallbackStorageKey}`;
    }
    if (b.blockType === 'INTERACTIVE_WIDGET') {
      payload.widget = b.payload;
    }
    return {
      id: `b${i}`,
      blockType: b.blockType,
      payload,
      narrationText: b.narrationText ?? null,
    };
  });
}

describe('a11y scan — all seeded interactive lessons (SC-005)', () => {
  it('covers 69 lessons (3 TK + 60 SD + 3 SMP + 3 SMA)', () => {
    expect(INTERACTIVE_LESSONS).toHaveLength(69);
  });

  it.each(INTERACTIVE_LESSONS.map((l) => [l.id, l] as const))(
    'lesson %s has zero axe violations through LessonContentRenderer',
    async (_id, lesson) => {
      const blocks = toRenderableBlocks(lesson.contentBlocks);
      const { container } = wrap(<LessonContentRenderer blocks={blocks} />);

      // Let any React.lazy widget chunks resolve before scanning.
      await waitFor(() => {
        expect(container.querySelectorAll('.animate-pulse')).toHaveLength(0);
      });

      expect(await axe(container)).toHaveNoViolations();
    },
  );
});

/**
 * Feature 011 / T091 (SC-005). The 10 viewBox-responsive illustration primitives
 * and the EmbeddedVideoBlock facade — scanned directly, not just through a lesson.
 */
const illustrationCases: Array<[string, React.ReactElement]> = [
  ['PlaceValueBlocks', <PlaceValueBlocks title="Nilai tempat 45" tens={4} ones={5} />],
  ['NumberLineStrip', <NumberLineStrip title="Garis bilangan 0-10" min={0} max={10} highlightValues={[7]} />],
  ['FractionShape', <FractionShape title="Tiga per empat" numerator={3} denominator={4} />],
  ['ArrayGrid', <ArrayGrid title="3 baris 4 kolom" rows={3} cols={4} />],
  ['ShapeFigure', <ShapeFigure title="Segitiga" shape="segitiga" />],
  ['BarChartMini', <BarChartMini title="Buah favorit" data={[{ label: 'Apel', value: 5 }, { label: 'Jeruk', value: 3 }]} />],
  ['ClockFace', <ClockFace title="Pukul 3:30" hour={3} minute={30} />],
  ['MoneyStack', <MoneyStack title="Uang kertas" denominations={[{ value: 2000, count: 3 }]} />],
  ['PatternRow', <PatternRow title="Pola bentuk" items={['circle', 'square', 'circle']} highlightIndex={2} />],
  ['MeasureRuler', <MeasureRuler title="Panjang pensil" lengthUnits={4} unitLabel="cm" />],
];

describe('a11y scan — illustration primitives + EmbeddedVideoBlock (T091)', () => {
  it.each(illustrationCases)('%s has zero axe violations', async (_name, element) => {
    const { container } = wrap(element);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('EmbeddedVideoBlock (State 1) has zero axe violations', async () => {
    const { container } = wrap(
      <EmbeddedVideoBlock
        title="Video Pecahan"
        externalId="dQw4w9WgXcQ"
        publisherName="Contoh Edukasi"
        posterImageUrl="/assets/lessons/sd/kelas-4/x-poster.svg"
        transcriptText="Transkrip video dalam Bahasa Indonesia."
        durationSeconds={240}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
