import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient, AccessType, Role } from "@prisma/client";
import { ParentService } from "./parent.service.js";
import { ParentDashboardService } from "./parent-dashboard.service.js";
import { AddChildSchema, ApproveConsentSchema } from "./parent.schema.js";
import { UpdateParentalControlSchema } from "./parent-dashboard.schema.js";
import { TokenPayload } from "../../types/fastify.js";
import { logStudentAccess } from "../../common/audit/audit-access-logger.js";

export function registerParentRoutes(
  fastify: FastifyInstance,
  parentService: ParentService,
  parentDashboardService: ParentDashboardService,
  prisma: PrismaClient
) {
  // POST /api/v1/parent/children
  fastify.post(
    "/api/v1/parent/children",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const dto = AddChildSchema.parse(request.body);
      const result = await parentService.addChild(user.userId, dto);
      return reply.status(201).send({
        message: "Akun anak berhasil dibuat dan dihubungkan ke akun wali",
        data: result.childProfile,
      });
    }
  );

  // POST /api/v1/parent/consent/approve
  fastify.post(
    "/api/v1/parent/consent/approve",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const dto = ApproveConsentSchema.parse(request.body);
      if (!dto.studentProfileId) {
        return reply.status(400).send({ message: "ID siswa wajib diisi" });
      }
      await parentService.approveConsent(user.userId, dto.studentProfileId);
      return reply.send({ message: "Persetujuan wali berhasil dicatat. Akun siswa telah diaktifkan." });
    }
  );

  // GET /api/v1/parent/children
  fastify.get(
    "/api/v1/parent/children",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const children = await parentService.getChildren(user.userId);
      return reply.send({ data: children });
    }
  );

  // GET /api/v1/parent/children/:studentId/summary
  fastify.get(
    "/api/v1/parent/children/:studentId/summary",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const { studentId } = request.params as { studentId: string };

      const summary = await parentDashboardService.getChildSummary(user.userId, studentId);

      await logStudentAccess(prisma, {
        accessorUserId: user.userId,
        accessorRole: user.role as Role,
        targetStudentId: summary.studentId,
        accessType: AccessType.READ_CHILD_SUMMARY,
        endpoint: request.url,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"] || "",
      });

      return reply.send({ data: summary });
    }
  );

  // GET /api/v1/parent/children/:studentId/activities
  fastify.get(
    "/api/v1/parent/children/:studentId/activities",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const { studentId } = request.params as { studentId: string };

      const activities = await parentDashboardService.getChildActivities(user.userId, studentId);

      await logStudentAccess(prisma, {
        accessorUserId: user.userId,
        accessorRole: user.role as Role,
        targetStudentId: studentId,
        accessType: AccessType.READ_CHILD_ACTIVITIES,
        endpoint: request.url,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"] || "",
      });

      return reply.send({ data: activities });
    }
  );

  // PUT /api/v1/parent/children/:studentId/controls
  fastify.put(
    "/api/v1/parent/children/:studentId/controls",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const { studentId } = request.params as { studentId: string };
      const dto = UpdateParentalControlSchema.parse(request.body);

      const updated = await parentDashboardService.updateParentalControls(user.userId, studentId, dto);

      await logStudentAccess(prisma, {
        accessorUserId: user.userId,
        accessorRole: user.role as Role,
        targetStudentId: studentId,
        accessType: AccessType.UPDATE_PARENTAL_CONTROLS,
        endpoint: request.url,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"] || "",
      });

      return reply.send({
        message: "Pengaturan kontrol orang tua berhasil diperbarui",
        data: updated,
      });
    }
  );

  // GET /api/v1/parent/children/:studentId/weekly-reports
  fastify.get(
    "/api/v1/parent/children/:studentId/weekly-reports",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const { studentId } = request.params as { studentId: string };

      const reports = await parentDashboardService.getChildWeeklyReports(user.userId, studentId);

      await logStudentAccess(prisma, {
        accessorUserId: user.userId,
        accessorRole: user.role as Role,
        targetStudentId: studentId,
        accessType: AccessType.READ_WEEKLY_REPORT,
        endpoint: request.url,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"] || "",
      });

      return reply.send({ data: reports });
    }
  );
}
