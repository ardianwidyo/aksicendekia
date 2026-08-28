import { GuestProgressState, GuestProfile, GuestSessionRecord } from '../gamification/guest-progress.schema';

export interface StorageEstimate {
  usage: number;
  quota: number;
  isTemporary: boolean;
}

export interface IProgressStorageRepository {
  /**
   * Mengambil state progres tamu saat ini.
   * Jika belum ada di storage, menginisialisasi state default baru.
   */
  getState(): Promise<GuestProgressState>;

  /**
   * Menyimpan snapshot state progres tamu ke storage lokal.
   */
  saveState(state: GuestProgressState): Promise<void>;

  /**
   * Memperbarui profil lokal (nama panggilan, jenjang, avatar).
   */
  updateProfile(profile: Partial<GuestProfile>): Promise<GuestProgressState>;

  /**
   * Mencatat penyelesaian sesi belajar lokal, memperbarui XP, streak, dan modul selesai.
   */
  recordCompletedSession(session: GuestSessionRecord): Promise<GuestProgressState>;

  /**
   * Menghapus seluruh data progres tamu dari storage lokal (Reset Data).
   */
  clearState(): Promise<void>;

  /**
   * Memeriksa estimasi penggunaan ruang penyimpanan (dalam bytes).
   */
  getStorageEstimate(): Promise<StorageEstimate>;
}
