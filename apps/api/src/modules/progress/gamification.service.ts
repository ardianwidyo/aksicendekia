import { PrismaClient, XpSourceType } from '@prisma/client';
import { ProgressRepository } from './progress.repository';
import { GamificationConfigService } from './gamification-config.service';
import { EventIdempotencyHandler } from './event-idempotency.handler';
import { BadgeEvaluator } from './badge.evaluator';
import { getLocalDateString, isSameCalendarDay, isNextCalendarDay, getDaysDifference } from './timezone.util';

export interface SessionCompletedEventPayload {
  eventId: string;
  eventType: string;
  aggregateId: string;
  timestamp: string;
  data: {
    sessionId: string;
    studentId: string;
    lessonId: string;
    score: number;
    correctCount: number;
    incorrectCount: number;
    totalQuestions: number;
    durationSeconds: number;
    completedAt: string;
  };
}

export class GamificationService {
  private configService: GamificationConfigService;
  private idempotencyHandler: EventIdempotencyHandler;
  private badgeEvaluator: BadgeEvaluator;

  constructor(
    private prisma: PrismaClient,
    private repository: ProgressRepository
  ) {
    this.configService = new GamificationConfigService();
    this.idempotencyHandler = new EventIdempotencyHandler(prisma);
    this.badgeEvaluator = new BadgeEvaluator(prisma);
  }

  async processSessionCompletedEvent(payload: SessionCompletedEventPayload): Promise<void> {
    const { eventId, eventType, aggregateId, data } = payload;

    // 1. Pengecekan Idempotensi (Fast return jika event sudah pernah diproses)
    const isProcessed = await this.idempotencyHandler.isEventProcessed(eventId);
    if (isProcessed) {
      return;
    }

    // 2. Eksekusi seluruh mutasi gamifikasi dalam Prisma Transaction
    await this.prisma.$transaction(async (tx) => {
      const student = await tx.user.findUnique({
        where: { id: data.studentId },
        include: { studentProfile: true }
      });

      if (!student) {
        throw new Error(`Siswa dengan ID ${data.studentId} tidak ditemukan`);
      }

      const timezone = 'Asia/Jakarta'; // Profil timezone (default Asia/Jakarta)
      const progress = await this.repository.getOrCreateStudentProgress(data.studentId, timezone, tx);

      // 3. Kalkulasi XP
      const baseXp = data.correctCount * this.configService.getCorrectAnswerBaseXp();
      const lessonBonus = this.configService.getLessonCompletionBonusXp();
      const perfectBonus = Number(data.score) === 100 ? this.configService.getPerfectScoreBonusXp() : 0;
      const totalEventXp = baseXp + lessonBonus + perfectBonus;

      if (baseXp > 0) {
        await this.repository.addXpTransaction(data.studentId, baseXp, 'QUESTION_CORRECT', data.sessionId, tx);
      }
      if (lessonBonus > 0) {
        await this.repository.addXpTransaction(data.studentId, lessonBonus, 'LESSON_BONUS', data.sessionId, tx);
      }
      if (perfectBonus > 0) {
        await this.repository.addXpTransaction(data.studentId, perfectBonus, 'PERFECT_SCORE_BONUS', data.sessionId, tx);
      }

      const newTotalXp = progress.totalXp + totalEventXp;
      const levelInfo = this.configService.calculateLevelFromXp(newTotalXp);

      let updatedLevel = progress.level;
      if (levelInfo.level > progress.level) {
        updatedLevel = levelInfo.level;
        // Milestone Reward: 1 Token Petunjuk gratis saat Kenaikan Level
        await this.repository.grantPowerup(data.studentId, 'HINT_TOKEN', 1, 'LEVEL_UP_REWARD', `level-${updatedLevel}`, tx);
      }

      // 4. Kalkulasi Streak Harian Multi-Timezone & Proteksi Pembeku Waktu
      const completedDate = new Date(data.completedAt);
      const localDateStr = getLocalDateString(completedDate, progress.timezone);

      let newStreak = progress.currentStreak;
      let newLongestStreak = progress.longestStreak;
      let newLastActiveDate = progress.lastActiveDate;

      if (!progress.lastActiveDate) {
        newStreak = 1;
        newLongestStreak = 1;
        newLastActiveDate = localDateStr;
      } else if (isSameCalendarDay(progress.lastActiveDate, localDateStr)) {
        // Hari yang sama: streak tetap
        newStreak = progress.currentStreak;
      } else if (isNextCalendarDay(progress.lastActiveDate, localDateStr)) {
        // Hari berikutnya: streak bertambah +1
        newStreak = progress.currentStreak + 1;
        newLongestStreak = Math.max(progress.longestStreak, newStreak);
        newLastActiveDate = localDateStr;

        // Cek Streak Milestone Rewards (7, 14, 30 hari)
        if (newStreak === 7) {
          await this.repository.grantPowerup(data.studentId, 'STREAK_FREEZE', 1, 'STREAK_MILESTONE_7', data.sessionId, tx);
        } else if (newStreak === 14) {
          await this.repository.grantPowerup(data.studentId, 'HINT_TOKEN', 3, 'STREAK_MILESTONE_14', data.sessionId, tx);
        } else if (newStreak === 30) {
          await this.repository.grantPowerup(data.studentId, 'STREAK_FREEZE', 2, 'STREAK_MILESTONE_30', data.sessionId, tx);
        }
      } else {
        // Terlewat 1 hari atau lebih
        const daysDiff = getDaysDifference(progress.lastActiveDate, localDateStr);
        if (daysDiff === 2) {
          // Terlewat tepat 1 hari kalender: Cek ketersediaan Pembeku Waktu (Streak Freeze)
          const freezeBalance = await this.repository.getPowerupBalance(data.studentId, 'STREAK_FREEZE', tx);
          if (freezeBalance > 0) {
            // Konsumsi otomatis 1 Streak Freeze dan pertahankan streak
            await this.repository.consumePowerupAtomic(data.studentId, 'STREAK_FREEZE', 1, 'AUTO_STREAK_PROTECTION', data.sessionId, tx);
            newStreak = progress.currentStreak + 1;
            newLongestStreak = Math.max(progress.longestStreak, newStreak);
            newLastActiveDate = localDateStr;
          } else {
            // Saldo tidak ada: reset streak ke 1
            newStreak = 1;
            newLastActiveDate = localDateStr;
          }
        } else {
          // Terlewat > 2 hari: reset streak ke 1
          newStreak = 1;
          newLastActiveDate = localDateStr;
        }
      }

      // Update StudentProgress State
      await tx.studentProgress.update({
        where: { studentId: data.studentId },
        data: {
          totalXp: newTotalXp,
          level: updatedLevel,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastActiveDate: newLastActiveDate
        }
      });

      // 5. Update Status Progres Pelajaran & Pembukaan Prasyarat Turunan
      if (student.studentProfile) {
        await this.repository.updateStudentLessonProgress(
          student.studentProfile.id,
          data.lessonId,
          data.score,
          tx
        );
        await this.repository.unlockDownstreamLessons(
          student.studentProfile.id,
          data.lessonId,
          tx
        );
      }

      // 6. Evaluasi Badge Event-Driven
      await this.badgeEvaluator.evaluateBadgesForStudent(data.studentId, eventId, tx);

      // 7. Tandai event berhasil diproses (Log Idempotensi)
      await this.idempotencyHandler.markEventProcessed(eventId, eventType, aggregateId, tx);
    });
  }
}
