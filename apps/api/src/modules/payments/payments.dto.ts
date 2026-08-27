import { z } from "zod";

export const PaymentGatewayWebhookSchema = z.object({
  order_id: z.string().min(1),
  status_code: z.string(),
  gross_amount: z.string(),
  signature_key: z.string().min(1),
  transaction_status: z.enum(["capture", "settlement", "pending", "deny", "expire", "cancel"]),
  payment_type: z.string().optional(),
  transaction_id: z.string().optional(),
  transaction_time: z.string().optional(),
  fraud_status: z.string().optional(),
});

export type PaymentGatewayWebhookInput = z.infer<typeof PaymentGatewayWebhookSchema>;
