import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { EducationStage, ContentStatus, QuestionType } from "@prisma/client";
import { resetFocusConfigCache } from "@aksicendekia/content-kit";
import { createMockPrismaClient } from "../../../__tests__/mock-prisma.js";
import { buildApp } from "../../../app.js";

// Feature 011: focus-config caches its env-derived value at module scope
// (by design — it must stay a pure, uncached-per-call read for
// generateStaticParams). Reset it before every test in this file so no test
// leaks a `enabled:false` (or a stale `true`) into the next one.
beforeEach(() => resetFocusConfigCache());

describe("Public Content API (Feature 009 - US1)", () => {
  let mockPrisma: any;
  let app: any;

  beforeEach(async () => {
    mockPrisma = createMockPrismaClient();
    app = buildApp(mockPrisma);
  });

  it("GET /api/v1/public/subjects harus mengembalikan daftar mata pelajaran publik tanpa autentikasi JWT", async () => {
    // Seed a subject
    await mockPrisma.subject.create({
      data: {
        code: "MATH_SD",
        name: "Matematika SD",
        educationStage: EducationStage.SD,
        phase: "FASE_A",
        status: ContentStatus.PUBLISHED,
      },
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/v1/public/subjects?stage=SD",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.subjects).toBeDefined();
    expect(body.subjects.length).toBeGreaterThan(0);
    expect(body.subjects[0].code).toBe("MATH_SD");
  });

  it("GET /api/v1/public/lessons/:id harus mengembalikan detail pelajaran dengan butir soal dan kunci jawaban", async () => {
    // Feature 011: subjectCode must be MATH_SD, not an arbitrary non-Math
    // subject — with focus mode on by default, anything else is correctly
    // hidden (FR-002), and this test is about the response shape, not focus.
    const subject = await mockPrisma.subject.create({
      data: {
        code: "MATH_SD",
        name: "Matematika SD",
        educationStage: EducationStage.SD,
        phase: "FASE_A",
        status: ContentStatus.PUBLISHED,
      },
    });

    const unit = await mockPrisma.unit.create({
      data: {
        subjectId: subject.id,
        title: "Makhluk Hidup",
        orderIndex: 1,
        status: ContentStatus.PUBLISHED,
      },
    });

    const lesson = await mockPrisma.lesson.create({
      data: {
        unitId: unit.id,
        title: "Tumbuhan dan Hewan",
        summary: "Mengenal tumbuhan dan hewan di sekitar kita",
        learningObjective: "Siswa mampu mengidentifikasi makhluk hidup",
        educationStage: EducationStage.SD,
        phase: "FASE_A",
        difficultyLevel: "BEGINNER",
        estimatedDurationMinutes: 15,
        orderIndex: 1,
        status: ContentStatus.PUBLISHED,
      },
    });

    await mockPrisma.questionItem.create({
      data: {
        lessonId: lesson.id,
        questionType: QuestionType.MULTIPLE_CHOICE,
        promptText: "Manakah yang termasuk tumbuhan?",
        contentPayload: {
          options: [
            { id: "opt_1", text: "Mawar" },
            { id: "opt_2", text: "Kucing" },
          ],
          correct_option_id: "opt_1",
        },
        explanation: "Mawar adalah tumbuhan berbunga.",
        orderIndex: 1,
        status: ContentStatus.PUBLISHED,
      },
    });

    const res = await app.inject({
      method: "GET",
      url: `/api/v1/public/lessons/${lesson.id}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.id).toBe(lesson.id);
    expect(body.title).toBe("Tumbuhan dan Hewan");
    expect(body.questionItems).toBeDefined();
    expect(body.questionItems.length).toBe(1);
    expect(body.questionItems[0].contentPayload.correct_option_id).toBe("opt_1");
  });

  it("GET /api/v1/public/lessons/:id mengembalikan 404 jika pelajaran belum berstatus PUBLISHED", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/public/lessons/non-existent-lesson-id",
    });

    expect(res.statusCode).toBe(404);
  });

  // Feature 010
  it("GET /api/v1/public/lessons/:id menyertakan contentBlocks, curriculumReference, dan listing", async () => {
    await mockPrisma.curriculumAchievement.upsert({
      where: { id: "cp-x" },
      create: {
        educationStage: EducationStage.SD,
        phase: "FASE_B",
        subjectCode: "MATH_SD",
        element: "Bilangan",
        achievementText: "Peserta didik menunjukkan pemahaman bilangan cacah sampai 10.000.",
        sourceDocument: "Keputusan Kepala BSKAP No. 032/H/KR/2024",
        sourceUrl: "https://kurikulummerdeka.com/x",
        retrievedAt: new Date("2026-09-01"),
      },
      update: {},
    });

    const lesson = await mockPrisma.lesson.create({
      data: {
        unitId: "unit-x",
        title: "Nilai Tempat",
        summary: "Uraikan nilai tempat.",
        learningObjective: "Menentukan nilai tempat sampai ribuan.",
        educationStage: EducationStage.SD,
        phase: "FASE_B",
        difficultyLevel: "BEGINNER",
        estimatedDurationMinutes: 12,
        orderIndex: 0,
        status: ContentStatus.PUBLISHED,
      },
    });
    lesson.curriculumAchievementId = "cp-x";
    lesson.listing = "LISTED";

    await mockPrisma.lessonContentBlock.create({
      data: {
        id: `${lesson.id}-b0`,
        lessonId: lesson.id,
        orderIndex: 0,
        blockType: "ANIMATION",
        payload: { animationId: "place-value-split", steps: [] },
        transcriptText: "Uraikan 3.482.",
        status: ContentStatus.PUBLISHED,
      },
    });

    const res = await app.inject({ method: "GET", url: `/api/v1/public/lessons/${lesson.id}` });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.contentBlocks).toHaveLength(1);
    expect(body.contentBlocks[0].blockType).toBe("ANIMATION");
    expect(body.listing).toBe("LISTED");
    expect(body.curriculumReference.sourceUrl).toMatch(/^https:\/\//);
    expect(body.curriculumReference.achievementText.length).toBeGreaterThan(20);
  });

  it("GET /api/v1/public/lessons/:id — pelajaran REVIEW tersembunyi kecuali saklar pratinjau menyala", async () => {
    const lesson = await mockPrisma.lesson.create({
      data: {
        unitId: "unit-y",
        title: "Draf",
        summary: "s",
        learningObjective: "lo",
        educationStage: EducationStage.SD,
        phase: "FASE_B",
        difficultyLevel: "BEGINNER",
        estimatedDurationMinutes: 10,
        orderIndex: 0,
        status: ContentStatus.REVIEW,
      },
    });

    const off = await app.inject({ method: "GET", url: `/api/v1/public/lessons/${lesson.id}` });
    expect(off.statusCode).toBe(404);

    process.env.CONTENT_PREVIEW_INCLUDE_REVIEW = "true";
    try {
      const on = await app.inject({ method: "GET", url: `/api/v1/public/lessons/${lesson.id}` });
      expect(on.statusCode).toBe(200);
    } finally {
      delete process.env.CONTENT_PREVIEW_INCLUDE_REVIEW;
    }
  });
});

describe("Public Content API — focus mode filtering (Feature 011 / FR-002)", () => {
  let mockPrisma: any;
  let app: any;

  beforeEach(async () => {
    mockPrisma = createMockPrismaClient();
    app = buildApp(mockPrisma);
    resetFocusConfigCache();
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_FOCUS_ENABLED;
    delete process.env.FOCUS_ENABLED;
    resetFocusConfigCache();
  });

  it("GET /api/v1/public/subjects hides an out-of-focus stage/subject even when explicitly requested", async () => {
    await mockPrisma.subject.create({
      data: {
        code: "NUMERASI_TK",
        name: "Numerasi TK",
        educationStage: EducationStage.TK,
        phase: "FOUNDATION",
        status: ContentStatus.PUBLISHED,
      },
    });

    const res = await app.inject({ method: "GET", url: "/api/v1/public/subjects?stage=TK" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.subjects).toEqual([]);
  });

  it("GET /api/v1/public/subjects still returns SD Matematika when focus is on (default)", async () => {
    await mockPrisma.subject.create({
      data: {
        code: "MATH_SD",
        name: "Matematika SD",
        educationStage: EducationStage.SD,
        phase: "FASE_A",
        status: ContentStatus.PUBLISHED,
      },
    });

    const res = await app.inject({ method: "GET", url: "/api/v1/public/subjects?stage=SD" });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.subjects.length).toBeGreaterThan(0);
  });

  it("GET /api/v1/public/units/:unitId/lessons hides lessons under an out-of-focus subject", async () => {
    const subject = await mockPrisma.subject.create({
      data: {
        code: "MATH_SMP",
        name: "Matematika SMP",
        educationStage: EducationStage.SMP,
        phase: "FASE_D",
        status: ContentStatus.PUBLISHED,
      },
    });
    const unit = await mockPrisma.unit.create({
      data: { subjectId: subject.id, title: "Aljabar", orderIndex: 1, status: ContentStatus.PUBLISHED },
    });
    await mockPrisma.lesson.create({
      data: {
        unitId: unit.id,
        title: "Persamaan Linear",
        summary: "s",
        learningObjective: "lo",
        educationStage: EducationStage.SMP,
        phase: "FASE_D",
        difficultyLevel: "BEGINNER",
        estimatedDurationMinutes: 10,
        orderIndex: 0,
        status: ContentStatus.PUBLISHED,
      },
    });

    const res = await app.inject({ method: "GET", url: `/api/v1/public/units/${unit.id}/lessons` });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).lessons).toEqual([]);
  });

  it("mematikan mode fokus (NEXT_PUBLIC_FOCUS_ENABLED=false) mengembalikan seluruh jenjang", async () => {
    process.env.NEXT_PUBLIC_FOCUS_ENABLED = "false";
    await mockPrisma.subject.create({
      data: {
        code: "NUMERASI_TK",
        name: "Numerasi TK",
        educationStage: EducationStage.TK,
        phase: "FOUNDATION",
        status: ContentStatus.PUBLISHED,
      },
    });

    const res = await app.inject({ method: "GET", url: "/api/v1/public/subjects?stage=TK" });
    const body = JSON.parse(res.body);
    expect(body.subjects.length).toBeGreaterThan(0);
  });

  it("GET /api/v1/public/lessons/:id hides a lesson whose own educationStage is out of focus", async () => {
    const lesson = await mockPrisma.lesson.create({
      data: {
        unitId: "unit-tk",
        title: "Mengenal Angka",
        summary: "s",
        learningObjective: "lo",
        educationStage: EducationStage.TK,
        phase: "FOUNDATION",
        difficultyLevel: "BEGINNER",
        estimatedDurationMinutes: 10,
        orderIndex: 0,
        status: ContentStatus.PUBLISHED,
      },
    });

    const res = await app.inject({ method: "GET", url: `/api/v1/public/lessons/${lesson.id}` });
    expect(res.statusCode).toBe(404);
  });

  it("GET /api/v1/public/lessons/:id hydrates payload.videoEmbed for a VIDEO block with videoEmbedId", async () => {
    await mockPrisma.videoEmbed.create({
      data: {
        id: "yt-x",
        provider: "YOUTUBE",
        externalId: "dQw4w9WgXcQ",
        title: "Video Contoh",
        publisherName: "Contoh Edukasi",
        posterStorageKey: "assets/lessons/sd/kelas-4/x-poster.svg",
        transcriptText: "Transkrip.",
        verifiedAt: new Date("2026-09-02"),
        reviewedBy: "guru@aksicendekia.id",
      },
    });

    const lesson = await mockPrisma.lesson.create({
      data: {
        unitId: "unit-video",
        title: "Pecahan",
        summary: "s",
        learningObjective: "lo",
        educationStage: EducationStage.SD,
        phase: "FASE_B",
        difficultyLevel: "BEGINNER",
        estimatedDurationMinutes: 10,
        orderIndex: 0,
        status: ContentStatus.PUBLISHED,
      },
    });

    await mockPrisma.lessonContentBlock.create({
      data: {
        id: `${lesson.id}-video`,
        lessonId: lesson.id,
        orderIndex: 0,
        blockType: "VIDEO",
        payload: {},
        videoEmbedId: "yt-x",
        status: ContentStatus.PUBLISHED,
      },
    });

    const res = await app.inject({ method: "GET", url: `/api/v1/public/lessons/${lesson.id}` });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    const videoBlock = body.contentBlocks.find((b: { blockType: string }) => b.blockType === "VIDEO");
    expect(videoBlock.payload.videoEmbed).toMatchObject({
      externalId: "dQw4w9WgXcQ",
      title: "Video Contoh",
      posterUrl: "/assets/lessons/sd/kelas-4/x-poster.svg",
    });
    expect(videoBlock.payload.videoEmbed.reviewedBy).toBeUndefined();
  });
});
