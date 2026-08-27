import { describe, it, expect, beforeEach, vi } from "vitest";
import { SubscriptionService } from "../subscriptions.service";
import { PlanTier, BillingCycle, PaymentMethod, SubscriptionStatus, PaymentStatus } from "@prisma/client";

describe("SubscriptionService", () => {
  let subscriptionService: SubscriptionService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      subscriptionPlan: {
        findUnique: vi.fn(),
      },
      subscription: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      paymentTransaction: {
        create: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };

    subscriptionService = new SubscriptionService(mockPrisma);
  });

  it("should create a new checkout session with 11% PPN tax", async () => {
    mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({
      id: "plan-pro-personal",
      code: PlanTier.PRO_PERSONAL,
      priceMonthlyIdr: 49000,
      priceAnnualIdr: 490000,
      isActive: true,
    });
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.subscription.create.mockResolvedValue({
      id: "sub-123",
      userId: "user-1",
      planId: "plan-pro-personal",
      status: SubscriptionStatus.PENDING_PAYMENT,
    });
    mockPrisma.paymentTransaction.create.mockImplementation((args: any) => Promise.resolve({
      ...args.data,
      id: "tx-123",
    }));

    const result = await subscriptionService.createCheckoutSession("user-1", {
      planCode: PlanTier.PRO_PERSONAL,
      billingCycle: BillingCycle.MONTHLY,
      paymentMethod: PaymentMethod.QRIS,
    });

    expect(result.orderId).toContain("AC-SUB-");
    expect(result.grossAmountIdr).toBe(49000 + Math.round(49000 * 0.11)); // 49000 + 5390 = 54390
    expect(result.taxAmountIdr).toBe(5390);
    expect(result.proratedCreditIdr).toBe(0);
    expect(result.snapToken).toBeDefined();
  });

  it("should calculate prorated credit when upgrading PRO_PERSONAL to PRO_FAMILY mid-cycle", async () => {
    const now = new Date();
    const fifteenDaysLater = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({
      id: "plan-pro-family",
      code: PlanTier.PRO_FAMILY,
      priceMonthlyIdr: 99000,
      priceAnnualIdr: 990000,
      isActive: true,
    });

    // Active PRO_PERSONAL sub with 15 days remaining
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: "sub-old",
      userId: "user-1",
      status: SubscriptionStatus.ACTIVE,
      billingCycle: BillingCycle.MONTHLY,
      endsAt: fifteenDaysLater,
      plan: {
        code: PlanTier.PRO_PERSONAL,
        priceMonthlyIdr: 49000,
        priceAnnualIdr: 490000,
      },
    });

    mockPrisma.subscription.create.mockResolvedValue({ id: "sub-new" });
    mockPrisma.paymentTransaction.create.mockImplementation((args: any) => Promise.resolve({
      ...args.data,
      id: "tx-new",
    }));

    const result = await subscriptionService.createCheckoutSession("user-1", {
      planCode: PlanTier.PRO_FAMILY,
      billingCycle: BillingCycle.MONTHLY,
      paymentMethod: PaymentMethod.EWALLET,
    });

    // 15 days left out of 30 days = 15/30 * 49000 = 24500 credit
    expect(result.proratedCreditIdr).toBeGreaterThan(24000);
    expect(result.proratedCreditIdr).toBeLessThan(25000);
    // Net base = 99000 - ~24500 = ~74500
    // Gross total = Net base + 11% PPN
    expect(result.grossAmountIdr).toBeLessThan(99000 * 1.11);
  });

  it("should cancel auto-renewal for active subscription", async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: "sub-active",
      status: SubscriptionStatus.ACTIVE,
      endsAt: new Date(),
    });
    mockPrisma.subscription.update.mockResolvedValue({
      id: "sub-active",
      autoRenew: false,
      status: SubscriptionStatus.CANCELED,
      endsAt: new Date(),
    });

    const result = await subscriptionService.cancelAutoRenew("user-1");
    expect(result.success).toBe(true);
    expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
      where: { id: "sub-active" },
      data: { autoRenew: false, status: SubscriptionStatus.CANCELED },
    });
  });
});
