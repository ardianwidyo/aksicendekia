import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { EducationStage, ContentStatus, Role } from "@prisma/client";
import { CurriculumService } from "./curriculum.service.js";
import { ForbiddenError } from "../../common/errors/app-error.js";
import { TokenPayload } from "../../types/fastify.js";
import {
  createSubjectSchema,
  updateSubjectSchema,
  createUnitSchema,
  updateUnitSchema,
  createLessonSchema,
  updateLessonSchema,
  setPrerequisitesSchema,
  createQuestionItemSchema,
  updateQuestionItemSchema,
  updateStatusSchema,
  csvImportSchema,
} from "./curriculum.schema.js";

function requireAdmin(req: FastifyRequest) {
  const user = req.user as TokenPayload | undefined;
  if (!user || user.role !== Role.ADMIN) {
    throw new ForbiddenError("Akses ditolak: Hanya peran ADMIN yang dapat mengelola CMS kurikulum");
  }
}

export function registerCurriculumRoutes(app: FastifyInstance, service: CurriculumService) {
  // ================= ADMIN CMS ROUTES =================

  // --- SUBJECTS ---
  app.post(
    "/api/v1/admin/curriculum/subjects",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);
      const body = createSubjectSchema.parse(req.body);
      const subject = await service.createSubject(body);
      return reply.status(201).send(subject);
    }
  );

  app.get(
    "/api/v1/admin/curriculum/subjects",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);
      const query = req.query as { stage?: EducationStage; status?: ContentStatus };
      const subjects = await service.listSubjects(query.stage, query.status);
      return reply.send({ subjects });
    }
  );

  app.get(
    "/api/v1/admin/curriculum/subjects/:id",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const subject = await service.getSubject(req.params.id);
      return reply.send(subject);
    }
  );

  app.patch(
    "/api/v1/admin/curriculum/subjects/:id",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const body = updateSubjectSchema.parse(req.body);
      const subject = await service.updateSubject(req.params.id, body);
      return reply.send(subject);
    }
  );

  app.patch(
    "/api/v1/admin/curriculum/subjects/:id/status",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const { status } = updateStatusSchema.parse(req.body);
      const subject = await service.updateSubjectStatus(req.params.id, status);
      return reply.send(subject);
    }
  );

  app.delete(
    "/api/v1/admin/curriculum/subjects/:id",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const subject = await service.deleteSubject(req.params.id);
      return reply.send({ message: "Mata pelajaran berhasil dihapus", id: subject.id });
    }
  );

  // --- UNITS ---
  app.post(
    "/api/v1/admin/curriculum/units",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);
      const body = createUnitSchema.parse(req.body);
      const unit = await service.createUnit(body);
      return reply.status(201).send(unit);
    }
  );

  app.get(
    "/api/v1/admin/curriculum/subjects/:subjectId/units",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { subjectId: string }; Query: { status?: ContentStatus } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const units = await service.listUnitsBySubject(req.params.subjectId, req.query.status);
      return reply.send({ units });
    }
  );

  app.get(
    "/api/v1/admin/curriculum/units/:id",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const unit = await service.getUnit(req.params.id);
      return reply.send(unit);
    }
  );

  app.patch(
    "/api/v1/admin/curriculum/units/:id",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const body = updateUnitSchema.parse(req.body);
      const unit = await service.updateUnit(req.params.id, body);
      return reply.send(unit);
    }
  );

  app.patch(
    "/api/v1/admin/curriculum/units/:id/status",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const { status } = updateStatusSchema.parse(req.body);
      const unit = await service.updateUnitStatus(req.params.id, status);
      return reply.send(unit);
    }
  );

  app.delete(
    "/api/v1/admin/curriculum/units/:id",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const unit = await service.deleteUnit(req.params.id);
      return reply.send({ message: "Unit berhasil dihapus", id: unit.id });
    }
  );

  // --- LESSONS ---
  app.post(
    "/api/v1/admin/curriculum/lessons",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);
      const body = createLessonSchema.parse(req.body);
      const lesson = await service.createLesson(body);
      return reply.status(201).send(lesson);
    }
  );

  app.get(
    "/api/v1/admin/curriculum/units/:unitId/lessons",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { unitId: string }; Query: { status?: ContentStatus } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const lessons = await service.listLessonsByUnit(req.params.unitId, req.query.status);
      return reply.send({ lessons });
    }
  );

  app.get(
    "/api/v1/admin/curriculum/lessons/:id",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const lesson = await service.getLesson(req.params.id);
      return reply.send(lesson);
    }
  );

  app.patch(
    "/api/v1/admin/curriculum/lessons/:id",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const body = updateLessonSchema.parse(req.body);
      const lesson = await service.updateLesson(req.params.id, body);
      return reply.send(lesson);
    }
  );

  app.patch(
    "/api/v1/admin/curriculum/lessons/:id/prerequisites",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const { prerequisiteLessonIds } = setPrerequisitesSchema.parse(req.body);
      const lesson = await service.updateLesson(req.params.id, {}, prerequisiteLessonIds);
      return reply.send(lesson);
    }
  );

  app.patch(
    "/api/v1/admin/curriculum/lessons/:id/status",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const { status } = updateStatusSchema.parse(req.body);
      const lesson = await service.updateLessonStatus(req.params.id, status);
      return reply.send(lesson);
    }
  );

  app.delete(
    "/api/v1/admin/curriculum/lessons/:id",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const lesson = await service.deleteLesson(req.params.id);
      return reply.send({ message: "Pelajaran berhasil dihapus", id: lesson.id });
    }
  );

  // --- QUESTION ITEMS ---
  app.post(
    "/api/v1/admin/curriculum/questions",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      requireAdmin(req);
      const body = createQuestionItemSchema.parse(req.body);
      const question = await service.createQuestionItem(body);
      return reply.status(201).send(question);
    }
  );

  app.get(
    "/api/v1/admin/curriculum/lessons/:lessonId/questions",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { lessonId: string }; Query: { status?: ContentStatus } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const questions = await service.listQuestionsByLesson(req.params.lessonId, req.query.status);
      return reply.send({ questions });
    }
  );

  app.get(
    "/api/v1/admin/curriculum/questions/:id",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const question = await service.getQuestionItem(req.params.id);
      return reply.send(question);
    }
  );

  app.patch(
    "/api/v1/admin/curriculum/questions/:id",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const body = updateQuestionItemSchema.parse(req.body);
      const question = await service.updateQuestionItem(req.params.id, body);
      return reply.send(question);
    }
  );

  app.patch(
    "/api/v1/admin/curriculum/questions/:id/status",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const { status } = updateStatusSchema.parse(req.body);
      const question = await service.updateQuestionItemStatus(req.params.id, status);
      return reply.send(question);
    }
  );

  app.delete(
    "/api/v1/admin/curriculum/questions/:id",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const question = await service.deleteQuestionItem(req.params.id);
      return reply.send({ message: "Butir soal berhasil dihapus", id: question.id });
    }
  );

  // --- CSV MASS IMPORT ---
  app.post(
    "/api/v1/admin/curriculum/lessons/:lessonId/import-csv",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { lessonId: string } }>, reply: FastifyReply) => {
      requireAdmin(req);
      const { csvContent } = csvImportSchema.omit({ lessonId: true }).parse(req.body);
      const report = await service.importQuestionsFromCsv(req.params.lessonId, csvContent);
      const statusCode = report.success ? 200 : 422;
      return reply.status(statusCode).send(report);
    }
  );

  // ================= STUDENT READ APIS =================

  app.get(
    "/api/v1/subjects",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Query: { stage?: EducationStage } }>, reply: FastifyReply) => {
      const stage = req.query.stage || EducationStage.SD;
      const subjects = await service.listSubjectsForStudent(stage);
      return reply.send({ subjects });
    }
  );

  app.get(
    "/api/v1/units/:unitId/lessons",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { unitId: string } }>, reply: FastifyReply) => {
      const user = req.user as TokenPayload;
      const lessons = await service.listLessonsForUnitForStudent(user.userId, req.params.unitId);
      return reply.send({ lessons });
    }
  );

  app.get(
    "/api/v1/lessons/:id",
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const user = req.user as TokenPayload;
      const lessonDetail = await service.getLessonDetailForStudent(user.userId, req.params.id);
      return reply.send(lessonDetail);
    }
  );
}
