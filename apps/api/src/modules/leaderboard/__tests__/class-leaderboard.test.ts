import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LeaderboardService } from '../leaderboard.service';

describe('LeaderboardService - Class Leaderboard', () => {
  let repositoryMock: any;
  let service: LeaderboardService;

  beforeEach(() => {
    repositoryMock = {
      findClassById: vi.fn().mockResolvedValue({
        id: 'cls-111',
        name: 'Kelas 4A SD Cendekia'
      }),
      isStudentInClass: vi.fn().mockResolvedValue(true),
      isTeacherOfClass: vi.fn().mockResolvedValue(false),
      getClassStudentsWeeklyXp: vi.fn().mockResolvedValue([
        {
          userId: 'usr-1',
          displayName: 'Bintang Cerdas',
          avatarToken: 'avatar_fox',
          weeklyXp: 450,
          firstXpTimestamp: 1000,
          isHiddenFromLeaderboard: false
        },
        {
          userId: 'usr-2',
          displayName: 'Kancil Pintar',
          avatarToken: 'avatar_bear',
          weeklyXp: 380,
          firstXpTimestamp: 2000,
          isHiddenFromLeaderboard: false
        },
        {
          userId: 'usr-3',
          displayName: 'Garuda Pemalu',
          avatarToken: 'avatar_eagle',
          weeklyXp: 500,
          firstXpTimestamp: 500,
          isHiddenFromLeaderboard: true // Siswa Tersembunyi
        }
      ])
    };

    service = new LeaderboardService(repositoryMock as any);
  });

  it('harus mengembalikan Top 10 dan menyaring siswa tersembunyi dari respons siswa lain', async () => {
    // Siswa usr-1 membuka papan peringkat
    const result = await service.getClassLeaderboard('cls-111', 'usr-1', 'SISWA');

    expect(result.classId).toBe('cls-111');
    expect(result.className).toBe('Kelas 4A SD Cendekia');

    // Siswa usr-3 tersembunyi -> tidak boleh muncul di topStudents milik usr-1
    const topDisplayNames = result.topStudents.map((s) => s.displayName);
    expect(topDisplayNames).toContain('Bintang Cerdas');
    expect(topDisplayNames).toContain('Kancil Pintar');
    expect(topDisplayNames).not.toContain('Garuda Pemalu');
  });

  it('harus tidak pernah mengembalikan data pribadi sensitif (full_name, email, school_name, foto asli)', async () => {
    const result = await service.getClassLeaderboard('cls-111', 'usr-1', 'SISWA');

    result.topStudents.forEach((student) => {
      expect(student).toHaveProperty('displayName');
      expect(student).toHaveProperty('avatarToken');
      expect(student).toHaveProperty('weeklyXp');
      expect(student).toHaveProperty('rank');

      // Memastikan atribut sensitif DILARANG KERAS muncul
      expect(student).not.toHaveProperty('fullName');
      expect(student).not.toHaveProperty('email');
      expect(student).not.toHaveProperty('schoolName');
      expect(student).not.toHaveProperty('avatarUrl');
      expect(student).not.toHaveProperty('birthDate');
    });
  });

  it('harus menyertakan objek myRank dengan peringkat presisi siswa yang meminta', async () => {
    const result = await service.getClassLeaderboard('cls-111', 'usr-2', 'SISWA');

    expect(result.myRank).toBeDefined();
    expect(result.myRank?.displayName).toBe('Kancil Pintar');
    expect(result.myRank?.weeklyXp).toBe(380);
    expect(result.myRank?.rank).toBe(3);
  });

  it('harus menolak akses jika siswa bukan anggota kelas bersangkutan dengan error 403', async () => {
    repositoryMock.isStudentInClass.mockResolvedValue(false);

    await expect(
      service.getClassLeaderboard('cls-111', 'usr-outsider', 'SISWA')
    ).rejects.toThrow('FORBIDDEN_CLASS_ACCESS: Anda bukan anggota kelas ini');
  });
});
