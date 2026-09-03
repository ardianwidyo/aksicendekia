import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider, LessonContentRenderer, type RenderableBlock } from '@aksicendekia/ui';
import { getInteractiveLesson } from '@/lib/guest-lessons';
import { toRenderableBlocks } from '../LessonDetailClient';

/**
 * Feature 011 / T119 (US5, SC-011, Constitution VI v1.2.0 butir 2). On the guest
 * lesson path, NO third-party (YouTube / ytimg / google) request may fire until
 * the user presses the video play button. The embedded-video facade renders a
 * self-hosted poster only; the nocookie iframe appears solely after activation.
 */
const THIRD_PARTY = /youtube|youtube-nocookie|ytimg|google|gstatic|doubleclick/i;

let fetchSpy: any;
let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  fetchSpy = vi.fn(async () => new Response('{}', { status: 200 }));
  globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

function thirdPartyHrefsInDom(): string[] {
  const hits: string[] = [];
  document.querySelectorAll('[src],[href]').forEach((el) => {
    const url = el.getAttribute('src') ?? el.getAttribute('href') ?? '';
    if (THIRD_PARTY.test(url)) hits.push(`${el.tagName}:${url}`);
  });
  return hits;
}

function fetchCallsToThirdParty(): string[] {
  return fetchSpy.mock.calls
    .map((c: any[]) => String(c[0]))
    .filter((u: string) => THIRD_PARTY.test(u));
}

describe('guest lesson path — no third-party request before video play', () => {
  it('renders a full SD lesson with an embedded video and hits no third-party origin', () => {
    const lesson = getInteractiveLesson('sd-mtk-k4-04')!;
    const blocks = toRenderableBlocks(lesson.contentBlocks as unknown as any[]) as RenderableBlock[];

    render(
      <I18nProvider defaultLocale="id">
        <LessonContentRenderer blocks={blocks} />
      </I18nProvider>,
    );

    expect(document.querySelector('iframe')).toBeNull();
    expect(thirdPartyHrefsInDom()).toEqual([]);
    expect(fetchCallsToThirdParty()).toEqual([]);
  });

  it('a real embed id loads exactly one nocookie iframe only after the play button is pressed', () => {
    render(
      <I18nProvider defaultLocale="id">
        <LessonContentRenderer
          blocks={[
            {
              id: 'v0',
              blockType: 'VIDEO',
              payload: {
                title: 'Video Pecahan',
                videoEmbed: {
                  provider: 'YOUTUBE',
                  externalId: 'dQw4w9WgXcQ',
                  title: 'Video Pecahan',
                  publisherName: 'Contoh Edukasi',
                  posterUrl: '/assets/lessons/sd/kelas-4/x-poster.svg',
                  transcriptText: 'Transkrip.',
                  durationSeconds: 200,
                },
              },
              narrationText: null,
            } as RenderableBlock,
          ]}
        />
      </I18nProvider>,
    );

    expect(document.querySelector('iframe')).toBeNull();
    expect(fetchCallsToThirdParty()).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: /putar video pecahan/i }));

    const iframe = document.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute('src')).toMatch(/youtube-nocookie\.com\/embed\//);
    expect(fetchCallsToThirdParty()).toEqual([]);
  });

  it('the current SD lesson uses an authoring-placeholder id — it shows a "coming soon" card, never an iframe', () => {
    const lesson = getInteractiveLesson('sd-mtk-k4-04')!;
    const blocks = toRenderableBlocks(lesson.contentBlocks as unknown as any[]) as RenderableBlock[];

    render(
      <I18nProvider defaultLocale="id">
        <LessonContentRenderer blocks={blocks} />
      </I18nProvider>,
    );

    expect(screen.getByText(/segera tersedia/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /putar video/i })).not.toBeInTheDocument();
    expect(document.querySelector('iframe')).toBeNull();
    expect(fetchCallsToThirdParty()).toEqual([]);
  });
});
