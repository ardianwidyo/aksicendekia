import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { GuestSyncService } from "./guest-sync.service.js";
import { GuestSyncRequestSchema } from "./guest-sync.schema.js";
import { TokenPayload } from "../../types/fastify.js";

export function registerGuestSyncRoutes(app: FastifyInstance, service: GuestSyncService) {
  app.post(
    "/api/v1/sync/guest-progress",
    {
      preHandler: [app.authenticate],
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 hour",
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = req.user as TokenPayload;
      const body = GuestSyncRequestSchema.parse(req.body);
      const result = await service.syncProgress(user.userId, body);
      return reply.status(200).send(result);
    }
  );
}
