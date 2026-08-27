import { PrismaClient, PlanTier, EntitlementKey } from "@prisma/client";
import { PaywallLimitError } from "../../common/errors/app-error";

export interface UserEntitlementsResult {
  tier: PlanTier;
  source: "DIRECT" | "INHERITED_PARENT" | "DEFAULT_FREE";
  isProActive: boolean;
  endsAt: Date | null;
  entitlements: {
    dailySessionLimit: number; // -1 for unlimited, or e.g. 3
    dailySessionsUsed: number;
    subjectAccessTier: "BASIC" | "ALL";
    dailyPowerupAllowance: number;
    dailyPowerupsUsed: number;
    parentReportDepth: "SUMMARY_ONLY" | "FULL_ANALYTICS";
    familyMemberCapacity: number;
  };
}

export class EntitlementService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Resolves current user entitlements (evaluating direct sub, family inheritance, real-time expiration, and daily quota usage).
   */
  async getUserEntitlements(userId: string): Promise<UserEntitlementsResult> {
    const now = new Date();

    // 1. Check direct active subscription for user
    const directSub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ["ACTIVE", "PAST_DUE", "CANCELED"] },
      },
      include: {
        plan: {
          include: {
            entitlements: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (directSub && this.isSubscriptionValid(directSub, now)) {
      const usage = await this.calculateDailyUsage(userId);
      return this.buildEntitlementsResult(
        directSub.plan.code,
        "DIRECT",
        true,
        directSub.endsAt,
        directSub.plan.entitlements,
        usage
      );
    }

    // 2. If no direct sub, check if user is a Student linked to a Parent with PRO_FAMILY
    const parentLink = await this.prisma.parentChildLink.findFirst({
      where: {
        studentProfile: {
          userId,
        },
      },
      include: {
        parent: {
          include: {
            subscriptions: {
              where: {
                status: { in: ["ACTIVE", "PAST_DUE"] },
              },
              include: {
                plan: {
                  include: {
                    entitlements: true,
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (parentLink && parentLink.parent.subscriptions.length > 0) {
      const parentSub = parentLink.parent.subscriptions[0];
      if (parentSub.plan.code === PlanTier.PRO_FAMILY && this.isSubscriptionValid(parentSub, now)) {
        const usage = await this.calculateDailyUsage(userId);
        return this.buildEntitlementsResult(
          PlanTier.PRO_FAMILY,
          "INHERITED_PARENT",
          true,
          parentSub.endsAt,
          parentSub.plan.entitlements,
          usage
        );
      }
    }

    // 3. Fallback to FREE Tier
    const freePlan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: PlanTier.FREE },
      include: { entitlements: true },
    });

    const usage = await this.calculateDailyUsage(userId);
    const entitlementsList = freePlan?.entitlements || [];

    return this.buildEntitlementsResult(
      PlanTier.FREE,
      "DEFAULT_FREE",
      false,
      null,
      entitlementsList,
      usage
    );
  }

  /**
   * Enforces quota check for a specific entitlement key. Throws PaywallLimitError if quota is exceeded.
   */
  async checkQuotaAccess(
    userId: string,
    entitlementKey: EntitlementKey,
    context?: { subjectId?: string }
  ): Promise<void> {
    const entitlementRes = await this.getUserEntitlements(userId);
    const { entitlements } = entitlementRes;

    if (entitlementKey === EntitlementKey.DAILY_SESSION_LIMIT) {
      if (
        entitlements.dailySessionLimit !== -1 &&
        entitlements.dailySessionsUsed >= entitlements.dailySessionLimit
      ) {
        throw new PaywallLimitError(
          `Batas sesi harian paket gratis (${entitlements.dailySessionsUsed}/${entitlements.dailySessionLimit}) telah tercapai. Tingkatkan ke Pro untuk sesi belajar tanpa batas!`,
          "PAYWALL_LIMIT_REACHED"
        );
      }
    }

    if (entitlementKey === EntitlementKey.DAILY_POWERUP_ALLOWANCE) {
      if (
        entitlements.dailyPowerupAllowance !== -1 &&
        entitlements.dailyPowerupsUsed >= entitlements.dailyPowerupAllowance
      ) {
        throw new PaywallLimitError(
          `Kuota power-up gratis harian (${entitlements.dailyPowerupsUsed}/${entitlements.dailyPowerupAllowance}) telah habis. Tingkatkan ke Pro untuk klaim power-up harian lebih banyak!`,
          "PAYWALL_LIMIT_REACHED"
        );
      }
    }
  }

  private isSubscriptionValid(
    sub: { status: string; endsAt: Date; gracePeriodEndsAt: Date | null },
    now: Date
  ): boolean {
    if (sub.status === "ACTIVE" || sub.status === "CANCELED") {
      return now <= sub.endsAt;
    }
    if (sub.status === "PAST_DUE") {
      return sub.gracePeriodEndsAt !== null && now <= sub.gracePeriodEndsAt;
    }
    return false;
  }

  private async calculateDailyUsage(
    userId: string
  ): Promise<{ dailySessionsUsed: number; dailyPowerupsUsed: number }> {
    const studentProgress = await this.prisma.studentProgress.findUnique({
      where: { studentId: userId },
    });
    const timezoneStr = studentProgress?.timezone || "Asia/Jakarta";

    const now = new Date();
    const todayStr = now.toLocaleDateString("en-CA", { timeZone: timezoneStr });
    const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);

    const dailySessionsUsed = await this.prisma.learningSession.count({
      where: {
        studentId: userId,
        startedAt: { gte: startOfToday },
      },
    });

    const dailyPowerupsUsed = await this.prisma.powerupTransaction.count({
      where: {
        studentId: userId,
        actionType: "EARNED",
        source: "DAILY_CLAIM",
        createdAt: { gte: startOfToday },
      },
    });

    return { dailySessionsUsed, dailyPowerupsUsed };
  }

  private buildEntitlementsResult(
    tier: PlanTier,
    source: "DIRECT" | "INHERITED_PARENT" | "DEFAULT_FREE",
    isProActive: boolean,
    endsAt: Date | null,
    entitlements: Array<{ entitlementKey: EntitlementKey; entitlementValue: string }>,
    usage: { dailySessionsUsed: number; dailyPowerupsUsed: number }
  ): UserEntitlementsResult {
    const getVal = (key: EntitlementKey, fallback: string) => {
      const found = entitlements.find((e) => e.entitlementKey === key);
      return found ? found.entitlementValue : fallback;
    };

    const dailySessionLimit = parseInt(getVal(EntitlementKey.DAILY_SESSION_LIMIT, "3"), 10);
    const subjectAccessTier = (getVal(EntitlementKey.SUBJECT_ACCESS_TIER, "BASIC") as "BASIC" | "ALL");
    const dailyPowerupAllowance = parseInt(getVal(EntitlementKey.DAILY_POWERUP_ALLOWANCE, "1"), 10);
    const parentReportDepth = (getVal(EntitlementKey.PARENT_REPORT_DEPTH, "SUMMARY_ONLY") as "SUMMARY_ONLY" | "FULL_ANALYTICS");
    const familyMemberCapacity = parseInt(getVal(EntitlementKey.FAMILY_MEMBER_CAPACITY, "0"), 10);

    return {
      tier,
      source,
      isProActive,
      endsAt,
      entitlements: {
        dailySessionLimit,
        dailySessionsUsed: usage.dailySessionsUsed,
        subjectAccessTier,
        dailyPowerupAllowance,
        dailyPowerupsUsed: usage.dailyPowerupsUsed,
        parentReportDepth,
        familyMemberCapacity,
      },
    };
  }
}
