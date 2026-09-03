import { describe, it, expect, beforeEach } from "vitest";
import { createMockPrismaClient } from "../../../__tests__/mock-prisma.js";
import { ContentBlockRepository } from "../content-block.repository.js";
import { CurriculumAchievementService } from "../curriculum-achievement.service.js";
import { createCurriculumAchievementSchema } from "../content-block.schema.js";
import { ConflictError } from "../../../common/errors/app-error.js";

const VALID_INPUT = {
  educationStage: "SD" as const,
  phase: "FASE_B" as const,
  subjectCode: "MATH_SD",
  element: "Bilangan",
  achievementText: "Kutipan verbatim dari dokumen resmi",
  sourceDocument: "Kepmendikbudristek No. X Lampiran Y",
  sourceUrl: "https://kurikulum.kemdikbud.go.id/x",
  retrievedAt: "2026-09-01T00:00:00Z",
};

describe("CurriculumAchievementService (contracts §7b)", () => {
  let repo: ContentBlockRepository;
  let service: CurriculumAchievementService;

  beforeEach(() => {
    repo = new ContentBlockRepository(createMockPrismaClient());
    service = new CurriculumAchievementService(repo);
  });

  it("creates an achievement from valid input", async () => {
    const parsed = createCurriculumAchievementSchema.parse(VALID_INPUT);
    const created = await service.create(parsed);
    expect(created.achievementText).toBe(VALID_INPUT.achievementText);
  });

  it("409s on a duplicate (phase, subjectCode, element) tuple", async () => {
    const parsed = createCurriculumAchievementSchema.parse(VALID_INPUT);
    await service.create(parsed);
    await expect(service.create(parsed)).rejects.toThrow(ConflictError);
  });

  it("lists created achievements", async () => {
    const parsed = createCurriculumAchievementSchema.parse(VALID_INPUT);
    await service.create(parsed);
    const list = await service.list();
    expect(list).toHaveLength(1);
  });
});

describe("createCurriculumAchievementSchema validation", () => {
  it("rejects an empty achievementText/sourceDocument/sourceUrl", () => {
    expect(() => createCurriculumAchievementSchema.parse({ ...VALID_INPUT, achievementText: "" })).toThrow();
    expect(() => createCurriculumAchievementSchema.parse({ ...VALID_INPUT, sourceDocument: "" })).toThrow();
    expect(() => createCurriculumAchievementSchema.parse({ ...VALID_INPUT, sourceUrl: "" })).toThrow();
  });

  it("rejects a missing retrievedAt", () => {
    const { retrievedAt, ...rest } = VALID_INPUT;
    expect(() => createCurriculumAchievementSchema.parse(rest)).toThrow();
  });

  it("rejects a non-https sourceUrl", () => {
    expect(() =>
      createCurriculumAchievementSchema.parse({ ...VALID_INPUT, sourceUrl: "http://kurikulum.kemdikbud.go.id/x" }),
    ).toThrow();
  });

  it("rejects a sourceUrl outside the official ministry domain", () => {
    expect(() =>
      createCurriculumAchievementSchema.parse({ ...VALID_INPUT, sourceUrl: "https://example.com/x" }),
    ).toThrow();
  });
});
