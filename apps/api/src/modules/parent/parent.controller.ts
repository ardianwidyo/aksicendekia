import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ParentService } from "./parent.service.js";
import { AddChildSchema, ApproveConsentSchema } from "./parent.schema.js";
import { TokenPayload } from "../../types/fastify.js";

export function registerParentRoutes(fastify: FastifyInstance, parentService: ParentService) {
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
}
