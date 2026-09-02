import { describe, it, expect } from 'vitest';
import { gradeQuestion } from '../session-grader';
import { toClientQuestionDTO } from '../session-mapper';

/**
 * Feature 010 / T073 — session-grader delegates DRAG_DROP_GROUPING + NUMBER_LINE to
 * @aksicendekia/content-kit, and the client-facing question DTO exposes rendering
 * data for the new types while stripping the answer key
 * (contracts/interactive-questions.contract.md §4).
 */
describe('session-grader — interactive question types', () => {
  it('grades DRAG_DROP_GROUPING via the shared content-kit grader', () => {
    const payload = {
      items: [
        { id: 'it_1', label: '1/2' },
        { id: 'it_2', label: '2/4' },
      ],
      groups: [
        { id: 'grp_half', label: 'Setengah' },
        { id: 'grp_other', label: 'Lainnya' },
      ],
      correctMapping: { it_1: 'grp_half', it_2: 'grp_half' },
      requireAllPlaced: true,
    };
    const correct = gradeQuestion('DRAG_DROP_GROUPING', payload, {
      placements: { it_1: 'grp_half', it_2: 'grp_half' },
    });
    expect(correct.isCorrect).toBe(true);

    const incorrect = gradeQuestion('DRAG_DROP_GROUPING', payload, {
      placements: { it_1: 'grp_other', it_2: 'grp_half' },
    });
    expect(incorrect.isCorrect).toBe(false);
  });

  it('grades NUMBER_LINE via the shared content-kit grader', () => {
    const payload = { min: -10, max: 10, step: 1, targetValue: -3, tolerance: 0 };
    expect(gradeQuestion('NUMBER_LINE', payload, { value: -3 }).isCorrect).toBe(true);
    expect(gradeQuestion('NUMBER_LINE', payload, { value: -2 }).isCorrect).toBe(false);
  });
});

describe('toClientQuestionDTO — answer-key stripping for interactive types (§4)', () => {
  it('DRAG_DROP_GROUPING: exposes items/groups but never correctMapping', () => {
    const question = {
      id: 'q1',
      questionType: 'DRAG_DROP_GROUPING' as const,
      promptText: 'Kelompokkan pecahan berikut',
      contentPayload: {
        items: [{ id: 'it_1', label: '1/2' }, { id: 'it_2', label: '2/4' }],
        groups: [{ id: 'grp_half', label: 'Setengah' }],
        correctMapping: { it_1: 'grp_half', it_2: 'grp_half' },
        requireAllPlaced: true,
      },
    };

    const dto = toClientQuestionDTO(question);

    expect(dto.dragDropItems).toEqual([
      { id: 'it_1', label: '1/2', illustrationAssetId: null },
      { id: 'it_2', label: '2/4', illustrationAssetId: null },
    ]);
    expect(dto.dragDropGroups).toEqual([{ id: 'grp_half', label: 'Setengah' }]);
    expect(dto.requireAllPlaced).toBe(true);
    expect(JSON.stringify(dto)).not.toContain('correctMapping');
  });

  it('NUMBER_LINE: exposes min/max/step/markers but never targetValue or tolerance', () => {
    const question = {
      id: 'q2',
      questionType: 'NUMBER_LINE' as const,
      promptText: 'Letakkan penanda pada -3',
      contentPayload: { min: -10, max: 10, step: 1, targetValue: -3, tolerance: 0, markers: [0, 5] },
    };

    const dto = toClientQuestionDTO(question);

    expect(dto.numberLineMin).toBe(-10);
    expect(dto.numberLineMax).toBe(10);
    expect(dto.numberLineStep).toBe(1);
    expect(dto.numberLineMarkers).toEqual([0, 5]);
    expect(JSON.stringify(dto)).not.toContain('targetValue');
    expect(JSON.stringify(dto)).not.toContain('tolerance');
  });
});
