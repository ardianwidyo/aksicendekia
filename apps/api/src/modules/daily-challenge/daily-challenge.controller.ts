import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { DailyChallengeService } from './daily-challenge.service';
import { claimChallengeParamSchema } from './daily-challenge.schema';
import { ForbiddenError } from '../../common/errors/app-error';
import { TokenPayload } from '../../types/fastify';

function requireUser(req: FastifyRequest): TokenPayload {
  const user = req.user as TokenPayload | undefined;
  if (!user) {
    throw new ForbiddenError('Autentikasi gagal atau token tidak ditemukan');
  }
  return user;
}

export function registerDailyChallengeRoutes(
  app: FastifyInstance,
  service: DailyChallengeService
) {
  // 1. GET /api/v1/daily-challenges/today
  app.get(
    '/api/v1/daily-challenges/today',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireUser(req);
      const challenge = await service.getTodayChallenge(user.userId);
      return reply.status(200).send({
        success: true,
        data: challenge
      });
    }
  );

  // 2. POST /api/v1/daily-challenges/:challengeId/claim
  app.post(
    '/api/v1/daily-challenges/:challengeId/claim',
    { preHandler: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = requireUser(req);
      const params = claimChallengeParamSchema.parse(req.params);

      const result = await service.claimReward(user.userId, params.challengeId);
      return reply.status(200).send(result);
    }
  );
}
