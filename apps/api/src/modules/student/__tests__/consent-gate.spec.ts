import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../../app.js";
import { createMockPrismaClient } from "../../../__tests__/mock-prisma.js";
import { Role, AccountStatus, EducationStage } from "@prisma/client";

describe("Mandatory Test: Consent Gate Middleware (PENDING_CONSENT Rejection)", () => {
  let app: ReturnType<typeof buildApp>;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    app = buildApp(mockPrisma);
  });

  it("should block PENDING_CONSENT student from accessing business endpoint with HTTP 403", async () => {
    // 1. Register student under 18 (born in 2012 -> age 14)
    const regRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: "anak@sekolah.id",
        password: "Password123!",
        role: Role.SISWA,
        displayName: "Siswa Muda",
        educationStage: EducationStage.SMP,
        gradeLevel: 7,
        avatarId: "avatar-1",
        birthDate: "2012-05-15T00:00:00.000Z",
        parentEmail: "ortu@sekolah.id",
      },
    });

    expect(regRes.statusCode).toBe(201);
    const regBody = JSON.parse(regRes.body);
    expect(regBody.data.status).toBe(AccountStatus.PENDING_CONSENT);
    expect(regBody.data.requiresConsent).toBe(true);

    const studentUserId = regBody.data.id;

    // 2. Generate Access Token for PENDING_CONSENT student
    const pendingToken = app.jwt.sign({
      userId: studentUserId,
      role: Role.SISWA,
      status: AccountStatus.PENDING_CONSENT,
    });

    // 3. Attempt to access protected business endpoint GET /api/v1/students/me
    const blockedRes = await app.inject({
      method: "GET",
      url: "/api/v1/students/me",
      headers: {
        authorization: `Bearer ${pendingToken}`,
      },
    });

    expect(blockedRes.statusCode).toBe(403);
    const blockedBody = JSON.parse(blockedRes.body);
    expect(blockedBody.code).toBe("CONSENT_REQUIRED");
    expect(blockedBody.message).toContain("persetujuan orang tua/wali");
  });

  it("should allow student to access endpoint once account status becomes ACTIVE", async () => {
    // 1. Register student
    const regRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: "anak2@sekolah.id",
        password: "Password123!",
        role: Role.SISWA,
        displayName: "Siswa Aktif",
        educationStage: EducationStage.SD,
        gradeLevel: 4,
        avatarId: "avatar-2",
        birthDate: "2015-08-10T00:00:00.000Z",
      },
    });
    const studentUserId = JSON.parse(regRes.body).data.id;

    // 2. Register parent user
    const parentRegRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: "wali2@sekolah.id",
        password: "Password123!",
        role: Role.ORANG_TUA,
      },
    });
    const parentUserId = JSON.parse(parentRegRes.body).data.id;

    const parentToken = app.jwt.sign({
      userId: parentUserId,
      role: Role.ORANG_TUA,
      status: AccountStatus.ACTIVE,
    });

    // 3. Get Student Profile ID using findUnique
    const studentProfile = await mockPrisma.studentProfile.findUnique({ where: { userId: studentUserId } });

    // 4. Parent approves consent
    const consentRes = await app.inject({
      method: "POST",
      url: "/api/v1/parent/consent/approve",
      headers: {
        authorization: `Bearer ${parentToken}`,
      },
      payload: {
        studentProfileId: studentProfile!.id,
      },
    });

    expect(consentRes.statusCode).toBe(200);

    // 5. Now generate active token for student
    const activeToken = app.jwt.sign({
      userId: studentUserId,
      role: Role.SISWA,
      status: AccountStatus.ACTIVE,
    });

    // 6. Access protected business endpoint GET /api/v1/students/me
    const allowedRes = await app.inject({
      method: "GET",
      url: "/api/v1/students/me",
      headers: {
        authorization: `Bearer ${activeToken}`,
      },
    });

    expect(allowedRes.statusCode).toBe(200);
    const body = JSON.parse(allowedRes.body);
    expect(body.data.displayName).toBe("Siswa Aktif");
  });
});
