import { PrismaClient, PlanTier, EntitlementKey } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedSubscriptionPlans() {
  console.log("🌱 Seeding Subscription Plans & Entitlement Configs...");

  const defaultPlans = [
    {
      code: PlanTier.FREE,
      name: "AksiCendekia Gratis",
      description: "Paket dasar untuk belajar harian dengan fitur terbatas",
      priceMonthlyIdr: 0,
      priceAnnualIdr: 0,
      maxFamilyMembers: 0,
      entitlements: [
        { entitlementKey: EntitlementKey.DAILY_SESSION_LIMIT, entitlementValue: "3" },
        { entitlementKey: EntitlementKey.SUBJECT_ACCESS_TIER, entitlementValue: "BASIC" },
        { entitlementKey: EntitlementKey.DAILY_POWERUP_ALLOWANCE, entitlementValue: "1" },
        { entitlementKey: EntitlementKey.PARENT_REPORT_DEPTH, entitlementValue: "SUMMARY_ONLY" },
        { entitlementKey: EntitlementKey.FAMILY_MEMBER_CAPACITY, entitlementValue: "0" },
      ],
    },
    {
      code: PlanTier.PRO_PERSONAL,
      name: "AksiCendekia Pro Personal",
      description: "Akses tanpa batas untuk 1 siswa dengan analisis mendalam",
      priceMonthlyIdr: 49000,
      priceAnnualIdr: 490000,
      maxFamilyMembers: 0,
      entitlements: [
        { entitlementKey: EntitlementKey.DAILY_SESSION_LIMIT, entitlementValue: "-1" },
        { entitlementKey: EntitlementKey.SUBJECT_ACCESS_TIER, entitlementValue: "ALL" },
        { entitlementKey: EntitlementKey.DAILY_POWERUP_ALLOWANCE, entitlementValue: "5" },
        { entitlementKey: EntitlementKey.PARENT_REPORT_DEPTH, entitlementValue: "FULL_ANALYTICS" },
        { entitlementKey: EntitlementKey.FAMILY_MEMBER_CAPACITY, entitlementValue: "0" },
      ],
    },
    {
      code: PlanTier.PRO_FAMILY,
      name: "AksiCendekia Pro Keluarga",
      description: "Satu langganan orang tua untuk hingga 5 akun anak",
      priceMonthlyIdr: 99000,
      priceAnnualIdr: 990000,
      maxFamilyMembers: 5,
      entitlements: [
        { entitlementKey: EntitlementKey.DAILY_SESSION_LIMIT, entitlementValue: "-1" },
        { entitlementKey: EntitlementKey.SUBJECT_ACCESS_TIER, entitlementValue: "ALL" },
        { entitlementKey: EntitlementKey.DAILY_POWERUP_ALLOWANCE, entitlementValue: "5" },
        { entitlementKey: EntitlementKey.PARENT_REPORT_DEPTH, entitlementValue: "FULL_ANALYTICS" },
        { entitlementKey: EntitlementKey.FAMILY_MEMBER_CAPACITY, entitlementValue: "5" },
      ],
    },
  ];

  for (const planData of defaultPlans) {
    const { entitlements, ...planFields } = planData;

    const plan = await prisma.subscriptionPlan.upsert({
      where: { code: planFields.code },
      update: planFields,
      create: planFields,
    });

    for (const ent of entitlements) {
      await prisma.planEntitlementConfig.upsert({
        where: {
          planId_entitlementKey: {
            planId: plan.id,
            entitlementKey: ent.entitlementKey,
          },
        },
        update: { entitlementValue: ent.entitlementValue },
        create: {
          planId: plan.id,
          entitlementKey: ent.entitlementKey,
          entitlementValue: ent.entitlementValue,
        },
      });
    }
  }

  console.log("✅ Subscription Plans & Entitlements Seeded Successfully!");
}

if (require.main === module) {
  seedSubscriptionPlans()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
