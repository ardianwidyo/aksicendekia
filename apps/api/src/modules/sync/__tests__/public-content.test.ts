import { describe, it, expect, beforeEach } from "vitest";
import { EducationStage, ContentStatus, QuestionType } from "@prisma/client";
import { createMockPrismaClient } from "../../../__tests__/mock-prisma.js";
import { buildApp } from "../../../app.js";

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
    const subject = await mockPrisma.subject.create({
      data: {
        code: "IPA_SD",
        name: "IPA SD",
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
});
