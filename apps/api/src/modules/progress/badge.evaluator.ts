import { PrismaClient, BadgeDefinition, Prisma } from '@prisma/client';

export class BadgeEvaluator {
  constructor(private prisma: PrismaClient) {}

  async evaluateBadgesForStudent(
    studentId: string,
    eventId: string,
    tx?: Prisma.TransactionClient
  ): Promise<string[]> {
    const client = tx || this.prisma;

    // Ambil profil siswa untuk mendapatkan studentProfileId
    const profile = client.studentProfile
      ? await client.studentProfile.findUnique({
          where: { userId: studentId }
        })
      : null;

    const allBadges = await client.badgeDefinition.findMany();
    const existingBadges = await client.studentBadge.findMany({
      where: { studentId },
      select: { badgeId: true }
    });
    const unlockedBadgeIds = new Set(existingBadges.map((b) => b.badgeId));

    const progress = client.studentProgress
      ? await client.studentProgress.findUnique({
          where: { studentId }
        })
      : null;

    const newlyUnlockedBadgeIds: string[] = [];

    for (const badge of allBadges) {
      if (unlockedBadgeIds.has(badge.id)) continue;

      const isEligible = await this.checkCondition(
        badge,
        studentId,
        profile?.id || null,
        progress?.currentStreak || 0,
        client
      );

      if (isEligible) {
        await client.studentBadge.create({
          data: {
            studentId,
            badgeId: badge.id,
            triggerEventId: eventId
          }
        });
        newlyUnlockedBadgeIds.push(badge.id);
      }
    }

    return newlyUnlockedBadgeIds;
  }

  private async checkCondition(
    badge: BadgeDefinition,
    studentId: string,
    studentProfileId: string | null,
    currentStreak: number,
    client: Prisma.TransactionClient | PrismaClient
  ): Promise<boolean> {
    const params = (badge.conditionParameter as Record<string, any>) || {};

    switch (badge.conditionType) {
      case 'LESSONS_COMPLETED': {
        const requiredCount = params.count || 1;
        if (!studentProfileId) return false;
        const completedCount = await client.studentLessonProgress.count({
          where: {
            studentProfileId,
            isCompleted: true
          }
        });
        return completedCount >= requiredCount;
      }

      case 'STREAK_LENGTH': {
        const requiredStreak = params.days || 1;
        return currentStreak >= requiredStreak;
      }

      case 'ACCURACY_RATE': {
        const requiredAccuracy = params.minAccuracyPercentage || 90;
        const sessions = await client.learningSession.findMany({
          where: { studentId, status: 'COMPLETED' },
          select: { score: true }
        });
        if (sessions.length === 0) return false;
        const totalScore = sessions.reduce((acc, s) => acc + (s.score ? Number(s.score) : 0), 0);
        const avgScore = totalScore / sessions.length;
        return avgScore >= requiredAccuracy;
      }

      case 'SUBJECT_COMPLETION': {
        const subjectId = params.subjectId;
        if (!subjectId || !studentProfileId) return false;
        const subjectLessons = await client.lesson.findMany({
          where: {
            unit: { subjectId },
            status: 'PUBLISHED'
          },
          select: { id: true }
        });
        if (subjectLessons.length === 0) return false;

        const completedCount = await client.studentLessonProgress.count({
          where: {
            studentProfileId,
            lessonId: { in: subjectLessons.map((l) => l.id) },
            isCompleted: true
          }
        });
        return completedCount === subjectLessons.length;
      }

      default:
        return false;
    }
  }
}
