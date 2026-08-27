import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LeaderboardService } from '../leaderboard.service';

describe('LeaderboardService - Privacy Settings & Parental Lock', () => {
  let repositoryMock: any;
  let service: LeaderboardService;

  beforeEach(() => {
    repositoryMock = {
      getStudentPrivacySetting: vi.fn().mockResolvedValue({
        studentUserId: 'usr-student-1',
        isHiddenFromLeaderboard: false,
        isPrivacyLocked: false,
        updatedAt: new Date('2026-08-27T10:00:00.000Z')
      }),
      updateStudentPrivacySetting: vi.fn().mockImplementation((userId, data) =>
        Promise.resolve({
          studentUserId: userId,
          isHiddenFromLeaderboard: data.isHiddenFromLeaderboard ?? false,
          isPrivacyLocked: data.isPrivacyLocked ?? false,
          updatedAt: new Date('2026-08-27T13:40:00.000Z')
        })
      ),
      isParentOfStudent: vi.fn().mockResolvedValue(true)
    };

    service = new LeaderboardService(repositoryMock as any);
  });

  it('harus mengizinkan siswa mengubah status tersembunyi jika privasi tidak dikunci', async () => {
    const result = await service.updateStudentPrivacy('usr-student-1', true);

    expect(result.isHiddenFromLeaderboard).toBe(true);
    expect(repositoryMock.updateStudentPrivacySetting).toHaveBeenCalledWith(
      'usr-student-1',
      { isHiddenFromLeaderboard: true }
    );
  });

  it('harus menolak perubahan visibilitas dari siswa jika Parental Lock aktif dengan error 403', async () => {
    repositoryMock.getStudentPrivacySetting.mockResolvedValue({
      studentUserId: 'usr-student-1',
      isHiddenFromLeaderboard: false,
      isPrivacyLocked: true
    });

    await expect(
      service.updateStudentPrivacy('usr-student-1', true)
    ).rejects.toThrow('Pengaturan privasi telah dikunci oleh orang tua');
  });

  it('harus mengizinkan orang tua terverifikasi untuk mengunci pengaturan privasi siswa', async () => {
    const result = await service.setParentPrivacyLock(
      'usr-parent-1',
      'usr-student-1',
      true,
      true
    );

    expect(result.isPrivacyLocked).toBe(true);
    expect(result.isHiddenFromLeaderboard).toBe(true);
    expect(repositoryMock.updateStudentPrivacySetting).toHaveBeenCalledWith(
      'usr-student-1',
      { isPrivacyLocked: true, isHiddenFromLeaderboard: true }
    );
  });

  it('harus menolak jika user yang mengunci bukan orang tua terverifikasi siswa', async () => {
    repositoryMock.isParentOfStudent.mockResolvedValue(false);

    await expect(
      service.setParentPrivacyLock('usr-stranger', 'usr-student-1', true)
    ).rejects.toThrow('FORBIDDEN_PARENT_ACCESS');
  });
});
