import { PrismaClient, ContentStatus, EducationStage } from "@prisma/client";
import { isLessonInFocus, isStageInFocus, isSubjectInFocus } from "@aksicendekia/content-kit";

/**
 * Feature 011 — Prisma queries extracted from public-content.controller.ts
 * (plan.md's noted Constitution II debt: controllers must not touch Prisma
 * directly). Also where focus-mode filtering (FR-001..FR-006) is applied so
 * every public-content route inherits it from one place instead of each
 * needing its own copy of the predicate.
 */

/**
 * Which content statuses the public path may serve.
 * Production: PUBLISHED only. Non-production preview: also REVIEW, gated by
 * CONTENT_PREVIEW_INCLUDE_REVIEW=true (Feature 010 / FR-030b). Never on in prod.
 */
export function publicStatuses(): ContentStatus[] {
  const preview =
    process.env.CONTENT_PREVIEW_INCLUDE_REVIEW === "true" &&
    process.env.NODE_ENV !== "production";
  return preview ? [ContentStatus.PUBLISHED, ContentStatus.REVIEW] : [ContentStatus.PUBLISHED];
}

export async function getPublicSubjects(prisma: PrismaClient, stage: EducationStage) {
  const statuses = publicStatuses();
  const subjects = await prisma.subject.findMany({
    where: { educationStage: stage, status: { in: statuses } },
    include: {
      units: {
        where: { status: { in: statuses } },
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            where: { status: { in: statuses }, listing: "LISTED" },
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              title: true,
              summary: true,
              difficultyLevel: true,
              estimatedDurationMinutes: true,
              orderIndex: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // FR-002: focus mode hides out-of-scope stages/subjects even when a caller
  // explicitly asks for one — the `stage` query param is not a bypass.
  return subjects.filter((s) => isLessonInFocus({ educationStage: s.educationStage, subjectCode: s.code }));
}

/**
 * Feature 011 (T077, FR-010) — the per-grade catalog feed for the kelas 1-6
 * explore/catalog UI. Focus-mode filtered like every other public-content route.
 */
export async function getPublicLessonsByGrade(prisma: PrismaClient, gradeLevel: number) {
  const lessons = await prisma.lesson.findMany({
    where: {
      educationStage: EducationStage.SD,
      gradeLevel,
      status: { in: publicStatuses() },
      listing: "LISTED",
    },
    orderBy: { orderIndex: "asc" },
    select: {
      id: true,
      unitId: true,
      title: true,
      summary: true,
      learningObjective: true,
      educationStage: true,
      phase: true,
      gradeLevel: true,
      difficultyLevel: true,
      estimatedDurationMinutes: true,
      orderIndex: true,
    },
  });

  // MATH_SD is the only SD subject in focus; the stage check is the load-bearing one.
  return lessons
    .filter((l) => isLessonInFocus({ educationStage: l.educationStage, subjectCode: "MATH_SD" }))
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function getPublicUnitLessons(prisma: PrismaClient, unitId: string) {
  const unit = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!unit) return [];

  const subject = await prisma.subject.findUnique({ where: { id: (unit as { subjectId: string }).subjectId } });
  if (!subject || !isSubjectInFocus(subject.code)) return [];

  const lessons = await prisma.lesson.findMany({
    where: {
      unitId,
      status: { in: publicStatuses() },
      listing: "LISTED",
    },
    orderBy: { orderIndex: "asc" },
    select: {
      id: true,
      unitId: true,
      title: true,
      summary: true,
      learningObjective: true,
      educationStage: true,
      phase: true,
      difficultyLevel: true,
      estimatedDurationMinutes: true,
      orderIndex: true,
    },
  });

  return lessons.filter((l) => isStageInFocus(l.educationStage));
}

interface VideoEmbedPublicShape {
  provider: string;
  externalId: string;
  title: string;
  publisherName: string;
  durationSeconds: number | null;
  posterUrl: string;
  transcriptText: string;
}

/** Never expose `reviewedBy`/`reviewNote` — internal CMS fields, not public API surface. */
function toPublicVideoEmbed(v: {
  provider: string;
  externalId: string;
  title: string;
  publisherName: string;
  durationSeconds: number | null;
  posterStorageKey: string;
  transcriptText: string;
}): VideoEmbedPublicShape {
  return {
    provider: v.provider,
    externalId: v.externalId,
    title: v.title,
    publisherName: v.publisherName,
    durationSeconds: v.durationSeconds,
    posterUrl: `/${v.posterStorageKey}`,
    transcriptText: v.transcriptText,
  };
}

export async function getPublicLessonDetail(prisma: PrismaClient, id: string) {
  const statuses = publicStatuses();
  const lesson = await prisma.lesson.findFirst({
    where: { id, status: { in: statuses } },
    include: {
      curriculumAchievement: true,
      contentBlocks: {
        where: { status: { in: statuses } },
        orderBy: { orderIndex: "asc" },
      },
      questionItems: {
        where: { status: { in: statuses } },
        orderBy: { orderIndex: "asc" },
        include: { hints: { orderBy: { stepOrder: "asc" } } },
      },
    },
  });

  if (!lesson) return null;

  // Stage is available directly on the lesson row, so this check always
  // applies. The subject-code check below is best-effort: it only fires
  // when the lesson's unit/subject can actually be resolved. A lesson whose
  // join is incomplete is a data-integrity gap, not a focus decision, so it
  // is not hidden on that basis alone (fail open on the unresolved join,
  // fail closed on the stage check that always resolves).
  if (!isStageInFocus(lesson.educationStage)) return null;

  const unit = await prisma.unit.findUnique({ where: { id: lesson.unitId } });
  if (unit) {
    const subject = await prisma.subject.findUnique({
      where: { id: (unit as { subjectId: string }).subjectId },
    });
    if (subject && !isSubjectInFocus(subject.code)) return null;
  }

  const cp = lesson.curriculumAchievement;

  const contentBlocks = await Promise.all(
    lesson.contentBlocks.map(async (b: { videoEmbedId?: string | null } & Record<string, unknown>) => {
      const base = {
        id: b.id,
        orderIndex: b.orderIndex,
        blockType: b.blockType,
        payload: b.payload,
        altText: b.altText,
        transcriptText: b.transcriptText,
        narrationText: b.narrationText,
      };
      if (!b.videoEmbedId) return base;
      const embed = await prisma.videoEmbed.findUnique({ where: { id: b.videoEmbedId } });
      if (!embed) return base;
      return {
        ...base,
        payload: { ...(base.payload as Record<string, unknown>), videoEmbed: toPublicVideoEmbed(embed) },
      };
    }),
  );

  return {
    id: lesson.id,
    unitId: lesson.unitId,
    title: lesson.title,
    summary: lesson.summary,
    learningObjective: lesson.learningObjective,
    educationStage: lesson.educationStage,
    phase: lesson.phase,
    gradeLevel: (lesson as { gradeLevel?: number | null }).gradeLevel ?? null,
    difficultyLevel: lesson.difficultyLevel,
    estimatedDurationMinutes: lesson.estimatedDurationMinutes,
    orderIndex: lesson.orderIndex,
    listing: lesson.listing,
    supersededByLessonId: lesson.supersededByLessonId,
    curriculumReference: cp
      ? {
          element: cp.element,
          achievementText: cp.achievementText,
          sourceDocument: cp.sourceDocument,
          sourceUrl: cp.sourceUrl,
          retrievedAt: cp.retrievedAt,
        }
      : null,
    contentBlocks,
    questionItems: lesson.questionItems.map(
      (q: {
        id: string;
        questionType: string;
        promptText: string;
        contentPayload: unknown;
        explanation: string;
        orderIndex: number;
        hints: Array<{ stepOrder: number; hintText: string }>;
      }) => ({
        id: q.id,
        questionType: q.questionType,
        promptText: q.promptText,
        contentPayload: q.contentPayload,
        explanation: q.explanation,
        orderIndex: q.orderIndex,
        hints: q.hints.map((h) => ({ stepOrder: h.stepOrder, hintText: h.hintText })),
      }),
    ),
  };
}

export async function getPublicExercise(prisma: PrismaClient, id: string) {
  // Not focus-filtered: reached only via a lesson the caller already opened
  // (itself gated by getPublicLessonDetail), not a discovery/listing surface.
  const question = await prisma.questionItem.findFirst({
    where: { id, status: { in: publicStatuses() } },
    include: { hints: { orderBy: { stepOrder: "asc" } } },
  });

  if (!question) return null;

  return {
    id: question.id,
    lessonId: question.lessonId,
    questionType: question.questionType,
    promptText: question.promptText,
    contentPayload: question.contentPayload,
    explanation: question.explanation,
    orderIndex: question.orderIndex,
    hints: question.hints.map((h: { stepOrder: number; hintText: string }) => ({
      stepOrder: h.stepOrder,
      hintText: h.hintText,
    })),
  };
}
