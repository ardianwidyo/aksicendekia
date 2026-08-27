import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProgressService } from './progress.service';
import { consumePowerupSchema, missionMapParamSchema } from './progress.schema';
import { ForbiddenError, AppError } from '../../common/errors/app-error';
import { TokenPayload } from '../../types/fastify';

function requireUser(req: FastifyRequest): TokenPayload {
  const user = req.user as TokenPayload | undefined;
  if (!user) {
    throw new ForbiddenError('Autentikasi gagal atau token tidak ditemukan');
  }
  return user;
}

export function registerProgressRoutes(app: FastifyInstance, service: ProgressService) {
  // 1. GET /api/v1/curriculum/subjects/:subjectId/mission-map - Ambil Graf Simpul Peta Misi
  app.get(
    '/api/v1/curriculum/subjects/:subjectId/mission-map',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireUser(req);
      const params = missionMapParamSchema.parse(req.params);

      // PDP Authorization Check: Hanya SISWA bersangkutan, ORANG_TUA, GURU, atau ADMIN
      const result = await service.getMissionMap(params.subjectId, user.userId);
      return reply.status(200).send(result);
    }
  );

  // 2. GET /api/v1/students/achievements - Dashboard Halaman Pencapaian Siswa
  app.get(
    '/api/v1/students/achievements',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireUser(req);
      const result = await service.getStudentAchievements(user.userId);
      return reply.status(200).send(result);
    }
  );

  // 3. POST /api/v1/powerups/consume - Konsumsi Token Power-up
  app.post(
    '/api/v1/powerups/consume',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireUser(req);
      const body = consumePowerupSchema.parse(req.body);

      try {
        const result = await service.consumePowerup(
          user.userId,
          body.powerupType,
          body.sessionId
        );
        return reply.status(200).send(result);
      } catch (err: any) {
        if (err.message && err.message.startsWith('INSUFFICIENT_POWERUP')) {
          throw new AppError(err.message, 400, 'INSUFFICIENT_POWERUP');
        }
        throw err;
      }
    }
  );
}
