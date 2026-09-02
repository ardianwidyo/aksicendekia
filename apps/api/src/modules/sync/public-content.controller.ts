import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient, EducationStage } from "@prisma/client";
import { NotFoundError } from "../../common/errors/app-error.js";
import {
  getPublicSubjects,
  getPublicUnitLessons,
  getPublicLessonDetail,
  getPublicExercise,
} from "./public-content.service.js";

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
