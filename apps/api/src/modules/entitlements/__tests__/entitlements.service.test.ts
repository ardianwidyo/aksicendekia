import { describe, it, expect, beforeEach, vi } from "vitest";
import { EntitlementService } from "../entitlements.service";
import { PlanTier, EntitlementKey } from "@prisma/client";
import { PaywallLimitError } from "../../../common/errors/app-error";

describe("EntitlementService", () => {
  let entitlementService: EntitlementService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      subscription: {
        findFirst: vi.fn(),
      },
      parentChildLink: {
        findFirst: vi.fn(),
      },
      subscriptionPlan: {
        findUnique: vi.fn(),
      },
      studentProgress: {
        findUnique: vi.fn(),
      },
      learningSession: {
        count: vi.fn(),
      },
      powerupTransaction: {
        count: vi.fn(),
      },
    };

    entitlementService = new EntitlementService(mockPrisma);
  });

  it("should return DEFAULT_FREE entitlements when user has no active subscription", async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.parentChildLink.findFirst.mockResolvedValue(null);
    mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({
      code: PlanTier.FREE,
      entitlements: [
        { entitlementKey: EntitlementKey.DAILY_SESSION_LIMIT, entitlementValue: "3" },
        { entitlementKey: EntitlementKey.SUBJECT_ACCESS_TIER, entitlementValue: "BASIC" },
        { entitlementKey: EntitlementKey.DAILY_POWERUP_ALLOWANCE, entitlementValue: "1" },
        { entitlementKey: EntitlementKey.PARENT_REPORT_DEPTH, entitlementValue: "SUMMARY_ONLY" },
        { entitlementKey: EntitlementKey.FAMILY_MEMBER_CAPACITY, entitlementValue: "0" },
      ],
    });
    mockPrisma.studentProgress.findUnique.mockResolvedValue({ timezone: "Asia/Jakarta" });
    mockPrisma.learningSession.count.mockResolvedValue(1);
    mockPrisma.powerupTransaction.count.mockResolvedValue(0);

    const result = await entitlementService.getUserEntitlements("user-1");

    expect(result.tier).toBe(PlanTier.FREE);
    expect(result.source).toBe("DEFAULT_FREE");
    expect(result.isProActive).toBe(false);
    expect(result.entitlements.dailySessionLimit).toBe(3);
    expect(result.entitlements.dailySessionsUsed).toBe(1);
  });

  it("should return DIRECT active subscription entitlements for PRO_PERSONAL user", async () => {
    const futureDate = new Date(Date.now() + 86400000 * 30);
    mockPrisma.subscription.findFirst.mockResolvedValue({
      status: "ACTIVE",
      endsAt: futureDate,
      gracePeriodEndsAt: null,
      plan: {
        code: PlanTier.PRO_PERSONAL,
        entitlements: [
          { entitlementKey: EntitlementKey.DAILY_SESSION_LIMIT, entitlementValue: "-1" },
          { entitlementKey: EntitlementKey.SUBJECT_ACCESS_TIER, entitlementValue: "ALL" },
          { entitlementKey: EntitlementKey.DAILY_POWERUP_ALLOWANCE, entitlementValue: "5" },
          { entitlementKey: EntitlementKey.PARENT_REPORT_DEPTH, entitlementValue: "FULL_ANALYTICS" },
          { entitlementKey: EntitlementKey.FAMILY_MEMBER_CAPACITY, entitlementValue: "0" },
        ],
      },
    });
    mockPrisma.studentProgress.findUnique.mockResolvedValue({ timezone: "Asia/Jakarta" });
    mockPrisma.learningSession.count.mockResolvedValue(10);
    mockPrisma.powerupTransaction.count.mockResolvedValue(2);

    const result = await entitlementService.getUserEntitlements("user-pro");

    expect(result.tier).toBe(PlanTier.PRO_PERSONAL);
    expect(result.source).toBe("DIRECT");
    expect(result.isProActive).toBe(true);
    expect(result.entitlements.dailySessionLimit).toBe(-1);
    expect(result.entitlements.dailySessionsUsed).toBe(10);
  });

  it("should return INHERITED_PARENT entitlements when student has no sub but parent has PRO_FAMILY", async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    const futureDate = new Date(Date.now() + 86400000 * 30);

    mockPrisma.parentChildLink.findFirst.mockResolvedValue({
      parent: {
        subscriptions: [
          {
            status: "ACTIVE",
            endsAt: futureDate,
            gracePeriodEndsAt: null,
            plan: {
              code: PlanTier.PRO_FAMILY,
              entitlements: [
                { entitlementKey: EntitlementKey.DAILY_SESSION_LIMIT, entitlementValue: "-1" },
                { entitlementKey: EntitlementKey.SUBJECT_ACCESS_TIER, entitlementValue: "ALL" },
                { entitlementKey: EntitlementKey.DAILY_POWERUP_ALLOWANCE, entitlementValue: "5" },
                { entitlementKey: EntitlementKey.PARENT_REPORT_DEPTH, entitlementValue: "FULL_ANALYTICS" },
                { entitlementKey: EntitlementKey.FAMILY_MEMBER_CAPACITY, entitlementValue: "5" },
              ],
            },
          },
        ],
      },
    });
    mockPrisma.studentProgress.findUnique.mockResolvedValue({ timezone: "Asia/Jakarta" });
    mockPrisma.learningSession.count.mockResolvedValue(2);
    mockPrisma.powerupTransaction.count.mockResolvedValue(0);

    const result = await entitlementService.getUserEntitlements("student-child-1");

    expect(result.tier).toBe(PlanTier.PRO_FAMILY);
    expect(result.source).toBe("INHERITED_PARENT");
    expect(result.isProActive).toBe(true);
    expect(result.entitlements.dailySessionLimit).toBe(-1);
  });

  it("should throw PaywallLimitError when free user exceeds daily session limit", async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(null);
    mockPrisma.parentChildLink.findFirst.mockResolvedValue(null);
    mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({
      code: PlanTier.FREE,
      entitlements: [
        { entitlementKey: EntitlementKey.DAILY_SESSION_LIMIT, entitlementValue: "3" },
      ],
    });
    mockPrisma.studentProgress.findUnique.mockResolvedValue({ timezone: "Asia/Jakarta" });
    mockPrisma.learningSession.count.mockResolvedValue(3); // 3 out of 3 used
    mockPrisma.powerupTransaction.count.mockResolvedValue(0);

    await expect(
      entitlementService.checkQuotaAccess("user-free", EntitlementKey.DAILY_SESSION_LIMIT)
    ).rejects.toThrow(PaywallLimitError);
  });

  it("should NOT throw when Pro user attempts session even if count > 3", async () => {
    const futureDate = new Date(Date.now() + 86400000 * 30);
    mockPrisma.subscription.findFirst.mockResolvedValue({
      status: "ACTIVE",
      endsAt: futureDate,
      gracePeriodEndsAt: null,
      plan: {
        code: PlanTier.PRO_PERSONAL,
        entitlements: [
          { entitlementKey: EntitlementKey.DAILY_SESSION_LIMIT, entitlementValue: "-1" },
        ],
      },
    });
    mockPrisma.studentProgress.findUnique.mockResolvedValue({ timezone: "Asia/Jakarta" });
    mockPrisma.learningSession.count.mockResolvedValue(10);
    mockPrisma.powerupTransaction.count.mockResolvedValue(0);

    await expect(
      entitlementService.checkQuotaAccess("user-pro", EntitlementKey.DAILY_SESSION_LIMIT)
    ).resolves.not.toThrow();
  });
});
