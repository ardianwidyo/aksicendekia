import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DailyChallengeService } from '../daily-challenge.service';
import { DailyChallengeRepository } from '../daily-challenge.repository';

describe('DailyChallengeService', () => {
  let repositoryMock: any;
  let service: DailyChallengeService;

  beforeEach(() => {
    repositoryMock = {
      findStudentProfileByUserId: vi.fn().mockResolvedValue({
        id: 'prof-1',
        userId: 'usr-sd-1',
        educationStage: 'SD'
      }),
      findChallengeByDateAndStage: vi.fn().mockResolvedValue(null),
      findPublishedQuestionsCountByStage: vi.fn().mockResolvedValue(15),
      createChallenge: vi.fn().mockImplementation((data) =>
        Promise.resolve({
          id: 'dc-uuid-1',
          ...data
        })
      ),
      getOrCreateStudentChallenge: vi.fn().mockResolvedValue({
        id: 'sdc-uuid-1',
        studentUserId: 'usr-sd-1',
        dailyChallengeId: 'dc-uuid-1',
        currentProgress: 0,
        status: 'IN_PROGRESS',
        completedAt: null,
        claimedAt: null
      }),
      updateStudentProgress: vi.fn().mockResolvedValue({}),
      claimChallengeRewardAtomic: vi.fn().mockImplementation((studentUserId, challengeId) => {
        return Promise.resolve({
          claimedAt: new Date('2026-08-27T13:30:00.000Z')
        });
      })
    };

    service = new DailyChallengeService(repositoryMock as any);
  });

  it('harus menggenerasi 1 tantangan harian baru jika belum ada untuk jenjang SD', async () => {
    const challenge = await service.getTodayChallenge('usr-sd-1');

    expect(repositoryMock.findPublishedQuestionsCountByStage).toHaveBeenCalledWith('SD');
    expect(repositoryMock.createChallenge).toHaveBeenCalledTimes(1);
    expect(challenge).toHaveProperty('id', 'dc-uuid-1');
    expect(challenge.educationStage).toBe('SD');
    expect(challenge.targetType).toBe('QUESTION_COUNT');
    expect(challenge.targetValue).toBe(10);
  });

  it('harus menggunakan template fallback jika tidak ada soal berstatus PUBLISHED', async () => {
    repositoryMock.findPublishedQuestionsCountByStage.mockResolvedValue(0);

    const challenge = await service.getTodayChallenge('usr-sd-1');

    expect(challenge.targetType).toBe('LESSON_COUNT');
    expect(challenge.targetValue).toBe(2);
  });

  it('harus menambah progres siswa saat butir soal dijawab benar', async () => {
    repositoryMock.findChallengeByDateAndStage.mockResolvedValue({
      id: 'dc-uuid-1',
      educationStage: 'SD',
      targetValue: 10,
      rewardXp: 50
    });

    await service.incrementProgress('usr-sd-1', 1);

    expect(repositoryMock.updateStudentProgress).toHaveBeenCalledWith('sdc-uuid-1', 1, 10);
  });

  it('harus berhasil mengklaim hadiah untuk tantangan yang berstatus COMPLETED', async () => {
    repositoryMock.findChallengeByDateAndStage.mockResolvedValue({
      id: 'dc-uuid-1',
      educationStage: 'SD',
      rewardXp: 50,
      rewardPowerupType: 'HINT_TOKEN',
      rewardPowerupQty: 1
    });

    const result = await service.claimReward('usr-sd-1', 'dc-uuid-1');

    expect(result.success).toBe(true);
    expect(result.status).toBe('CLAIMED');
    expect(result.xpAwarded).toBe(50);
    expect(result.powerupAwarded).toEqual({ type: 'HINT_TOKEN', quantity: 1 });
  });

  it('harus menolak klaim hadiah ganda dengan error REWARD_ALREADY_CLAIMED', async () => {
    repositoryMock.claimChallengeRewardAtomic.mockRejectedValue(
      new Error('REWARD_ALREADY_CLAIMED')
    );

    await expect(service.claimReward('usr-sd-1', 'dc-uuid-1')).rejects.toThrow(
      'Hadiah tantangan ini sudah pernah diklaim sebelumnya.'
    );
  });

  it('harus menolak klaim hadiah jika tantangan belum berstatus COMPLETED', async () => {
    repositoryMock.claimChallengeRewardAtomic.mockRejectedValue(
      new Error('CHALLENGE_NOT_COMPLETED')
    );

    await expect(service.claimReward('usr-sd-1', 'dc-uuid-1')).rejects.toThrow(
      'Target tantangan harian belum tercapai.'
    );
  });
});
