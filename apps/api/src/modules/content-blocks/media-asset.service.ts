import { randomUUID } from "crypto";
import { mediaAssetSchema } from "@aksicendekia/content-kit";
import type { MediaAsset } from "@prisma/client";
import { ContentBlockRepository } from "./content-block.repository.js";
import { BadRequestError, ConflictError, UnprocessableEntityError } from "../../common/errors/app-error.js";
import type { CreateMediaAssetInput } from "./content-block.schema.js";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/svg+xml": "svg",
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "text/vtt": "vtt",
  "text/plain": "txt",
  "text/markdown": "md",
};

/**
 * Media asset ingestion — FR-003, FR-005 / contracts/content-blocks.contract.md §6.
 * Validation reuses @aksicendekia/content-kit's mediaAssetSchema (single source of
 * truth for the allowlist/size/duration/altText rules also enforced client-side).
 */
export class MediaAssetService {
  constructor(private repo: ContentBlockRepository) {}

  async registerAsset(input: CreateMediaAssetInput): Promise<MediaAsset> {
    const storageKey = input.storageKey ?? this.generateStorageKey(input.kind, input.mimeType);

    const parsed = mediaAssetSchema.safeParse({
      id: "pending",
      kind: input.kind,
      storageKey,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      widthPx: input.widthPx,
      heightPx: input.heightPx,
      durationSeconds: input.durationSeconds,
      altText: input.altText,
      licenseNote: input.licenseNote,
      attribution: input.attribution,
    });

    if (!parsed.success) {
      const hotlinkIssue = parsed.error.issues.find((issue) => issue.path[0] === "storageKey");
      if (hotlinkIssue) {
        throw new UnprocessableEntityError(hotlinkIssue.message, "HOTLINK_REJECTED");
      }
      throw new BadRequestError(parsed.error.issues[0]?.message ?? "Aset media tidak valid");
    }

    const existing = await this.repo.findMediaAssetByStorageKey(storageKey);
    if (existing) {
      throw new ConflictError(`storageKey "${storageKey}" sudah terdaftar`);
    }

    return this.repo.createMediaAsset({
      kind: parsed.data.kind,
      storageKey: parsed.data.storageKey,
      mimeType: parsed.data.mimeType,
      byteSize: parsed.data.byteSize,
      widthPx: parsed.data.widthPx,
      heightPx: parsed.data.heightPx,
      durationSeconds: parsed.data.durationSeconds,
      altText: parsed.data.altText,
      licenseNote: parsed.data.licenseNote,
      attribution: parsed.data.attribution,
    });
  }

  async listAssets(): Promise<MediaAsset[]> {
    return this.repo.listMediaAssets();
  }

  private generateStorageKey(kind: string, mimeType: string): string {
    const ext = EXTENSION_BY_MIME[mimeType] ?? "bin";
    return `assets/uploads/${kind.toLowerCase()}/${randomUUID()}.${ext}`;
  }
}
