import { PowerupType } from '@prisma/client';

export interface MissionMapNodeDTO {
  lessonId: string;
  title: string;
  sequenceOrder: number;
  status: 'COMPLETED' | 'CURRENT' | 'UNLOCKED' | 'LOCKED';
  bestScore: number | null;
  prerequisites: string[];
}

export interface MissionMapResponseDTO {
  subjectId: string;
  subjectName: string;
  nodes: MissionMapNodeDTO[];
}

export interface AchievementBadgeDTO {
  badgeId: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string;
  category: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progressPercentage: number;
}

export interface SubjectProgressSummaryDTO {
  subjectId: string;
  subjectName: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  totalXpEarned: number;
}

export interface StudentAchievementDashboardDTO {
  totalXp: number;
  level: number;
  xpToNextLevel: number;
  xpCurrentLevelProgress: number;
  currentStreak: number;
  longestStreak: number;
  formattedStreakText: string;
  powerupBalances: Record<PowerupType, number>;
  badges: AchievementBadgeDTO[];
  subjectProgress: SubjectProgressSummaryDTO[];
}

export interface ConsumePowerupResponseDTO {
  powerupType: PowerupType;
  remainingQuantity: number;
  consumedAt: string;
}
