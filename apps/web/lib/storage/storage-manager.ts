import {
  GuestProgressState,
  GuestProfile,
  GuestSessionRecord,
} from '../gamification/guest-progress.schema';
import { IProgressStorageRepository, StorageEstimate } from './progress-storage.interface';
import { IndexedDBProgressAdapter } from './indexeddb-progress.adapter';
import { LocalStorageProgressAdapter } from './localstorage-progress.adapter';

export class StorageManager implements IProgressStorageRepository {
  private static instance: StorageManager | null = null;
  private adapter: IProgressStorageRepository;
  private isIncognito: boolean = false;

  private constructor() {
    // Check if IndexedDB is available and working
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.adapter = new IndexedDBProgressAdapter();
    } else {
      this.adapter = new LocalStorageProgressAdapter();
    }

    this.detectIncognito();
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  public static setCustomAdapter(adapter: IProgressStorageRepository) {
    const manager = StorageManager.getInstance();
    manager.adapter = adapter;
  }

  private async detectIncognito(): Promise<void> {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const { quota } = await navigator.storage.estimate();
        // Standard heuristic: Quota under 120MB in Chromium often indicates Incognito mode
        if (quota && quota < 120 * 1024 * 1024) {
          this.isIncognito = true;
        }
      } catch {
        this.isIncognito = false;
      }
    }
  }

  public isPrivateMode(): boolean {
    return this.isIncognito;
  }

  async getState(): Promise<GuestProgressState> {
    try {
      return await this.adapter.getState();
    } catch {
      // Fallback to localstorage adapter if indexeddb fails
      if (!(this.adapter instanceof LocalStorageProgressAdapter)) {
        this.adapter = new LocalStorageProgressAdapter();
        return await this.adapter.getState();
      }
      throw new Error('Gagal memuat state penyimpanan lokal');
    }
  }

  async saveState(state: GuestProgressState): Promise<void> {
    // Check storage estimate and prune if above 80%
    try {
      const estimate = await this.getStorageEstimate();
      if (estimate.quota > 0 && estimate.usage / estimate.quota > 0.8) {
        // Prune older detailed sessions beyond 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const prunedSessions = state.recentSessions.filter((s) => s.completedAt >= thirtyDaysAgo);
        state = {
          ...state,
          recentSessions: prunedSessions.slice(0, 10),
        };
      }
    } catch {
      // Ignore estimate check failures
    }

    try {
      await this.adapter.saveState(state);
    } catch {
      if (!(this.adapter instanceof LocalStorageProgressAdapter)) {
        this.adapter = new LocalStorageProgressAdapter();
        await this.adapter.saveState(state);
      }
    }
  }

  async updateProfile(profile: Partial<GuestProfile>): Promise<GuestProgressState> {
    return await this.adapter.updateProfile(profile);
  }

  async recordCompletedSession(session: GuestSessionRecord): Promise<GuestProgressState> {
    return await this.adapter.recordCompletedSession(session);
  }

  async clearState(): Promise<void> {
    await this.adapter.clearState();
  }

  async getStorageEstimate(): Promise<StorageEstimate> {
    const est = await this.adapter.getStorageEstimate();
    return {
      ...est,
      isTemporary: this.isIncognito,
    };
  }
}
