import { describe, it, expect } from 'vitest';
import { mediaAssetSchema } from '../media-asset.schema';
import { contentBlockSchema, contentBlockPayloadSchema } from '../content-block.schema';
import { interactiveWidgetInstanceSchema, widgetParamsSchemaFor } from '../widget-params.schema';
import {
  videoEmbedRefSchema,
  toNoCookieEmbedUrl,
  embeddedMediaGateReasons,
  type VideoEmbedRef,
} from '../video-embed.schema';

describe('mediaAssetSchema', () => {
  const base = { id: 'a1', kind: 'IMAGE' as const, storageKey: 'assets/x.svg', mimeType: 'image/svg+xml', byteSize: 1024, altText: 'x' };

  it('accepts a valid self-hosted image with alt text', () => {
    expect(mediaAssetSchema.safeParse(base).success).toBe(true);
  });

  it('rejects an absolute-URL storageKey (anti-hotlink)', () => {
    expect(mediaAssetSchema.safeParse({ ...base, storageKey: 'https://cdn.example.com/x.svg' }).success).toBe(false);
    expect(mediaAssetSchema.safeParse({ ...base, storageKey: '//cdn/x.svg' }).success).toBe(false);
  });

  it('rejects a disallowed mime type for the kind', () => {
    expect(mediaAssetSchema.safeParse({ ...base, mimeType: 'image/gif' }).success).toBe(false);
  });

  it('rejects oversized image and missing alt text', () => {
    expect(mediaAssetSchema.safeParse({ ...base, byteSize: 2_000_000 }).success).toBe(false);
    const { altText, ...noAlt } = base;
    expect(mediaAssetSchema.safeParse(noAlt).success).toBe(false);
  });

  it('enforces audio duration cap', () => {
    const audio = { id: 'a2', kind: 'AUDIO' as const, storageKey: 'assets/n.mp3', mimeType: 'audio/mpeg', byteSize: 1000, durationSeconds: 90 };
    expect(mediaAssetSchema.safeParse(audio).success).toBe(false);
  });
});

describe('contentBlockPayloadSchema (discriminated union)', () => {
  it('ILLUSTRATION requires mediaAssetId + altText', () => {
    expect(contentBlockPayloadSchema.safeParse({ blockType: 'ILLUSTRATION', mediaAssetId: 'm1', altText: 'x' }).success).toBe(true);
    expect(contentBlockPayloadSchema.safeParse({ blockType: 'ILLUSTRATION', mediaAssetId: 'm1' }).success).toBe(false);
  });

  it('ANIMATION requires transcriptText + fallbackAssetId + closed animationId', () => {
    const ok = {
      blockType: 'ANIMATION',
      animationId: 'place-value-split',
      steps: [{ atMs: 0, caption: 'c', frame: 'f' }],
      transcriptText: 't',
      fallbackAssetId: 'f1',
    };
    expect(contentBlockPayloadSchema.safeParse(ok).success).toBe(true);
    expect(contentBlockPayloadSchema.safeParse({ ...ok, animationId: 'made-up' }).success).toBe(false);
    expect(contentBlockPayloadSchema.safeParse({ ...ok, transcriptText: undefined }).success).toBe(false);
  });

  it('INTERACTIVE_WIDGET validates nested widget params', () => {
    const block = contentBlockSchema.safeParse({
      id: 'b1',
      orderIndex: 0,
      payload: {
        blockType: 'INTERACTIVE_WIDGET',
        widget: { widgetType: 'NUMBER_LINE_EXPLORER', params: { min: 0, max: 10, step: 1, initial: 0 } },
      },
    });
    expect(block.success).toBe(true);
  });

  it('INTERACTIVE_WIDGET rejects params that break the widget schema', () => {
    const bad = interactiveWidgetInstanceSchema.safeParse({
      widgetType: 'NUMBER_LINE_EXPLORER',
      params: { min: 10, max: 0, step: 1, initial: 0 }, // max < min
    });
    expect(bad.success).toBe(false);
  });
});

describe('widgetParamsSchemaFor', () => {
  it('resolves each of the 7 ids and rejects unknown', () => {
    for (const id of ['STEP_REVEAL', 'PARAMETER_EXPLORER', 'NUMBER_LINE_EXPLORER', 'FRACTION_BAR_BUILDER', 'IMAGE_HOTSPOT', 'SORT_INTO_GROUPS', 'ANIMATED_WORKED_EXAMPLE']) {
      expect(widgetParamsSchemaFor(id)).toBeDefined();
    }
    expect(widgetParamsSchemaFor('NOPE')).toBeUndefined();
  });

  it('NUMBER_LINE_EXPLORER enforces (max-min)/step <= 100', () => {
    const schema = widgetParamsSchemaFor('NUMBER_LINE_EXPLORER')!;
    expect(schema.safeParse({ min: 0, max: 10, step: 1, initial: 0 }).success).toBe(true);
    expect(schema.safeParse({ min: 0, max: 1000, step: 1, initial: 0 }).success).toBe(false);
  });
});

describe('videoEmbedRefSchema (Feature 011 / Constitution VI v1.2.0)', () => {
  const base: VideoEmbedRef = {
    id: 'yt-sd4-pecahan-01',
    provider: 'YOUTUBE',
    externalId: 'dQw4w9WgXcQ',
    title: 'Mengenal Pecahan',
    publisherName: 'Contoh Edukasi',
    posterStorageKey: 'assets/lessons/sd/kelas-4/pecahan-01-poster.svg',
    transcriptText: 'Transkrip video dalam Bahasa Indonesia.',
    verifiedAt: '2026-09-02',
    reviewedBy: 'guru.penunjuk@aksicendekia.id',
  };

  it('accepts a valid embed ref', () => {
    expect(videoEmbedRefSchema.safeParse(base).success).toBe(true);
  });

  it('rejects externalId that looks like a URL instead of an 11-char id', () => {
    expect(
      videoEmbedRefSchema.safeParse({ ...base, externalId: 'https://youtu.be/dQw4w9WgXcQ' }).success,
    ).toBe(false);
    expect(videoEmbedRefSchema.safeParse({ ...base, externalId: 'too-short' }).success).toBe(false);
  });

  it('rejects an absolute-URL or off-tree posterStorageKey (anti-hotlink)', () => {
    expect(
      videoEmbedRefSchema.safeParse({ ...base, posterStorageKey: 'https://i.ytimg.com/vi/x/hq.jpg' })
        .success,
    ).toBe(false);
    expect(
      videoEmbedRefSchema.safeParse({ ...base, posterStorageKey: 'assets/other/x.svg' }).success,
    ).toBe(false);
  });

  it('rejects a provider other than YOUTUBE', () => {
    expect(videoEmbedRefSchema.safeParse({ ...base, provider: 'VIMEO' }).success).toBe(false);
  });

  it('toNoCookieEmbedUrl composes a youtube-nocookie.com URL from the id alone', () => {
    const url = toNoCookieEmbedUrl(base.externalId);
    expect(url.startsWith('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe(true);
    expect(url).not.toContain('youtube.com/watch');
  });

  it('embeddedMediaGateReasons is empty once reviewed and verified', () => {
    expect(embeddedMediaGateReasons(base)).toEqual([]);
  });

  it('embeddedMediaGateReasons blocks publish when unreviewed or unverified', () => {
    const { reviewedBy, ...unreviewed } = base;
    expect(embeddedMediaGateReasons(unreviewed as VideoEmbedRef).length).toBeGreaterThan(0);
    expect(embeddedMediaGateReasons({ ...base, verifiedAt: '' }).length).toBeGreaterThan(0);
  });
});
