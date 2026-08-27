import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { EntitlementService } from "./entitlements.service";

export function registerEntitlementRoutes(app: FastifyInstance, entitlementService: EntitlementService) {
  app.get(
    "/api/v1/entitlements/me",
    {
      preHandler: [app.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as { id: string };
      const entitlements = await entitlementService.getUserEntitlements(user.id);
      return reply.send(entitlements);
    }
  );
}
