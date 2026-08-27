import { z } from "zod";

export const CheckoutSubscriptionSchema = z.object({
  planCode: z.enum(["PRO_PERSONAL", "PRO_FAMILY"]),
  billingCycle: z.enum(["MONTHLY", "ANNUAL"]),
  paymentMethod: z.enum(["EWALLET", "VIRTUAL_ACCOUNT", "CREDIT_CARD", "QRIS", "BANK_TRANSFER"]),
  customerDetails: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
  }).optional(),
});

export type CheckoutSubscriptionInput = z.infer<typeof CheckoutSubscriptionSchema>;
