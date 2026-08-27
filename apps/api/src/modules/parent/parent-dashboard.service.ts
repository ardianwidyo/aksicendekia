import { PrismaClient } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "../../common/errors/app-error.js";
import { UpdateParentalControlDTO } from "./parent-dashboard.schema.js";

export class ParentDashboardService {
  constructor(private prisma: PrismaClient) {}

  private async verifyParentChildRelation(parentId: string, studentIdentifier: string) {
    const studentProfile = await this.prisma.studentProfile.findFirst({
      where: {
        OR: [{ id: studentIdentifier }, { userId: studentIdentifier }],
      },
    });

    if (!studentProfile) {
      throw new NotFoundError("Profil siswa tidak ditemukan");
    }

    const link = await this.prisma.parentChildLink.findUnique({
      where: {
        parentId_studentProfileId: {
          parentId,
          studentProfileId: studentProfile.id,
        },
      },
      include: {
        consent: true,
      },
    });

    if (!link) {
      throw new ForbiddenError(
        "Akun orang tua tidak terhubung secara sah dengan akun anak ini",
        "FORBIDDEN_PARENT_LINK_REQUIRED"
      );
    }

    return { studentProfile, link };
  }

  async getChildSummary(parentId: string, studentIdentifier: string) {
    const { studentProfile } = await this.verifyParentChildRelation(parentId, studentIdentifier);
    const studentUserId = studentProfile.userId;

    // 1. Fetch StudentProgress
    const progress = await this.prisma.studentProgress.findUnique({
      where: { studentId: studentUserId },
    });

    // 2. Fetch Sessions
    const completedSessions = await this.prisma.learningSession.findMany({
      where: {
        studentId: studentUserId,
        status: "COMPLETED",
      },
      include: {
        lesson: {
          include: {
            unit: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    const totalLearningSeconds = completedSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const totalLearningMinutes = Math.round(totalLearningSeconds / 60);
    const lessonsCompleted = completedSessions.length;

    // Average accuracy
    let averageAccuracy = 0;
    if (completedSessions.length > 0) {
      const scores = completedSessions.map((s) => (s.score ? Number(s.score) : 0));
      averageAccuracy = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    }

    // Subject Performance breakdown (Strongest / Weakest)
    const subjectStatsMap: Record<string, { subjectId: string; subjectName: string; totalScore: number; count: number }> = {};
    for (const session of completedSessions) {
      const subj = session.lesson.unit.subject;
      if (!subjectStatsMap[subj.id]) {
        subjectStatsMap[subj.id] = { subjectId: subj.id, subjectName: subj.name, totalScore: 0, count: 0 };
      }
      subjectStatsMap[subj.id].totalScore += session.score ? Number(session.score) : 0;
      subjectStatsMap[subj.id].count += 1;
    }

    const subjectList = Object.values(subjectStatsMap).map((s) => ({
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      accuracyRate: Math.round((s.totalScore / s.count) * 10) / 10,
    }));

    subjectList.sort((a, b) => b.accuracyRate - a.accuracyRate);

    const strongestSubject = subjectList.length > 0 ? subjectList[0] : null;
    const weakestSubject = subjectList.length > 1 ? subjectList[subjectList.length - 1] : null;

    // 3. Parental Control Settings
    let parentalControl = await this.prisma.parentalControlSetting.findUnique({
      where: { studentUserId },
    });

    if (!parentalControl) {
      parentalControl = await this.prisma.parentalControlSetting.create({
        data: {
          studentUserId,
          parentUserId: parentId,
          dailyTimeLimitMinutes: null,
          isPrivacyLocked: false,
        },
      });
    }

    // Today's learning time spent
    const timezoneStr = progress?.timezone || "Asia/Jakarta";
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-CA", { timeZone: timezoneStr });
    const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);

    const todaySessions = await this.prisma.learningSession.findMany({
      where: {
        studentId: studentUserId,
        startedAt: { gte: startOfToday },
      },
    });

    const todayTimeSpentSeconds = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const todayTimeSpentMinutes = Math.round(todayTimeSpentSeconds / 60);

    const isTimeLimitExceeded =
      parentalControl.dailyTimeLimitMinutes !== null &&
      todayTimeSpentMinutes >= parentalControl.dailyTimeLimitMinutes;

    return {
      studentId: studentUserId,
      studentProfileId: studentProfile.id,
      displayName: studentProfile.displayName,
      avatarId: studentProfile.avatarId,
      educationStage: studentProfile.educationStage,
      gradeLevel: studentProfile.gradeLevel,
      totalLearningMinutes,
      lessonsCompleted,
      averageAccuracy,
      currentStreak: progress?.currentStreak || 0,
      strongestSubject,
      weakestSubject,
      parentalControl: {
        dailyTimeLimitMinutes: parentalControl.dailyTimeLimitMinutes,
        todayTimeSpentMinutes,
        isTimeLimitExceeded,
        isPrivacyLocked: parentalControl.isPrivacyLocked,
      },
    };
  }

  async getChildActivities(parentId: string, studentIdentifier: string) {
    const { studentProfile } = await this.verifyParentChildRelation(parentId, studentIdentifier);
    const studentUserId = studentProfile.userId;

    const sessions = await this.prisma.learningSession.findMany({
      where: { studentId: studentUserId },
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        lesson: {
          include: {
            unit: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    return sessions.map((s) => ({
      sessionId: s.id,
      lessonId: s.lessonId,
      lessonTitle: s.lesson.title,
      subjectName: s.lesson.unit.subject.name,
      durationMinutes: Math.round(s.durationSeconds / 60),
      score: s.score ? Number(s.score) : 0,
      accuracy: s.score ? Number(s.score) : 0,
      xpEarned: Math.round((s.correctCount / (s.totalQuestions || 1)) * 50),
      completedAt: s.completedAt ? s.completedAt.toISOString() : s.startedAt.toISOString(),
    }));
  }

  async updateParentalControls(parentId: string, studentIdentifier: string, dto: UpdateParentalControlDTO) {
    const { studentProfile } = await this.verifyParentChildRelation(parentId, studentIdentifier);
    const studentUserId = studentProfile.userId;

    const updated = await this.prisma.parentalControlSetting.upsert({
      where: { studentUserId },
      create: {
        studentUserId,
        parentUserId: parentId,
        dailyTimeLimitMinutes: dto.dailyTimeLimitMinutes ?? null,
        isPrivacyLocked: dto.isPrivacyLocked ?? false,
      },
      update: {
        ...(dto.dailyTimeLimitMinutes !== undefined && { dailyTimeLimitMinutes: dto.dailyTimeLimitMinutes }),
        ...(dto.isPrivacyLocked !== undefined && { isPrivacyLocked: dto.isPrivacyLocked }),
      },
    });

    // Also sync StudentPrivacySetting if privacy lock changes
    if (dto.isPrivacyLocked !== undefined) {
      await this.prisma.studentPrivacySetting.upsert({
        where: { studentUserId },
        create: {
          studentUserId,
          isPrivacyLocked: dto.isPrivacyLocked,
        },
        update: {
          isPrivacyLocked: dto.isPrivacyLocked,
        },
      });
    }

    return updated;
  }

  async getChildWeeklyReports(parentId: string, studentIdentifier: string) {
    const { studentProfile } = await this.verifyParentChildRelation(parentId, studentIdentifier);

    return this.prisma.weeklyReportSummary.findMany({
      where: {
        studentUserId: studentProfile.userId,
      },
      orderBy: { weekStartDate: "desc" },
      take: 12,
    });
  }
}
