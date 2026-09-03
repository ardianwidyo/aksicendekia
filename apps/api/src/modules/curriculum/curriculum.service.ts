import { Subject, Unit, Lesson, QuestionItem, ContentStatus, EducationStage, QuestionType, MatchingMode, Prisma } from "@prisma/client";
import { getAchievementById } from "@aksicendekia/content-kit";
import { CurriculumRepository } from "./curriculum.repository.js";
import { CsvImportService, CsvImportReport } from "./csv-import.service.js";
import { BadRequestError, NotFoundError, ConflictError } from "../../common/errors/app-error.js";
import {
  CreateSubjectInput,
  UpdateSubjectInput,
  CreateUnitInput,
  UpdateUnitInput,
  CreateLessonInput,
  UpdateLessonInput,
  CreateQuestionItemInput,
  UpdateQuestionItemInput,
} from "./curriculum.schema.js";

/** Feature 011 — the 5 Matematika SD curriculum elements every grade must cover (FR-011). */
const SD_MATEMATIKA_ELEMENTS = [
  "Bilangan",
  "Aljabar",
  "Pengukuran",
  "Geometri",
  "Analisis Data dan Peluang",
] as const;
const SD_MIN_LESSONS_PER_GRADE = 10;

export interface GradeCoverage {
  gradeLevel: number;
  lessonCount: number;
  elementsCovered: string[];
  elementsMissing: string[];
  meetsMinimum: boolean;
}
export interface CurriculumCoverageReport {
  coverage: GradeCoverage[];
  overallMeetsMinimum: boolean;
}

export class CurriculumService {
  constructor(
    private repo: CurriculumRepository,
    private csvImportService: CsvImportService
  ) {}

  // ================= FEATURE 011 — SD MATEMATIKA COVERAGE (FR-011) =================
  async getCurriculumCoverage(): Promise<CurriculumCoverageReport> {
    const rows = await this.repo.listSdLessonsForCoverage();
    const coverage: GradeCoverage[] = [1, 2, 3, 4, 5, 6].map((gradeLevel) => {
      const listed = rows.filter((r) => r.gradeLevel === gradeLevel && r.listing === "LISTED");
      const elementsCovered = [
        ...new Set(
          listed
            .map((r) => (r.curriculumAchievementId ? getAchievementById(r.curriculumAchievementId)?.element : undefined))
            .filter((e): e is string => Boolean(e))
        ),
      ].sort();
      const elementsMissing = SD_MATEMATIKA_ELEMENTS.filter((e) => !elementsCovered.includes(e));
      return {
        gradeLevel,
        lessonCount: listed.length,
        elementsCovered,
        elementsMissing,
        meetsMinimum: listed.length >= SD_MIN_LESSONS_PER_GRADE && elementsMissing.length === 0,
      };
    });
    return { coverage, overallMeetsMinimum: coverage.every((g) => g.meetsMinimum) };
  }

  // ================= SUBJECTS =================
  async getSubject(id: string): Promise<Subject> {
    const subject = await this.repo.findSubjectById(id);
    if (!subject) throw new NotFoundError("Mata pelajaran tidak ditemukan");
    return subject;
  }

  async listSubjects(stage?: EducationStage, status?: ContentStatus): Promise<Subject[]> {
    return this.repo.listSubjects(stage, status);
  }

  async createSubject(input: CreateSubjectInput): Promise<Subject> {
    const existing = await this.repo.findSubjectByCode(input.code);
    if (existing) throw new ConflictError(`Kode mata pelajaran '${input.code}' sudah digunakan`);

    return this.repo.createSubject({
      code: input.code,
      name: input.name,
      educationStage: input.educationStage,
      phase: input.phase,
      status: ContentStatus.DRAFT,
      version: 1,
    });
  }

  async updateSubject(id: string, input: UpdateSubjectInput): Promise<Subject> {
    const subject = await this.getSubject(id);

    // Immutable Versioning Check
    if (subject.status === ContentStatus.PUBLISHED) {
      // Create new draft revision
      return this.repo.createSubject({
        code: `${subject.code}_v${subject.version + 1}`,
        name: input.name ?? subject.name,
        educationStage: input.educationStage ?? subject.educationStage,
        phase: input.phase ?? subject.phase,
        status: ContentStatus.DRAFT,
        version: subject.version + 1,
      });
    }

    return this.repo.updateSubject(id, input);
  }

  async updateSubjectStatus(id: string, targetStatus: ContentStatus): Promise<Subject> {
    const subject = await this.getSubject(id);
    return this.repo.updateSubject(id, { status: targetStatus });
  }

  async deleteSubject(id: string): Promise<Subject> {
    const subject = await this.getSubject(id);
    if (subject.status === ContentStatus.PUBLISHED) {
      throw new ConflictError("Tidak dapat menghapus mata pelajaran berstatus PUBLISHED. Arsipkan terlebih dahulu.");
    }
    return this.repo.deleteSubject(id);
  }

  // ================= UNITS =================
  async getUnit(id: string): Promise<Unit> {
    const unit = await this.repo.findUnitById(id);
    if (!unit) throw new NotFoundError("Unit/Bab tidak ditemukan");
    return unit;
  }

  async listUnitsBySubject(subjectId: string, status?: ContentStatus): Promise<Unit[]> {
    return this.repo.listUnitsBySubject(subjectId, status);
  }

  async createUnit(input: CreateUnitInput): Promise<Unit> {
    await this.getSubject(input.subjectId);
    return this.repo.createUnit({
      subject: { connect: { id: input.subjectId } },
      title: input.title,
      description: input.description,
      orderIndex: input.orderIndex,
      status: ContentStatus.DRAFT,
    });
  }

  async updateUnit(id: string, input: UpdateUnitInput): Promise<Unit> {
    const unit = await this.getUnit(id);

    if (unit.status === ContentStatus.PUBLISHED) {
      // Create clone draft for published unit
      return this.repo.createUnit({
        subject: { connect: { id: unit.subjectId } },
        title: input.title ?? `${unit.title} (Draft Revision)`,
        description: input.description ?? unit.description,
        orderIndex: input.orderIndex ?? unit.orderIndex,
        status: ContentStatus.DRAFT,
      });
    }

    return this.repo.updateUnit(id, input);
  }

  async updateUnitStatus(id: string, targetStatus: ContentStatus): Promise<Unit> {
    await this.getUnit(id);
    return this.repo.updateUnit(id, { status: targetStatus });
  }

  async deleteUnit(id: string): Promise<Unit> {
    const unit = await this.getUnit(id);
    if (unit.status === ContentStatus.PUBLISHED) {
      throw new ConflictError("Tidak dapat menghapus unit berstatus PUBLISHED.");
    }
    return this.repo.deleteUnit(id);
  }

  // ================= LESSONS =================
  async getLesson(id: string): Promise<Lesson & { prerequisites: { prerequisiteLessonId: string }[]; questionItems: QuestionItem[] }> {
    const lesson = await this.repo.findLessonById(id);
    if (!lesson) throw new NotFoundError("Pelajaran tidak ditemukan");
    return lesson;
  }

  async listLessonsByUnit(unitId: string, status?: ContentStatus): Promise<Lesson[]> {
    return this.repo.listLessonsByUnit(unitId, status);
  }

  async createLesson(input: CreateLessonInput): Promise<Lesson> {
    await this.getUnit(input.unitId);

    if (input.prerequisiteLessonIds && input.prerequisiteLessonIds.length > 0) {
      await this.validatePrerequisites(input.prerequisiteLessonIds);
    }

    return this.repo.createLesson(
      {
        unit: { connect: { id: input.unitId } },
        title: input.title,
        summary: input.summary,
        learningObjective: input.learningObjective,
        educationStage: input.educationStage,
        phase: input.phase,
        difficultyLevel: input.difficultyLevel,
        estimatedDurationMinutes: input.estimatedDurationMinutes,
        orderIndex: input.orderIndex,
        status: ContentStatus.DRAFT,
        version: 1,
        // Feature 010 (FR-008a, gate C3): link to the official CP quote, if given.
        ...(input.curriculumAchievementId
          ? { curriculumAchievement: { connect: { id: input.curriculumAchievementId } } }
          : {}),
      },
      input.prerequisiteLessonIds
    );
  }

  async updateLesson(id: string, input: UpdateLessonInput): Promise<Lesson> {
    const lesson = await this.getLesson(id);

    if (input.prerequisiteLessonIds) {
      await this.checkCircularPrerequisites(id, input.prerequisiteLessonIds);
    }

    // Immutable Versioning Check
    if (lesson.status === ContentStatus.PUBLISHED) {
      // Create new draft version
      return this.repo.createLesson(
        {
          unit: { connect: { id: lesson.unitId } },
          title: input.title ?? lesson.title,
          summary: input.summary ?? lesson.summary,
          learningObjective: input.learningObjective ?? lesson.learningObjective,
          educationStage: input.educationStage ?? lesson.educationStage,
          phase: input.phase ?? lesson.phase,
          difficultyLevel: input.difficultyLevel ?? lesson.difficultyLevel,
          estimatedDurationMinutes: input.estimatedDurationMinutes ?? lesson.estimatedDurationMinutes,
          orderIndex: input.orderIndex ?? lesson.orderIndex,
          status: ContentStatus.DRAFT,
          version: lesson.version + 1,
          parentVersion: { connect: { id: lesson.id } },
          ...(input.curriculumAchievementId !== undefined
            ? { curriculumAchievement: { connect: { id: input.curriculumAchievementId } } }
            : lesson.curriculumAchievementId
              ? { curriculumAchievement: { connect: { id: lesson.curriculumAchievementId } } }
              : {}),
        },
        input.prerequisiteLessonIds ?? lesson.prerequisites.map((p) => p.prerequisiteLessonId)
      );
    }

    const { curriculumAchievementId, ...rest } = input;
    return this.repo.updateLesson(
      id,
      {
        ...rest,
        ...(curriculumAchievementId !== undefined
          ? { curriculumAchievement: { connect: { id: curriculumAchievementId } } }
          : {}),
      },
      input.prerequisiteLessonIds
    );
  }

  async updateLessonStatus(id: string, targetStatus: ContentStatus): Promise<Lesson> {
    const lesson = await this.getLesson(id);

    if (targetStatus === ContentStatus.PUBLISHED && lesson.parentVersionId) {
      // Transition previous version to ARCHIVED
      await this.repo.updateLesson(lesson.parentVersionId, { status: ContentStatus.ARCHIVED });
    }

    return this.repo.updateLesson(id, { status: targetStatus });
  }

  async deleteLesson(id: string): Promise<Lesson> {
    const lesson = await this.getLesson(id);
    if (lesson.status === ContentStatus.PUBLISHED) {
      throw new ConflictError("Tidak dapat menghapus pelajaran berstatus PUBLISHED.");
    }
    return this.repo.deleteLesson(id);
  }

  // ================= PREREQUISITE VALIDATION (DAG) =================
  private async validatePrerequisites(prerequisiteIds: string[]): Promise<void> {
    for (const pId of prerequisiteIds) {
      const exists = await this.repo.findLessonById(pId);
      if (!exists) throw new NotFoundError(`Pelajaran prasyarat ID '${pId}' tidak ditemukan`);
    }
  }

  private async checkCircularPrerequisites(lessonId: string, targetPrerequisiteIds: string[]): Promise<void> {
    await this.validatePrerequisites(targetPrerequisiteIds);

    if (targetPrerequisiteIds.includes(lessonId)) {
      throw new BadRequestError("Pelajaran tidak dapat menjadi prasyarat untuk dirinya sendiri");
    }

    const allLinks = await this.repo.getPrerequisitesGraph();
    const graph = new Map<string, string[]>();

    for (const link of allLinks) {
      if (link.lessonId === lessonId) continue; // Skip current link to test new ones
      if (!graph.has(link.lessonId)) graph.set(link.lessonId, []);
      graph.get(link.lessonId)!.push(link.prerequisiteLessonId);
    }

    for (const targetPId of targetPrerequisiteIds) {
      if (!graph.has(lessonId)) graph.set(lessonId, []);
      graph.get(lessonId)!.push(targetPId);

      // Check if targetPId can reach lessonId
      const visited = new Set<string>();
      const stack = [targetPId];

      while (stack.length > 0) {
        const curr = stack.pop()!;
        if (curr === lessonId) {
          throw new BadRequestError("Terdeteksi siklus prasyarat antar-pelajaran (circular prerequisite dependency)");
        }
        if (!visited.has(curr)) {
          visited.add(curr);
          const neighbors = graph.get(curr) || [];
          stack.push(...neighbors);
        }
      }
    }
  }

  // ================= QUESTION ITEMS =================
  async getQuestionItem(id: string) {
    const item = await this.repo.findQuestionItemById(id);
    if (!item) throw new NotFoundError("Butir soal tidak ditemukan");
    return item;
  }

  async listQuestionsByLesson(lessonId: string, status?: ContentStatus) {
    return this.repo.listQuestionsByLesson(lessonId, status);
  }

  async createQuestionItem(input: CreateQuestionItemInput) {
    await this.getLesson(input.lessonId);

    const contentPayload: any = {};
    if (input.questionType === QuestionType.MULTIPLE_CHOICE) {
      contentPayload.choices = input.multipleChoicePayload?.choices;
    } else if (input.questionType === QuestionType.SHORT_ANSWER) {
      contentPayload.acceptedAnswers = input.shortAnswerPayload?.acceptedAnswers;
      contentPayload.matchingMode = input.shortAnswerPayload?.matchingMode ?? MatchingMode.NORMALIZED;
    } else if (input.questionType === QuestionType.MATCHING_PAIRS) {
      contentPayload.pairs = input.matchingPairsPayload?.pairs;
    }

    return this.repo.createQuestionItem(
      {
        lesson: { connect: { id: input.lessonId } },
        questionType: input.questionType,
        promptText: input.promptText,
        contentPayload,
        explanation: input.explanation,
        orderIndex: input.orderIndex,
        status: ContentStatus.DRAFT,
      },
      input.hints
    );
  }

  async updateQuestionItem(id: string, input: UpdateQuestionItemInput) {
    const item = await this.getQuestionItem(id);

    const data: Prisma.QuestionItemUpdateInput = {};
    if (input.questionType) data.questionType = input.questionType;
    if (input.promptText) data.promptText = input.promptText;
    if (input.explanation) data.explanation = input.explanation;
    if (input.orderIndex !== undefined) data.orderIndex = input.orderIndex;

    const questionType = input.questionType ?? item.questionType;
    const contentPayload: any = { ...((item.contentPayload as any) || {}) };

    if (questionType === QuestionType.MULTIPLE_CHOICE && input.multipleChoicePayload) {
      contentPayload.choices = input.multipleChoicePayload.choices;
    } else if (questionType === QuestionType.SHORT_ANSWER && input.shortAnswerPayload) {
      contentPayload.acceptedAnswers = input.shortAnswerPayload.acceptedAnswers;
      contentPayload.matchingMode = input.shortAnswerPayload.matchingMode;
    } else if (questionType === QuestionType.MATCHING_PAIRS && input.matchingPairsPayload) {
      contentPayload.pairs = input.matchingPairsPayload.pairs;
    }
    data.contentPayload = contentPayload;

    if (item.status === ContentStatus.PUBLISHED) {
      // Create draft clone for published question item
      return this.repo.createQuestionItem(
        {
          lesson: { connect: { id: item.lessonId } },
          questionType,
          promptText: input.promptText ?? item.promptText,
          contentPayload,
          explanation: input.explanation ?? item.explanation,
          orderIndex: input.orderIndex ?? item.orderIndex,
          status: ContentStatus.DRAFT,
        },
        input.hints ?? item.hints.map((h) => ({ stepOrder: h.stepOrder, hintText: h.hintText }))
      );
    }

    return this.repo.updateQuestionItem(id, data, input.hints);
  }

  async updateQuestionItemStatus(id: string, targetStatus: ContentStatus) {
    await this.getQuestionItem(id);
    return this.repo.updateQuestionItem(id, { status: targetStatus });
  }

  async deleteQuestionItem(id: string) {
    const item = await this.getQuestionItem(id);
    if (item.status === ContentStatus.PUBLISHED) {
      throw new ConflictError("Tidak dapat menghapus butir soal berstatus PUBLISHED.");
    }
    return this.repo.deleteQuestionItem(id);
  }

  // ================= CSV MASS IMPORT =================
  async importQuestionsFromCsv(lessonId: string, csvContent: string): Promise<CsvImportReport> {
    await this.getLesson(lessonId);

    const { headers, rows } = this.csvImportService.parseCsv(csvContent);
    if (rows.length === 0) {
      return {
        success: false,
        totalRows: 0,
        passedRows: 0,
        failedRows: 0,
        errors: [{ row: 0, column: "file", message: "File CSV tidak berisi data atau kosong" }],
      };
    }

    const { report, validPayloads } = this.csvImportService.processCsvRows(lessonId, headers, rows);

    if (report.success && validPayloads.length > 0) {
      const created = await this.repo.createQuestionItemsBatch(validPayloads);
      report.createdCount = created.length;
    }

    return report;
  }

  // ================= STUDENT READ APIS =================
  async listSubjectsForStudent(stage: EducationStage): Promise<Subject[]> {
    return this.repo.listSubjects(stage, ContentStatus.PUBLISHED);
  }

  async listLessonsForUnitForStudent(studentProfileId: string, unitId: string) {
    const lessons = await this.repo.listLessonsByUnit(unitId, ContentStatus.PUBLISHED);
    const completedIds = await this.repo.getStudentCompletedLessonIds(studentProfileId);

    return lessons.map((lesson) => {
      const prereqs = lesson.prerequisites.map((p) => p.prerequisiteLessonId);
      const isLocked = prereqs.some((pId) => !completedIds.includes(pId));

      return {
        id: lesson.id,
        unitId: lesson.unitId,
        title: lesson.title,
        summary: lesson.summary,
        learningObjective: lesson.learningObjective,
        educationStage: lesson.educationStage,
        phase: lesson.phase,
        difficultyLevel: lesson.difficultyLevel,
        estimatedDurationMinutes: lesson.estimatedDurationMinutes,
        orderIndex: lesson.orderIndex,
        isLocked,
        isCompleted: completedIds.includes(lesson.id),
      };
    });
  }

  async getLessonDetailForStudent(studentProfileId: string, lessonId: string) {
    const lesson = await this.repo.findLessonById(lessonId);

    if (!lesson || lesson.status !== ContentStatus.PUBLISHED) {
      throw new NotFoundError("Pelajaran tidak ditemukan atau belum diterbitkan");
    }

    const completedIds = await this.repo.getStudentCompletedLessonIds(studentProfileId);
    const prereqs = lesson.prerequisites.map((p) => p.prerequisiteLessonId);
    const isLocked = prereqs.some((pId) => !completedIds.includes(pId));

    if (isLocked) {
      // SECURITY: Strip and omit question items completely for locked lessons!
      return {
        id: lesson.id,
        unitId: lesson.unitId,
        title: lesson.title,
        summary: lesson.summary,
        learningObjective: lesson.learningObjective,
        educationStage: lesson.educationStage,
        phase: lesson.phase,
        difficultyLevel: lesson.difficultyLevel,
        estimatedDurationMinutes: lesson.estimatedDurationMinutes,
        orderIndex: lesson.orderIndex,
        isLocked: true,
        status: "LOCKED",
        questionItems: [], // STRICTLY EMPTY!
      };
    }

    // Unlocked: return published question items
    const publishedQuestions = lesson.questionItems
      .filter((q) => q.status === ContentStatus.PUBLISHED)
      .map((q) => ({
        id: q.id,
        questionType: q.questionType,
        promptText: q.promptText,
        contentPayload: q.contentPayload,
        explanation: q.explanation,
        orderIndex: q.orderIndex,
        hints: q.hints.map((h) => ({
          stepOrder: h.stepOrder,
          hintText: h.hintText,
        })),
      }));

    return {
      id: lesson.id,
      unitId: lesson.unitId,
      title: lesson.title,
      summary: lesson.summary,
      learningObjective: lesson.learningObjective,
      educationStage: lesson.educationStage,
      phase: lesson.phase,
      difficultyLevel: lesson.difficultyLevel,
      estimatedDurationMinutes: lesson.estimatedDurationMinutes,
      orderIndex: lesson.orderIndex,
      isLocked: false,
      isCompleted: completedIds.includes(lesson.id),
      questionItems: publishedQuestions,
    };
  }
}
