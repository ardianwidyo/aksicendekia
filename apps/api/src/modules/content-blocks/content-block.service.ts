import { ContentStatus, LessonContentBlock, Prisma } from "@prisma/client";
import { getWidgetCatalogEntry } from "@aksicendekia/content-kit";
import { ContentBlockRepository } from "./content-block.repository.js";
import { BadRequestError, ConflictError, NotFoundError } from "../../common/errors/app-error.js";
import {
  CreateContentBlockInput,
  UpdateContentBlockInput,
  REQUIRED_COMPANION_FIELDS,
  ContentBlockTypeLiteral,
  parseBlockPayload,
} from "./content-block.schema.js";

/**
 * CRUD + reorder for LessonContentBlock — contracts/content-blocks.contract.md §1-5.
 * Gate orchestration (submit-review) lives in PublishService; this service only owns
 * shape validation and the PUBLISHED-lesson edit guard (Feature 003 versioning applies
 * at the Lesson level, not here — editing a PUBLISHED lesson's blocks is rejected outright).
 */
export class ContentBlockService {
  constructor(private repo: ContentBlockRepository) {}

  async listBlocks(lessonId: string): Promise<LessonContentBlock[]> {
    await this.assertLessonExists(lessonId);
    return this.repo.listBlocks(lessonId);
  }

  async createBlock(lessonId: string, input: CreateContentBlockInput): Promise<LessonContentBlock> {
    await this.assertLessonEditable(lessonId);
    const payload = this.validatePayload(input.blockType, input.payload);
    this.assertCompanionFields(input.blockType, input);

    return this.repo.createBlock(lessonId, {
      orderIndex: input.orderIndex,
      blockType: input.blockType,
      payload: payload as Prisma.InputJsonValue,
      altText: input.altText ?? null,
      transcriptText: input.transcriptText ?? null,
      mediaAssetId: input.mediaAssetId ?? null,
      captionAssetId: input.captionAssetId ?? null,
      fallbackAssetId: input.fallbackAssetId ?? null,
      narrationText: input.narrationText ?? null,
      narrationAssetId: input.narrationAssetId ?? null,
      status: ContentStatus.DRAFT,
    });
  }

  async updateBlock(blockId: string, input: UpdateContentBlockInput): Promise<LessonContentBlock> {
    const existing = await this.repo.findBlockById(blockId);
    if (!existing) throw new NotFoundError("Blok konten tidak ditemukan");
    await this.assertLessonEditable(existing.lessonId);

    const payload = input.payload ? this.validatePayload(existing.blockType, input.payload) : undefined;
    if (input.payload) {
      this.assertCompanionFields(existing.blockType, {
        altText: input.altText ?? existing.altText ?? undefined,
        transcriptText: input.transcriptText ?? existing.transcriptText ?? undefined,
        mediaAssetId: input.mediaAssetId ?? existing.mediaAssetId ?? undefined,
        captionAssetId: input.captionAssetId ?? existing.captionAssetId ?? undefined,
        fallbackAssetId: input.fallbackAssetId ?? existing.fallbackAssetId ?? undefined,
      });
    }

    return this.repo.updateBlock(blockId, {
      ...(input.orderIndex !== undefined ? { orderIndex: input.orderIndex } : {}),
      ...(payload !== undefined ? { payload: payload as Prisma.InputJsonValue } : {}),
      ...(input.altText !== undefined ? { altText: input.altText } : {}),
      ...(input.transcriptText !== undefined ? { transcriptText: input.transcriptText } : {}),
      ...(input.mediaAssetId !== undefined ? { mediaAssetId: input.mediaAssetId } : {}),
      ...(input.captionAssetId !== undefined ? { captionAssetId: input.captionAssetId } : {}),
      ...(input.fallbackAssetId !== undefined ? { fallbackAssetId: input.fallbackAssetId } : {}),
      ...(input.narrationText !== undefined ? { narrationText: input.narrationText } : {}),
      ...(input.narrationAssetId !== undefined ? { narrationAssetId: input.narrationAssetId } : {}),
    });
  }

  async deleteBlock(blockId: string): Promise<LessonContentBlock> {
    const existing = await this.repo.findBlockById(blockId);
    if (!existing) throw new NotFoundError("Blok konten tidak ditemukan");
    await this.assertLessonEditable(existing.lessonId);
    return this.repo.deleteBlock(blockId);
  }

  async reorderBlocks(lessonId: string, orderedBlockIds: string[]): Promise<LessonContentBlock[]> {
    await this.assertLessonEditable(lessonId);
    const current = await this.repo.listBlocks(lessonId);

    const currentIds = new Set(current.map((b) => b.id));
    const requestedIds = new Set(orderedBlockIds);
    const sameSize = currentIds.size === requestedIds.size;
    const sameMembers = sameSize && [...currentIds].every((id) => requestedIds.has(id));
    const noDuplicates = orderedBlockIds.length === requestedIds.size;

    if (!sameMembers || !noDuplicates) {
      throw new BadRequestError(
        "orderedBlockIds harus memuat persis seluruh id blok milik pelajaran, tanpa duplikat atau id asing",
      );
    }

    return this.repo.reorderBlocks(lessonId, orderedBlockIds);
  }

  private validatePayload(blockType: string, payload: unknown): unknown {
    const result = parseBlockPayload(blockType, payload);
    if (!result.success) {
      if (result.reason === "unknown_block_type") {
        throw new BadRequestError(`blockType tidak dikenal: ${blockType}`);
      }
      throw new BadRequestError(result.error.issues[0]?.message ?? "payload tidak sesuai bentuk blockType");
    }
    if (blockType === "INTERACTIVE_WIDGET") {
      const widget = (result.data as { widgetType: string }).widgetType;
      const entry = getWidgetCatalogEntry(widget);
      if (!entry) {
        throw new NotFoundError(`widgetType "${widget}" tidak ada di katalog`);
      }
    }
    return result.data;
  }

  private assertCompanionFields(blockType: ContentBlockTypeLiteral, fields: Record<string, unknown>): void {
    const required = REQUIRED_COMPANION_FIELDS[blockType];
    for (const field of required) {
      if (!fields[field]) {
        throw new BadRequestError(`Field pendamping "${field}" wajib untuk blockType ${blockType}`);
      }
    }
  }

  private async assertLessonExists(lessonId: string): Promise<void> {
    const lesson = await this.repo.findLessonStatus(lessonId);
    if (!lesson) throw new NotFoundError("Pelajaran tidak ditemukan");
  }

  private async assertLessonEditable(lessonId: string): Promise<void> {
    const lesson = await this.repo.findLessonStatus(lessonId);
    if (!lesson) throw new NotFoundError("Pelajaran tidak ditemukan");
    if (lesson.status === ContentStatus.PUBLISHED) {
      throw new ConflictError("Pelajaran berstatus PUBLISHED — sunting memerlukan versi baru (Feature 003)");
    }
  }
}
