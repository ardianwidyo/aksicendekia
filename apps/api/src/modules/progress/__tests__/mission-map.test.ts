import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MissionMapResolver } from '../mission-map.resolver';

describe('MissionMapResolver', () => {
  let prismaMock: any;
  let resolver: MissionMapResolver;

  beforeEach(() => {
    prismaMock = {
      subject: {
        findUnique: vi.fn()
      },
      studentProfile: {
        findUnique: vi.fn().mockResolvedValue({ id: 'prof-1', userId: 'usr-1' })
      },
      studentLessonProgress: {
        findMany: vi.fn().mockResolvedValue([
          { lessonId: 'les-1', isCompleted: true, bestScore: 100 }
        ])
      }
    };

    resolver = new MissionMapResolver(prismaMock);
  });

  it('harus menyelesaikan status simpul Peta Misi (COMPLETED, CURRENT, LOCKED)', async () => {
    prismaMock.subject.findUnique.mockResolvedValue({
      id: 'subj-1',
      name: 'Matematika SD',
      units: [
        {
          id: 'u-1',
          lessons: [
            { id: 'les-1', title: 'Pelajaran 1', prerequisites: [] },
            { id: 'les-2', title: 'Pelajaran 2', prerequisites: [{ prerequisiteLessonId: 'les-1' }] },
            { id: 'les-3', title: 'Pelajaran 3', prerequisites: [{ prerequisiteLessonId: 'les-2' }] }
          ]
        }
      ]
    });

    const map = await resolver.resolveMissionMap('subj-1', 'usr-1');

    expect(map.nodes).toHaveLength(3);
    expect(map.nodes[0].status).toBe('COMPLETED');
    expect(map.nodes[0].bestScore).toBe(100);
    expect(map.nodes[1].status).toBe('CURRENT');
    expect(map.nodes[2].status).toBe('LOCKED');
  });
});
