import { PrismaClient, PowerupType, PowerupAction, XpSourceType, Prisma } from '@prisma/client';

export class ProgressRepository {
  constructor(private prisma: PrismaClient) {}

  async getOrCreateStudentProgress(
    studentId: string,
    timezone = 'Asia/Jakarta',
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || this.prisma;
    let progress = await client.studentProgress.findUnique({
      where: { studentId }
    });

    if (!progress) {
      progress = await client.studentProgress.create({
        data: {
          studentId,
          timezone
        }
      });

      // Inisialisasi saldo power-up awal jika belum ada
      await client.studentPowerup.createMany({
        data: [
          { studentId, powerupType: 'HINT_TOKEN', quantity: 3 },
          { studentId, powerupType: 'STREAK_FREEZE', quantity: 1 }
        ],
        skipDuplicates: true
      });
    }

    return progress;
  }

  async addXpTransaction(
    studentId: string,
    amount: number,
    source: XpSourceType,
    referenceId?: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || this.prisma;
    return client.xpTransaction.create({
      data: {
        studentId,
        amount,
        source,
        referenceId
      }
    });
  }

  async getPowerupBalance(
    studentId: string,
    powerupType: PowerupType,
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const client = tx || this.prisma;
    const powerup = await client.studentPowerup.findUnique({
      where: {
        studentId_powerupType: { studentId, powerupType }
      }
    });
    return powerup ? powerup.quantity : 0;
  }

  async getAllPowerupBalances(
    studentId: string,
    tx?: Prisma.TransactionClient
  ): Promise<Record<PowerupType, number>> {
    const client = tx || this.prisma;
    const powerups = await client.studentPowerup.findMany({
      where: { studentId }
    });

    const result: Record<PowerupType, number> = {
      HINT_TOKEN: 0,
      STREAK_FREEZE: 0
    };

    for (const p of powerups) {
      result[p.powerupType] = p.quantity;
    }

    return result;
  }

  async consumePowerupAtomic(
    studentId: string,
    powerupType: PowerupType,
    amount = 1,
    source = 'SESSION_CONSUME',
    referenceId?: string,
    tx?: Prisma.TransactionClient
  ): Promise<number> {
    const client = tx || this.prisma;

    // Proteksi transaksi atomik untuk mencegah saldo negatif
    const updatedCount = await client.studentPowerup.updateMany({
      where: {
        studentId,
        powerupType,
        quantity: { gte: amount }
      },
      data: {
        quantity: { decrement: amount }
      }
    });

    if (updatedCount.count === 0) {
      throw new Error(`INSUFFICIENT_POWERUP: Saldo ${powerupType} tidak mencukupi`);
    }

    await client.powerupTransaction.create({
      data: {
        studentId,
        powerupType,
        actionType: 'CONSUMED',
        amount,
        source,
        referenceId
      }
    });

    const updated = await client.studentPowerup.findUnique({
      where: { studentId_powerupType: { studentId, powerupType } }
    });

    return updated ? updated.quantity : 0;
  }

  async grantPowerup(
    studentId: string,
    powerupType: PowerupType,
    amount: number,
    source: string,
    referenceId?: string,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx || this.prisma;

    await client.studentPowerup.upsert({
      where: { studentId_powerupType: { studentId, powerupType } },
      create: { studentId, powerupType, quantity: amount },
      update: { quantity: { increment: amount } }
    });

    await client.powerupTransaction.create({
      data: {
        studentId,
        powerupType,
        actionType: 'EARNED',
        amount,
        source,
        referenceId
      }
    });
  }

  async updateStudentLessonProgress(
    studentProfileId: string,
    lessonId: string,
    score: number,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || this.prisma;
    const existing = await client.studentLessonProgress.findUnique({
      where: { studentProfileId_lessonId: { studentProfileId, lessonId } }
    });

    const bestScore = existing?.bestScore
      ? Math.max(Number(existing.bestScore), score)
      : score;

    return client.studentLessonProgress.upsert({
      where: { studentProfileId_lessonId: { studentProfileId, lessonId } },
      create: {
        studentProfileId,
        lessonId,
        status: 'COMPLETED',
        isCompleted: true,
        bestScore,
        attemptsCount: 1,
        completedAt: new Date()
      },
      update: {
        status: 'COMPLETED',
        isCompleted: true,
        bestScore,
        attemptsCount: { increment: 1 },
        completedAt: existing?.completedAt || new Date()
      }
    });
  }

  async unlockDownstreamLessons(
    studentProfileId: string,
    completedLessonId: string,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx || this.prisma;

    // Cari seluruh pelajaran yang mensyaratkan completedLessonId
    const downstreamPrereqs = await client.lessonPrerequisite.findMany({
      where: { prerequisiteLessonId: completedLessonId },
      include: {
        lesson: {
          include: {
            prerequisites: true
          }
        }
      }
    });

    for (const item of downstreamPrereqs) {
      const targetLesson = item.lesson;
      const allPrereqIds = targetLesson.prerequisites.map((p) => p.prerequisiteLessonId);

      const completedPrereqsCount = await client.studentLessonProgress.count({
        where: {
          studentProfileId,
          lessonId: { in: allPrereqIds },
          isCompleted: true
        }
      });

      if (completedPrereqsCount === allPrereqIds.length) {
        await client.studentLessonProgress.upsert({
          where: {
            studentProfileId_lessonId: {
              studentProfileId,
              lessonId: targetLesson.id
            }
          },
          create: {
            studentProfileId,
            lessonId: targetLesson.id,
            status: 'UNLOCKED',
            isCompleted: false
          },
          update: {
            status: 'UNLOCKED'
          }
        });
      }
    }
  }
}
