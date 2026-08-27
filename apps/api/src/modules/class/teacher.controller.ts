import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient, AccessType, Role } from "@prisma/client";
import { TeacherDashboardService } from "./teacher-dashboard.service.js";
import { CreateAssignmentSchema } from "./teacher-dashboard.schema.js";
import { TokenPayload } from "../../types/fastify.js";
import { logStudentAccess } from "../../common/audit/audit-access-logger.js";

export function registerTeacherRoutes(
  fastify: FastifyInstance,
  teacherService: TeacherDashboardService,
  prisma: PrismaClient
) {
  // GET /api/v1/teacher/classes
  fastify.get(
    "/api/v1/teacher/classes",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const classes = await teacherService.getTeacherClasses(user.userId);
      return reply.send({ data: classes });
    }
  );

  // GET /api/v1/teacher/classes/:classId/students
  fastify.get(
    "/api/v1/teacher/classes/:classId/students",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const { classId } = request.params as { classId: string };

      const students = await teacherService.getClassStudentProgress(user.userId, classId);

      // Audit log for teacher reading class student data
      for (const s of students) {
        await logStudentAccess(prisma, {
          accessorUserId: user.userId,
          accessorRole: user.role as Role,
          targetStudentId: s.studentId,
          accessType: AccessType.READ_CLASS_STUDENTS,
          endpoint: request.url,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] || "",
        });
      }

      return reply.send({ data: students });
    }
  );

  // GET /api/v1/teacher/classes/:classId/item-analysis
  fastify.get(
    "/api/v1/teacher/classes/:classId/item-analysis",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const { classId } = request.params as { classId: string };
      const { lessonId } = request.query as { lessonId?: string };

      const itemAnalysis = await teacherService.getItemAccuracyAnalysis(user.userId, classId, lessonId);

      return reply.send({ data: itemAnalysis });
    }
  );

  // POST /api/v1/teacher/assignments
  fastify.post(
    "/api/v1/teacher/assignments",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const dto = CreateAssignmentSchema.parse(request.body);

      const assignment = await teacherService.createAssignment(user.userId, dto);

      return reply.status(201).send({
        message: "Penugasan pelajaran berhasil dibuat",
        data: assignment,
      });
    }
  );

  // GET /api/v1/teacher/assignments/:assignmentId
  fastify.get(
    "/api/v1/teacher/assignments/:assignmentId",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const { assignmentId } = request.params as { assignmentId: string };

      const progressSummary = await teacherService.getAssignmentProgress(user.userId, assignmentId);

      return reply.send({ data: progressSummary });
    }
  );

  // GET /api/v1/teacher/classes/:classId/export-csv
  fastify.get(
    "/api/v1/teacher/classes/:classId/export-csv",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const { classId } = request.params as { classId: string };

      const csvString = await teacherService.exportClassCsv(user.userId, classId);

      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header(
        "Content-Disposition",
        `attachment; filename="rekap-kelas-${classId}-${new Date().toISOString().substring(0, 10)}.csv"`
      );

      return reply.send(csvString);
    }
  );
}
