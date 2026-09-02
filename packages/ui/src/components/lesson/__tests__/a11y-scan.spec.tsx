import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { INTERACTIVE_LESSONS, type LessonBlockInput } from '@aksicendekia/content-kit';
import { I18nProvider } from '../../../providers/i18n-provider';
import { LessonContentRenderer, type RenderableBlock } from '../LessonContentRenderer';

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

describe('a11y scan — all 12 seeded interactive lessons (SC-005)', () => {
  it('covers exactly 12 lessons', () => {
    expect(INTERACTIVE_LESSONS).toHaveLength(12);
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
