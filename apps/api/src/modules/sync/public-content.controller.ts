import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient, ContentStatus, EducationStage } from "@prisma/client";
import { NotFoundError } from "../../common/errors/app-error.js";

/**
 * Which content statuses the public path may serve.
 * Production: PUBLISHED only. Non-production preview: also REVIEW, gated by
 * CONTENT_PREVIEW_INCLUDE_REVIEW=true (Feature 010 / FR-030b). Never on in prod.
 */
function publicStatuses(): ContentStatus[] {
  const preview =
    process.env.CONTENT_PREVIEW_INCLUDE_REVIEW === "true" &&
    process.env.NODE_ENV !== "production";
  return preview ? [ContentStatus.PUBLISHED, ContentStatus.REVIEW] : [ContentStatus.PUBLISHED];
}

export function registerPublicContentRoutes(app: FastifyInstance, prisma: PrismaClient) {
  // Public Subjects
  app.get(
    "/api/v1/public/subjects",
    async (req: FastifyRequest<{ Querystring: { stage?: EducationStage } }>, reply: FastifyReply) => {
      const stage = req.query.stage || EducationStage.SD;
      const statuses = publicStatuses();
      const subjects = await prisma.subject.findMany({
        where: { educationStage: stage, status: { in: statuses } },
        include: {
          units: {
            where: { status: { in: statuses } },
            orderBy: { orderIndex: "asc" },
            include: {
              lessons: {
                where: { status: { in: statuses }, listing: "LISTED" },
                orderBy: { orderIndex: "asc" },
                select: {
                  id: true,
                  title: true,
                  summary: true,
                  difficultyLevel: true,
                  estimatedDurationMinutes: true,
                  orderIndex: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return reply.send({ subjects });
    }
  );

  // Public Unit Lessons
  app.get(
    "/api/v1/public/units/:unitId/lessons",
    async (req: FastifyRequest<{ Params: { unitId: string } }>, reply: FastifyReply) => {
      const lessons = await prisma.lesson.findMany({
        where: {
          unitId: req.params.unitId,
          status: { in: publicStatuses() },
          listing: "LISTED",
        },
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          unitId: true,
          title: true,
          summary: true,
          learningObjective: true,
          educationStage: true,
          phase: true,
          difficultyLevel: true,
          estimatedDurationMinutes: true,
          orderIndex: true,
        },
      });

      return reply.send({ lessons });
    }
  );

  // Public Lesson Detail — includes content blocks + curriculum reference + answer
  // keys (client-side evaluation for Guest Mode). Feature 010.
  app.get(
    "/api/v1/public/lessons/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const statuses = publicStatuses();
      const lesson = await prisma.lesson.findFirst({
        where: { id: req.params.id, status: { in: statuses } },
        include: {
          curriculumAchievement: true,
          contentBlocks: {
            where: { status: { in: statuses } },
            orderBy: { orderIndex: "asc" },
          },
          questionItems: {
            where: { status: { in: statuses } },
            orderBy: { orderIndex: "asc" },
            include: { hints: { orderBy: { stepOrder: "asc" } } },
          },
        },
      });

      if (!lesson) {
        throw new NotFoundError("Pelajaran tidak ditemukan atau belum diterbitkan");
      }

      const cp = lesson.curriculumAchievement;

      return reply.send({
        id: lesson.id,
        unitId: lesson.unitId,
        title: lesson.title,
        summary: lesson.summary,
        learningObjective: lesson.learningObjective,
        educationStage: lesson.educationStage,
        phase: lesson.phase,
        difficultyLevel: lesson.difficultyLevel,
        estimatedDurationMinutes: lesson.estimatedDurationMinutes,
        orderIndex: lesson.orderIndex,
        listing: lesson.listing,
        supersededByLessonId: lesson.supersededByLessonId,
        curriculumReference: cp
          ? {
              element: cp.element,
              achievementText: cp.achievementText,
              sourceDocument: cp.sourceDocument,
              sourceUrl: cp.sourceUrl,
              retrievedAt: cp.retrievedAt,
            }
          : null,
        contentBlocks: lesson.contentBlocks.map((b) => ({
          id: b.id,
          orderIndex: b.orderIndex,
          blockType: b.blockType,
          payload: b.payload,
          altText: b.altText,
          transcriptText: b.transcriptText,
          narrationText: b.narrationText,
        })),
        questionItems: lesson.questionItems.map((q) => ({
          id: q.id,
          questionType: q.questionType,
          promptText: q.promptText,
          contentPayload: q.contentPayload,
          explanation: q.explanation,
          orderIndex: q.orderIndex,
          hints: q.hints.map((h) => ({ stepOrder: h.stepOrder, hintText: h.hintText })),
        })),
      });
    }
  );

  // Public Single Exercise/Question
  app.get(
    "/api/v1/public/exercises/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const question = await prisma.questionItem.findFirst({
        where: { id: req.params.id, status: { in: publicStatuses() } },
        include: { hints: { orderBy: { stepOrder: "asc" } } },
      });

      if (!question) {
        throw new NotFoundError("Butir soal tidak ditemukan atau belum diterbitkan");
      }

      return reply.send({
        id: question.id,
        lessonId: question.lessonId,
        questionType: question.questionType,
        promptText: question.promptText,
        contentPayload: question.contentPayload,
        explanation: question.explanation,
        orderIndex: question.orderIndex,
        hints: question.hints.map((h) => ({ stepOrder: h.stepOrder, hintText: h.hintText })),
      });
    }
  );
}
