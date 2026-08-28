import { describe, it, expect, beforeEach, vi } from "vitest";
import { GuestSyncService } from "../guest-sync.service.js";
import { GuestSyncRepository } from "../guest-sync.repository.js";
import { createMockPrismaClient } from "../../../__tests__/mock-prisma.js";

describe("GuestSyncService (Feature 009 - US4)", () => {
  let mockPrisma: any;
  let repo: GuestSyncRepository;
  let service: GuestSyncService;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    repo = new GuestSyncRepository(mockPrisma);
    service = new GuestSyncService(repo);
  });

  it("harus menerapkan batas kewajaran XP (maksimal 10.000 XP) saat sinkronisasi", async () => {
    const syncSpy = vi.spyOn(repo, "syncGuestProgress").mockResolvedValue({
      totalXp: 10000,
      level: 101,
      completedLessonsCount: 3,
    });

    const payload = {
      guestId: "11111111-2222-3333-4444-555555555555",
      totalXp: 999999, // Unreasonable XP payload
      streakCount: 5,
      completedLessonIds: ["l1", "l2", "l3"],
      completedModuleIds: [],
      unlockedBadgeIds: [],
      sessionHistory: [],
    };

    const res = await service.syncProgress("user_1", payload);

    expect(syncSpy).toHaveBeenCalledWith(
      "user_1",
      expect.objectContaining({
        totalXp: 10000, // Capped to 10000
      })
    );
    expect(res.success).toBe(true);
    expect(res.mergedXp).toBe(10000);
  });

  it("harus menolak permintaan sinkronisasi tanpa userId", async () => {
    const payload = {
      guestId: "11111111-2222-3333-4444-555555555555",
      totalXp: 50,
      streakCount: 1,
      completedLessonIds: [],
      completedModuleIds: [],
      unlockedBadgeIds: [],
      sessionHistory: [],
    };

    await expect(service.syncProgress("", payload)).rejects.toThrow();
  });
});
