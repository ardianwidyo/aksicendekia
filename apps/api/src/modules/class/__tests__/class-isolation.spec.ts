import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../../app.js";
import { createMockPrismaClient } from "../../../__tests__/mock-prisma.js";
import { Role, AccountStatus, EducationStage } from "@prisma/client";

describe("Mandatory Test: Inter-Class Data Isolation (Relational Authorization)", () => {
  let app: ReturnType<typeof buildApp>;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    app = buildApp(mockPrisma);
  });

  it("should return 403 Forbidden when Teacher B attempts to access Student A in Teacher A's class", async () => {
    // 1. Register Teacher A & Teacher B
    const teacherARes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email: "guruA@sekolah.id", password: "Password123!", role: Role.GURU },
    });
    const teacherAId = JSON.parse(teacherARes.body).data.id;

    const teacherBRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email: "guruB@sekolah.id", password: "Password123!", role: Role.GURU },
    });
    const teacherBId = JSON.parse(teacherBRes.body).data.id;

    // Tokens
    const teacherAToken = app.jwt.sign({ userId: teacherAId, role: Role.GURU, status: AccountStatus.ACTIVE });
    const teacherBToken = app.jwt.sign({ userId: teacherBId, role: Role.GURU, status: AccountStatus.ACTIVE });

    // 2. Teacher A creates Class 10-A
    const classARes = await app.inject({
      method: "POST",
      url: "/api/v1/classes",
      headers: { authorization: `Bearer ${teacherAToken}` },
      payload: { name: "Matematika 10-A", educationStage: EducationStage.SMA },
    });
    expect(classARes.statusCode).toBe(201);
    const classACode = JSON.parse(classARes.body).data.classCode;

    // 3. Register Student A (Age >= 18 for instant ACTIVE status)
    const studentARes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: "siswaA@sekolah.id",
        password: "Password123!",
        role: Role.SISWA,
        displayName: "Siswa A",
        educationStage: EducationStage.SMA,
        gradeLevel: 10,
        avatarId: "avatar-3",
        birthDate: "2005-01-01T00:00:00.000Z",
      },
    });
    expect(studentARes.statusCode).toBe(201);
    const studentAUserId = JSON.parse(studentARes.body).data.id;
    const studentAToken = app.jwt.sign({ userId: studentAUserId, role: Role.SISWA, status: AccountStatus.ACTIVE });

    // Student A joins Class 10-A
    const joinRes = await app.inject({
      method: "POST",
      url: "/api/v1/classes/join",
      headers: { authorization: `Bearer ${studentAToken}` },
      payload: { classCode: classACode },
    });
    expect(joinRes.statusCode).toBe(200);

    const studentAProfile = await mockPrisma.studentProfile.findUnique({ where: { userId: studentAUserId } });
    expect(studentAProfile).toBeDefined();

    // 4. Teacher B attempts to view Student A's data
    const unauthorizedRes = await app.inject({
      method: "GET",
      url: `/api/v1/students/${studentAProfile!.id}`,
      headers: { authorization: `Bearer ${teacherBToken}` },
    });

    expect(unauthorizedRes.statusCode).toBe(403);
    const body = JSON.parse(unauthorizedRes.body);
    expect(body.message).toContain("Akses ditolak");

    // 5. Teacher A views Student A's data -> Allowed!
    const authorizedRes = await app.inject({
      method: "GET",
      url: `/api/v1/students/${studentAProfile!.id}`,
      headers: { authorization: `Bearer ${teacherAToken}` },
    });

    expect(authorizedRes.statusCode).toBe(200);
    const authBody = JSON.parse(authorizedRes.body);
    expect(authBody.data.displayName).toBe("Siswa A");
  });
});
