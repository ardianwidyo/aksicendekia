import {
  GuestProgressState,
  GuestProgressStateSchema,
  GuestProfile,
  GuestSessionRecord,
} from '../gamification/guest-progress.schema';
import { IProgressStorageRepository, StorageEstimate } from './progress-storage.interface';

const DB_NAME = 'aksicendekia_guest_db';
const DB_VERSION = 1;
const STORE_NAME = 'guest_progress';
const STATE_KEY = 'current_state';

export class IndexedDBProgressAdapter implements IProgressStorageRepository {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB tidak didukung pada lingkungan ini'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

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
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STATE_KEY);

      req.onsuccess = () => {
        if (!req.result) {
          const defaultState = this.createDefaultState();
          this.saveState(defaultState).then(() => resolve(defaultState));
          return;
        }

        try {
          const parsed = GuestProgressStateSchema.parse(req.result);
          resolve(parsed);
        } catch {
          // If corrupted, fallback to default
          const defaultState = this.createDefaultState();
          this.saveState(defaultState).then(() => resolve(defaultState));
        }
      };

      req.onerror = () => reject(req.error);
    });
  }

  async saveState(state: GuestProgressState): Promise<void> {
    const db = await this.getDB();
    const validated = GuestProgressStateSchema.parse({
      ...state,
      updatedAt: new Date().toISOString(),
    });

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(validated, STATE_KEY);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
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

    // 1. Calculate XP & Level
    const newTotalXp = current.gamification.totalXp + session.xpEarned;
    const newLevel = Math.floor(newTotalXp / 100) + 1;

    // 2. Update Streak
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

    // 3. Update Curriculum Progress
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

    // 4. Update Recent Sessions (capped at 30)
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
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(STATE_KEY);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getStorageEstimate(): Promise<StorageEstimate> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      return {
        usage: est.usage || 0,
        quota: est.quota || 0,
        isTemporary: false,
      };
    }
    return {
      usage: 0,
      quota: 50 * 1024 * 1024,
      isTemporary: false,
    };
  }
}
