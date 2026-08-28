import {
  GuestProgressState,
  GuestProgressStateSchema,
  GuestProfile,
  GuestSessionRecord,
} from '../gamification/guest-progress.schema';
import { IProgressStorageRepository, StorageEstimate } from './progress-storage.interface';

const LOCALSTORAGE_KEY = 'aksicendekia_guest_progress_v1';

export class LocalStorageProgressAdapter implements IProgressStorageRepository {
  private createDefaultState(): GuestProgressState {
    const now = new Date().toISOString();
    return {
      guestId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'guest_' + Date.now(),
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
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
      isMigrated: false,
      migratedToUserId: null,
    };
  }

  async getState(): Promise<GuestProgressState> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return this.createDefaultState();
    }

    const raw = window.localStorage.getItem(LOCALSTORAGE_KEY);
    if (!raw) {
      const defaultState = this.createDefaultState();
      await this.saveState(defaultState);
      return defaultState;
    }

    try {
      const parsed = JSON.parse(raw);
      return GuestProgressStateSchema.parse(parsed);
    } catch {
      const defaultState = this.createDefaultState();
      await this.saveState(defaultState);
      return defaultState;
    }
  }

  async saveState(state: GuestProgressState): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) return;

    const validated = GuestProgressStateSchema.parse({
      ...state,
      updatedAt: new Date().toISOString(),
    });

    try {
      window.localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(validated));
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError' || err?.code === 22) {
        // Apply LRU pruning on sessions if quota exceeded
        const prunedState: GuestProgressState = {
          ...validated,
          recentSessions: validated.recentSessions.slice(0, 5),
        };
        window.localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(prunedState));
      }
    }
  }

  async updateProfile(profile: Partial<GuestProfile>): Promise<GuestProgressState> {
    const current = await this.getState();
    const updated: GuestProgressState = {
      ...current,
      profile: {
        ...current.profile,
        ...profile,
      },
    };
    await this.saveState(updated);
    return updated;
  }

  async recordCompletedSession(session: GuestSessionRecord): Promise<GuestProgressState> {
    const current = await this.getState();

    const newTotalXp = current.gamification.totalXp + session.xpEarned;
    const newLevel = Math.floor(newTotalXp / 100) + 1;

    const today = new Date().toISOString().split('T')[0];
    let newCurrentStreak = current.gamification.streak.currentStreak;
    let newLongestStreak = current.gamification.streak.longestStreak;
    const activityHistory = [...current.gamification.streak.activityHistory];

    if (!activityHistory.includes(today)) {
      activityHistory.push(today);
    }

    const lastDate = current.gamification.streak.lastActivityDate;
    if (!lastDate) {
      newCurrentStreak = 1;
    } else {
      const last = new Date(lastDate);
      const now = new Date(today);
      const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newCurrentStreak += 1;
      } else if (diffDays > 1) {
        newCurrentStreak = 1;
      }
    }

    if (newCurrentStreak > newLongestStreak) {
      newLongestStreak = newCurrentStreak;
    }

    const completedLessonIds = [...current.curriculumProgress.completedLessonIds];
    if (!completedLessonIds.includes(session.lessonId)) {
      completedLessonIds.push(session.lessonId);
    }

    const lessonScores = { ...current.curriculumProgress.lessonScores };
    const prevScore = lessonScores[session.lessonId];
    lessonScores[session.lessonId] = {
      bestScore: Math.max(prevScore?.bestScore ?? 0, session.scorePercentage),
      attempts: (prevScore?.attempts ?? 0) + 1,
      lastCompletedAt: session.completedAt,
      timeSpentSeconds: (prevScore?.timeSpentSeconds ?? 0) + session.timeSpentSeconds,
    };

    const recentSessions = [session, ...current.recentSessions].slice(0, 30);

    const updatedState: GuestProgressState = {
      ...current,
      gamification: {
        ...current.gamification,
        totalXp: newTotalXp,
        currentLevel: newLevel,
        streak: {
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastActivityDate: today,
          activityHistory,
        },
      },
      curriculumProgress: {
        ...current.curriculumProgress,
        completedLessonIds,
        lessonScores,
      },
      recentSessions,
    };

    await this.saveState(updatedState);
    return updatedState;
  }

  async clearState(): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(LOCALSTORAGE_KEY);
    }
  }

  async getStorageEstimate(): Promise<StorageEstimate> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { usage: 0, quota: 5 * 1024 * 1024, isTemporary: false };
    }

    let totalLength = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        totalLength += (window.localStorage.getItem(key) || '').length * 2;
      }
    }

    return {
      usage: totalLength,
      quota: 5 * 1024 * 1024, // 5MB standard LocalStorage quota
      isTemporary: false,
    };
  }
}
