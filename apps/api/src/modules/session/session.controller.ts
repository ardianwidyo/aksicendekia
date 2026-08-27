import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SessionService } from './session.service';
import { ForbiddenError, AppError } from '../../common/errors/app-error';
import { TokenPayload } from '../../types/fastify';
import {
  createSessionSchema,
  submitAnswerSchema,
  getHintSchema,
  sessionHistoryQuerySchema
} from './session.schema';

function requireStudent(req: FastifyRequest): TokenPayload {
  const user = req.user as TokenPayload | undefined;
  if (!user) {
    throw new ForbiddenError('Autentikasi gagal atau token tidak ditemukan');
  }
  return user;
}

export function registerSessionRoutes(app: FastifyInstance, service: SessionService) {
  // 1. POST /api/v1/sessions - Inisialisasi Sesi Belajar Baru
  app.post(
    '/api/v1/sessions',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireStudent(req);
      const body = createSessionSchema.parse(req.body);
      const result = await service.createSession(user.userId, body.lessonId);
      return reply.status(201).send(result);
    }
  );

  // 2. GET /api/v1/sessions/:id - Ambil Sesi & Soal Aktif
  app.get(
    '/api/v1/sessions/:id',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireStudent(req);
      const { id } = req.params as { id: string };
      const result = await service.getActiveSession(user.userId, id);
      return reply.status(200).send(result);
    }
  );

  // 3. POST /api/v1/sessions/:id/answers - Submisi Jawaban Soal
  app.post(
    '/api/v1/sessions/:id/answers',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireStudent(req);
      const { id } = req.params as { id: string };
      const idempotencyKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string;

      if (!idempotencyKey) {
        throw new AppError('Header Idempotency-Key wajib disertakan', 400, 'BAD_REQUEST');
      }

      const body = submitAnswerSchema.parse(req.body);
      const result = await service.submitAnswer(
        user.userId,
        id,
        body,
        idempotencyKey
      );
      return reply.status(200).send(result);
    }
  );

  // 4. POST /api/v1/sessions/:id/hints - Minta Petunjuk Bertingkat
  app.post(
    '/api/v1/sessions/:id/hints',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireStudent(req);
      const { id } = req.params as { id: string };
      const body = getHintSchema.parse(req.body);
      const result = await service.getHint(user.userId, id, body.questionId);
      return reply.status(200).send(result);
    }
  );

  // 5. POST /api/v1/sessions/:id/pause - Jeda Sesi
  app.post(
    '/api/v1/sessions/:id/pause',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireStudent(req);
      const { id } = req.params as { id: string };
      const result = await service.pauseSession(user.userId, id);
      return reply.status(200).send(result);
    }
  );

  // 6. POST /api/v1/sessions/:id/resume - Lanjutkan Sesi
  app.post(
    '/api/v1/sessions/:id/resume',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireStudent(req);
      const { id } = req.params as { id: string };
      const result = await service.resumeSession(user.userId, id);
      return reply.status(200).send(result);
    }
  );

  // 7. POST /api/v1/sessions/:id/complete - Penyelesaian Sesi
  app.post(
    '/api/v1/sessions/:id/complete',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireStudent(req);
      const { id } = req.params as { id: string };
      const result = await service.completeSession(user.userId, id);
      return reply.status(200).send(result);
    }
  );

  // 8. GET /api/v1/students/me/sessions - Riwayat Sesi Siswa
  app.get(
    '/api/v1/students/me/sessions',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireStudent(req);
      const query = sessionHistoryQuerySchema.parse(req.query);
      const result = await service.getStudentSessionHistory(user.userId, query.page, query.limit);
      return reply.status(200).send(result);
    }
  );

  // 9. GET /api/v1/sessions/:id/history - Detail Riwayat Sesi
  app.get(
    '/api/v1/sessions/:id/history',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireStudent(req);
      const { id } = req.params as { id: string };
      const result = await service.completeSession(user.userId, id);
      return reply.status(200).send(result);
    }
  );
}
