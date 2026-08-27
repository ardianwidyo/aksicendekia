import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toClientQuestionDTO } from '../session-mapper';
import { SessionService } from '../session.service';

describe('User Story 1: Session Initialization & Zero Key Answer Leakage', () => {
  describe('toClientQuestionDTO Mapper', () => {
    it('should strictly omit correct_option_id and explanation from MULTIPLE_CHOICE question', () => {
      const dbQuestion = {
        id: 'q_001',
        questionType: 'MULTIPLE_CHOICE' as const,
        promptText: 'Berapakah 10 + 5?',
        contentPayload: {
          options: [
            { id: 'opt_a', text: '15', isCorrect: true },
            { id: 'opt_b', text: '20', isCorrect: false }
          ],
          correctOptionId: 'opt_a',
          explanation: '10 dikali 5 sama dengan 15'
        },
        hints: [{ id: 'h1' }, { id: 'h2' }]
      };

      const dto = toClientQuestionDTO(dbQuestion);

      expect(dto.id).toBe('q_001');
      expect(dto.type).toBe('MULTIPLE_CHOICE');
      expect(dto.prompt).toBe('Berapakah 10 + 5?');
      expect(dto.availableHintsCount).toBe(2);
      expect(dto.options).toHaveLength(2);
      expect(dto.options![0]).toEqual({ id: 'opt_a', text: '15' });
      expect(dto.options![1]).toEqual({ id: 'opt_b', text: '20' });

      // Zero Key Answer Leakage Assertions
      expect((dto as any).correctOptionId).toBeUndefined();
      expect((dto as any).explanation).toBeUndefined();
      expect((dto.options![0] as any).isCorrect).toBeUndefined();
    });

    it('should strictly omit accepted_answers and matching_mode from SHORT_ANSWER question', () => {
      const dbQuestion = {
        id: 'q_002',
        questionType: 'SHORT_ANSWER' as const,
        promptText: 'Sebutkan ibu kota Indonesia!',
        contentPayload: {
          acceptedAnswers: ['Jakarta', 'DKI Jakarta'],
          matchingMode: 'NORMALIZED',
          explanation: 'Ibu kota negara adalah Jakarta'
        },
        hints: []
      };

      const dto = toClientQuestionDTO(dbQuestion);

      expect(dto.id).toBe('q_002');
      expect(dto.type).toBe('SHORT_ANSWER');
      expect(dto.prompt).toBe('Sebutkan ibu kota Indonesia!');
      expect(dto.availableHintsCount).toBe(0);

      // Zero Key Answer Leakage Assertions
      expect((dto as any).acceptedAnswers).toBeUndefined();
      expect((dto as any).matchingMode).toBeUndefined();
      expect((dto as any).explanation).toBeUndefined();
    });

    it('should strictly omit answer pairs mapping from MATCHING_PAIRS question', () => {
      const dbQuestion = {
        id: 'q_003',
        questionType: 'MATCHING_PAIRS' as const,
        promptText: 'Cocokkan negara dengan ibu kotanya!',
        contentPayload: {
          pairs: [
            { left: 'Indonesia', right: 'Jakarta' },
            { left: 'Jepang', right: 'Tokyo' }
          ],
          explanation: 'Pasangan sah'
        },
        hints: [{ id: 'h1' }]
      };

      const dto = toClientQuestionDTO(dbQuestion);

      expect(dto.id).toBe('q_003');
      expect(dto.type).toBe('MATCHING_PAIRS');
      expect(dto.matchingItemsLeft).toContain('Indonesia');
      expect(dto.matchingItemsLeft).toContain('Jepang');
      expect(dto.matchingItemsRight).toContain('Jakarta');
      expect(dto.matchingItemsRight).toContain('Tokyo');

      // Zero Key Answer Leakage Assertions
      expect((dto as any).pairs).toBeUndefined();
      expect((dto as any).explanation).toBeUndefined();
    });
  });

  describe('SessionService.createSession', () => {
    let mockRepo: any;
    let sessionService: SessionService;

    beforeEach(() => {
      mockRepo = {
        findLessonWithSubject: vi.fn(),
        findPublishedQuestions: vi.fn(),
        findActiveSession: vi.fn(),
        createLearningSession: vi.fn(),
        findSessionById: vi.fn()
      };
      sessionService = new SessionService(mockRepo);
    });

    it('should throw NotFoundError if lesson does not exist or is not PUBLISHED', async () => {
      mockRepo.findLessonWithSubject.mockResolvedValue(null);

      await expect(sessionService.createSession('usr_std_1', 'lesson_not_found')).rejects.toThrow(
        'Pelajaran tidak ditemukan'
      );
    });

    it('should throw ForbiddenError if lesson is not PUBLISHED', async () => {
      mockRepo.findLessonWithSubject.mockResolvedValue({
        id: 'lesson_1',
        status: 'DRAFT',
        unit: { subject: { id: 'subj_1' } }
      });

      await expect(sessionService.createSession('usr_std_1', 'lesson_1')).rejects.toThrow(
        'Hanya pelajaran terbit (PUBLISHED) yang dapat diakses'
      );
    });

    it('should throw ConflictError if lesson has no published question items', async () => {
      mockRepo.findLessonWithSubject.mockResolvedValue({
        id: 'lesson_1',
        status: 'PUBLISHED',
        unit: { subject: { id: 'subj_1' } }
      });
      mockRepo.findPublishedQuestions.mockResolvedValue([]);

      await expect(sessionService.createSession('usr_std_1', 'lesson_1')).rejects.toThrow(
        'Pelajaran ini belum memiliki butir soal terbit'
      );
    });
  });
});
