import { describe, it, expect } from 'vitest';
import { gradeQuestion, normalizeAnswerText } from '../session-grader';

describe('User Story 2: Server Grading & Normalized Short Answer Tolerance', () => {
  describe('normalizeAnswerText', () => {
    it('should trim leading/trailing whitespace and collapse internal spaces', () => {
      expect(normalizeAnswerText('  jakarta   selatan  ')).toBe('jakarta selatan');
    });

    it('should convert to lowercase and strip trailing punctuation', () => {
      expect(normalizeAnswerText('  JAKARTA.')).toBe('jakarta');
      expect(normalizeAnswerText('Indonesia!?!')).toBe('indonesia');
    });

    it('should normalize diacritics and accents', () => {
      expect(normalizeAnswerText('Café')).toBe('cafe');
      expect(normalizeAnswerText('München')).toBe('munchen');
    });
  });

  describe('gradeQuestion - MULTIPLE_CHOICE', () => {
    const payload = {
      options: [
        { id: 'opt_a', text: '10', isCorrect: false },
        { id: 'opt_b', text: '15', isCorrect: true }
      ],
      correctOptionId: 'opt_b'
    };

    it('should return isCorrect: true when student selects correct option', () => {
      const result = gradeQuestion('MULTIPLE_CHOICE', payload, { selectedOptionId: 'opt_b' });
      expect(result.isCorrect).toBe(true);
      expect(result.correctAnswerDetails.correctOptionId).toBe('opt_b');
    });

    it('should return isCorrect: false when student selects wrong option', () => {
      const result = gradeQuestion('MULTIPLE_CHOICE', payload, { selectedOptionId: 'opt_a' });
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('gradeQuestion - SHORT_ANSWER (Tolerant Normalized Matching)', () => {
    const payload = {
      acceptedAnswers: ['Jakarta', 'DKI Jakarta', 'Ir. Soekarno'],
      matchingMode: 'NORMALIZED'
    };

    it('should return true for exact normalized matches with capitalization/whitespace variations', () => {
      expect(gradeQuestion('SHORT_ANSWER', payload, { text: '  jakarta  ' }).isCorrect).toBe(true);
      expect(gradeQuestion('SHORT_ANSWER', payload, { text: '  JAKARTA. ' }).isCorrect).toBe(true);
      expect(gradeQuestion('SHORT_ANSWER', payload, { text: 'dki  jakarta' }).isCorrect).toBe(true);
      expect(gradeQuestion('SHORT_ANSWER', payload, { text: '  ir.  soekarno ' }).isCorrect).toBe(true);
    });

    it('should return false for incorrect short answers', () => {
      expect(gradeQuestion('SHORT_ANSWER', payload, { text: 'Bandung' }).isCorrect).toBe(false);
    });

    it('should evaluate EXACT matching mode strictly', () => {
      const exactPayload = { acceptedAnswers: ['Jakarta'], matchingMode: 'EXACT' };
      expect(gradeQuestion('SHORT_ANSWER', exactPayload, { text: 'Jakarta' }).isCorrect).toBe(true);
      expect(gradeQuestion('SHORT_ANSWER', exactPayload, { text: 'jakarta' }).isCorrect).toBe(false);
    });
  });

  describe('gradeQuestion - MATCHING_PAIRS', () => {
    const payload = {
      pairs: [
        { left: 'Indonesia', right: 'Jakarta' },
        { left: 'Jepang', right: 'Tokyo' }
      ]
    };

    it('should return isCorrect: true when all pairs match expected items', () => {
      const studentAnswer = {
        pairs: {
          Indonesia: 'Jakarta',
          Jepang: 'Tokyo'
        }
      };
      const result = gradeQuestion('MATCHING_PAIRS', payload, studentAnswer);
      expect(result.isCorrect).toBe(true);
    });

    it('should return isCorrect: false when any pair is mismatched', () => {
      const studentAnswer = {
        pairs: {
          Indonesia: 'Tokyo',
          Jepang: 'Jakarta'
        }
      };
      const result = gradeQuestion('MATCHING_PAIRS', payload, studentAnswer);
      expect(result.isCorrect).toBe(false);
    });
  });
});
