import type { GateSnapshot, GateViolation } from "./gate-types.js";

/**
 * Curriculum gate — C1-C3 (data-model.md §5). Pure function: blocks DRAFT -> REVIEW
 * (FR-008, FR-008a, FR-010).
 */
export function runCurriculumGate(snapshot: GateSnapshot): GateViolation[] {
  const violations: GateViolation[] = [];
  const { lesson, blocks } = snapshot;

  const c1Missing =
    !lesson.educationStage || !lesson.phase || !lesson.learningObjective?.trim() || !lesson.unitId;
  if (c1Missing) {
    violations.push({
      rule: "C1",
      blockId: null,
      blockType: null,
      field: null,
      message: "Pelajaran belum memiliki jenjang, fase, tujuan belajar, atau unit yang valid.",
    });
  }

  const hasConceptBlock = blocks.some((b) => b.blockType === "ILLUSTRATION" || b.blockType === "ANIMATION");
  const hasWidgetBlock = blocks.some((b) => b.blockType === "INTERACTIVE_WIDGET");
  if (!hasConceptBlock || !hasWidgetBlock) {
    violations.push({
      rule: "C2",
      blockId: null,
      blockType: null,
      field: null,
      message: "Pelajaran belum memiliki komponen interaktif pada penelusuran konsep.",
    });
  }

  const achievement = lesson.curriculumAchievement;
  const c3Missing =
    !lesson.curriculumAchievementId ||
    !achievement ||
    !achievement.achievementText?.trim() ||
    !achievement.sourceDocument?.trim() ||
    !achievement.sourceUrl?.trim() ||
    !achievement.retrievedAt;
  if (c3Missing) {
    violations.push({
      rule: "C3",
      blockId: null,
      blockType: null,
      field: "curriculumAchievementId",
      message: "Pelajaran belum ditautkan ke capaian pembelajaran resmi.",
    });
  }

  return violations;
}
