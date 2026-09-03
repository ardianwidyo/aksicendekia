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

describe('GuestProgressStateSchema — Feature 011 / T115 (60-lesson SD catalog)', () => {
  const base = {
    guestId: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    profile: { displayName: 'Siswa', educationStage: 'SD', gradeLevel: 4, avatarId: 'avatar_kancil' },
    gamification: {
      totalXp: 3000,
      currentLevel: 8,
      streak: { currentStreak: 10, longestStreak: 12, lastActivityDate: '2026-09-03', activityHistory: [] },
      unlockedBadgeIds: [],
    },
    recentSessions: [],
    isMigrated: false,
    migratedToUserId: null,
  };

  const sixtyIds = Array.from({ length: 60 }, (_, i) => {
    const grade = Math.floor(i / 10) + 1;
    const n = String((i % 10) + 1).padStart(2, '0');
    return `sd-mtk-k${grade}-${n}`;
  });

  it('persists all 60 SD lesson ids + per-lesson scores without a cap', () => {
    const state = {
      ...base,
      curriculumProgress: {
        completedLessonIds: sixtyIds,
        completedModuleIds: [],
        lessonScores: Object.fromEntries(
          sixtyIds.map((id) => [id, { bestScore: 90, attempts: 1, lastCompletedAt: new Date().toISOString(), timeSpentSeconds: 200 }]),
        ),
      },
    };
    const parsed = GuestProgressStateSchema.parse(state);
    expect(parsed.curriculumProgress.completedLessonIds).toHaveLength(60);
    expect(Object.keys(parsed.curriculumProgress.lessonScores)).toHaveLength(60);
  });

  it('carries the 60 ids through a registration migration (isMigrated + migratedToUserId)', () => {
    const migrated = {
      ...base,
      isMigrated: true,
      migratedToUserId: 'user-123',
      curriculumProgress: { completedLessonIds: sixtyIds, completedModuleIds: [], lessonScores: {} },
    };
    const parsed = GuestProgressStateSchema.parse(migrated);
    expect(parsed.isMigrated).toBe(true);
    expect(parsed.migratedToUserId).toBe('user-123');
    expect(parsed.curriculumProgress.completedLessonIds).toEqual(sixtyIds);
  });
});
