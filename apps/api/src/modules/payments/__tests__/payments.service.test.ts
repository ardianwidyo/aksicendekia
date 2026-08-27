import { describe, it, expect, beforeEach, vi } from "vitest";
import { PaymentService } from "../payments.service";
import { PaymentSignatureVerifier } from "../payment-signature.verifier";
import { createHash } from "crypto";
import { PaymentStatus, SubscriptionStatus, InvoiceStatus } from "@prisma/client";
import { UnauthorizedError } from "../../../common/errors/app-error";

describe("PaymentSignatureVerifier", () => {
  const orderId = "AC-ORDER-123";
  const statusCode = "200";
  const grossAmount = "49000.00";
  const serverKey = "sample-server-key";

  it("should verify valid SHA-512 signature", () => {
    const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const validSignature = createHash("sha512").update(raw).digest("hex");

    const isValid = PaymentSignatureVerifier.verifyMidtransSignature(
      orderId,
      statusCode,
      grossAmount,
      validSignature,
      serverKey
    );

    expect(isValid).toBe(true);
  });

  it("should reject invalid / tampered signature", () => {
    const isValid = PaymentSignatureVerifier.verifyMidtransSignature(
      orderId,
      statusCode,
      grossAmount,
      "invalid-signature-hash",
      serverKey
    );

    expect(isValid).toBe(false);
  });
});

describe("PaymentService", () => {
  let paymentService: PaymentService;
  let mockPrisma: any;
  const serverKey = "sample-server-key-dev";

  beforeEach(() => {
    mockPrisma = {
      paymentTransaction: {
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      subscription: {
        update: vi.fn(),
      },
      invoice: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
    };

    paymentService = new PaymentService(mockPrisma);
  });

  it("should reject webhook request if signature is invalid", async () => {
    await expect(
      paymentService.handleWebhook({
        order_id: "AC-123",
        status_code: "200",
        gross_amount: "49000",
        signature_key: "invalid-signature",
        transaction_status: "settlement",
      })
    ).rejects.toThrow(UnauthorizedError);
  });

  it("should process settlement webhook, activate subscription, and create digital invoice", async () => {
    const orderId = "AC-SUB-999";
    const statusCode = "200";
    const grossAmount = "99000";
    const rawSignature = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const validSignature = createHash("sha512").update(rawSignature).digest("hex");

    mockPrisma.paymentTransaction.findUnique.mockResolvedValue({
      id: "tx-999",
      orderId,
      subscriptionId: "sub-999",
      userId: "user-999",
      grossAmountIdr: 99000,
      taxAmountIdr: 9811,
      status: PaymentStatus.PENDING,
      subscription: {
        id: "sub-999",
        billingCycle: "MONTHLY",
        endsAt: null,
      },
      user: {
        email: "ortu@aksicendekia.id",
      },
    });

    mockPrisma.paymentTransaction.update.mockResolvedValue({ id: "tx-999", status: PaymentStatus.SETTLED });
    mockPrisma.subscription.update.mockResolvedValue({ id: "sub-999", status: SubscriptionStatus.ACTIVE });
    mockPrisma.invoice.create.mockResolvedValue({ id: "inv-999", invoiceNumber: "INV/2026/08/AC-TX-999" });

    const result = await paymentService.handleWebhook({
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: validSignature,
      transaction_status: "settlement",
      transaction_id: "GW-TX-1001",
    });

    expect(result.status).toBe("OK");
    expect(result.idempotent).toBe(false);
    expect(mockPrisma.paymentTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "tx-999" },
        data: expect.objectContaining({ status: PaymentStatus.SETTLED }),
      })
    );
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sub-999" },
        data: expect.objectContaining({ status: SubscriptionStatus.ACTIVE }),
      })
    );
    expect(mockPrisma.invoice.create).toHaveBeenCalled();
  });

  it("should be absolute idempotent when repeated webhook is received for SETTLED transaction", async () => {
    const orderId = "AC-SUB-888";
    const statusCode = "200";
    const grossAmount = "49000";
    const rawSignature = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const validSignature = createHash("sha512").update(rawSignature).digest("hex");

    // Transaction already SETTLED in DB
    mockPrisma.paymentTransaction.findUnique.mockResolvedValue({
      id: "tx-888",
      orderId,
      status: PaymentStatus.SETTLED,
      subscription: { id: "sub-888" },
      user: { email: "user@aksicendekia.id" },
    });

    const result = await paymentService.handleWebhook({
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: validSignature,
      transaction_status: "settlement",
    });

    expect(result.status).toBe("OK");
    expect(result.idempotent).toBe(true);
    expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
    expect(mockPrisma.invoice.create).not.toHaveBeenCalled();
  });
});
