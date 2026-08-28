import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageProgressAdapter } from '../localstorage-progress.adapter';

describe('LocalStorageProgressAdapter (Feature 009 - US2)', () => {
  let adapter: LocalStorageProgressAdapter;

  beforeEach(() => {
    let store: Record<string, string> = {};
    (global as any).window = {
      localStorage: {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
        key: (i: number) => Object.keys(store)[i] || null,
        length: Object.keys(store).length,
      },
    };
    adapter = new LocalStorageProgressAdapter();
  });

  it('harus mengembalikan default state saat belum ada data di storage', async () => {
    const state = await adapter.getState();
    expect(state).toBeDefined();
    expect(state.gamification.totalXp).toBe(0);
    expect(state.profile.displayName).toBe('Siswa Hebat');
  });

  it('harus menyimpan pembaruan profil ke storage lokal', async () => {
    await adapter.updateProfile({ displayName: 'Budi Pintar', avatarId: 'avatar_kancil' });
    const state = await adapter.getState();
    expect(state.profile.displayName).toBe('Budi Pintar');
    expect(state.profile.avatarId).toBe('avatar_kancil');
  });

  it('harus mencatat sesi selesai dan memperbarui XP, streak, dan lesson progress', async () => {
    const sessionRecord = {
      sessionId: 'sess_1',
      lessonId: 'lesson_math_1',
      educationStage: 'SD' as const,
      totalQuestions: 5,
      correctCount: 5,
      scorePercentage: 100,
      xpEarned: 70,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      timeSpentSeconds: 90,
      answers: [],
    };

    const updated = await adapter.recordCompletedSession(sessionRecord);
    expect(updated.gamification.totalXp).toBe(70);
    expect(updated.gamification.streak.currentStreak).toBe(1);
    expect(updated.curriculumProgress.completedLessonIds).toContain('lesson_math_1');
  });
});
