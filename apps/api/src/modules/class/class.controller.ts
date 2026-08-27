import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ClassService } from "./class.service.js";
import { CreateClassSchema, JoinClassSchema, ClassParamsSchema } from "./class.schema.js";
import { TokenPayload } from "../../types/fastify.js";

export function registerClassRoutes(fastify: FastifyInstance, classService: ClassService) {
  // POST /api/v1/classes
  fastify.post(
    "/api/v1/classes",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const dto = CreateClassSchema.parse(request.body);
      const newClass = await classService.createClass(user.userId, dto.name, dto.educationStage);
      return reply.status(201).send({
        message: "Kelas berhasil dibuat",
        data: newClass,
      });
    }
  );

  // POST /api/v1/classes/join
  fastify.post(
    "/api/v1/classes/join",
    { preHandler: [fastify.authenticate, fastify.consentGate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const dto = JoinClassSchema.parse(request.body);
      const enrollment = await classService.joinClass(user.userId, dto.classCode);
      return reply.send({
        message: "Berhasil bergabung ke kelas",
        data: enrollment,
      });
    }
  );

  // GET /api/v1/classes/:classId/roster
  fastify.get(
    "/api/v1/classes/:classId/roster",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const params = ClassParamsSchema.parse(request.params);
      const roster = await classService.getClassRoster(params.classId);
      return reply.send({ data: roster });
    }
  );

  // GET /api/v1/classes
  fastify.get(
    "/api/v1/classes",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as TokenPayload;
      const classes = await classService.getTeacherClasses(user.userId);
      return reply.send({ data: classes });
    }
  );
}
