import { PrismaClient, Prisma } from "@prisma/client";
import { GuestSyncRequest } from "./guest-sync.schema.js";

export class GuestSyncRepository {
  constructor(private prisma: PrismaClient) {}

  async syncGuestProgress(userId: string, data: GuestSyncRequest) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Get or create student progress
      let progress = await tx.studentProgress.findUnique({
        where: { studentId: userId },
      });

      if (!progress) {
        progress = await tx.studentProgress.create({
          data: {
            studentId: userId,
            timezone: "Asia/Jakarta",
            totalXp: 0,
            level: 1,
            currentStreak: 0,
            longestStreak: 0,
          },
        });
      }

      // 2. Calculate new XP and Level
      const newTotalXp = progress.totalXp + data.totalXp;
      const newLevel = Math.floor(newTotalXp / 100) + 1;
      const newCurrentStreak = Math.max(progress.currentStreak, data.streakCount);
      const newLongestStreak = Math.max(progress.longestStreak, data.streakCount);

      const updatedProgress = await tx.studentProgress.update({
        where: { studentId: userId },
        data: {
          totalXp: newTotalXp,
          level: newLevel,
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
        },
      });

      // 3. Record XP transaction if XP > 0
      if (data.totalXp > 0) {
        await tx.xpTransaction.create({
          data: {
            studentId: userId,
            amount: data.totalXp,
            source: "LESSON_BONUS",
            referenceId: `guest_migration_${data.guestId}`,
          },
        });
      }

      // 4. Mark completed lessons in studentLessonProgress if studentProfile exists
      const studentProfile = await tx.studentProfile.findUnique({
        where: { userId },
      });

      if (studentProfile) {
        for (const lessonId of data.completedLessonIds) {
          await tx.studentLessonProgress.upsert({
            where: {
              studentProfileId_lessonId: {
                studentProfileId: studentProfile.id,
                lessonId,
              },
            },
            create: {
              studentProfileId: studentProfile.id,
              lessonId,
              isCompleted: true,
              completedAt: new Date(),
            },
            update: {
              isCompleted: true,
              completedAt: new Date(),
            },
          });
        }
      }

      return {
        totalXp: updatedProgress.totalXp,
        level: updatedProgress.level,
        completedLessonsCount: data.completedLessonIds.length,
      };
    });
  }
}
