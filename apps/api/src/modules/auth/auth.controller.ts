import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "./auth.service.js";
import { RegisterUserSchema, LoginUserSchema } from "./auth.schema.js";
import { generateUUID } from "../../common/utils/crypto.js";

export function registerAuthRoutes(fastify: FastifyInstance, authService: AuthService) {
  // POST /api/v1/auth/register
  fastify.post(
    "/api/v1/auth/register",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "15 minutes",
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = RegisterUserSchema.parse(request.body);
      const result = await authService.register(dto);
      return reply.status(201).send({
        message: "Registrasi akun berhasil",
        data: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          status: result.user.status,
          requiresConsent: result.requiresConsent,
        },
      });
    }
  );

  // POST /api/v1/auth/login
  fastify.post(
    "/api/v1/auth/login",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "15 minutes",
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const dto = LoginUserSchema.parse(request.body);
      const { user } = await authService.login(dto);

      const familyId = generateUUID();
      const accessToken = fastify.jwt.sign(
        { userId: user.id, role: user.role, status: user.status },
        { expiresIn: "15m" }
      );

      const refreshTokenPlain = fastify.jwt.sign(
        { userId: user.id, familyId },
        { expiresIn: "7d" }
      );

      await authService.createInitialRefreshToken(user.id, refreshTokenPlain, familyId);

      reply.setCookie("refreshToken", refreshTokenPlain, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/v1/auth",
      });

      return reply.send({
        message: "Login berhasil",
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    }
  );

  // POST /api/v1/auth/refresh
  fastify.post("/api/v1/auth/refresh", async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshTokenCookie = request.cookies.refreshToken;
    if (!refreshTokenCookie) {
      return reply.status(401).send({ message: "Refresh token tidak ditemukan di cookie" });
    }

    try {
      fastify.jwt.verify(refreshTokenCookie);
    } catch (err) {
      return reply.status(401).send({ message: "Refresh token tidak valid atau kedaluwarsa" });
    }

    const { userId, familyId, newTokenPlain } = await authService.handleRefreshTokenRotation(refreshTokenCookie);

    const newAccessToken = fastify.jwt.sign(
      { userId, role: "SISWA", status: "ACTIVE" },
      { expiresIn: "15m" }
    );

    const newRefreshToken = fastify.jwt.sign(
      { userId, familyId, token: newTokenPlain },
      { expiresIn: "7d" }
    );

    reply.setCookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/v1/auth",
    });

    return reply.send({
      message: "Refresh token berhasil diperbarui",
      accessToken: newAccessToken,
    });
  });

  // POST /api/v1/auth/logout
  fastify.post("/api/v1/auth/logout", async (request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie("refreshToken", { path: "/api/v1/auth" });
    return reply.send({ message: "Logout berhasil" });
  });

  // GET /api/v1/auth/status
  fastify.get(
    "/api/v1/auth/status",
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        user: request.user,
      });
    }
  );
}
