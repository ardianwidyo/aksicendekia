import {
  PrismaClient,
  EducationStage,
  CurriculumPhase,
  ContentStatus,
  DifficultyLevel,
  ContentBlockType,
  QuestionType,
} from '@prisma/client';
import {
  INTERACTIVE_LESSONS,
  LEGACY_LESSON_REFS,
  SD_VIDEO_REFS,
  type InteractiveLesson,
  type LessonBlockInput,
} from '@aksicendekia/content-kit';
import { seedCurriculumAchievements } from './seed-curriculum-achievements';

/**
 * Feature 010 / T046 + Feature 011 / T074 — seed the interactive lessons
 * (3 TK + 60 SD Matematika kelas 1-6 + 3 SMP + 3 SMA) and the embedded-video
 * registry rows. Idempotent (upsert by stable content-kit ids). Every lesson is
 * written at status REVIEW — this script MUST NOT write PUBLISHED (FR-030a). A
 * guard below fails loudly if that invariant is ever broken.
 */
const prisma = new PrismaClient();

async function seedVideoEmbeds(): Promise<void> {
  for (const ref of SD_VIDEO_REFS) {
    const row = {
      provider: ref.provider,
      externalId: ref.externalId,
      title: ref.title,
      publisherName: ref.publisherName,
      durationSeconds: ref.durationSeconds ?? null,
      posterStorageKey: ref.posterStorageKey,
      transcriptText: ref.transcriptText,
      verifiedAt: new Date(ref.verifiedAt),
      reviewedBy: ref.reviewedBy ?? null,
      reviewNote: ref.reviewNote ?? null,
    };
    await prisma.videoEmbed.upsert({ where: { id: ref.id }, update: row, create: { id: ref.id, ...row } });
  }
}

function blockPayload(block: LessonBlockInput): Record<string, unknown> {
  // Fold the storage-key companions into the JSON payload so the block is
  // self-contained (real MediaAsset rows land with T042). FK columns stay null.
  return {
    ...block.payload,
    ...(block.altText ? { altText: block.altText } : {}),
    ...(block.transcriptText ? { transcriptText: block.transcriptText } : {}),
    ...(block.mediaStorageKey ? { mediaStorageKey: block.mediaStorageKey, imageUrl: `/${block.mediaStorageKey}` } : {}),
    ...(block.captionStorageKey ? { captionStorageKey: block.captionStorageKey } : {}),
    ...(block.fallbackStorageKey ? { fallbackStorageKey: block.fallbackStorageKey } : {}),
    ...(block.illustrationPrimitive ? { illustrationPrimitive: block.illustrationPrimitive } : {}),
  };
}

async function seedOneLesson(lesson: InteractiveLesson): Promise<void> {
  if ((lesson.status as string) === 'PUBLISHED') {
    throw new Error(`FR-030a violation: lesson ${lesson.id} carries status PUBLISHED in the seed`);
  }

  const subject = await prisma.subject.upsert({
    where: { code: lesson.subjectCode },
    update: { name: lesson.subjectName },
    create: {
      code: lesson.subjectCode,
      name: lesson.subjectName,
      educationStage: lesson.educationStage as EducationStage,
      phase: lesson.phase as CurriculumPhase,
      status: ContentStatus.REVIEW,
    },
  });

  // Feature 011 — SD Matematika is grouped into one unit per grade (kelas 1-6);
  // other stages keep the single subject-level unit.
  const unitId = lesson.gradeLevel
    ? `unit-${lesson.subjectCode}-k${lesson.gradeLevel}`
    : `unit-${lesson.subjectCode}`;
  const unitTitle = lesson.gradeLevel ? `Kelas ${lesson.gradeLevel} — Matematika` : lesson.unitTitle;
  const unit = await prisma.unit.upsert({
    where: { id: unitId },
    update: { title: unitTitle },
    create: {
      id: unitId,
      subjectId: subject.id,
      title: unitTitle,
      orderIndex: lesson.gradeLevel ?? 0,
      status: ContentStatus.REVIEW,
    },
  });

  await prisma.lesson.upsert({
    where: { id: lesson.id },
    update: {
      title: lesson.title,
      summary: lesson.summary,
      learningObjective: lesson.learningObjective,
      gradeLevel: lesson.gradeLevel ?? null,
      status: ContentStatus.REVIEW,
      listing: 'LISTED',
      curriculumAchievementId: lesson.curriculumAchievementId,
    },
    create: {
      id: lesson.id,
      unitId: unit.id,
      title: lesson.title,
      summary: lesson.summary,
      learningObjective: lesson.learningObjective,
      educationStage: lesson.educationStage as EducationStage,
      phase: lesson.phase as CurriculumPhase,
      difficultyLevel: lesson.difficultyLevel as DifficultyLevel,
      estimatedDurationMinutes: lesson.estimatedDurationMinutes,
      orderIndex: lesson.orderIndex,
      gradeLevel: lesson.gradeLevel ?? null,
      status: ContentStatus.REVIEW,
      listing: 'LISTED',
      curriculumAchievementId: lesson.curriculumAchievementId,
    },
  });

  // Content blocks — replace to keep ordering deterministic on re-run.
  await prisma.lessonContentBlock.deleteMany({ where: { lessonId: lesson.id } });
  for (let i = 0; i < lesson.contentBlocks.length; i++) {
    const block = lesson.contentBlocks[i];
    await prisma.lessonContentBlock.create({
      data: {
        id: `${lesson.id}-b${i}`,
        lessonId: lesson.id,
        orderIndex: i,
        blockType: block.blockType as ContentBlockType,
        payload: blockPayload(block) as object,
        transcriptText: block.transcriptText ?? null,
        altText: block.altText ?? null,
        narrationText: block.narrationText ?? null,
        // Feature 011 — an embedded VIDEO block references a VideoEmbed row
        // instead of carrying a self-hosted mediaAssetId.
        videoEmbedId: block.videoEmbedId ?? null,
        status: ContentStatus.REVIEW,
      },
    });
  }

  // Questions
  await prisma.questionHint.deleteMany({
    where: { questionItem: { lessonId: lesson.id } },
  });
  await prisma.questionItem.deleteMany({ where: { lessonId: lesson.id } });
  for (let i = 0; i < lesson.questions.length; i++) {
    const q = lesson.questions[i];
    await prisma.questionItem.create({
      data: {
        id: q.id,
        lessonId: lesson.id,
        questionType: q.questionType as QuestionType,
        promptText: q.promptText,
        contentPayload: q.contentPayload as object,
        explanation: q.explanation,
        orderIndex: i,
        status: ContentStatus.REVIEW,
        hints: {
          create: q.hints.map((h) => ({ stepOrder: h.stepOrder, hintText: h.hintText })),
        },
      },
    });
  }
}

async function markLegacyLessons(): Promise<void> {
  for (const legacy of LEGACY_LESSON_REFS) {
    const replacement = INTERACTIVE_LESSONS.find((l) => l.id === legacy.supersededByLessonId);
    await prisma.lesson.updateMany({
      where: { id: legacy.id },
      data: {
        listing: 'HIDDEN_LEGACY',
        supersededByLessonId: replacement ? legacy.supersededByLessonId : null,
      },
    });
  }
}

export async function seedInteractiveContent(): Promise<void> {
  console.log(
    `🌱 Feature 010/011 — curriculum achievements + ${INTERACTIVE_LESSONS.length} interactive lessons + ${SD_VIDEO_REFS.length} video embeds (status REVIEW)`,
  );
  await seedCurriculumAchievements();
  await seedVideoEmbeds();
  for (const lesson of INTERACTIVE_LESSONS) await seedOneLesson(lesson);
  await markLegacyLessons();

  const published = await prisma.lesson.count({
    where: { id: { in: INTERACTIVE_LESSONS.map((l) => l.id) }, status: ContentStatus.PUBLISHED },
  });
  if (published > 0) throw new Error(`FR-030a violation: ${published} seeded lessons ended up PUBLISHED`);
  console.log(`  ✓ ${INTERACTIVE_LESSONS.length} lessons at REVIEW, 0 PUBLISHED`);
}

if (require.main === module) {
  seedInteractiveContent()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
