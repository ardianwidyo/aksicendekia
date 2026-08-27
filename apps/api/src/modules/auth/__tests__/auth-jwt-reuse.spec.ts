import { describe, it, expect, beforeEach } from "vitest";
import { buildApp } from "../../../app.js";
import { createMockPrismaClient } from "../../../__tests__/mock-prisma.js";
import { Role } from "@prisma/client";

describe("Mandatory Test: Refresh Token Reuse Detection & Family Revocation", () => {
  let app: ReturnType<typeof buildApp>;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    app = buildApp(mockPrisma);
  });

  it("should detect reuse of a previously rotated refresh token and revoke the entire token family", async () => {
    // 1. Register & Login user
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        email: "user.reuse@sekolah.id",
        password: "Password123!",
        role: Role.GURU,
      },
    });

    const loginRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: {
        email: "user.reuse@sekolah.id",
        password: "Password123!",
      },
    });

    expect(loginRes.statusCode).toBe(200);

    // Extract Refresh Token Cookie A
    const setCookieA = loginRes.cookies.find((c) => c.name === "refreshToken");
    expect(setCookieA).toBeDefined();
    const tokenA = setCookieA!.value;

    // 2. Refresh session using Token A -> Rotates to Token B
    const refreshRes1 = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: {
        refreshToken: tokenA,
      },
    });

    expect(refreshRes1.statusCode).toBe(200);

    const setCookieB = refreshRes1.cookies.find((c) => c.name === "refreshToken");
    expect(setCookieB).toBeDefined();

    // 3. Attempt to RE-USE Token A (Attacker scenario)
    const reuseRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: {
        refreshToken: tokenA,
      },
    });

    expect(reuseRes.statusCode).toBe(401);
    const reuseBody = JSON.parse(reuseRes.body);
    expect(reuseBody.code).toBe("TOKEN_REUSE_DETECTED");
    expect(reuseBody.message).toContain("penggunaan ulang refresh token");

    // 4. Verify that Token B is ALSO revoked now because the whole family was burned
    const setCookieBToken = setCookieB!.value;
    const refreshRes2 = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      cookies: {
        refreshToken: setCookieBToken,
      },
    });

    expect(refreshRes2.statusCode).toBe(401);
  });
});
