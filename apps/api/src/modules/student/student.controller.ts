import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { StudentService } from "./student.service.js";
import { UpdateStudentProfileSchema, StudentProfileParamsSchema } from "./student.schema.js";
import { createRelationalAuthzHook } from "../../middleware/relational-authz.hook.js";
import { PrismaClient } from "@prisma/client";
import { TokenPayload } from "../../types/fastify.js";

export function registerStudentRoutes(fastify: FastifyInstance, studentService: StudentService, prisma: PrismaClient) {
  const relationalAuthz = createRelationalAuthzHook(
    prisma,
    (req: FastifyRequest) => (req.params as { studentId?: string }).studentId
  );

  // GET /api/v1/students/me
  fastify.get(
    "/api/v1/students/me",
    { preHandler: [fastify.authenticate, fastify.consentGate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const profile = await studentService.getProfileByUserId(user.userId);
      return reply.send({ data: profile });
    }
  );

  // GET /api/v1/students/:studentId (Protected by Relational Authorization Hook)
  fastify.get(
    "/api/v1/students/:studentId",
    { preHandler: [fastify.authenticate, fastify.consentGate, relationalAuthz] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = StudentProfileParamsSchema.parse(request.params);
      const profile = await studentService.getProfileById(params.studentId);
      return reply.send({ data: profile });
    }
  );

  // PUT /api/v1/students/me
  fastify.put(
    "/api/v1/students/me",
    { preHandler: [fastify.authenticate, fastify.consentGate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const dto = UpdateStudentProfileSchema.parse(request.body);
      const updated = await studentService.updateProfile(user.userId, dto);
      return reply.send({ message: "Profil berhasil diperbarui", data: updated });
    }
  );
}
