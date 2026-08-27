import { PrismaClient, PaymentStatus, SubscriptionStatus, InvoiceStatus } from "@prisma/client";
import { PaymentGatewayWebhookInput } from "./payments.dto";
import { PaymentSignatureVerifier } from "./payment-signature.verifier";
import { UnauthorizedError, NotFoundError, ForbiddenError } from "../../common/errors/app-error";

export class PaymentService {
  constructor(private prisma: PrismaClient) {}

  async handleWebhook(payload: PaymentGatewayWebhookInput) {
    const serverKey = process.env.PAYMENT_GATEWAY_SERVER_KEY || "sample-server-key-dev";

    // 1. Verify Signature
    const isValidSignature = PaymentSignatureVerifier.verifyMidtransSignature(
      payload.order_id,
      payload.status_code,
      payload.gross_amount,
      payload.signature_key,
      serverKey
    );

    if (!isValidSignature) {
      throw new UnauthorizedError("Signature webhook tidak valid", "INVALID_WEBHOOK_SIGNATURE");
    }

    // 2. Fetch PaymentTransaction record
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { orderId: payload.order_id },
      include: {
        subscription: true,
        user: true,
      },
    });

    if (!transaction) {
      throw new NotFoundError("Transaksi tidak ditemukan", "TRANSACTION_NOT_FOUND");
    }

    // 3. Absolute Idempotency Check
    if (transaction.status === PaymentStatus.SETTLED) {
      return {
        status: "OK",
        message: "Webhook diproses secara idempoten (transaksi sudah diselesaikan sebelumnya)",
        idempotent: true,
      };
    }

    const isSuccessStatus = payload.transaction_status === "settlement" || payload.transaction_status === "capture";

    if (isSuccessStatus) {
      const now = new Date();

      // Update Transaction status to SETTLED
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.SETTLED,
          gatewayTransactionId: payload.transaction_id || `GW-TX-${payload.order_id}`,
          paidAt: now,
          rawGatewayResponse: payload as any,
        },
      });

      // Calculate Subscription duration and new endsAt timestamp
      const sub = transaction.subscription;
      const durationDays = sub.billingCycle === "ANNUAL" ? 365 : 30;
      const baseStart = sub.endsAt && sub.endsAt > now ? sub.endsAt : now;
      const newEndsAt = new Date(baseStart.getTime() + durationDays * 24 * 60 * 60 * 1000);

      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          startsAt: now,
          endsAt: newEndsAt,
          gracePeriodEndsAt: null,
          autoRenew: true,
        },
      });

      // Generate Digital Invoice
      const invoiceNumber = `INV/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/AC-${transaction.id.substring(0, 6).toUpperCase()}`;
      const subtotalIdr = transaction.grossAmountIdr - transaction.taxAmountIdr;

      await this.prisma.invoice.create({
        data: {
          invoiceNumber,
          paymentTransactionId: transaction.id,
          userId: transaction.userId,
          subtotalIdr,
          taxIdr: transaction.taxAmountIdr,
          totalIdr: transaction.grossAmountIdr,
          billingName: transaction.user.email.split("@")[0],
          billingEmail: transaction.user.email,
          status: InvoiceStatus.PAID,
          issuedAt: now,
        },
      });

      return {
        status: "OK",
        message: "Pembayaran berhasil dikonfirmasi dan langganan Pro telah diaktifkan",
        idempotent: false,
      };
    } else if (payload.transaction_status === "expire" || payload.transaction_status === "cancel" || payload.transaction_status === "deny") {
      await this.prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.FAILED,
          rawGatewayResponse: payload as any,
        },
      });

      return {
        status: "OK",
        message: "Transaksi dibatalkan atau kedaluwarsa",
        idempotent: false,
      };
    }

    return { status: "OK", message: "Status transaksi diperbarui", idempotent: false };
  }

  async getPaymentHistory(userId: string) {
    const transactions = await this.prisma.paymentTransaction.findMany({
      where: { userId },
      include: {
        subscription: {
          include: { plan: true },
        },
        invoice: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      transactions: transactions.map((t) => ({
        id: t.id,
        orderId: t.orderId,
        planName: t.subscription.plan.name,
        grossAmountIdr: t.grossAmountIdr,
        taxAmountIdr: t.taxAmountIdr,
        paymentMethod: t.paymentMethod,
        status: t.status,
        paidAt: t.paidAt,
        createdAt: t.createdAt,
        invoiceId: t.invoice?.id || null,
        invoiceNumber: t.invoice?.invoiceNumber || null,
      })),
    };
  }

  async getInvoiceDetail(userId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        transaction: {
          include: {
            subscription: {
              include: { plan: true },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundError("Invoice tidak ditemukan");
    }

    if (invoice.userId !== userId) {
      throw new ForbiddenError("Anda tidak berhak mengakses invoice ini");
    }

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      orderId: invoice.transaction.orderId,
      billingName: invoice.billingName,
      billingEmail: invoice.billingEmail,
      planName: invoice.transaction.subscription.plan.name,
      billingCycle: invoice.transaction.subscription.billingCycle,
      subtotalIdr: invoice.subtotalIdr,
      taxIdr: invoice.taxIdr,
      totalIdr: invoice.totalIdr,
      paymentMethod: invoice.transaction.paymentMethod,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
    };
  }
}
