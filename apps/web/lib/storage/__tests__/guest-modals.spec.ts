import { describe, it, expect } from 'vitest';
import { GuestProgressStateSchema } from '../../gamification/guest-progress.schema';

describe('Guest Modals & Contracts Validation (Feature 009 - US3/US4/US5)', () => {
  it('harus memvalidasi state schema saat payload profil diubah', () => {
    const initialState = {
      guestId: '11111111-2222-3333-4444-555555555555',
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: {
        displayName: 'Budi Belajar',
        educationStage: 'SD',
        gradeLevel: 2,
        avatarId: 'avatar_garuda',
      },
      gamification: {
        totalXp: 50,
        currentLevel: 1,
        streak: {
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: '2026-08-28',
          activityHistory: ['2026-08-28'],
        },
        unlockedBadgeIds: [],
      },
      curriculumProgress: {
        completedLessonIds: ['lesson_1'],
        completedModuleIds: [],
        lessonScores: {},
      },
      recentSessions: [],
      isMigrated: false,
      migratedToUserId: null,
    };

    const validated = GuestProgressStateSchema.parse(initialState);
    expect(validated.profile.displayName).toBe('Budi Belajar');
    expect(validated.profile.avatarId).toBe('avatar_garuda');
  });

  it('harus memvalidasi migrasi flag saat akun terhubung', () => {
    const migratedState = {
      guestId: '11111111-2222-3333-4444-555555555555',
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: {
        displayName: 'Siswa Hebat',
        educationStage: 'SD',
        gradeLevel: 1,
        avatarId: 'avatar_default_kancil',
      },
      gamification: {
        totalXp: 0,
        currentLevel: 1,
        streak: {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          activityHistory: [],
        },
        unlockedBadgeIds: [],
      },
      curriculumProgress: {
        completedLessonIds: [],
        completedModuleIds: [],
        lessonScores: {},
      },
      recentSessions: [],
      isMigrated: true,
      migratedToUserId: 'user_uuid_123',
    };

    const validated = GuestProgressStateSchema.parse(migratedState);
    expect(validated.isMigrated).toBe(true);
    expect(validated.migratedToUserId).toBe('user_uuid_123');
  });
});
