import { z } from 'zod';

/**
 * Media asset rules — Feature 010 / FR-003, FR-005 / data-model.md §3.1.
 * Everything platform-hosted; third-party hotlinks rejected at the boundary.
 */

export const MEDIA_ASSET_KINDS = [
  'IMAGE',
  'ANIMATION',
  'VIDEO',
  'AUDIO',
  'CAPTION',
  'TRANSCRIPT',
] as const;
export type MediaAssetKind = (typeof MEDIA_ASSET_KINDS)[number];

/** Allowed MIME types per kind. */
export const ALLOWED_MIME_BY_KIND: Record<MediaAssetKind, readonly string[]> = {
  IMAGE: ['image/svg+xml', 'image/png', 'image/webp', 'image/jpeg'],
  ANIMATION: ['image/svg+xml'],
  VIDEO: ['video/mp4', 'video/webm'],
  AUDIO: ['audio/mpeg', 'audio/ogg', 'audio/wav'],
  CAPTION: ['text/vtt'],
  TRANSCRIPT: ['text/plain', 'text/markdown'],
};

/** Max byte size per kind. */
export const MAX_BYTES_BY_KIND: Record<MediaAssetKind, number> = {
  IMAGE: 512 * 1024,
  ANIMATION: 512 * 1024,
  VIDEO: 20 * 1024 * 1024,
  AUDIO: 2 * 1024 * 1024,
  CAPTION: 256 * 1024,
  TRANSCRIPT: 256 * 1024,
};

/** Max duration (seconds) where it applies. */
export const MAX_DURATION_BY_KIND: Partial<Record<MediaAssetKind, number>> = {
  VIDEO: 180,
  AUDIO: 60,
};

/** A relative storage key — never an absolute URL, never protocol-relative. */
export const storageKeySchema = z
  .string()
  .min(1)
  .refine((v) => !/^(https?:)?\/\//i.test(v), {
    message: 'storageKey harus relatif — hotlink pihak ketiga ditolak (FR-003).',
  });

export const mediaAssetSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(MEDIA_ASSET_KINDS),
    storageKey: storageKeySchema,
    mimeType: z.string().min(1),
    byteSize: z.number().int().nonnegative(),
    widthPx: z.number().int().positive().optional(),
    heightPx: z.number().int().positive().optional(),
    durationSeconds: z.number().int().positive().optional(),
    altText: z.string().min(1).optional(),
    licenseNote: z.string().optional(),
    attribution: z.string().optional(),
  })
  .superRefine((asset, ctx) => {
    const allowed = ALLOWED_MIME_BY_KIND[asset.kind];
    if (!allowed.includes(asset.mimeType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mimeType'],
        message: `mimeType "${asset.mimeType}" tidak diizinkan untuk kind ${asset.kind}.`,
      });
    }
    if (asset.byteSize > MAX_BYTES_BY_KIND[asset.kind]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['byteSize'],
        message: `Ukuran berkas melebihi batas untuk kind ${asset.kind}.`,
      });
    }
    const maxDuration = MAX_DURATION_BY_KIND[asset.kind];
    if (maxDuration !== undefined && (asset.durationSeconds ?? 0) > maxDuration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['durationSeconds'],
        message: `Durasi melebihi ${maxDuration} detik untuk kind ${asset.kind}.`,
      });
    }
    if (asset.kind === 'IMAGE' && !asset.altText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['altText'],
        message: 'Ilustrasi/gambar wajib memiliki teks alternatif (FR-004).',
      });
    }
  });

export type MediaAsset = z.infer<typeof mediaAssetSchema>;

/** Reference to an asset as embedded in a public lesson payload. */
export const mediaRefSchema = z.object({
  id: z.string().min(1),
  storageKey: storageKeySchema,
  mimeType: z.string().min(1),
  byteSize: z.number().int().nonnegative().optional(),
  altText: z.string().nullable().optional(),
  durationSeconds: z.number().int().positive().nullable().optional(),
});
export type MediaRef = z.infer<typeof mediaRefSchema>;
