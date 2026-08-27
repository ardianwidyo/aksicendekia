import { PrismaClient, PlanTier, BillingCycle, PaymentMethod, SubscriptionStatus, PaymentStatus } from "@prisma/client";
import { NotFoundError, ForbiddenError } from "../../common/errors/app-error";
import { CheckoutSubscriptionInput } from "./subscriptions.dto";
import { randomUUID } from "crypto";

export class SubscriptionService {
  constructor(private prisma: PrismaClient) {}

  async createCheckoutSession(userId: string, input: CheckoutSubscriptionInput) {
    const now = new Date();

    // 1. Fetch requested target plan
    const targetPlan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: input.planCode },
    });

    if (!targetPlan || !targetPlan.isActive) {
      throw new NotFoundError("Paket langganan tidak ditemukan atau tidak aktif");
    }

    // 2. Fetch current user subscription if any
    const activeSub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] },
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    // Determine plan base price
    const newPlanBasePrice = input.billingCycle === BillingCycle.ANNUAL
      ? targetPlan.priceAnnualIdr
      : targetPlan.priceMonthlyIdr;

    let proratedCreditIdr = 0;

    // 3. Handle Mid-Cycle Upgrade Prorated Credit (PRO_PERSONAL -> PRO_FAMILY)
    if (activeSub && activeSub.status === SubscriptionStatus.ACTIVE && activeSub.endsAt > now) {
      if (activeSub.plan.code === PlanTier.PRO_PERSONAL && input.planCode === PlanTier.PRO_FAMILY) {
        const msRemaining = activeSub.endsAt.getTime() - now.getTime();
        const daysRemaining = Math.max(0, msRemaining / (1000 * 60 * 60 * 24));
        const totalPeriodDays = activeSub.billingCycle === BillingCycle.ANNUAL ? 365 : 30;
        const prevPlanPrice = activeSub.billingCycle === BillingCycle.ANNUAL
          ? activeSub.plan.priceAnnualIdr
          : activeSub.plan.priceMonthlyIdr;

        const dailyRate = prevPlanPrice / totalPeriodDays;
        proratedCreditIdr = Math.round(daysRemaining * dailyRate);
      } else if (activeSub.plan.code === input.planCode) {
        // Renewal of same plan
        proratedCreditIdr = 0;
      }
    }

    const netBaseAmount = Math.max(0, newPlanBasePrice - proratedCreditIdr);
    const taxAmountIdr = Math.round(netBaseAmount * 0.11); // PPN 11%
    const grossAmountIdr = netBaseAmount + taxAmountIdr;

    // 4. Create new Subscription record in PENDING_PAYMENT status
    const durationDays = input.billingCycle === BillingCycle.ANNUAL ? 365 : 30;
    const startsAt = now;
    const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId: targetPlan.id,
        billingCycle: input.billingCycle,
        status: SubscriptionStatus.PENDING_PAYMENT,
        startsAt,
        endsAt,
        autoRenew: true,
      },
    });

    // 5. Generate unique Order ID
    const orderId = `AC-SUB-${Date.now()}-${randomUUID().substring(0, 8).toUpperCase()}`;
    const snapToken = `SNAP-TOKEN-${orderId}`;
    const snapRedirectUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${snapToken}`;

    // 6. Record PaymentTransaction ledger
    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        orderId,
        subscriptionId: subscription.id,
        userId,
        grossAmountIdr,
        taxAmountIdr,
        paymentMethod: input.paymentMethod,
        snapToken,
        snapRedirectUrl,
        status: PaymentStatus.PENDING,
      },
    });

    return {
      orderId: transaction.orderId,
      subscriptionId: subscription.id,
      grossAmountIdr: transaction.grossAmountIdr,
      taxAmountIdr: transaction.taxAmountIdr,
      proratedCreditIdr,
      snapToken: transaction.snapToken,
      snapRedirectUrl: transaction.snapRedirectUrl,
    };
  }

  async cancelAutoRenew(userId: string) {
    const activeSub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activeSub) {
      throw new NotFoundError("Tidak ditemukan langganan aktif untuk dibatalkan");
    }

    const updated = await this.prisma.subscription.update({
      where: { id: activeSub.id },
      data: {
        autoRenew: false,
        status: SubscriptionStatus.CANCELED,
      },
    });

    return {
      success: true,
      message: "Perpanjangan otomatis berhasil dibatalkan. Akses Pro tetap berlaku hingga akhir periode.",
      endsAt: updated.endsAt,
    };
  }

  async expireStalePendingTransactions() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    const staleTransactions = await this.prisma.paymentTransaction.findMany({
      where: {
        status: PaymentStatus.PENDING,
        createdAt: { lt: cutoff },
      },
    });

    for (const tx of staleTransactions) {
      await this.prisma.paymentTransaction.update({
        where: { id: tx.id },
        data: { status: PaymentStatus.EXPIRED },
      });

      await this.prisma.subscription.update({
        where: { id: tx.subscriptionId },
        data: { status: SubscriptionStatus.EXPIRED },
      });
    }

    return { expiredCount: staleTransactions.length };
  }
}
