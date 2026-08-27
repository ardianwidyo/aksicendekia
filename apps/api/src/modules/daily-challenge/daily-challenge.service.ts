import { DailyChallengeRepository } from './daily-challenge.repository';
import { EducationStage, ChallengeTargetType, PowerupType } from '@prisma/client';
import { AppError } from '../../common/errors/app-error';

export class DailyChallengeService {
  constructor(private repository: DailyChallengeRepository) {}

  private getStartOfTodayDate(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  async getTodayChallenge(studentUserId: string) {
    const profile = await this.repository.findStudentProfileByUserId(studentUserId);
    const educationStage: EducationStage = profile?.educationStage || 'SD';
    const todayDate = this.getStartOfTodayDate();

    // 1. Get or create DailyChallenge for today & stage
    let challenge = await this.repository.findChallengeByDateAndStage(todayDate, educationStage);

    if (!challenge) {
      challenge = await this.generateDailyChallengeForStage(todayDate, educationStage);
    }

    // 2. Get or create StudentDailyChallenge progress record
    const studentProgress = await this.repository.getOrCreateStudentChallenge(
      studentUserId,
      challenge.id
    );

    const dateStr = todayDate.toISOString().split('T')[0];

    return {
      id: challenge.id,
      educationStage: challenge.educationStage,
      challengeDate: dateStr,
      title: challenge.title,
      description: challenge.description,
      targetType: challenge.targetType,
      targetValue: challenge.targetValue,
      currentProgress: studentProgress.currentProgress,
      rewardXp: challenge.rewardXp,
      rewardPowerupType: challenge.rewardPowerupType,
      rewardPowerupQty: challenge.rewardPowerupQty,
      status: studentProgress.status,
      completedAt: studentProgress.completedAt ? studentProgress.completedAt.toISOString() : null,
      claimedAt: studentProgress.claimedAt ? studentProgress.claimedAt.toISOString() : null
    };
  }

  async claimReward(studentUserId: string, challengeId: string) {
    const todayDate = this.getStartOfTodayDate();
    const profile = await this.repository.findStudentProfileByUserId(studentUserId);
    const educationStage: EducationStage = profile?.educationStage || 'SD';

    const challenge = await this.repository.findChallengeByDateAndStage(todayDate, educationStage);

    const rewardXp = challenge?.rewardXp ?? 50;
    const rewardPowerupType = challenge?.rewardPowerupType ?? 'HINT_TOKEN';
    const rewardPowerupQty = challenge?.rewardPowerupQty ?? 1;

    try {
      const result = await this.repository.claimChallengeRewardAtomic(
        studentUserId,
        challengeId,
        rewardXp,
        rewardPowerupType,
        rewardPowerupQty
      );

      return {
        success: true,
        challengeId,
        status: 'CLAIMED' as const,
        xpAwarded: rewardXp,
        powerupAwarded: rewardPowerupType
          ? {
              type: rewardPowerupType,
              quantity: rewardPowerupQty
            }
          : undefined,
        claimedAt: result.claimedAt.toISOString()
      };
    } catch (err: any) {
      if (err.message === 'REWARD_ALREADY_CLAIMED') {
        throw new AppError('Hadiah tantangan ini sudah pernah diklaim sebelumnya.', 400, 'REWARD_ALREADY_CLAIMED');
      }
      if (err.message === 'CHALLENGE_NOT_COMPLETED') {
        throw new AppError('Target tantangan harian belum tercapai.', 400, 'CHALLENGE_NOT_COMPLETED');
      }
      if (err.message === 'CHALLENGE_NOT_FOUND') {
        throw new AppError('Tantangan harian tidak ditemukan.', 404, 'CHALLENGE_NOT_FOUND');
      }
      throw err;
    }
  }

  async incrementProgress(studentUserId: string, increment = 1) {
    const todayChallenge = await this.getTodayChallenge(studentUserId);
    const newProgress = todayChallenge.currentProgress + increment;

    const studentChallenge = await this.repository.getOrCreateStudentChallenge(
      studentUserId,
      todayChallenge.id
    );

    if (studentChallenge.status === 'IN_PROGRESS') {
      await this.repository.updateStudentProgress(
        studentChallenge.id,
        newProgress,
        todayChallenge.targetValue
      );
    }
  }

  private async generateDailyChallengeForStage(
    todayDate: Date,
    educationStage: EducationStage
  ) {
    const publishedCount = await this.repository.findPublishedQuestionsCountByStage(educationStage);

    let title = `Selesaikan 10 soal Kurikulum Merdeka ${educationStage}`;
    let description = `Jawab 10 soal cerita berstatus Published untuk jenjang ${educationStage}.`;
    let targetType: ChallengeTargetType = 'QUESTION_COUNT';
    let targetValue = 10;
    let rewardXp = 50;
    let rewardPowerupType: PowerupType = 'HINT_TOKEN';
    let rewardPowerupQty = 1;

    if (publishedCount === 0) {
      title = `Selesaikan 2 sesi belajar jenjang ${educationStage}`;
      description = `Tantangan harian belajar untuk jenjang ${educationStage}.`;
      targetType = 'LESSON_COUNT';
      targetValue = 2;
    }

    return this.repository.createChallenge({
      educationStage,
      challengeDate: todayDate,
      title,
      description,
      targetType,
      targetValue,
      rewardXp,
      rewardPowerupType,
      rewardPowerupQty
    });
  }
}
