import { PrismaClient, EducationStage, CurriculumPhase } from '@prisma/client';
import { CURRICULUM_ACHIEVEMENTS } from '@aksicendekia/content-kit';

/**
 * Feature 010 / T045 — seed the CurriculumAchievement rows from content-kit.
 * Idempotent (upsert by stable id). MUST run before seed-interactive-content
 * because gate C3 links lessons to these rows (FR-008a).
 */
const prisma = new PrismaClient();

export async function seedCurriculumAchievements(): Promise<void> {
  for (const cp of CURRICULUM_ACHIEVEMENTS) {
    await prisma.curriculumAchievement.upsert({
      where: { id: cp.id },
      update: {
        educationStage: cp.educationStage as EducationStage,
        phase: cp.phase as CurriculumPhase,
        subjectCode: cp.subjectCode,
        element: cp.element,
        achievementText: cp.achievementText,
        sourceDocument: cp.sourceDocument,
        sourceUrl: cp.sourceUrl,
        retrievedAt: new Date(cp.retrievedAt),
      },
      create: {
        id: cp.id,
        educationStage: cp.educationStage as EducationStage,
        phase: cp.phase as CurriculumPhase,
        subjectCode: cp.subjectCode,
        element: cp.element,
        achievementText: cp.achievementText,
        sourceDocument: cp.sourceDocument,
        sourceUrl: cp.sourceUrl,
        retrievedAt: new Date(cp.retrievedAt),
      },
    });
  }
  console.log(`  ✓ ${CURRICULUM_ACHIEVEMENTS.length} curriculum achievements upserted`);
}

if (require.main === module) {
  seedCurriculumAchievements()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
