import { z } from 'zod';

/**
 * Third-party video embed rules — Feature 011 / Constitution VI v1.2.0
 * "Pengecualian Tunggal — Video Edukasi Tersemat" / data-model.md §3.
 *
 * `externalId` (not a full URL) is the load-bearing choice here: the
 * nocookie playback URL is composed by the component from this id, so no
 * caller can bypass the privacy-mode variant by supplying its own URL.
 */

export const VIDEO_PROVIDERS = ['YOUTUBE'] as const;
export type VideoProvider = (typeof VIDEO_PROVIDERS)[number];

/** YouTube video ids are exactly 11 chars of [A-Za-z0-9_-]. */
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export const videoEmbedRefSchema = z.object({
  id: z.string().min(1),
  provider: z.enum(VIDEO_PROVIDERS),
  externalId: z
    .string()
    .regex(YOUTUBE_ID_PATTERN, 'externalId harus id video (11 char), bukan URL.'),
  title: z.string().min(1),
  publisherName: z.string().min(1),
  durationSeconds: z.number().int().positive().optional(),
  posterStorageKey: z
    .string()
    .min(1)
    .refine((v) => !/^(https?:)?\/\//i.test(v), {
      message: 'posterStorageKey harus relatif — pratinjau video WAJIB self-hosted.',
    })
    .refine((v) => v.startsWith('assets/lessons/sd/'), {
      message: 'posterStorageKey harus berada di bawah assets/lessons/sd/.',
    }),
  transcriptText: z.string().min(1),
  verifiedAt: z.string().min(1),
  reviewedBy: z.string().min(1).optional(),
  reviewNote: z.string().optional(),
});

export type VideoEmbedRef = z.infer<typeof videoEmbedRefSchema>;

/** Composes the privacy-mode playback URL — the only place a URL is built. */
export function toNoCookieEmbedUrl(externalId: string): string {
  return `https://www.youtube-nocookie.com/embed/${externalId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
}

/**
 * The Embedded Media Gate (Constitution VI v1.2.0 §5, contracts/video-embed.md).
 * A lesson with a `VideoEmbedRef` block cannot reach `PUBLISHED` unless this
 * passes — the six constitutional conditions collapse to two checkable facts
 * on the ref itself (the rest are enforced by the schema/component, not by
 * data present at publish time).
 */
export function embeddedMediaGateReasons(ref: VideoEmbedRef): string[] {
  const reasons: string[] = [];
  if (!ref.reviewedBy) {
    reasons.push('Video belum ditinjau manusia (reviewedBy kosong) — Konstitusi VI butir 5.');
  }
  if (!ref.verifiedAt) {
    reasons.push('Video belum diverifikasi tautannya (verifiedAt kosong) — Konstitusi VI butir 5.');
  }
  return reasons;
}
