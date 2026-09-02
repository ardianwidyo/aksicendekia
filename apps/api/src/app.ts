import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyMultipart from "@fastify/multipart";
import { ZodError } from "zod";
import { PrismaClient } from "@prisma/client";
import { AppError } from "./common/errors/app-error.js";
import { assertProductionPreviewGuards } from "./common/env/production-guard.js";
import { authenticateHook } from "./middleware/authenticate.hook.js";
import { consentGateHook } from "./middleware/consent-gate.hook.js";
import { ConsoleEmailService } from "./common/email/console-email.service.js";

import { AuthRepository } from "./modules/auth/auth.repository.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { registerAuthRoutes } from "./modules/auth/auth.controller.js";

import { StudentRepository } from "./modules/student/student.repository.js";
import { StudentService } from "./modules/student/student.service.js";
import { registerStudentRoutes } from "./modules/student/student.controller.js";

import { ParentRepository } from "./modules/parent/parent.repository.js";
import { ParentService } from "./modules/parent/parent.service.js";
import { registerParentRoutes } from "./modules/parent/parent.controller.js";

import { ClassRepository } from "./modules/class/class.repository.js";
import { ClassService } from "./modules/class/class.service.js";
import { registerClassRoutes } from "./modules/class/class.controller.js";
import { argon2Service } from "./modules/auth/argon2.service.js";

import { CurriculumRepository } from "./modules/curriculum/curriculum.repository.js";
import { CsvImportService } from "./modules/curriculum/csv-import.service.js";
import { CurriculumService } from "./modules/curriculum/curriculum.service.js";
import { registerCurriculumRoutes } from "./modules/curriculum/curriculum.controller.js";

import { SessionRepository } from "./modules/session/session.repository.js";
import { SessionService } from "./modules/session/session.service.js";
import { registerSessionRoutes } from "./modules/session/session.controller.js";

import { ProgressRepository } from "./modules/progress/progress.repository.js";
import { ProgressService } from "./modules/progress/progress.service.js";
import { GamificationService } from "./modules/progress/gamification.service.js";
import { registerProgressRoutes } from "./modules/progress/progress.controller.js";

import { DailyChallengeRepository } from "./modules/daily-challenge/daily-challenge.repository.js";
import { DailyChallengeService } from "./modules/daily-challenge/daily-challenge.service.js";
import { registerDailyChallengeRoutes } from "./modules/daily-challenge/daily-challenge.controller.js";

import { LeaderboardRepository } from "./modules/leaderboard/leaderboard.repository.js";
import { LeaderboardService } from "./modules/leaderboard/leaderboard.service.js";
import { registerLeaderboardRoutes } from "./modules/leaderboard/leaderboard.controller.js";

import { ParentDashboardService } from "./modules/parent/parent-dashboard.service.js";
import { TeacherDashboardService } from "./modules/class/teacher-dashboard.service.js";
import { registerTeacherRoutes } from "./modules/class/teacher.controller.js";
import { WeeklyReportsService } from "./modules/weekly-reports/weekly-reports.service.js";

import { EntitlementService } from "./modules/entitlements/entitlements.service.js";
import { registerEntitlementRoutes } from "./modules/entitlements/entitlements.controller.js";
import { SubscriptionService } from "./modules/subscriptions/subscriptions.service.js";
import { registerSubscriptionRoutes } from "./modules/subscriptions/subscriptions.controller.js";
import { PaymentService } from "./modules/payments/payments.service.js";
import { registerPaymentRoutes } from "./modules/payments/payments.controller.js";
import { registerPublicContentRoutes } from "./modules/sync/public-content.controller.js";
import { GuestSyncRepository } from "./modules/sync/guest-sync.repository.js";
import { GuestSyncService } from "./modules/sync/guest-sync.service.js";
import { registerGuestSyncRoutes } from "./modules/sync/guest-sync.controller.js";

import { ContentBlockRepository } from "./modules/content-blocks/content-block.repository.js";
import { ContentBlockService } from "./modules/content-blocks/content-block.service.js";
import { MediaAssetService } from "./modules/content-blocks/media-asset.service.js";
import { CurriculumAchievementService } from "./modules/content-blocks/curriculum-achievement.service.js";
import { PublishService } from "./modules/content-blocks/publish.service.js";
import { registerContentBlockRoutes } from "./modules/content-blocks/content-block.controller.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    consentGate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export function buildApp(prisma: PrismaClient, jwtSecret: string = "secret-super-rahasia-aksicendekia-2026"): FastifyInstance {
  assertProductionPreviewGuards();

  const app = fastify({ logger: false });

  // Register plugins
  app.register(fastifyJwt, { secret: jwtSecret });
  app.register(fastifyCookie);
  app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });
  app.register(fastifyMultipart, {
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  // Decorate custom hooks
  app.decorate("authenticate", authenticateHook);
  app.decorate("consentGate", consentGateHook);

  // Error Handler
  app.setErrorHandler((error: Error, _request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: "Validasi data gagal",
        errors: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        message: error.message,
        code: error.code,
      });
    }

    // Default 500
    console.error("Unhandled Error:", error);
    return reply.status(500).send({
      message: "Terjadi kesalahan internal pada server",
    });
  });

  // Instantiate Repositories, Services, and Controllers
  const emailService = new ConsoleEmailService();
  const authRepo = new AuthRepository(prisma);
  const studentRepo = new StudentRepository(prisma);
  const parentRepo = new ParentRepository(prisma);
  const classRepo = new ClassRepository(prisma);
  const curriculumRepo = new CurriculumRepository(prisma);
  const sessionRepo = new SessionRepository(prisma);
  const progressRepo = new ProgressRepository(prisma);
  const dailyChallengeRepo = new DailyChallengeRepository(prisma);
  const leaderboardRepo = new LeaderboardRepository(prisma);
  const csvImportService = new CsvImportService();

  const entitlementService = new EntitlementService(prisma);
  const subscriptionService = new SubscriptionService(prisma);
  const paymentService = new PaymentService(prisma);

  const authService = new AuthService(authRepo, studentRepo, parentRepo, argon2Service, emailService);
  const studentService = new StudentService(studentRepo);
  const parentService = new ParentService(parentRepo, authRepo, studentRepo, argon2Service);
  const parentDashboardService = new ParentDashboardService(prisma);
  const teacherDashboardService = new TeacherDashboardService(prisma);
  const weeklyReportsService = new WeeklyReportsService(prisma);
  const classService = new ClassService(classRepo, studentRepo);
  const curriculumService = new CurriculumService(curriculumRepo, csvImportService);
  const sessionService = new SessionService(sessionRepo, prisma, entitlementService);
  const progressService = new ProgressService(prisma, progressRepo);
  const gamificationService = new GamificationService(prisma, progressRepo);
  const dailyChallengeService = new DailyChallengeService(dailyChallengeRepo);
  const leaderboardService = new LeaderboardService(leaderboardRepo);
  const guestSyncRepo = new GuestSyncRepository(prisma);
  const guestSyncService = new GuestSyncService(guestSyncRepo);

  const contentBlockRepo = new ContentBlockRepository(prisma);
  const contentBlockService = new ContentBlockService(contentBlockRepo);
  const mediaAssetService = new MediaAssetService(contentBlockRepo);
  const curriculumAchievementService = new CurriculumAchievementService(contentBlockRepo);
  const publishService = new PublishService(contentBlockRepo);

  // Register routes
  registerAuthRoutes(app, authService);
  registerStudentRoutes(app, studentService, prisma);
  registerParentRoutes(app, parentService, parentDashboardService, prisma);
  registerClassRoutes(app, classService);
  registerTeacherRoutes(app, teacherDashboardService, prisma);
  registerCurriculumRoutes(app, curriculumService);
  registerSessionRoutes(app, sessionService);
  registerProgressRoutes(app, progressService);
  registerDailyChallengeRoutes(app, dailyChallengeService);
  registerLeaderboardRoutes(app, leaderboardService);

  registerEntitlementRoutes(app, entitlementService);
  registerSubscriptionRoutes(app, subscriptionService);
  registerPaymentRoutes(app, paymentService);
  registerPublicContentRoutes(app, prisma);
  registerGuestSyncRoutes(app, guestSyncService);
  registerContentBlockRoutes(app, contentBlockService, mediaAssetService, curriculumAchievementService, publishService);

  // Weekly Report Generation Route
  app.post("/api/v1/reports/weekly/generate", { preHandler: [app.authenticate] }, async (_req, reply) => {
    const result = await weeklyReportsService.generateWeeklySummaries();
    return reply.send({ message: "Data laporan ringkasan mingguan berhasil dibuat", data: result });
  });

  return app;
}
