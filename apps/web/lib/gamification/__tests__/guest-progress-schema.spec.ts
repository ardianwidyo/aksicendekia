import { describe, it, expect } from 'vitest';
import { GuestProgressStateSchema } from '../guest-progress.schema';

describe('GuestProgressStateSchema (Feature 009 - US2)', () => {
  it('harus memvalidasi state default yang valid', () => {
    const defaultState = {
      guestId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: {
        displayName: 'Siswa Cendekia',
        educationStage: 'SD',
        gradeLevel: 2,
        avatarId: 'avatar_kancil',
      },
      gamification: {
        totalXp: 150,
        currentLevel: 2,
        streak: {
          currentStreak: 3,
          longestStreak: 5,
          lastActivityDate: '2026-08-28',
          activityHistory: ['2026-08-26', '2026-08-27', '2026-08-28'],
        },
        unlockedBadgeIds: ['badge_first_step'],
      },
      curriculumProgress: {
        completedLessonIds: ['lesson_1', 'lesson_2'],
        completedModuleIds: ['mod_1'],
        lessonScores: {
          lesson_1: {
            bestScore: 100,
            attempts: 1,
            lastCompletedAt: new Date().toISOString(),
            timeSpentSeconds: 120,
          },
        },
      },
      recentSessions: [],
      isMigrated: false,
      migratedToUserId: null,
    };

    const parsed = GuestProgressStateSchema.parse(defaultState);
    expect(parsed.guestId).toBe(defaultState.guestId);
    expect(parsed.gamification.totalXp).toBe(150);
    expect(parsed.profile.displayName).toBe('Siswa Cendekia');
  });

  it('harus menolak schemaVersion yang tidak sesuai', () => {
    const invalidState = {
      guestId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      schemaVersion: 2, // Only version 1 allowed
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(() => GuestProgressStateSchema.parse(invalidState)).toThrow();
  });
});
