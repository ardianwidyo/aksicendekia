import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { createMockPrismaClient } from "../../../__tests__/mock-prisma.js";
import { ContentBlockRepository } from "../content-block.repository.js";
import { PublishService } from "../publish.service.js";
import { ConflictError, UnprocessableEntityError } from "../../../common/errors/app-error.js";

async function seedCompliantLesson(mockPrisma: any) {
  const achievement = await mockPrisma.curriculumAchievement.create({
    data: {
      educationStage: "SD",
      phase: "FASE_B",
      subjectCode: "MATH_SD",
      element: "Bilangan",
      achievementText: "Kutipan",
      sourceDocument: "Dok",
      sourceUrl: "https://kurikulum.kemdikbud.go.id/x",
      retrievedAt: new Date(),
    },
  });
  const unit = await mockPrisma.unit.create({ data: { subjectId: "s1", title: "Unit", orderIndex: 1 } });
  const lesson = await mockPrisma.lesson.create({
    data: {
      unitId: unit.id,
      title: "Pelajaran",
      summary: "Ringkasan",
      learningObjective: "Tujuan",
      educationStage: "SD",
      phase: "FASE_B",
      difficultyLevel: "BEGINNER",
      estimatedDurationMinutes: 10,
      orderIndex: 1,
      status: "DRAFT",
      curriculumAchievementId: achievement.id,
    },
  });
  await mockPrisma.lessonContentBlock.create({
    data: {
      lessonId: lesson.id,
      orderIndex: 0,
      blockType: "ILLUSTRATION",
      payload: {},
      altText: "Dua apel",
      status: "DRAFT",
    },
  });
  await mockPrisma.lessonContentBlock.create({
    data: {
      lessonId: lesson.id,
      orderIndex: 1,
      blockType: "INTERACTIVE_WIDGET",
      payload: { widgetType: "NUMBER_LINE_EXPLORER", params: { min: 0, max: 10, step: 1, initial: 0 } },
      status: "DRAFT",
    },
  });
  return lesson;
}

describe("PublishService (contract §7, §7a) — publish authority", () => {
  let mockPrisma: any;
  let repo: ContentBlockRepository;
  let service: PublishService;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    repo = new ContentBlockRepository(mockPrisma);
    service = new PublishService(repo);
  });

  it("moves a compliant DRAFT lesson to REVIEW via submit-review", async () => {
    const lesson = await seedCompliantLesson(mockPrisma);
    const result = await service.submitForReview(lesson.id);
    expect(result.status).toBe("REVIEW");
  });

  it("422s submit-review with structured violations when a gate fails", async () => {
    const lesson = await seedCompliantLesson(mockPrisma);
    await mockPrisma.lesson.update({ where: { id: lesson.id }, data: { curriculumAchievementId: null } });

    await expect(service.submitForReview(lesson.id)).rejects.toThrow(UnprocessableEntityError);
    try {
      await service.submitForReview(lesson.id);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityError);
      const violations = (error as UnprocessableEntityError).violations as any[];
      expect(violations.some((v) => v.rule === "C3")).toBe(true);
    }
  });

  it("publishes a REVIEW lesson", async () => {
    const lesson = await seedCompliantLesson(mockPrisma);
    await service.submitForReview(lesson.id);
    const result = await service.publish(lesson.id, "Diperiksa guru Matematika SD");
    expect(result.status).toBe("PUBLISHED");
  });

  it("409s publish when the lesson is not in REVIEW", async () => {
    const lesson = await seedCompliantLesson(mockPrisma);
    await expect(service.publish(lesson.id)).rejects.toThrow(ConflictError);
  });

  it("422s publish when the gates no longer pass at publish time", async () => {
    const lesson = await seedCompliantLesson(mockPrisma);
    await service.submitForReview(lesson.id);
    await mockPrisma.lesson.update({ where: { id: lesson.id }, data: { curriculumAchievementId: null } });

    await expect(service.publish(lesson.id)).rejects.toThrow(UnprocessableEntityError);
  });
});

describe("Static guard — nothing outside publish.service.ts writes status: PUBLISHED (FR-030a)", () => {
  // Scoped to the publishing subsystem (this module + seed scripts) rather than the
  // whole apps/api/src tree: unrelated modules legitimately *read* `status: "PUBLISHED"`
  // as a filter value (e.g. `findMany({ where: { status: "PUBLISHED" } })`), which this
  // regex-based check cannot distinguish from a write. The content-blocks module and the
  // seed pipeline are the only places FR-030a is actually at risk of being violated.
  const contentBlocksRoot = resolve(__dirname, "..");
  const prismaSeedRoot = resolve(__dirname, "../../../../..", "prisma");

  function collectFiles(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      if (entry === "__tests__" || entry === "node_modules") continue;
      const full = join(dir, entry);
      const stats = statSync(full);
      if (stats.isDirectory()) collectFiles(full, out);
      else if (/\.(ts|js)$/.test(entry)) out.push(full);
    }
    return out;
  }

  it("no seed/migration file, and no other module, contains a hardcoded PUBLISHED status write", () => {
    // A "hardcoded write" = a `status` field literally assigned the constant PUBLISHED,
    // e.g. `status: "PUBLISHED"` or `status: ContentStatus.PUBLISHED`. This catches a
    // stray seed/migration/service literally publishing content; it does not (and
    // structurally cannot) police a caller passing a dynamic value through the
    // pre-existing generic Feature-003 status endpoint — that is a separate, already
    // JWT+role-gated admin action, not a script writing PUBLISHED on its own.
    const hardcodedPublishedStatus = /status\s*:\s*(ContentStatus\.PUBLISHED|["']PUBLISHED["'])/;
    const candidateRoots = [contentBlocksRoot, prismaSeedRoot];
    const offenders: string[] = [];

    for (const root of candidateRoots) {
      let files: string[];
      try {
        files = collectFiles(root);
      } catch {
        continue;
      }
      for (const file of files) {
        if (file.endsWith(join("content-blocks", "publish.service.ts"))) continue;
        if (file.includes(join("content-blocks", "__tests__"))) continue;
        const content = readFileSync(file, "utf-8");
        if (hardcodedPublishedStatus.test(content)) offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });
});
