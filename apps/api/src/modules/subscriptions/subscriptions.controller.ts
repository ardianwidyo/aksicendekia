import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { SubscriptionService } from "./subscriptions.service";
import { CheckoutSubscriptionSchema } from "./subscriptions.dto";

export function registerSubscriptionRoutes(app: FastifyInstance, subscriptionService: SubscriptionService) {
  app.post(
    "/api/v1/subscriptions/checkout",
    {
      preHandler: [app.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as { id: string };
      const body = CheckoutSubscriptionSchema.parse(request.body);
      const result = await subscriptionService.createCheckoutSession(user.id, body);
      return reply.status(201).send(result);
    }
  );

  app.post(
    "/api/v1/subscriptions/cancel",
    {
      preHandler: [app.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as { id: string };
      const result = await subscriptionService.cancelAutoRenew(user.id);
      return reply.send(result);
    }
  );
}
