import { describe, it, expect } from 'vitest';
import { gradeQuestion } from '@aksicendekia/content-kit';
import { LocalSessionEngine } from '../local-session-engine';

/**
 * Feature 010 / T074 — Guest Mode (client) grades DRAG_DROP_GROUPING and NUMBER_LINE
 * identically to an authenticated session (server), for the same input. Both paths
 * delegate to @aksicendekia/content-kit's gradeQuestion; this test guards against a
 * future re-divergence of the two wrapper call sites.
 */
describe('LocalSessionEngine vs server gradeQuestion — interactive question parity', () => {
  it('DRAG_DROP_GROUPING agrees for correct, partial, and foreign-id placements', () => {
    const payload = {
      items: [
        { id: 'it_1', label: '1/2' },
        { id: 'it_2', label: '2/4' },
        { id: 'it_3', label: '1/3' },
      ],
      groups: [
        { id: 'grp_half', label: 'Setengah' },
        { id: 'grp_other', label: 'Lainnya' },
      ],
      correctMapping: { it_1: 'grp_half', it_2: 'grp_half', it_3: 'grp_other' },
      requireAllPlaced: true,
    };

    const scenarios = [
      { placements: { it_1: 'grp_half', it_2: 'grp_half', it_3: 'grp_other' } },
      { placements: { it_1: 'grp_half' } },
      { placements: { it_1: 'grp_half', it_2: 'grp_half', it_3: 'grp_other', ghost: 'grp_half' } },
    ];

    for (const answer of scenarios) {
      const server = gradeQuestion('DRAG_DROP_GROUPING', payload, answer);
      const client = LocalSessionEngine.evaluateAnswer('DRAG_DROP_GROUPING', payload, answer);
      expect(client.isCorrect).toBe(server.isCorrect);
    }
  });

  it('NUMBER_LINE agrees for exact, tolerance-band, and non-finite answers', () => {
    const payload = { min: -10, max: 10, step: 1, targetValue: -3, tolerance: 1 };

    const scenarios = [{ value: -3 }, { value: -2 }, { value: 5 }, { value: 'abc' }, {}];

    for (const answer of scenarios) {
      const server = gradeQuestion('NUMBER_LINE', payload, answer);
      const client = LocalSessionEngine.evaluateAnswer('NUMBER_LINE', payload, answer);
      expect(client.isCorrect).toBe(server.isCorrect);
    }
  });
});
