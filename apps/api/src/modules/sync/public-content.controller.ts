import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient, ContentStatus, EducationStage } from "@prisma/client";
import { NotFoundError } from "../../common/errors/app-error.js";

export function registerPublicContentRoutes(app: FastifyInstance, prisma: PrismaClient) {
  // Public Subjects
  app.get(
    "/api/v1/public/subjects",
    async (req: FastifyRequest<{ Querystring: { stage?: EducationStage } }>, reply: FastifyReply) => {
      const stage = req.query.stage || EducationStage.SD;
      const subjects = await prisma.subject.findMany({
        where: {
          educationStage: stage,
          status: ContentStatus.PUBLISHED,
        },
        include: {
          units: {
            where: { status: ContentStatus.PUBLISHED },
            orderBy: { orderIndex: "asc" },
            include: {
              lessons: {
                where: { status: ContentStatus.PUBLISHED },
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
          status: ContentStatus.PUBLISHED,
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

  // Public Lesson Detail (includes published questions with answer keys for local client evaluation)
  app.get(
    "/api/v1/public/lessons/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const lesson = await prisma.lesson.findFirst({
        where: {
          id: req.params.id,
          status: ContentStatus.PUBLISHED,
        },
        include: {
          questionItems: {
            where: { status: ContentStatus.PUBLISHED },
            orderBy: { orderIndex: "asc" },
            include: {
              hints: {
                orderBy: { stepOrder: "asc" },
              },
            },
          },
        },
      });

      if (!lesson) {
        throw new NotFoundError("Pelajaran tidak ditemukan atau belum diterbitkan");
      }

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
        questionItems: lesson.questionItems.map((q) => ({
          id: q.id,
          questionType: q.questionType,
          promptText: q.promptText,
          contentPayload: q.contentPayload,
          explanation: q.explanation,
          orderIndex: q.orderIndex,
          hints: q.hints.map((h) => ({
            stepOrder: h.stepOrder,
            hintText: h.hintText,
          })),
        })),
      });
    }
  );

  // Public Single Exercise/Question
  app.get(
    "/api/v1/public/exercises/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const question = await prisma.questionItem.findFirst({
        where: {
          id: req.params.id,
          status: ContentStatus.PUBLISHED,
        },
        include: {
          hints: {
            orderBy: { stepOrder: "asc" },
          },
        },
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
        hints: question.hints.map((h) => ({
          stepOrder: h.stepOrder,
          hintText: h.hintText,
        })),
      });
    }
  );
}
