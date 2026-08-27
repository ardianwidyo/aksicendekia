import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionService } from '../session.service';

describe('User Story 2 & 4: Answer Submission, Idempotency, and Double Completion Guard', () => {
  let mockRepo: any;
  let sessionService: SessionService;

  beforeEach(() => {
    mockRepo = {
      findExistingAnswerByIdempotencyKey: vi.fn(),
      findSessionById: vi.fn(),
      recordAnswerAndUpdateSession: vi.fn(),
      updateSessionStatus: vi.fn()
    };
    sessionService = new SessionService(mockRepo);
  });

  it('should return cached answer evaluation directly when Idempotency-Key is reused', async () => {
    mockRepo.findExistingAnswerByIdempotencyKey.mockResolvedValue({
      id: 'ans_123',
      questionId: 'q_001',
      isCorrect: true,
      studentAnswer: { type: 'MULTIPLE_CHOICE', selectedOptionId: 'opt_b' },
      question: {
        questionType: 'MULTIPLE_CHOICE',
        contentPayload: { correctOptionId: 'opt_b' },
        explanation: 'Jawaban benar adalah B'
      }
    });

    mockRepo.findSessionById.mockResolvedValue({
      id: 'sess_1',
      currentIndex: 1,
      totalQuestions: 5,
      status: 'IN_PROGRESS'
    });

    const result = await sessionService.submitAnswer(
      'std_1',
      'sess_1',
      { questionId: 'q_001', answer: { type: 'MULTIPLE_CHOICE', selectedOptionId: 'opt_b' }, timeSpentSeconds: 10 },
      'idem_uuid_12345'
    );

    expect(result.sessionId).toBe('sess_1');
    expect(result.isCorrect).toBe(true);
    expect(result.explanation).toBe('Jawaban benar adalah B');
    expect(mockRepo.recordAnswerAndUpdateSession).not.toHaveBeenCalled();
  });

  it('should calculate score 100% on server and ignore any client score claims', async () => {
    mockRepo.findExistingAnswerByIdempotencyKey.mockResolvedValue(null);
    mockRepo.findSessionById.mockResolvedValue({
      id: 'sess_1',
      studentId: 'std_1',
      status: 'IN_PROGRESS',
      currentIndex: 0,
      totalQuestions: 2,
      correctCount: 0,
      incorrectCount: 0,
      durationSeconds: 0,
      expiresAt: new Date(Date.now() + 100000),
      questionOrders: [
        {
          sequenceOrder: 0,
          questionId: 'q_001',
          question: {
            id: 'q_001',
            questionType: 'SHORT_ANSWER',
            contentPayload: { acceptedAnswers: ['Pancasila'], matchingMode: 'NORMALIZED' },
            explanation: 'Dasar negara adalah Pancasila'
          }
        }
      ]
    });

    mockRepo.recordAnswerAndUpdateSession.mockResolvedValue({
      answer: { id: 'ans_1' },
      session: { currentIndex: 1, totalQuestions: 2 }
    });

    const result = await sessionService.submitAnswer(
      'std_1',
      'sess_1',
      { questionId: 'q_001', answer: { type: 'SHORT_ANSWER', text: '  pancasila ' }, timeSpentSeconds: 15 },
      'idem_uuid_999'
    );

    expect(result.isCorrect).toBe(true);
    expect(result.explanation).toBe('Dasar negara adalah Pancasila');
    expect(mockRepo.recordAnswerAndUpdateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        isCorrect: true,
        correctCount: 1
      })
    );
  });
});
