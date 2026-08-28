import { GuestSyncRepository } from "./guest-sync.repository.js";
import { GuestSyncRequest, GuestSyncResponse } from "./guest-sync.schema.js";
import { AppError } from "../../common/errors/app-error.js";

export class GuestSyncService {
  constructor(private repo: GuestSyncRepository) {}

  async syncProgress(userId: string, data: GuestSyncRequest): Promise<GuestSyncResponse> {
    if (!userId) {
      throw new AppError("User ID wajib disertakan untuk sinkronisasi", 400, "BAD_REQUEST");
    }

    // Sanity check limits
    const safeXp = Math.min(data.totalXp, 10000);
    const safeStreak = Math.min(data.streakCount, 365);

    const safeData: GuestSyncRequest = {
      ...data,
      totalXp: safeXp,
      streakCount: safeStreak,
    };

    const result = await this.repo.syncGuestProgress(userId, safeData);

    return {
      success: true,
      mergedXp: result.totalXp,
      newLevel: result.level,
      totalCompletedLessons: result.completedLessonsCount,
      syncedAt: new Date().toISOString(),
      message: "Progres belajar mode tamu berhasil disinkronkan ke akun!",
    };
  }
}
