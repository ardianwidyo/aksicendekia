import { describe, it, expect, beforeEach } from "vitest";
import { createMockPrismaClient } from "../../../__tests__/mock-prisma.js";
import { ContentBlockRepository } from "../content-block.repository.js";
import { ContentBlockService } from "../content-block.service.js";
import { BadRequestError, ConflictError, NotFoundError } from "../../../common/errors/app-error.js";

describe("ContentBlockService — CRUD + reorder (contracts §1-5)", () => {
  let mockPrisma: any;
  let repo: ContentBlockRepository;
  let service: ContentBlockService;
  let lessonId: string;

  beforeEach(async () => {
    mockPrisma = createMockPrismaClient();
    repo = new ContentBlockRepository(mockPrisma);
    service = new ContentBlockService(repo);

    const unit = await mockPrisma.unit.create({ data: { subjectId: "subj-1", title: "Unit", orderIndex: 1 } });
    const lesson = await mockPrisma.lesson.create({
      data: {
        unitId: unit.id,
        title: "Pelajaran",
        summary: "Ringkasan",
        learningObjective: "Tujuan",
        educationStage: "SD",
        phase: "FASE_B",
        difficultyLevel: "BEGINNER",
        estimatedDurationMinutes: 10,
        orderIndex: 1,
        status: "DRAFT",
      },
    });
    lessonId = lesson.id;
  });

  it("creates a RICH_TEXT block with status DRAFT", async () => {
    const block = await service.createBlock(lessonId, {
      orderIndex: 0,
      blockType: "RICH_TEXT",
      payload: { markdown: "Halo dunia" },
    } as any);

    expect(block.status).toBe("DRAFT");
    expect(block.orderIndex).toBe(0);
  });

  it("400s when payload does not match blockType's shape", async () => {
    await expect(
      service.createBlock(lessonId, {
        orderIndex: 0,
        blockType: "RICH_TEXT",
        payload: { wrongField: true },
      } as any),
    ).rejects.toThrow(BadRequestError);
  });

  it("400s when an INTERACTIVE_WIDGET block's params fail its widget schema", async () => {
    await expect(
      service.createBlock(lessonId, {
        orderIndex: 0,
        blockType: "INTERACTIVE_WIDGET",
        payload: { widgetType: "NUMBER_LINE_EXPLORER", params: { min: 10, max: 0, step: 1, initial: 0 } },
      } as any),
    ).rejects.toThrow(BadRequestError);
  });

  it("404s when widgetType is not in the catalog", async () => {
    await expect(
      service.createBlock(lessonId, {
        orderIndex: 0,
        blockType: "INTERACTIVE_WIDGET",
        payload: { widgetType: "GHOST_WIDGET", params: {} },
      } as any),
    ).rejects.toThrow(NotFoundError);
  });

  it("shifts subsequent blocks when orderIndex collides", async () => {
    await service.createBlock(lessonId, { orderIndex: 0, blockType: "RICH_TEXT", payload: { markdown: "A" } } as any);
    await service.createBlock(lessonId, { orderIndex: 1, blockType: "RICH_TEXT", payload: { markdown: "B" } } as any);
    await service.createBlock(lessonId, { orderIndex: 0, blockType: "RICH_TEXT", payload: { markdown: "C" } } as any);

    const blocks = await service.listBlocks(lessonId);
    expect(blocks.map((b: any) => b.payload.markdown)).toEqual(["C", "A", "B"]);
    expect(blocks.map((b: any) => b.orderIndex)).toEqual([0, 1, 2]);
  });

  it("409s when creating a block on a PUBLISHED lesson", async () => {
    await mockPrisma.lesson.update({ where: { id: lessonId }, data: { status: "PUBLISHED" } });
    await expect(
      service.createBlock(lessonId, { orderIndex: 0, blockType: "RICH_TEXT", payload: { markdown: "A" } } as any),
    ).rejects.toThrow(ConflictError);
  });

  it("409s when updating a block whose lesson is PUBLISHED", async () => {
    const block = await service.createBlock(lessonId, {
      orderIndex: 0,
      blockType: "RICH_TEXT",
      payload: { markdown: "A" },
    } as any);
    await mockPrisma.lesson.update({ where: { id: lessonId }, data: { status: "PUBLISHED" } });

    await expect(service.updateBlock(block.id, { payload: { markdown: "B" } } as any)).rejects.toThrow(
      ConflictError,
    );
  });

  it("deletes a block and compacts subsequent orderIndex values", async () => {
    const a = await service.createBlock(lessonId, { orderIndex: 0, blockType: "RICH_TEXT", payload: { markdown: "A" } } as any);
    await service.createBlock(lessonId, { orderIndex: 1, blockType: "RICH_TEXT", payload: { markdown: "B" } } as any);
    await service.createBlock(lessonId, { orderIndex: 2, blockType: "RICH_TEXT", payload: { markdown: "C" } } as any);

    await service.deleteBlock(a.id);

    const blocks = await service.listBlocks(lessonId);
    expect(blocks.map((b: any) => b.payload.markdown)).toEqual(["B", "C"]);
    expect(blocks.map((b: any) => b.orderIndex)).toEqual([0, 1]);
  });

  it("reorders all blocks atomically given a full permutation", async () => {
    const a = await service.createBlock(lessonId, { orderIndex: 0, blockType: "RICH_TEXT", payload: { markdown: "A" } } as any);
    const b = await service.createBlock(lessonId, { orderIndex: 1, blockType: "RICH_TEXT", payload: { markdown: "B" } } as any);
    const c = await service.createBlock(lessonId, { orderIndex: 2, blockType: "RICH_TEXT", payload: { markdown: "C" } } as any);

    const blocks = await service.reorderBlocks(lessonId, [c.id, a.id, b.id]);
    expect(blocks.map((x: any) => x.id)).toEqual([c.id, a.id, b.id]);
    expect(blocks.map((x: any) => x.orderIndex)).toEqual([0, 1, 2]);
  });

  it("400s reorder when the id set does not exactly match the lesson's blocks", async () => {
    const a = await service.createBlock(lessonId, { orderIndex: 0, blockType: "RICH_TEXT", payload: { markdown: "A" } } as any);
    await service.createBlock(lessonId, { orderIndex: 1, blockType: "RICH_TEXT", payload: { markdown: "B" } } as any);

    await expect(service.reorderBlocks(lessonId, [a.id, "foreign-id"])).rejects.toThrow(BadRequestError);
    await expect(service.reorderBlocks(lessonId, [a.id])).rejects.toThrow(BadRequestError);
    await expect(service.reorderBlocks(lessonId, [a.id, a.id])).rejects.toThrow(BadRequestError);
  });

  it("requires the wajib companion fields for ILLUSTRATION and VIDEO blocks", async () => {
    await expect(
      service.createBlock(lessonId, {
        orderIndex: 0,
        blockType: "ILLUSTRATION",
        payload: {},
      } as any),
    ).rejects.toThrow(BadRequestError);

    const block = await service.createBlock(lessonId, {
      orderIndex: 0,
      blockType: "ILLUSTRATION",
      payload: {},
      mediaAssetId: "asset-1",
      altText: "Dua apel",
    } as any);
    expect(block.altText).toBe("Dua apel");
  });
});
