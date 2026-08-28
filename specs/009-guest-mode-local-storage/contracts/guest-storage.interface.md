# Interface Contract: Client Storage Repository

**Feature Branch**: `009-guest-mode-local-storage` | **Date**: 2026-08-28

---

## TypeScript Interface Definition (`IProgressStorageRepository`)

File: `apps/web/lib/storage/progress-storage.interface.ts`

```typescript
import { GuestProgressState, GuestProfile, GuestSessionRecord } from '../gamification/guest-progress.schema';

export interface IProgressStorageRepository {
  /**
   * Mengambil state progres tamu saat ini.
   * Jika belum ada di storage, menginisialisasi state default baru.
   */
  getState(): Promise<GuestProgressState>;

  /**
   * Menyimpan seluruh snapshot state progres tamu ke storage lokal.
   */
  saveState(state: GuestProgressState): Promise<void>;

  /**
   * Memperbarui profil lokal (nama panggilan, jenjang, avatar).
   */
  updateProfile(profile: Partial<GuestProfile>): Promise<GuestProgressState>;

  /**
   * Mencatat penyelesaian suatu sesi belajar lokal, memperbarui XP, streak, dan modul selesai.
   */
  recordCompletedSession(session: GuestSessionRecord): Promise<GuestProgressState>;

  /**
   * Menghapus seluruh data progres tamu dari storage lokal (Reset Data).
   */
  clearState(): Promise<void>;

  /**
   * Memeriksa estimasi penggunaan ruang penyimpanan (dalam bytes).
   */
  getStorageEstimate(): Promise<{ usage: number; quota: number; isTemporary: boolean }>;
}
```
