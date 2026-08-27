import { describe, it, expect } from 'vitest';
import { GamificationConfigService } from '../gamification-config.service';

describe('GamificationConfigService - XP Rules & Level Curve', () => {
  const configService = new GamificationConfigService();

  it('harus mengembalikan aturan dasar perolehan XP', () => {
    expect(configService.getCorrectAnswerBaseXp()).toBe(10);
    expect(configService.getLessonCompletionBonusXp()).toBe(50);
    expect(configService.getPerfectScoreBonusXp()).toBe(20);
  });

  it('harus menghitung ambang batas XP per level dengan formula eksponensial (100 * (level-1)^1.5)', () => {
    expect(configService.getLevelRequiredXp(1)).toBe(0);
    expect(configService.getLevelRequiredXp(2)).toBe(100);
    expect(configService.getLevelRequiredXp(3)).toBe(282); // floor(100 * 2^1.5) = 282
  });

  it('harus menghitung level siswa dan progres XP ke level berikutnya secara akurat', () => {
    // 0 XP -> Level 1
    const l1 = configService.calculateLevelFromXp(0);
    expect(l1.level).toBe(1);
    expect(l1.xpCurrentLevelProgress).toBe(0);
    expect(l1.xpToNextLevel).toBe(100);

    // 150 XP -> Level 2
    const l2 = configService.calculateLevelFromXp(150);
    expect(l2.level).toBe(2);
    expect(l2.xpCurrentLevelProgress).toBe(50); // 150 - 100
    expect(l2.xpToNextLevel).toBe(132); // 282 - 150 = 132

    // 300 XP -> Level 3
    const l3 = configService.calculateLevelFromXp(300);
    expect(l3.level).toBe(3);
    expect(l3.xpCurrentLevelProgress).toBe(18); // 300 - 282 = 18
  });
});
