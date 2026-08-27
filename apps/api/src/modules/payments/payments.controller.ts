import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PaymentService } from "./payments.service";
import { PaymentGatewayWebhookSchema } from "./payments.dto";

export function registerPaymentRoutes(app: FastifyInstance, paymentService: PaymentService) {
  // Public webhook handler endpoint (verifies signature internally)
  app.post("/api/v1/payments/webhook", async (request: FastifyRequest, reply: FastifyReply) => {
    const body = PaymentGatewayWebhookSchema.parse(request.body);
    const result = await paymentService.handleWebhook(body);
    return reply.status(200).send(result);
  });

  // Authenticated user transaction history
  app.get(
    "/api/v1/payments/history",
    {
      preHandler: [app.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as { id: string };
      const history = await paymentService.getPaymentHistory(user.id);
      return reply.send(history);
    }
  );

  // Authenticated user digital invoice details
  app.get(
    "/api/v1/payments/invoices/:invoiceId",
    {
      preHandler: [app.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as { id: string };
      const { invoiceId } = request.params as { invoiceId: string };
      const invoice = await paymentService.getInvoiceDetail(user.id, invoiceId);
      return reply.send(invoice);
    }
  );
}
