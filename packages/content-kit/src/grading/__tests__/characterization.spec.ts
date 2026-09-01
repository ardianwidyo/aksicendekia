import { describe, it, expect } from 'vitest';
import { gradeQuestion } from '../grade-question';
import { normalizeAnswerText } from '../normalize';

/**
 * T011 — locks the grading behaviour the repo shipped before Feature 010 unified
 * session-grader.ts and local-session-engine.ts into content-kit.
 *
 * DELIBERATE divergence (documented): trailing `;` / `:` are now stripped for BOTH
 * paths (previously only local-session-engine did). See the dedicated block below.
 */

describe('MULTIPLE_CHOICE — both key conventions', () => {
  it('camelCase payload (was session-grader.ts)', () => {
    const payload = { correctOptionId: 'opt_a', options: [{ id: 'opt_a' }, { id: 'opt_b' }] };
    expect(gradeQuestion('MULTIPLE_CHOICE', payload, 'opt_a').isCorrect).toBe(true);
    expect(gradeQuestion('MULTIPLE_CHOICE', payload, { selectedOptionId: 'opt_b' }).isCorrect).toBe(false);
  });

  it('snake_case payload (was local-session-engine.ts)', () => {
    const payload = { correct_option_id: 'opt_a' };
    expect(gradeQuestion('MULTIPLE_CHOICE', payload, 'opt_a').isCorrect).toBe(true);
    expect(gradeQuestion('MULTIPLE_CHOICE', payload, ' opt_a ').isCorrect).toBe(true); // trimmed
  });

  it('options[].isCorrect fallback', () => {
    const payload = { options: [{ id: 'x', isCorrect: false }, { id: 'y', isCorrect: true }] };
    expect(gradeQuestion('MULTIPLE_CHOICE', payload, 'y').isCorrect).toBe(true);
  });

  it('no answer / no key → incorrect', () => {
    expect(gradeQuestion('MULTIPLE_CHOICE', {}, '').isCorrect).toBe(false);
  });
});

describe('SHORT_ANSWER — all matching modes, both conventions', () => {
  it('EXACT is byte-for-byte', () => {
    const payload = { acceptedAnswers: ['Rp1.500'], matchingMode: 'EXACT' };
    expect(gradeQuestion('SHORT_ANSWER', payload, 'Rp1.500').isCorrect).toBe(true);
    expect(gradeQuestion('SHORT_ANSWER', payload, 'rp1.500').isCorrect).toBe(false);
  });

  it('CASE_INSENSITIVE ignores case + outer spaces', () => {
    const payload = { accepted_answers: ['Sepuluh'], matching_mode: 'CASE_INSENSITIVE' };
    expect(gradeQuestion('SHORT_ANSWER', payload, '  sepuluh ').isCorrect).toBe(true);
  });

  it('NORMALIZED collapses spaces, case, diacritics (default mode)', () => {
    const payload = { accepted_answers: ['kué'] };
    expect(gradeQuestion('SHORT_ANSWER', payload, 'KUE').isCorrect).toBe(true);
    expect(gradeQuestion('SHORT_ANSWER', { acceptedAnswers: ['dua  puluh'] }, 'Dua Puluh').isCorrect).toBe(true);
  });

  it('object answer via .text / .answer', () => {
    const payload = { acceptedAnswers: ['sepuluh'] };
    expect(gradeQuestion('SHORT_ANSWER', payload, { text: 'sepuluh' }).isCorrect).toBe(true);
    expect(gradeQuestion('SHORT_ANSWER', payload, { answer: 'sepuluh' }).isCorrect).toBe(true);
  });

  describe('trailing punctuation (DELIBERATE unification on [.,!?;:])', () => {
    it('strips . , ! ? like both old implementations', () => {
      for (const suffix of ['.', ',', '!', '?']) {
        expect(gradeQuestion('SHORT_ANSWER', { acceptedAnswers: ['sepuluh'] }, `sepuluh${suffix}`).isCorrect).toBe(true);
      }
    });

    it('now ALSO strips ; and : for the server path (was local-only behaviour)', () => {
      expect(gradeQuestion('SHORT_ANSWER', { acceptedAnswers: ['sepuluh'] }, 'sepuluh;').isCorrect).toBe(true);
      expect(gradeQuestion('SHORT_ANSWER', { acceptedAnswers: ['sepuluh'] }, 'sepuluh:').isCorrect).toBe(true);
    });
  });
});

describe('MATCHING_PAIRS — array + object payloads', () => {
  it('array {left,right} payload, exact map match', () => {
    const payload = { pairs: [{ left: 'a', right: '1' }, { left: 'b', right: '2' }] };
    expect(gradeQuestion('MATCHING_PAIRS', payload, { pairs: { a: '1', b: '2' } }).isCorrect).toBe(true);
    expect(gradeQuestion('MATCHING_PAIRS', payload, { a: '1', b: '2' }).isCorrect).toBe(true);
  });

  it('missing / extra / swapped pair → incorrect', () => {
    const payload = { matching_pairs: [{ left: 'a', right: '1' }, { left: 'b', right: '2' }] };
    expect(gradeQuestion('MATCHING_PAIRS', payload, { a: '1' }).isCorrect).toBe(false); // missing
    expect(gradeQuestion('MATCHING_PAIRS', payload, { a: '1', b: '2', c: '3' }).isCorrect).toBe(false); // extra
    expect(gradeQuestion('MATCHING_PAIRS', payload, { a: '2', b: '1' }).isCorrect).toBe(false); // swapped
  });

  it('empty expected pairs → incorrect', () => {
    expect(gradeQuestion('MATCHING_PAIRS', { pairs: [] }, {}).isCorrect).toBe(false);
  });
});

describe('normalizeAnswerText direct', () => {
  it('is idempotent and lowercase/trim/collapse', () => {
    expect(normalizeAnswerText('  Halo   Dunia. ')).toBe('halo dunia');
    expect(normalizeAnswerText(normalizeAnswerText('Café;'))).toBe('cafe');
  });
});
