import { describe, it, expect, beforeEach } from "vitest";
import { EducationStage, CurriculumPhase, ContentStatus, DifficultyLevel } from "@prisma/client";
import { createMockPrismaClient } from "../../../__tests__/mock-prisma.js";
import { CurriculumRepository } from "../curriculum.repository.js";
import { CurriculumService } from "../curriculum.service.js";
import { CsvImportService } from "../csv-import.service.js";
import { UnprocessableEntityError } from "../../../common/errors/app-error.js";

/**
 * Feature 011 / T122+T124 (US6). The Embedded Media Gate — Konstitusi VI v1.2.0,
 * 6 kondisi pemblokir (contracts/video-embed.md) — plus the FR-032 CP
 * primary-verification check, enforced on every REVIEW -> PUBLISHED transition.
 */
describe("Embedded Media Gate (Feature 011 / T122)", () => {
  let mockPrisma: any;
  let service: CurriculumService;

  const FRESH = new Date().toISOString();
  const STALE = new Date(Date.now() - 400 * 86_400_000).toISOString();

  async function seedCp(needsPrimaryVerification: boolean, id = "cp-gate") {
    await mockPrisma.curriculumAchievement.upsert({
      where: { id },
      create: {
        id,
        educationStage: EducationStage.SD,
        phase: CurriculumPhase.FASE_B,
        subjectCode: "MATH_SD",
        element: "Bilangan",
        achievementText: "x".repeat(40),
        sourceDocument: "SK BSKAP 032/2024",
        sourceUrl: "https://kurikulummerdeka.com/x",
        retrievedAt: new Date(),
        needsPrimaryVerification,
      },
      update: { needsPrimaryVerification },
    });
    return id;
  }

  async function seedEmbed(over: Record<string, unknown> = {}, id = "yt-gate") {
    await mockPrisma.videoEmbed.create({
      data: {
        id,
        provider: "YOUTUBE",
        externalId: "dQw4w9WgXcQ",
        title: "Video",
        publisherName: "Contoh",
        posterStorageKey: "assets/lessons/sd/kelas-4/x-poster.svg",
        transcriptText: "Transkrip.",
        verifiedAt: new Date(FRESH),
        reviewedBy: "guru@aksicendekia.id",
        ...over,
      },
    });
    return id;
  }

  interface LessonOpts {
    withAnimation?: boolean;
    embedId?: string | null;
    selfHostedOnVideo?: boolean;
    curriculumAchievementId?: string;
  }

  async function seedLesson(opts: LessonOpts = {}) {
    const lesson = await mockPrisma.lesson.create({
      data: {
        unitId: "unit-gate",
        title: "Nilai Tempat",
        summary: "s",
        learningObjective: "lo",
        educationStage: EducationStage.SD,
        phase: CurriculumPhase.FASE_B,
        gradeLevel: 4,
        difficultyLevel: DifficultyLevel.BEGINNER,
        estimatedDurationMinutes: 12,
        orderIndex: 0,
        status: ContentStatus.REVIEW,
        listing: "LISTED",
      },
    });
    if (opts.curriculumAchievementId) lesson.curriculumAchievementId = opts.curriculumAchievementId;

    if (opts.withAnimation ?? true) {
      await mockPrisma.lessonContentBlock.create({
        data: {
          id: `${lesson.id}-anim`,
          lessonId: lesson.id,
          orderIndex: 0,
          blockType: "ANIMATION",
          payload: { animationId: "place-value-split", steps: [] },
          status: ContentStatus.REVIEW,
        },
      });
    }
    if (opts.embedId !== null) {
      await mockPrisma.lessonContentBlock.create({
        data: {
          id: `${lesson.id}-video`,
          lessonId: lesson.id,
          orderIndex: 1,
          blockType: "VIDEO",
          payload: { title: "Video" },
          videoEmbedId: opts.embedId ?? "yt-gate",
          mediaAssetId: opts.selfHostedOnVideo ? "assets/lessons/sd/kelas-4/x.mp4" : null,
          status: ContentStatus.REVIEW,
        },
      });
    }
    return lesson;
  }

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    service = new CurriculumService(new CurriculumRepository(mockPrisma), new CsvImportService());
  });

  it("happy path — publishes when animation present, embed reviewed + fresh, CP verified", async () => {
    const cp = await seedCp(false);
    await seedEmbed();
    const lesson = await seedLesson({ curriculumAchievementId: cp });
    const published = await service.updateLessonStatus(lesson.id, ContentStatus.PUBLISHED);
    expect(published.status).toBe(ContentStatus.PUBLISHED);
  });

  it("Kondisi 1 — embed present but no self-hosted ANIMATION block → 422", async () => {
    await seedEmbed();
    const lesson = await seedLesson({ withAnimation: false });
    await expect(service.updateLessonStatus(lesson.id, ContentStatus.PUBLISHED)).rejects.toThrow(
      /Kondisi 1/,
    );
  });

  it("Kondisi 3 — non-YOUTUBE / malformed externalId → 422", async () => {
    await seedEmbed({ provider: "YOUTUBE", externalId: "not-an-id" });
    const lesson = await seedLesson();
    await expect(service.updateLessonStatus(lesson.id, ContentStatus.PUBLISHED)).rejects.toThrow(
      /Kondisi 3/,
    );
  });

  it("Kondisi 5 — reviewedBy is null → 422 naming butir 5", async () => {
    await seedEmbed({ reviewedBy: null });
    const lesson = await seedLesson();
    await expect(service.updateLessonStatus(lesson.id, ContentStatus.PUBLISHED)).rejects.toThrow(
      /Kondisi 5.*reviewedBy/,
    );
  });

  it("Kondisi 5 — verifiedAt older than the freshness threshold → 422", async () => {
    await seedEmbed({ verifiedAt: new Date(STALE) });
    const lesson = await seedLesson();
    await expect(service.updateLessonStatus(lesson.id, ContentStatus.PUBLISHED)).rejects.toThrow(
      /Kondisi 5.*lebih lama/,
    );
  });

  it("Kondisi 5 — embed id not in the registry → 422", async () => {
    const lesson = await seedLesson({ embedId: "yt-missing" });
    await expect(service.updateLessonStatus(lesson.id, ContentStatus.PUBLISHED)).rejects.toThrow(
      /tidak ada di registri/,
    );
  });

  it("Kondisi 6 — VIDEO block carries both videoEmbedId and a self-hosted file → 422", async () => {
    await seedEmbed();
    const lesson = await seedLesson({ selfHostedOnVideo: true });
    await expect(service.updateLessonStatus(lesson.id, ContentStatus.PUBLISHED)).rejects.toThrow(
      /Kondisi 6/,
    );
  });

  it("T124 — publish rejected while the referenced CP row has needsPrimaryVerification: true", async () => {
    await seedEmbed();
    // reference a real content-kit CP id that ships with needsPrimaryVerification: true
    const lesson = await seedLesson({ curriculumAchievementId: "cp-fase-b-matematika-bilangan" });
    await expect(service.updateLessonStatus(lesson.id, ContentStatus.PUBLISHED)).rejects.toThrow(
      /needsPrimaryVerification/,
    );
  });

  it("throws an UnprocessableEntityError (HTTP 422)", async () => {
    await seedEmbed({ reviewedBy: null });
    const lesson = await seedLesson();
    await expect(
      service.updateLessonStatus(lesson.id, ContentStatus.PUBLISHED),
    ).rejects.toBeInstanceOf(UnprocessableEntityError);
  });

  it("a lesson with NO embedded video is unaffected by the gate", async () => {
    const cp = await seedCp(false);
    const lesson = await seedLesson({ embedId: null, curriculumAchievementId: cp });
    const published = await service.updateLessonStatus(lesson.id, ContentStatus.PUBLISHED);
    expect(published.status).toBe(ContentStatus.PUBLISHED);
  });
});
