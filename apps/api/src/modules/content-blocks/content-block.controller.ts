import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Role } from "@prisma/client";
import { ContentBlockService } from "./content-block.service.js";
import { MediaAssetService } from "./media-asset.service.js";
import { CurriculumAchievementService } from "./curriculum-achievement.service.js";
import { PublishService } from "./publish.service.js";
import { ForbiddenError, BadRequestError, UnprocessableEntityError } from "../../common/errors/app-error.js";
import { TokenPayload } from "../../types/fastify.js";
import { widgetCatalogSeedRows } from "@aksicendekia/content-kit";
import {
  createContentBlockSchema,
  updateContentBlockSchema,
  reorderBlocksSchema,
  createMediaAssetSchema,
  publishLessonSchema,
  createCurriculumAchievementSchema,
} from "./content-block.schema.js";

function requireAdmin(req: FastifyRequest) {
  const user = req.user as TokenPayload | undefined;
  if (!user || user.role !== Role.ADMIN) {
    throw new ForbiddenError("Akses ditolak: Hanya peran ADMIN yang dapat mengelola CMS konten");
  }
}

function sendGateFailure(reply: FastifyReply, error: UnprocessableEntityError) {
  return reply.status(422).send({
    error: error.code,
    message: error.message,
    violations: error.violations,
  });
}

export function registerContentBlockRoutes(
  app: FastifyInstance,
  blockService: ContentBlockService,
  mediaAssetService: MediaAssetService,
  achievementService: CurriculumAchievementService,
  publishService: PublishService,
) {
  app.get(
    "/api/v1/admin/lessons/:lessonId/blocks",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);
      const { lessonId } = req.params as { lessonId: string };
      const blocks = await blockService.listBlocks(lessonId);
      return reply.send({ blocks });
    },
  );

  app.post(
    "/api/v1/admin/lessons/:lessonId/blocks",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);
      const { lessonId } = req.params as { lessonId: string };
      const body = createContentBlockSchema.parse(req.body);
      const block = await blockService.createBlock(lessonId, body);
      return reply.status(201).send(block);
    },
  );

  app.patch(
    "/api/v1/admin/blocks/:blockId",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);
      const { blockId } = req.params as { blockId: string };
      const body = updateContentBlockSchema.parse(req.body);
      const block = await blockService.updateBlock(blockId, body);
      return reply.send(block);
    },
  );

  app.delete(
    "/api/v1/admin/blocks/:blockId",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);
      const { blockId } = req.params as { blockId: string };
      await blockService.deleteBlock(blockId);
      return reply.status(204).send();
    },
  );

  app.put(
    "/api/v1/admin/lessons/:lessonId/blocks/order",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);
      const { lessonId } = req.params as { lessonId: string };
      const { orderedBlockIds } = reorderBlocksSchema.parse(req.body);
      const blocks = await blockService.reorderBlocks(lessonId, orderedBlockIds);
      return reply.send({ blocks });
    },
  );

  app.get(
    "/api/v1/admin/media-assets",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);
      const assets = await mediaAssetService.listAssets();
      return reply.send({ assets });
    },
  );

  app.post(
    "/api/v1/admin/media-assets",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);

      const filePart = await req.file();
      if (!filePart) throw new BadRequestError("Berkas aset media wajib disertakan");

      const buffer = await filePart.toBuffer();
      const fieldValue = (name: string): string | undefined => {
        const field = (filePart.fields as Record<string, unknown>)[name];
        return field && typeof field === "object" && "value" in field ? String((field as { value: unknown }).value) : undefined;
      };

      const input = createMediaAssetSchema.parse({
        kind: fieldValue("kind"),
        mimeType: filePart.mimetype,
        byteSize: buffer.byteLength,
        altText: fieldValue("altText"),
        licenseNote: fieldValue("licenseNote"),
        attribution: fieldValue("attribution"),
        durationSeconds: fieldValue("durationSeconds") ? Number(fieldValue("durationSeconds")) : undefined,
        widthPx: fieldValue("widthPx") ? Number(fieldValue("widthPx")) : undefined,
        heightPx: fieldValue("heightPx") ? Number(fieldValue("heightPx")) : undefined,
      });

      const asset = await mediaAssetService.registerAsset(input);
      return reply.status(201).send(asset);
    },
  );

  app.post(
    "/api/v1/admin/lessons/:lessonId/submit-review",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);
      const { lessonId } = req.params as { lessonId: string };
      try {
        const result = await publishService.submitForReview(lessonId);
        return reply.send(result);
      } catch (error) {
        if (error instanceof UnprocessableEntityError) return sendGateFailure(reply, error);
        throw error;
      }
    },
  );

  app.post(
    "/api/v1/admin/lessons/:lessonId/publish",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);
      const { lessonId } = req.params as { lessonId: string };
      const { reviewerNote } = publishLessonSchema.parse(req.body ?? {});
      try {
        const result = await publishService.publish(lessonId, reviewerNote);
        return reply.send(result);
      } catch (error) {
        if (error instanceof UnprocessableEntityError) return sendGateFailure(reply, error);
        throw error;
      }
    },
  );

  app.get(
    "/api/v1/admin/curriculum-achievements",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);
      const achievements = await achievementService.list();
      return reply.send({ achievements });
    },
  );

  app.post(
    "/api/v1/admin/curriculum-achievements",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);
      const body = createCurriculumAchievementSchema.parse(req.body);
      const achievement = await achievementService.create(body);
      return reply.status(201).send(achievement);
    },
  );

  app.get(
    "/api/v1/admin/widget-catalog",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);
      return reply.send({ widgets: widgetCatalogSeedRows() });
    },
  );
}
