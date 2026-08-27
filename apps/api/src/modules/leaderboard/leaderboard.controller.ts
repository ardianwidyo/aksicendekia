import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { LeaderboardService } from './leaderboard.service';
import {
  classLeaderboardParamSchema,
  updateStudentPrivacySchema,
  parentPrivacyLockParamSchema,
  parentPrivacyLockSchema
} from './leaderboard.schema';
import { ForbiddenError } from '../../common/errors/app-error';
import { TokenPayload } from '../../types/fastify';

function requireUser(req: FastifyRequest): TokenPayload {
  const user = req.user as TokenPayload | undefined;
  if (!user) {
    throw new ForbiddenError('Autentikasi gagal atau token tidak ditemukan');
  }
  return user;
}

export function registerLeaderboardRoutes(
  app: FastifyInstance,
  service: LeaderboardService
) {
  // 1. GET /api/v1/classes/:classId/leaderboard
  app.get(
    '/api/v1/classes/:classId/leaderboard',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireUser(req);
      const params = classLeaderboardParamSchema.parse(req.params);

      const result = await service.getClassLeaderboard(
        params.classId,
        user.userId,
        user.role
      );
      return reply.status(200).send({
        success: true,
        data: result
      });
    }
  );

  // 2. GET /api/v1/students/me/privacy
  app.get(
    '/api/v1/students/me/privacy',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireUser(req);
      const result = await service.getStudentPrivacy(user.userId);
      return reply.status(200).send({
        success: true,
        data: result
      });
    }
  );

  // 3. PATCH /api/v1/students/me/privacy
  app.patch(
    '/api/v1/students/me/privacy',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireUser(req);
      const body = updateStudentPrivacySchema.parse(req.body);

      const result = await service.updateStudentPrivacy(
        user.userId,
        body.isHiddenFromLeaderboard
      );
      return reply.status(200).send({
        success: true,
        data: result
      });
    }
  );

  // 4. PATCH /api/v1/parents/students/:studentId/privacy-lock
  app.patch(
    '/api/v1/parents/students/:studentId/privacy-lock',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireUser(req);
      const params = parentPrivacyLockParamSchema.parse(req.params);
      const body = parentPrivacyLockSchema.parse(req.body);

      if (user.role !== 'ORANG_TUA') {
        throw new ForbiddenError('Hanya akun Orang Tua yang dapat mengunci pengaturan privasi siswa');
      }

      const result = await service.setParentPrivacyLock(
        user.userId,
        params.studentId,
        body.isPrivacyLocked,
        body.overrideIsHiddenFromLeaderboard
      );
      return reply.status(200).send({
        success: true,
        data: result
      });
    }
  );
}
