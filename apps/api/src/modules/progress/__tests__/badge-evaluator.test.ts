import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadgeEvaluator } from '../badge.evaluator';

describe('BadgeEvaluator', () => {
  let prismaMock: any;
  let evaluator: BadgeEvaluator;

  beforeEach(() => {
    prismaMock = {
      studentProfile: {
        findUnique: vi.fn().mockResolvedValue({ id: 'prof-1', userId: 'usr-1' })
      },
      badgeDefinition: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'bdg-1',
            code: 'FIRST_LESSON',
            name: 'Langkah Pertama',
            conditionType: 'LESSONS_COMPLETED',
            conditionParameter: { count: 1 }
          },
          {
            id: 'bdg-2',
            code: 'STREAK_7',
            name: 'Pejuang 7 Hari',
            conditionType: 'STREAK_LENGTH',
            conditionParameter: { days: 7 }
          }
        ])
      },
      studentBadge: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({})
      },
      studentProgress: {
        findUnique: vi.fn().mockResolvedValue({ currentStreak: 7 })
      },
      studentLessonProgress: {
        count: vi.fn().mockResolvedValue(1)
      }
    };

    evaluator = new BadgeEvaluator(prismaMock);
  });

  it('harus mengevaluasi dan memberikan badge yang kondisinya terpenuhi', async () => {
    const unlockedBadgeIds = await evaluator.evaluateBadgesForStudent('usr-1', 'evt-1');

    expect(unlockedBadgeIds).toContain('bdg-1');
    expect(unlockedBadgeIds).toContain('bdg-2');
    expect(prismaMock.studentBadge.create).toHaveBeenCalledTimes(2);
  });

  it('harus mengabaikan badge yang sudah pernah diperoleh sebelumnya', async () => {
    prismaMock.studentBadge.findMany.mockResolvedValue([{ badgeId: 'bdg-1' }]);

    const unlockedBadgeIds = await evaluator.evaluateBadgesForStudent('usr-1', 'evt-1');

    expect(unlockedBadgeIds).not.toContain('bdg-1');
    expect(unlockedBadgeIds).toContain('bdg-2');
    expect(prismaMock.studentBadge.create).toHaveBeenCalledTimes(1);
  });
});
