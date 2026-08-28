import { describe, it, expect, beforeEach } from 'vitest';
import { StorageManager } from '../storage-manager';
import { LocalStorageProgressAdapter } from '../localstorage-progress.adapter';

describe('StorageManager (Feature 009 - US2/US3/US5)', () => {
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
    StorageManager.setCustomAdapter(new LocalStorageProgressAdapter());
  });

  it('harus memuat state dari adapter yang aktif', async () => {
    const manager = StorageManager.getInstance();
    const state = await manager.getState();
    expect(state).toBeDefined();
    expect(state.profile.displayName).toBe('Siswa Hebat');
  });

  it('harus memperbarui profil dan menyimpan snapshot baru', async () => {
    const manager = StorageManager.getInstance();
    await manager.updateProfile({ displayName: 'Kancil Cerdik' });
    const state = await manager.getState();
    expect(state.profile.displayName).toBe('Kancil Cerdik');
  });

  it('harus membersihkan seluruh state pada operasi clearState()', async () => {
    const manager = StorageManager.getInstance();
    await manager.updateProfile({ displayName: 'User Sebelum Reset' });
    await manager.clearState();
    const stateAfter = await manager.getState();
    expect(stateAfter.profile.displayName).toBe('Siswa Hebat');
    expect(stateAfter.gamification.totalXp).toBe(0);
  });
});
