import { describe, it, expect } from 'vitest';
import { LocalSessionEngine } from '../local-session-engine';

describe('LocalSessionEngine (Feature 009 - US2)', () => {
  describe('normalizeAnswerText', () => {
    it('harus memangkas spasi ganda, mengubah ke huruf kecil, dan membuang tanda baca akhir', () => {
      expect(LocalSessionEngine.normalizeAnswerText('  Jakarta.  ')).toBe('jakarta');
      expect(LocalSessionEngine.normalizeAnswerText('Ir.   Soekarno!')).toBe('ir. soekarno');
      expect(LocalSessionEngine.normalizeAnswerText('PANCASILA,')).toBe('pancasila');
    });

    it('harus menormalisasi diakritik Unicode NFD', () => {
      expect(LocalSessionEngine.normalizeAnswerText('Café')).toBe('cafe');
    });
  });

  describe('evaluateAnswer', () => {
    it('harus mengevaluasi jawaban MULTIPLE_CHOICE dengan benar', () => {
      const payload = {
        options: [{ id: 'opt_1', text: 'A' }, { id: 'opt_2', text: 'B' }],
        correct_option_id: 'opt_1',
      };

      expect(LocalSessionEngine.evaluateAnswer('MULTIPLE_CHOICE', payload, 'opt_1').isCorrect).toBe(true);
      expect(LocalSessionEngine.evaluateAnswer('MULTIPLE_CHOICE', payload, 'opt_2').isCorrect).toBe(false);
    });

    it('harus mengevaluasi SHORT_ANSWER mode NORMALIZED dengan variasi spasi dan huruf besar/kecil', () => {
      const payload = {
        matching_mode: 'NORMALIZED',
        accepted_answers: ['Oksigen', 'Gas Oksigen', 'O2'],
      };

      expect(LocalSessionEngine.evaluateAnswer('SHORT_ANSWER', payload, '  oksigen  ').isCorrect).toBe(true);
      expect(LocalSessionEngine.evaluateAnswer('SHORT_ANSWER', payload, 'OKSIGEN.').isCorrect).toBe(true);
      expect(LocalSessionEngine.evaluateAnswer('SHORT_ANSWER', payload, 'Karbon').isCorrect).toBe(false);
    });
  });

  describe('calculateXp', () => {
    it('harus menghitung 10 XP per soal benar', () => {
      expect(LocalSessionEngine.calculateXp(60, 3)).toBe(30);
    });

    it('harus memberikan bonus 20 XP jika skor 100%', () => {
      expect(LocalSessionEngine.calculateXp(100, 5)).toBe(70); // 50 + 20
    });
  });

  describe('updateStreak', () => {
    it('harus menginisialisasi streak ke 1 hari jika belum pernah ada aktivitas', () => {
      const initial = {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        activityHistory: [],
      };

      const updated = LocalSessionEngine.updateStreak(initial);
      expect(updated.currentStreak).toBe(1);
      expect(updated.longestStreak).toBe(1);
      expect(updated.lastActivityDate).toBe(new Date().toISOString().split('T')[0]);
    });
  });
});
