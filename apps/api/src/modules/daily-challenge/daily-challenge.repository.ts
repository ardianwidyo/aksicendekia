import { PrismaClient, EducationStage, ChallengeTargetType, ChallengeStatus, PowerupType, XpSourceType, Prisma } from '@prisma/client';

export class DailyChallengeRepository {
  constructor(private prisma: PrismaClient) {}

  async findStudentProfileByUserId(userId: string) {
    return this.prisma.studentProfile.findUnique({
      where: { userId }
    });
  }

  async findChallengeByDateAndStage(date: Date, educationStage: EducationStage) {
    return this.prisma.dailyChallenge.findUnique({
      where: {
        educationStage_challengeDate: {
          educationStage,
          challengeDate: date
        }
      }
    });
  }

  async createChallenge(data: {
    educationStage: EducationStage;
    challengeDate: Date;
    title: string;
    description: string;
    targetType: ChallengeTargetType;
    targetValue: number;
    rewardXp: number;
    rewardPowerupType?: PowerupType;
    rewardPowerupQty?: number;
  }) {
    return this.prisma.dailyChallenge.create({
      data
    });
  }

  async findPublishedQuestionsCountByStage(educationStage: EducationStage): Promise<number> {
    return this.prisma.question.count({
      where: {
        status: 'PUBLISHED',
        lesson: {
          unit: {
            subject: {
              educationStage
            }
          }
        }
      }
    });
  }

  async getOrCreateStudentChallenge(studentUserId: string, dailyChallengeId: string) {
    let progress = await this.prisma.studentDailyChallenge.findUnique({
      where: {
        studentUserId_dailyChallengeId: {
          studentUserId,
          dailyChallengeId
        }
      }
    });

    if (!progress) {
      progress = await this.prisma.studentDailyChallenge.create({
        data: {
          studentUserId,
          dailyChallengeId,
          currentProgress: 0,
          status: 'IN_PROGRESS'
        }
      });
    }

    return progress;
  }

  async updateStudentProgress(
    id: string,
    currentProgress: number,
    targetValue: number
  ) {
    const isCompleted = currentProgress >= targetValue;
    return this.prisma.studentDailyChallenge.update({
      where: { id },
      data: {
        currentProgress,
        status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: isCompleted ? new Date() : null
      }
    });
  }

  async claimChallengeRewardAtomic(
    studentUserId: string,
    dailyChallengeId: string,
    rewardXp: number,
    rewardPowerupType?: PowerupType | null,
    rewardPowerupQty?: number
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Atomic status update from COMPLETED to CLAIMED
      const updatedCount = await tx.studentDailyChallenge.updateMany({
        where: {
          studentUserId,
          dailyChallengeId,
          status: 'COMPLETED'
        },
        data: {
          status: 'CLAIMED',
          claimedAt: new Date()
        }
      });

      if (updatedCount.count === 0) {
        // Baris tidak ter-update -> mungkin status belum COMPLETED atau sudah CLAIMED
        const existing = await tx.studentDailyChallenge.findUnique({
          where: {
            studentUserId_dailyChallengeId: {
              studentUserId,
              dailyChallengeId
            }
          }
        });

        if (!existing) {
          throw new Error('CHALLENGE_NOT_FOUND');
        }

        if (existing.status === 'CLAIMED') {
          throw new Error('REWARD_ALREADY_CLAIMED');
        }

        if (existing.status === 'IN_PROGRESS') {
          throw new Error('CHALLENGE_NOT_COMPLETED');
        }

        throw new Error('REWARD_ALREADY_CLAIMED');
      }

      // 2. Credit XP transaction
      await tx.xpTransaction.create({
        data: {
          studentId: studentUserId,
          amount: rewardXp,
          source: 'DAILY_CHALLENGE_BONUS',
          referenceId: dailyChallengeId
        }
      });

      // 3. Update total XP in StudentProgress
      await tx.studentProgress.upsert({
        where: { studentId: studentUserId },
        create: {
          studentId: studentUserId,
          totalXp: rewardXp
        },
        update: {
          totalXp: {
            increment: rewardXp
          }
        }
      });

      // 4. Credit Power-up if applicable
      if (rewardPowerupType && rewardPowerupQty && rewardPowerupQty > 0) {
        await tx.studentPowerup.upsert({
          where: {
            studentId_powerupType: {
              studentId: studentUserId,
              powerupType: rewardPowerupType
            }
          },
          create: {
            studentId: studentUserId,
            powerupType: rewardPowerupType,
            quantity: rewardPowerupQty
          },
          update: {
            quantity: {
              increment: rewardPowerupQty
            }
          }
        });

        await tx.powerupTransaction.create({
          data: {
            studentId: studentUserId,
            powerupType: rewardPowerupType,
            actionType: 'EARNED',
            amount: rewardPowerupQty,
            source: 'DAILY_CHALLENGE',
            referenceId: dailyChallengeId
          }
        });
      }

      return {
        claimedAt: new Date()
      };
    });
  }
}
