import { PrismaClient, Role } from "@prisma/client";

export class WeeklyReportsService {
  constructor(private prisma: PrismaClient) {}

  async generateWeeklySummaries(): Promise<{ generatedCount: number }> {
    const now = new Date();
    const weekEndDate = new Date(now);
    const weekStartDate = new Date(now);
    weekStartDate.setDate(weekStartDate.getDate() - 7);

    let generatedCount = 0;

    // 1. Generate for Parents
    const parentLinks = await this.prisma.parentChildLink.findMany({
      include: {
        parent: true,
        studentProfile: {
          include: {
            user: {
              include: {
                studentProgress: true,
              },
            },
          },
        },
      },
    });

    for (const link of parentLinks) {
      const parentUser = link.parent;
      const studentProfile = link.studentProfile;
      const studentUserId = studentProfile.userId;

      const weekSessions = await this.prisma.learningSession.findMany({
        where: {
          studentId: studentUserId,
          startedAt: { gte: weekStartDate, lte: weekEndDate },
          status: "COMPLETED",
        },
      });

      const totalMinutes = Math.round(weekSessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60);
      const lessonsCompleted = weekSessions.length;

      let averageAccuracy = 0;
      if (weekSessions.length > 0) {
        const scores = weekSessions.map((s) => (s.score ? Number(s.score) : 0));
        averageAccuracy = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
      }

      const reportPayload = {
        title: `Laporan Mingguan Belajar ${studentProfile.displayName}`,
        studentName: studentProfile.displayName,
        weekRange: `${weekStartDate.toISOString().substring(0, 10)} s/d ${weekEndDate.toISOString().substring(0, 10)}`,
        totalMinutes,
        lessonsCompleted,
        averageAccuracy,
        currentStreak: studentProfile.user.studentProgress?.currentStreak || 0,
        motivationalMessage:
          averageAccuracy >= 80
            ? "Luar biasa! Pertahankan semangat belajar yang hebat ini!"
            : "Terus dampingi anak untuk mencoba latihan soal secara konsisten.",
      };

      await this.prisma.weeklyReportSummary.create({
        data: {
          targetUserId: parentUser.id,
          targetRole: Role.ORANG_TUA,
          studentUserId,
          weekStartDate,
          weekEndDate,
          reportDataJson: reportPayload,
        },
      });

      generatedCount++;
    }

    // 2. Generate for Teachers
    const classes = await this.prisma.class.findMany({
      include: {
        teacher: true,
        enrollments: {
          include: {
            studentProfile: true,
          },
        },
      },
    });

    for (const cls of classes) {
      const studentUserIds = cls.enrollments.map((e) => e.studentProfile.userId);
      if (studentUserIds.length === 0) continue;

      const classWeekSessions = await this.prisma.learningSession.findMany({
        where: {
          studentId: { in: studentUserIds },
          startedAt: { gte: weekStartDate, lte: weekEndDate },
          status: "COMPLETED",
        },
      });

      const activeStudentCount = new Set(classWeekSessions.map((s) => s.studentId)).size;
      const totalMinutes = Math.round(classWeekSessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60);

      const reportPayload = {
        title: `Ringkasan Mingguan Kelas ${cls.name}`,
        className: cls.name,
        totalEnrolled: studentUserIds.length,
        activeStudentsThisWeek: activeStudentCount,
        totalClassMinutes: totalMinutes,
        weekRange: `${weekStartDate.toISOString().substring(0, 10)} s/d ${weekEndDate.toISOString().substring(0, 10)}`,
      };

      await this.prisma.weeklyReportSummary.create({
        data: {
          targetUserId: cls.teacherId,
          targetRole: Role.GURU,
          classId: cls.id,
          weekStartDate,
          weekEndDate,
          reportDataJson: reportPayload,
        },
      });

      generatedCount++;
    }

    return { generatedCount };
  }

  async cleanupExpiredAuditLogsAndReports(): Promise<{ deletedLogsCount: number; deletedReportsCount: number }> {
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const deletedLogs = await this.prisma.studentDataAccessLog.deleteMany({
      where: { createdAt: { lt: oneYearAgo } },
    });

    const deletedReports = await this.prisma.weeklyReportSummary.deleteMany({
      where: { createdAt: { lt: twelveMonthsAgo } },
    });

    return {
      deletedLogsCount: deletedLogs.count,
      deletedReportsCount: deletedReports.count,
    };
  }
}
