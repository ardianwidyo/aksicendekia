import gamificationConfig from '../../config/gamification-config.json';

export class GamificationConfigService {
  private config = gamificationConfig;

  getCorrectAnswerBaseXp(): number {
    return this.config.xpRules.correctAnswerBaseXp;
  }

  getLessonCompletionBonusXp(): number {
    return this.config.xpRules.lessonCompletionBonusXp;
  }

  getPerfectScoreBonusXp(): number {
    return this.config.xpRules.perfectScoreBonusXp;
  }

  getLevelRequiredXp(level: number): number {
    if (level <= 1) return 0;
    const { baseXp, exponent } = this.config.levelCurve;
    return Math.floor(baseXp * Math.pow(level - 1, exponent));
  }

  calculateLevelFromXp(totalXp: number): {
    level: number;
    xpToNextLevel: number;
    xpCurrentLevelProgress: number;
  } {
    let level = 1;
    while (level < this.config.levelCurve.maxLevel) {
      const nextLevelXp = this.getLevelRequiredXp(level + 1);
      if (totalXp < nextLevelXp) {
        break;
      }
      level++;
    }

    const currentLevelBaseXp = this.getLevelRequiredXp(level);
    const nextLevelXp = this.getLevelRequiredXp(level + 1);
    const xpCurrentLevelProgress = totalXp - currentLevelBaseXp;
    const xpToNextLevel = nextLevelXp - totalXp;

    return {
      level,
      xpToNextLevel: Math.max(0, xpToNextLevel),
      xpCurrentLevelProgress: Math.max(0, xpCurrentLevelProgress)
    };
  }
}
