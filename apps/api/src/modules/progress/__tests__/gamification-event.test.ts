import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GamificationService, SessionCompletedEventPayload } from '../gamification.service';
import { ProgressRepository } from '../progress.repository';
import { EventIdempotencyHandler } from '../event-idempotency.handler';

describe('GamificationService - Event Idempotency & Processing', () => {
  let prismaMock: any;
  let repoMock: any;
  let gamificationService: GamificationService;

  beforeEach(() => {
    prismaMock = {
      processedEventLog: {
        findUnique: vi.fn(),
        create: vi.fn()
      },
      user: {
        findUnique: vi.fn()
      },
      studentProfile: {
        findUnique: vi.fn().mockResolvedValue({ id: 'prof-1', userId: 'usr-student-1' })
      },
      studentProgress: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      badgeDefinition: {
        findMany: vi.fn().mockResolvedValue([])
      },
      studentBadge: {
        findMany: vi.fn().mockResolvedValue([])
      },
      $transaction: vi.fn((callback) => callback(prismaMock))
    };

    repoMock = {
      getOrCreateStudentProgress: vi.fn().mockResolvedValue({
        id: 'prog-1',
        studentId: 'usr-student-1',
        totalXp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        timezone: 'Asia/Jakarta'
      }),
      addXpTransaction: vi.fn().mockResolvedValue({}),
      grantPowerup: vi.fn().mockResolvedValue({}),
      getPowerupBalance: vi.fn().mockResolvedValue(0),
      consumePowerupAtomic: vi.fn().mockResolvedValue(0),
      updateStudentLessonProgress: vi.fn().mockResolvedValue({}),
      unlockDownstreamLessons: vi.fn().mockResolvedValue({})
    };

    gamificationService = new GamificationService(prismaMock, repoMock);
  });

  it('harus memproses event penyelesaian sesi baru dan menambah XP', async () => {
    prismaMock.processedEventLog.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'usr-student-1',
      studentProfile: { id: 'prof-1' }
    });

    const payload: SessionCompletedEventPayload = {
      eventId: 'evt-001',
      eventType: 'learning.session.completed',
      aggregateId: 'sess-001',
      timestamp: new Date().toISOString(),
      data: {
        sessionId: 'sess-001',
        studentId: 'usr-student-1',
        lessonId: 'les-001',
        score: 100,
        correctCount: 5,
        incorrectCount: 0,
        totalQuestions: 5,
        durationSeconds: 120,
        completedAt: new Date().toISOString()
      }
    };

    await gamificationService.processSessionCompletedEvent(payload);

    expect(repoMock.addXpTransaction).toHaveBeenCalledWith(
      'usr-student-1',
      50, // 5 * 10
      'QUESTION_CORRECT',
      'sess-001',
      expect.anything()
    );
    expect(repoMock.addXpTransaction).toHaveBeenCalledWith(
      'usr-student-1',
      50, // lesson completion bonus
      'LESSON_BONUS',
      'sess-001',
      expect.anything()
    );
    expect(repoMock.addXpTransaction).toHaveBeenCalledWith(
      'usr-student-1',
      20, // perfect score bonus
      'PERFECT_SCORE_BONUS',
      'sess-001',
      expect.anything()
    );

    expect(prismaMock.processedEventLog.create).toHaveBeenCalledWith({
      data: {
        eventId: 'evt-001',
        eventType: 'learning.session.completed',
        aggregateId: 'sess-001'
      }
    });
  });

  it('harus mengabaikan event dengan eventId yang sama (Idempotent Ignore)', async () => {
    prismaMock.processedEventLog.findUnique.mockResolvedValue({
      eventId: 'evt-001',
      eventType: 'learning.session.completed',
      aggregateId: 'sess-001',
      processedAt: new Date()
    });

    const payload: SessionCompletedEventPayload = {
      eventId: 'evt-001',
      eventType: 'learning.session.completed',
      aggregateId: 'sess-001',
      timestamp: new Date().toISOString(),
      data: {
        sessionId: 'sess-001',
        studentId: 'usr-student-1',
        lessonId: 'les-001',
        score: 100,
        correctCount: 5,
        incorrectCount: 0,
        totalQuestions: 5,
        durationSeconds: 120,
        completedAt: new Date().toISOString()
      }
    };

    await gamificationService.processSessionCompletedEvent(payload);

    expect(repoMock.addXpTransaction).not.toHaveBeenCalled();
    expect(prismaMock.studentProgress.update).not.toHaveBeenCalled();
  });
});
