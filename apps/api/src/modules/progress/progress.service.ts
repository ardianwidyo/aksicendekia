import { PrismaClient, PowerupType } from '@prisma/client';
import { ProgressRepository } from './progress.repository';
import { GamificationConfigService } from './gamification-config.service';
import { MissionMapResolver } from './mission-map.resolver';
import {
  MissionMapResponseDTO,
  StudentAchievementDashboardDTO,
  ConsumePowerupResponseDTO,
  AchievementBadgeDTO,
  SubjectProgressSummaryDTO
} from './progress.dto';

export class ProgressService {
  private configService: GamificationConfigService;
  private missionMapResolver: MissionMapResolver;

  constructor(
    private prisma: PrismaClient,
    private repository: ProgressRepository
  ) {
    this.configService = new GamificationConfigService();
    this.missionMapResolver = new MissionMapResolver(prisma);
  }

  async getMissionMap(subjectId: string, studentUserId: string): Promise<MissionMapResponseDTO> {
    return this.missionMapResolver.resolveMissionMap(subjectId, studentUserId);
  }

  async getStudentAchievements(studentUserId: string): Promise<StudentAchievementDashboardDTO> {
    const progress = await this.repository.getOrCreateStudentProgress(studentUserId);
    const levelInfo = this.configService.calculateLevelFromXp(progress.totalXp);
    const powerupBalances = await this.repository.getAllPowerupBalances(studentUserId);

    // Ambil seluruh Badge Definitions & Badges yang telah dibuka siswa
    const allBadgeDefinitions = await this.prisma.badgeDefinition.findMany();
    const unlockedBadges = await this.prisma.studentBadge.findMany({
      where: { studentId: studentUserId }
    });
    const unlockedMap = new Map(unlockedBadges.map((b) => [b.badgeId, b.unlockedAt]));

    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId: studentUserId }
    });

    const badgeDTOs: AchievementBadgeDTO[] = allBadgeDefinitions.map((bd) => {
      const unlockedAt = unlockedMap.get(bd.id);
      const isUnlocked = !!unlockedAt;

      return {
        badgeId: bd.id,
        code: bd.code,
        name: bd.name,
        description: bd.description,
        iconUrl: bd.iconUrl,
        category: bd.category,
        isUnlocked,
        unlockedAt: unlockedAt ? unlockedAt.toISOString() : null,
        progressPercentage: isUnlocked ? 100 : 0
      };
    });

    // Ringkasan progres per Mata Pelajaran
    const subjects = await this.prisma.subject.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        units: {
          where: { status: 'PUBLISHED' },
          include: {
            lessons: {
              where: { status: 'PUBLISHED' }
            }
          }
        }
      }
    });

    const studentLessonProgressRecords = profile
      ? await this.prisma.studentLessonProgress.findMany({
          where: { studentProfileId: profile.id, isCompleted: true }
        })
      : [];

    const completedLessonIds = new Set(studentLessonProgressRecords.map((p) => p.lessonId));

    const subjectSummaries: SubjectProgressSummaryDTO[] = subjects.map((sub) => {
      const allSubjectLessons = sub.units.flatMap((u) => u.lessons);
      const totalLessons = allSubjectLessons.length;
      const completedLessons = allSubjectLessons.filter((l) => completedLessonIds.has(l.id)).length;
      const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        subjectId: sub.id,
        subjectName: sub.name,
        totalLessons,
        completedLessons,
        completionPercentage,
        totalXpEarned: completedLessons * 50
      };
    });

    return {
      totalXp: progress.totalXp,
      level: levelInfo.level,
      xpToNextLevel: levelInfo.xpToNextLevel,
      xpCurrentLevelProgress: levelInfo.xpCurrentLevelProgress,
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak,
      formattedStreakText: `${progress.currentStreak} Hari Beruntun!`,
      powerupBalances,
      badges: badgeDTOs,
      subjectProgress: subjectSummaries
    };
  }

  async consumePowerup(
    studentUserId: string,
    powerupType: PowerupType,
    sessionId?: string
  ): Promise<ConsumePowerupResponseDTO> {
    const remainingQuantity = await this.repository.consumePowerupAtomic(
      studentUserId,
      powerupType,
      1,
      'SESSION_CONSUME',
      sessionId
    );

    return {
      powerupType,
      remainingQuantity,
      consumedAt: new Date().toISOString()
    };
  }
}
