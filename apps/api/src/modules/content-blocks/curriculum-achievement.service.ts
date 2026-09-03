import type { CurriculumAchievement } from "@prisma/client";
import { ContentBlockRepository } from "./content-block.repository.js";
import { ConflictError } from "../../common/errors/app-error.js";
import type { CreateCurriculumAchievementInput } from "./content-block.schema.js";

/**
 * Curriculum achievement CRUD — FR-008a / contracts/content-blocks.contract.md §7b.
 * Field-level validation (https + official domain, non-empty quote) lives in the
 * Zod schema; this service only owns the uniqueness rule.
 */
export class CurriculumAchievementService {
  constructor(private repo: ContentBlockRepository) {}

  async create(input: CreateCurriculumAchievementInput): Promise<CurriculumAchievement> {
    const existing = await this.repo.findCurriculumAchievementByTuple(input.phase, input.subjectCode, input.element);
    if (existing) {
      throw new ConflictError(
        `Capaian pembelajaran untuk (${input.phase}, ${input.subjectCode}, ${input.element}) sudah ada`,
      );
    }

    return this.repo.createCurriculumAchievement({
      educationStage: input.educationStage,
      phase: input.phase,
      subjectCode: input.subjectCode,
      element: input.element,
      achievementText: input.achievementText,
      sourceDocument: input.sourceDocument,
      sourceUrl: input.sourceUrl,
      retrievedAt: input.retrievedAt,
    });
  }

  async list(): Promise<CurriculumAchievement[]> {
    return this.repo.listCurriculumAchievements();
  }
}
