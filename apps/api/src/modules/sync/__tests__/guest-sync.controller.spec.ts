import { describe, it, expect, beforeEach } from "vitest";
import { Role, AccountStatus, EducationStage } from "@prisma/client";
import { createMockPrismaClient } from "../../../__tests__/mock-prisma.js";
import { buildApp } from "../../../app.js";

describe("GuestSync Controller (Feature 009 - US4)", () => {
  let mockPrisma: any;
  let app: any;
  let authToken: string;
  let testUserId: string;

  beforeEach(async () => {
    mockPrisma = createMockPrismaClient();
    app = buildApp(mockPrisma);
    await app.ready();

    // Create a student user
    const user = await mockPrisma.user.create({
      data: {
        email: "student_sync@aksicendekia.id",
        passwordHash: "hash123",
        role: Role.SISWA,
        status: AccountStatus.ACTIVE,
      },
    });
    testUserId = user.id;

    await mockPrisma.studentProfile.create({
      data: {
        userId: user.id,
        displayName: "Budi Siswa",
        educationStage: EducationStage.SD,
        gradeLevel: 1,
        avatarId: "avatar_kancil",
        birthDate: new Date("2018-01-01"),
      },
    });

    // Generate valid JWT token
    authToken = app.jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  });

  it("POST /api/v1/sync/guest-progress menolak akses tanpa token JWT (401)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/sync/guest-progress",
      payload: {
        guestId: "11111111-2222-3333-4444-555555555555",
        totalXp: 50,
        streakCount: 1,
        completedLessonIds: [],
        completedModuleIds: [],
        unlockedBadgeIds: [],
        sessionHistory: [],
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it("POST /api/v1/sync/guest-progress berhasil menggabungkan data progres tamu ke akun siswa terdaftar", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/sync/guest-progress",
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        guestId: "11111111-2222-3333-4444-555555555555",
        totalXp: 120,
        streakCount: 3,
        completedLessonIds: ["lesson_math_1"],
        completedModuleIds: ["module_1"],
        unlockedBadgeIds: ["badge_first_win"],
        sessionHistory: [],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.mergedXp).toBe(120);
    expect(body.newLevel).toBe(2);
    expect(body.totalCompletedLessons).toBe(1);
  });
});
