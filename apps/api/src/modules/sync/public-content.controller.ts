import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient, EducationStage } from "@prisma/client";
import { z } from "zod";
import { NotFoundError, BadRequestError } from "../../common/errors/app-error.js";
import {
  getPublicSubjects,
  getPublicUnitLessons,
  getPublicLessonsByGrade,
  getPublicLessonDetail,
  getPublicExercise,
} from "./public-content.service.js";

const gradeLevelSchema = z.coerce.number().int().min(1).max(6);

export function registerPublicContentRoutes(app: FastifyInstance, prisma: PrismaClient) {
  // Public Subjects
  app.get(
    "/api/v1/public/subjects",
    async (req: FastifyRequest<{ Querystring: { stage?: EducationStage } }>, reply: FastifyReply) => {
      const stage = req.query.stage || EducationStage.SD;
      const subjects = await getPublicSubjects(prisma, stage);
      return reply.send({ subjects });
    }
  );

  // Public Lessons by SD grade — Feature 011 (FR-010). `?gradeLevel=1..6`, Zod-validated.
  app.get(
    "/api/v1/public/lessons",
    async (req: FastifyRequest<{ Querystring: { gradeLevel?: string } }>, reply: FastifyReply) => {
      const parsed = gradeLevelSchema.safeParse(req.query.gradeLevel);
      if (!parsed.success) {
        throw new BadRequestError("Parameter gradeLevel wajib berupa bilangan 1-6");
      }
      const lessons = await getPublicLessonsByGrade(prisma, parsed.data);
      return reply.send({ gradeLevel: parsed.data, lessons });
    }
  );

  // Public Unit Lessons
  app.get(
    "/api/v1/public/units/:unitId/lessons",
    async (req: FastifyRequest<{ Params: { unitId: string } }>, reply: FastifyReply) => {
      const lessons = await getPublicUnitLessons(prisma, req.params.unitId);
      return reply.send({ lessons });
    }
  );

  // Public Lesson Detail — includes content blocks + curriculum reference + answer
  // keys (client-side evaluation for Guest Mode). Feature 010. Feature 011 adds
  // focus-mode filtering and `videoEmbed` hydration on VIDEO blocks.
  app.get(
    "/api/v1/public/lessons/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const lesson = await getPublicLessonDetail(prisma, req.params.id);
      if (!lesson) {
        throw new NotFoundError("Pelajaran tidak ditemukan atau belum diterbitkan");
      }
      return reply.send(lesson);
    }
  );

  // Public Single Exercise/Question
  app.get(
    "/api/v1/public/exercises/:id",
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const question = await getPublicExercise(prisma, req.params.id);
      if (!question) {
        throw new NotFoundError("Butir soal tidak ditemukan atau belum diterbitkan");
      }
      return reply.send(question);
    }
  );
}
