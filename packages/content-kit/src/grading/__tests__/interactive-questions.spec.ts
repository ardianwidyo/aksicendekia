import { describe, it, expect } from 'vitest';
import { gradeQuestion } from '../grade-question';

/** T070 / T071 — grading for the two new interactive question types. */

describe('DRAG_DROP_GROUPING', () => {
  const payload = {
    correctMapping: { it_1: 'grp_half', it_2: 'grp_half', it_3: 'grp_other' },
    requireAllPlaced: true,
  };

  it('exact placement map → correct', () => {
    expect(
      gradeQuestion('DRAG_DROP_GROUPING', payload, {
        placements: { it_1: 'grp_half', it_2: 'grp_half', it_3: 'grp_other' },
      }).isCorrect,
    ).toBe(true);
  });

  it('partial placement → incorrect (no partial credit)', () => {
    expect(
      gradeQuestion('DRAG_DROP_GROUPING', payload, { placements: { it_1: 'grp_half' } }).isCorrect,
    ).toBe(false);
  });

  it('foreign item id → incorrect', () => {
    expect(
      gradeQuestion('DRAG_DROP_GROUPING', payload, {
        placements: { it_1: 'grp_half', it_2: 'grp_half', it_3: 'grp_other', ghost: 'grp_half' },
      }).isCorrect,
    ).toBe(false);
  });

  it('reports the correct mapping', () => {
    expect(gradeQuestion('DRAG_DROP_GROUPING', payload, {}).correctAnswerDetails).toEqual({
      correctMapping: payload.correctMapping,
    });
  });
});

describe('NUMBER_LINE', () => {
  it('tolerance 0 → exact only', () => {
    const payload = { targetValue: -3, tolerance: 0 };
    expect(gradeQuestion('NUMBER_LINE', payload, { value: -3 }).isCorrect).toBe(true);
    expect(gradeQuestion('NUMBER_LINE', payload, { value: -2 }).isCorrect).toBe(false);
    expect(gradeQuestion('NUMBER_LINE', payload, -3).isCorrect).toBe(true);
  });

  it('float epsilon absorbs rounding noise', () => {
    expect(gradeQuestion('NUMBER_LINE', { targetValue: 0.3, tolerance: 0 }, { value: 0.1 + 0.2 }).isCorrect).toBe(true);
  });

  it('tolerance band', () => {
    const payload = { target_value: 10, tolerance: 1 };
    expect(gradeQuestion('NUMBER_LINE', payload, { value: 10.9 }).isCorrect).toBe(true);
    expect(gradeQuestion('NUMBER_LINE', payload, { value: 11.5 }).isCorrect).toBe(false);
  });

  it('non-finite answer → incorrect', () => {
    expect(gradeQuestion('NUMBER_LINE', { targetValue: 5, tolerance: 0 }, { value: 'abc' }).isCorrect).toBe(false);
    expect(gradeQuestion('NUMBER_LINE', { targetValue: 5, tolerance: 0 }, {}).isCorrect).toBe(false);
  });
});

describe('unknown question type', () => {
  it('grades as incorrect, never throws', () => {
    expect(gradeQuestion('SOMETHING_ELSE', {}, {}).isCorrect).toBe(false);
  });
});
