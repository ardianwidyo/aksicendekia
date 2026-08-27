import { PrismaClient, Subject, Unit, Lesson, QuestionItem, ContentStatus, EducationStage, Prisma } from "@prisma/client";

export class CurriculumRepository {
  constructor(private prisma: PrismaClient) {}

  // ================= SUBJECTS =================
  async findSubjectById(id: string): Promise<Subject | null> {
    return this.prisma.subject.findUnique({
      where: { id },
      include: { units: true },
    });
  }

  async findSubjectByCode(code: string): Promise<Subject | null> {
    return this.prisma.subject.findUnique({
      where: { code },
    });
  }

  async listSubjects(stage?: EducationStage, status?: ContentStatus): Promise<Subject[]> {
    const where: Prisma.SubjectWhereInput = {};
    if (stage) where.educationStage = stage;
    if (status) where.status = status;

    return this.prisma.subject.findMany({
      where,
      orderBy: { code: "asc" },
      include: {
        units: {
          where: status ? { status } : undefined,
          orderBy: { orderIndex: "asc" },
        },
      },
    });
  }

  async createSubject(data: Prisma.SubjectCreateInput): Promise<Subject> {
    return this.prisma.subject.create({ data });
  }

  async updateSubject(id: string, data: Prisma.SubjectUpdateInput): Promise<Subject> {
    return this.prisma.subject.update({
      where: { id },
      data,
    });
  }

  async deleteSubject(id: string): Promise<Subject> {
    return this.prisma.subject.delete({
      where: { id },
    });
  }

  // ================= UNITS =================
  async findUnitById(id: string): Promise<Unit | null> {
    return this.prisma.unit.findUnique({
      where: { id },
      include: {
        subject: true,
        lessons: { orderBy: { orderIndex: "asc" } },
      },
    });
  }

  async listUnitsBySubject(subjectId: string, status?: ContentStatus): Promise<Unit[]> {
    const where: Prisma.UnitWhereInput = { subjectId };
    if (status) where.status = status;

    return this.prisma.unit.findMany({
      where,
      orderBy: { orderIndex: "asc" },
      include: {
        lessons: {
          where: status ? { status } : undefined,
          orderBy: { orderIndex: "asc" },
        },
      },
    });
  }

  async createUnit(data: Prisma.UnitCreateInput): Promise<Unit> {
    return this.prisma.unit.create({ data });
  }

  async updateUnit(id: string, data: Prisma.UnitUpdateInput): Promise<Unit> {
    return this.prisma.unit.update({
      where: { id },
      data,
    });
  }

  async deleteUnit(id: string): Promise<Unit> {
    return this.prisma.unit.delete({
      where: { id },
    });
  }

  // ================= LESSONS =================
  async findLessonById(id: string): Promise<(Lesson & { prerequisites: { prerequisiteLessonId: string }[]; questionItems: QuestionItem[] }) | null> {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: {
        prerequisites: { select: { prerequisiteLessonId: true } },
        questionItems: {
          orderBy: { orderIndex: "asc" },
          include: { hints: { orderBy: { stepOrder: "asc" } } },
        },
      },
    });
  }

  async listLessonsByUnit(unitId: string, status?: ContentStatus): Promise<Lesson[]> {
    const where: Prisma.LessonWhereInput = { unitId };
    if (status) where.status = status;

    return this.prisma.lesson.findMany({
      where,
      orderBy: { orderIndex: "asc" },
      include: {
        prerequisites: { select: { prerequisiteLessonId: true } },
      },
    });
  }

  async createLesson(data: Prisma.LessonCreateInput, prerequisiteIds?: string[]): Promise<Lesson> {
    return this.prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.create({ data });

      if (prerequisiteIds && prerequisiteIds.length > 0) {
        await tx.lessonPrerequisite.createMany({
          data: prerequisiteIds.map((pId) => ({
            lessonId: lesson.id,
            prerequisiteLessonId: pId,
          })),
        });
      }

      return lesson;
    });
  }

  async updateLesson(id: string, data: Prisma.LessonUpdateInput, prerequisiteIds?: string[]): Promise<Lesson> {
    return this.prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.update({
        where: { id },
        data,
      });

      if (prerequisiteIds !== undefined) {
        await tx.lessonPrerequisite.deleteMany({ where: { lessonId: id } });

        if (prerequisiteIds.length > 0) {
          await tx.lessonPrerequisite.createMany({
            data: prerequisiteIds.map((pId) => ({
              lessonId: id,
              prerequisiteLessonId: pId,
            })),
          });
        }
      }

      return lesson;
    });
  }

  async deleteLesson(id: string): Promise<Lesson> {
    return this.prisma.lesson.delete({
      where: { id },
    });
  }

  async setLessonPrerequisites(lessonId: string, prerequisiteIds: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.lessonPrerequisite.deleteMany({ where: { lessonId } });
      if (prerequisiteIds.length > 0) {
        await tx.lessonPrerequisite.createMany({
          data: prerequisiteIds.map((pId) => ({
            lessonId,
            prerequisiteLessonId: pId,
          })),
        });
      }
    });
  }

  async getPrerequisitesGraph(): Promise<{ lessonId: string; prerequisiteLessonId: string }[]> {
    return this.prisma.lessonPrerequisite.findMany({
      select: { lessonId: true, prerequisiteLessonId: true },
    });
  }

  // ================= QUESTION ITEMS =================
  async findQuestionItemById(id: string) {
    return this.prisma.questionItem.findUnique({
      where: { id },
      include: { hints: { orderBy: { stepOrder: "asc" } } },
    });
  }

  async listQuestionsByLesson(lessonId: string, status?: ContentStatus) {
    const where: Prisma.QuestionItemWhereInput = { lessonId };
    if (status) where.status = status;

    return this.prisma.questionItem.findMany({
      where,
      orderBy: { orderIndex: "asc" },
      include: { hints: { orderBy: { stepOrder: "asc" } } },
    });
  }

  async createQuestionItem(
    data: Prisma.QuestionItemCreateInput,
    hints: { stepOrder: number; hintText: string }[]
  ) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.questionItem.create({ data });

      if (hints.length > 0) {
        await tx.questionHint.createMany({
          data: hints.map((h) => ({
            questionItemId: item.id,
            stepOrder: h.stepOrder,
            hintText: h.hintText,
          })),
        });
      }

      return tx.questionItem.findUnique({
        where: { id: item.id },
        include: { hints: { orderBy: { stepOrder: "asc" } } },
      });
    });
  }

  async updateQuestionItem(
    id: string,
    data: Prisma.QuestionItemUpdateInput,
    hints?: { stepOrder: number; hintText: string }[]
  ) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.questionItem.update({
        where: { id },
        data,
      });

      if (hints !== undefined) {
        await tx.questionHint.deleteMany({ where: { questionItemId: id } });
        if (hints.length > 0) {
          await tx.questionHint.createMany({
            data: hints.map((h) => ({
              questionItemId: id,
              stepOrder: h.stepOrder,
              hintText: h.hintText,
            })),
          });
        }
      }

      return tx.questionItem.findUnique({
        where: { id: item.id },
        include: { hints: { orderBy: { stepOrder: "asc" } } },
      });
    });
  }

  async deleteQuestionItem(id: string) {
    return this.prisma.questionItem.delete({
      where: { id },
    });
  }

  async createQuestionItemsBatch(
    items: Array<{
      data: Prisma.QuestionItemCreateInput;
      hints: { stepOrder: number; hintText: string }[];
    }>
  ) {
    return this.prisma.$transaction(async (tx) => {
      const createdItems = [];
      for (const item of items) {
        const created = await tx.questionItem.create({ data: item.data });
        if (item.hints.length > 0) {
          await tx.questionHint.createMany({
            data: item.hints.map((h) => ({
              questionItemId: created.id,
              stepOrder: h.stepOrder,
              hintText: h.hintText,
            })),
          });
        }
        createdItems.push(created);
      }
      return createdItems;
    });
  }

  // ================= STUDENT PROGRESS =================
  async getStudentCompletedLessonIds(studentProfileId: string): Promise<string[]> {
    const progress = await this.prisma.studentLessonProgress.findMany({
      where: {
        studentProfileId,
        isCompleted: true,
      },
      select: { lessonId: true },
    });

    return progress.map((p) => p.lessonId);
  }

  async markLessonCompleted(studentProfileId: string, lessonId: string) {
    return this.prisma.studentLessonProgress.upsert({
      where: {
        studentProfileId_lessonId: { studentProfileId, lessonId },
      },
      create: {
        studentProfileId,
        lessonId,
        isCompleted: true,
        completedAt: new Date(),
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });
  }
}
