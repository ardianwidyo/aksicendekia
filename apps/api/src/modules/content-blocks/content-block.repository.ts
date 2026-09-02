import { PrismaClient, Prisma, ContentStatus, LessonContentBlock, MediaAsset, CurriculumAchievement } from "@prisma/client";
import type { GateSnapshot } from "./gate-types.js";

export class ContentBlockRepository {
  constructor(private prisma: PrismaClient) {}

  // ================= LESSON GUARDS =================
  async findLessonStatus(lessonId: string): Promise<{ id: string; status: ContentStatus } | null> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, status: true },
    });
    return lesson;
  }

  // ================= BLOCKS =================
  async listBlocks(lessonId: string): Promise<LessonContentBlock[]> {
    return this.prisma.lessonContentBlock.findMany({
      where: { lessonId },
      orderBy: { orderIndex: "asc" },
    });
  }

  async findBlockById(blockId: string): Promise<LessonContentBlock | null> {
    return this.prisma.lessonContentBlock.findUnique({ where: { id: blockId } });
  }

  async createBlock(
    lessonId: string,
    data: Omit<Prisma.LessonContentBlockUncheckedCreateInput, "id" | "lessonId">,
  ): Promise<LessonContentBlock> {
    return this.prisma.$transaction(async (tx) => {
      await tx.lessonContentBlock.updateMany({
        where: { lessonId, orderIndex: { gte: data.orderIndex as number } },
        data: { orderIndex: { increment: 1 } },
      });
      return tx.lessonContentBlock.create({ data: { ...data, lessonId } });
    });
  }

  async updateBlock(
    blockId: string,
    data: Prisma.LessonContentBlockUncheckedUpdateInput,
  ): Promise<LessonContentBlock> {
    return this.prisma.lessonContentBlock.update({ where: { id: blockId }, data });
  }

  async deleteBlock(blockId: string): Promise<LessonContentBlock> {
    return this.prisma.$transaction(async (tx) => {
      const block = await tx.lessonContentBlock.delete({ where: { id: blockId } });
      await tx.lessonContentBlock.updateMany({
        where: { lessonId: block.lessonId, orderIndex: { gt: block.orderIndex } },
        data: { orderIndex: { decrement: 1 } },
      });
      return block;
    });
  }

  async reorderBlocks(lessonId: string, orderedBlockIds: string[]): Promise<LessonContentBlock[]> {
    return this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < orderedBlockIds.length; i++) {
        await tx.lessonContentBlock.update({
          where: { id: orderedBlockIds[i] },
          data: { orderIndex: -(i + 1) },
        });
      }
      for (let i = 0; i < orderedBlockIds.length; i++) {
        await tx.lessonContentBlock.update({
          where: { id: orderedBlockIds[i] },
          data: { orderIndex: i },
        });
      }
      return tx.lessonContentBlock.findMany({ where: { lessonId }, orderBy: { orderIndex: "asc" } });
    });
  }

  // ================= GATE SNAPSHOT =================
  async getGateSnapshot(lessonId: string): Promise<GateSnapshot | null> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { curriculumAchievement: true, questionItems: true },
    });
    if (!lesson) return null;

    const blocks = await this.listBlocks(lessonId);

    return {
      lesson: {
        id: lesson.id,
        educationStage: lesson.educationStage,
        phase: lesson.phase,
        learningObjective: lesson.learningObjective,
        unitId: lesson.unitId,
        curriculumAchievementId: lesson.curriculumAchievementId,
        curriculumAchievement: lesson.curriculumAchievement
          ? {
              achievementText: lesson.curriculumAchievement.achievementText,
              sourceDocument: lesson.curriculumAchievement.sourceDocument,
              sourceUrl: lesson.curriculumAchievement.sourceUrl,
              retrievedAt: lesson.curriculumAchievement.retrievedAt,
            }
          : null,
      },
      blocks: blocks.map((b) => ({
        id: b.id,
        blockType: b.blockType,
        payload: b.payload,
        altText: b.altText,
        transcriptText: b.transcriptText,
        captionAssetId: b.captionAssetId,
        fallbackAssetId: b.fallbackAssetId,
        narrationText: b.narrationText,
      })),
      questionItems: lesson.questionItems.map((q) => ({
        id: q.id,
        contentPayload: q.contentPayload as GateSnapshot["questionItems"][number]["contentPayload"],
      })),
    };
  }

  async updateLessonStatus(lessonId: string, status: ContentStatus, reviewerNote?: string): Promise<void> {
    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: reviewerNote !== undefined ? { status, reviewerNote } : { status },
    });
  }

  // ================= MEDIA ASSETS =================
  async createMediaAsset(data: Prisma.MediaAssetCreateInput): Promise<MediaAsset> {
    return this.prisma.mediaAsset.create({ data });
  }

  async findMediaAssetById(id: string): Promise<MediaAsset | null> {
    return this.prisma.mediaAsset.findUnique({ where: { id } });
  }

  async findMediaAssetByStorageKey(storageKey: string): Promise<MediaAsset | null> {
    return this.prisma.mediaAsset.findUnique({ where: { storageKey } });
  }

  async listMediaAssets(): Promise<MediaAsset[]> {
    return this.prisma.mediaAsset.findMany();
  }

  // ================= CURRICULUM ACHIEVEMENTS =================
  async createCurriculumAchievement(data: Prisma.CurriculumAchievementCreateInput): Promise<CurriculumAchievement> {
    return this.prisma.curriculumAchievement.create({ data });
  }

  async findCurriculumAchievementByTuple(
    phase: CurriculumAchievement["phase"],
    subjectCode: string,
    element: string,
  ): Promise<CurriculumAchievement | null> {
    return this.prisma.curriculumAchievement.findFirst({ where: { phase, subjectCode, element } });
  }

  async listCurriculumAchievements(): Promise<CurriculumAchievement[]> {
    return this.prisma.curriculumAchievement.findMany();
  }
}
