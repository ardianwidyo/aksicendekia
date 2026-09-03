import { describe, it, expect, beforeEach } from "vitest";
import { EducationStage, CurriculumPhase, ContentStatus, DifficultyLevel, QuestionType, MatchingMode } from "@prisma/client";
import { createMockPrismaClient } from "../../../__tests__/mock-prisma.js";
import { CurriculumRepository } from "../curriculum.repository.js";
import { CurriculumService } from "../curriculum.service.js";
import { CsvImportService } from "../csv-import.service.js";
import { BadRequestError, NotFoundError, ConflictError } from "../../../common/errors/app-error.js";

describe("Curriculum Module (Feature 003)", () => {
  let mockPrisma: any;
  let repo: CurriculumRepository;
  let csvImportService: CsvImportService;
  let service: CurriculumService;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    repo = new CurriculumRepository(mockPrisma);
    csvImportService = new CsvImportService();
    service = new CurriculumService(repo, csvImportService);
  });

  describe("1. Hierarchy & Immutable Content Versioning", () => {
    it("harus membuat Mata Pelajaran baru dengan status DRAFT dan versi 1", async () => {
      const subject = await service.createSubject({
        code: "MATH_SD",
        name: "Matematika SD",
        educationStage: EducationStage.SD,
        phase: CurriculumPhase.FASE_B,
      });

      expect(subject.id).toBeDefined();
      expect(subject.code).toBe("MATH_SD");
      expect(subject.status).toBe(ContentStatus.DRAFT);
      expect(subject.version).toBe(1);
    });

    it("harus menolak pembuatan Mata Pelajaran dengan kode duplikat", async () => {
      await service.createSubject({
        code: "MATH_SD",
        name: "Matematika SD",
        educationStage: EducationStage.SD,
        phase: CurriculumPhase.FASE_B,
      });

      await expect(
        service.createSubject({
          code: "MATH_SD",
          name: "Matematika SD Lain",
          educationStage: EducationStage.SD,
          phase: CurriculumPhase.FASE_B,
        })
      ).rejects.toThrow(ConflictError);
    });

    it("harus membuat draf revisi baru (version + 1) saat mengedit Mata Pelajaran berstatus PUBLISHED", async () => {
      const original = await service.createSubject({
        code: "IPA_SMP",
        name: "IPA SMP",
        educationStage: EducationStage.SMP,
        phase: CurriculumPhase.FASE_D,
      });

      await service.updateSubjectStatus(original.id, ContentStatus.PUBLISHED);

      const revised = await service.updateSubject(original.id, {
        name: "IPA SMP Terpadu Revisi",
      });

      expect(revised.status).toBe(ContentStatus.DRAFT);
      expect(revised.version).toBe(2);
      expect(revised.name).toBe("IPA SMP Terpadu Revisi");
    });
  });

  describe("2. Prasyarat Pelajaran & Validasi DAG (Cycle Detection)", () => {
    it("harus mendeteksi dan menolak siklus dependensi prasyarat (circular dependency)", async () => {
      const subject = await service.createSubject({
        code: "PHYS_SMA",
        name: "Fisika SMA",
        educationStage: EducationStage.SMA,
        phase: CurriculumPhase.FASE_E,
      });

      const unit = await service.createUnit({
        subjectId: subject.id,
        title: "Unit Vektor",
        orderIndex: 1,
      });

      const lessonA = await service.createLesson({
        unitId: unit.id,
        title: "Pelajaran A",
        summary: "Ringkasan A",
        learningObjective: "Tujuan A",
        educationStage: EducationStage.SMA,
        phase: CurriculumPhase.FASE_E,
        difficultyLevel: DifficultyLevel.BEGINNER,
        estimatedDurationMinutes: 30,
        orderIndex: 1,
      });

      const lessonB = await service.createLesson({
        unitId: unit.id,
        title: "Pelajaran B",
        summary: "Ringkasan B",
        learningObjective: "Tujuan B",
        educationStage: EducationStage.SMA,
        phase: CurriculumPhase.FASE_E,
        difficultyLevel: DifficultyLevel.INTERMEDIATE,
        estimatedDurationMinutes: 40,
        orderIndex: 2,
        prerequisiteLessonIds: [lessonA.id], // B requires A
      });

      // Try setting A requires B -> Creates A -> B -> A cycle
      await expect(
        service.updateLesson(lessonA.id, { prerequisiteLessonIds: [lessonB.id] })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe("3. Impor Massal CSV & Laporan Error Terstruktur", () => {
    it("harus memproses impor CSV valid 500 baris dengan sukses", async () => {
      const subject = await service.createSubject({
        code: "MATH_SD",
        name: "Matematika SD",
        educationStage: EducationStage.SD,
        phase: CurriculumPhase.FASE_B,
      });
      const unit = await service.createUnit({ subjectId: subject.id, title: "Unit 1", orderIndex: 1 });
      const lesson = await service.createLesson({
        unitId: unit.id,
        title: "Pelajaran 1",
        summary: "Summary",
        learningObjective: "Objective",
        educationStage: EducationStage.SD,
        phase: CurriculumPhase.FASE_B,
        difficultyLevel: DifficultyLevel.BEGINNER,
        estimatedDurationMinutes: 30,
        orderIndex: 1,
      });

      // Generate 500 CSV rows
      let csvContent = "order_index,question_type,prompt_text,content_payload_json,explanation,hints_json\n";
      for (let i = 1; i <= 500; i++) {
        const payload = JSON.stringify({
          choices: [
            { id: "a", text: `Opsi A Soal ${i}`, isCorrect: true },
            { id: "b", text: `Opsi B Soal ${i}`, isCorrect: false },
          ],
        }).replace(/"/g, '""');
        const hints = JSON.stringify([{ stepOrder: 1, hintText: `Hint Soal ${i}` }]).replace(/"/g, '""');

        csvContent += `${i},MULTIPLE_CHOICE,"Soal Ke-${i}","${payload}","Pembahasan Soal ${i}","${hints}"\n`;
      }

      const report = await service.importQuestionsFromCsv(lesson.id, csvContent);

      expect(report.success).toBe(true);
      expect(report.totalRows).toBe(500);
      expect(report.passedRows).toBe(500);
      expect(report.failedRows).toBe(0);
      expect(report.createdCount).toBe(500);
    });

    it("harus mengembalikan laporan kesalahan presisi jika ada baris CSV tidak valid", async () => {
      const subject = await service.createSubject({
        code: "MATH_SD",
        name: "Matematika SD",
        educationStage: EducationStage.SD,
        phase: CurriculumPhase.FASE_B,
      });
      const unit = await service.createUnit({ subjectId: subject.id, title: "Unit 1", orderIndex: 1 });
      const lesson = await service.createLesson({
        unitId: unit.id,
        title: "Pelajaran 1",
        summary: "Summary",
        learningObjective: "Objective",
        educationStage: EducationStage.SD,
        phase: CurriculumPhase.FASE_B,
        difficultyLevel: DifficultyLevel.BEGINNER,
        estimatedDurationMinutes: 30,
        orderIndex: 1,
      });

      const csvContent =
        "order_index,question_type,prompt_text,content_payload_json,explanation,hints_json\n" +
        '1,INVALID_TYPE,"Soal 1","{}","Pembahasan","[]"\n' +
        '2,SHORT_ANSWER,"Soal 2","{}","Pembahasan","[]"\n';

      const report = await service.importQuestionsFromCsv(lesson.id, csvContent);

      expect(report.success).toBe(false);
      expect(report.totalRows).toBe(2);
      expect(report.failedRows).toBe(2);
      expect(report.errors.length).toBe(2);
      expect(report.errors[0].row).toBe(2); // Baris 2 (row 1 data)
      expect(report.errors[0].column).toBe("question_type");
    });
  });

  describe("4. API Baca Siswa & Proteksi Konten Non-PUBLISHED / Terkunci", () => {
    it("hanya mengembalikan Mata Pelajaran berstatus PUBLISHED untuk siswa", async () => {
      const s1 = await service.createSubject({ code: "MATH", name: "Matematika", educationStage: EducationStage.SD, phase: CurriculumPhase.FASE_B });
      const s2 = await service.createSubject({ code: "IPA", name: "IPA", educationStage: EducationStage.SD, phase: CurriculumPhase.FASE_B });

      await service.updateSubjectStatus(s1.id, ContentStatus.PUBLISHED);

      const subjects = await service.listSubjectsForStudent(EducationStage.SD);

      expect(subjects.length).toBe(1);
      expect(subjects[0].id).toBe(s1.id);
    });

    it("WAJIB membuang (strip) butir_soal jika pelajaran berstatus terkunci (isLocked = true)", async () => {
      const studentProfileId = "student-uuid-123";

      const subject = await service.createSubject({ code: "MATH", name: "Matematika", educationStage: EducationStage.SD, phase: CurriculumPhase.FASE_B });
      await service.updateSubjectStatus(subject.id, ContentStatus.PUBLISHED);

      const unit = await service.createUnit({ subjectId: subject.id, title: "Unit 1", orderIndex: 1 });
      await service.updateUnitStatus(unit.id, ContentStatus.PUBLISHED);

      const lesson1 = await service.createLesson({
        unitId: unit.id,
        title: "Pelajaran 1",
        summary: "Sum 1",
        learningObjective: "Obj 1",
        educationStage: EducationStage.SD,
        phase: CurriculumPhase.FASE_B,
        difficultyLevel: DifficultyLevel.BEGINNER,
        estimatedDurationMinutes: 30,
        orderIndex: 1,
      });
      await service.updateLessonStatus(lesson1.id, ContentStatus.PUBLISHED);

      const lesson2 = await service.createLesson({
        unitId: unit.id,
        title: "Pelajaran 2 (Terkunci)",
        summary: "Sum 2",
        learningObjective: "Obj 2",
        educationStage: EducationStage.SD,
        phase: CurriculumPhase.FASE_B,
        difficultyLevel: DifficultyLevel.INTERMEDIATE,
        estimatedDurationMinutes: 40,
        orderIndex: 2,
        prerequisiteLessonIds: [lesson1.id], // Requires Lesson 1
      });
      await service.updateLessonStatus(lesson2.id, ContentStatus.PUBLISHED);

      // Create PUBLISHED question in Lesson 2
      const q2 = await service.createQuestionItem({
        lessonId: lesson2.id,
        questionType: QuestionType.SHORT_ANSWER,
        promptText: "Soal Rahasia Pelajaran 2",
        explanation: "Pembahasan Rahasia",
        orderIndex: 1,
        hints: [{ stepOrder: 1, hintText: "Petunjuk Rahasia" }],
        shortAnswerPayload: { acceptedAnswers: ["Rahasia"], matchingMode: "NORMALIZED" as MatchingMode },
      });
      await service.updateQuestionItemStatus(q2.id, ContentStatus.PUBLISHED);

      // Fetch detail for student who has NOT completed Lesson 1
      const detailLocked = await service.getLessonDetailForStudent(studentProfileId, lesson2.id);

      expect(detailLocked.isLocked).toBe(true);
      expect(detailLocked.status).toBe("LOCKED");
      expect(detailLocked.questionItems).toEqual([]); // STRICTLY EMPTY! Zero leakage!

      // Now student completes Lesson 1
      await repo.markLessonCompleted(studentProfileId, lesson1.id);

      // Fetch detail again -> unlocked!
      const detailUnlocked = await service.getLessonDetailForStudent(studentProfileId, lesson2.id);

      expect(detailUnlocked.isLocked).toBe(false);
      expect(detailUnlocked.questionItems.length).toBe(1);
      expect(detailUnlocked.questionItems[0].promptText).toBe("Soal Rahasia Pelajaran 2");
    });
  });

  describe("5. Feature 010 — Tautan Capaian Pembelajaran (FR-008a, gate C3)", () => {
    it("membuat pelajaran dengan curriculumAchievementId tertaut", async () => {
      const achievement = await mockPrisma.curriculumAchievement.create({
        data: {
          educationStage: EducationStage.SD,
          phase: CurriculumPhase.FASE_B,
          subjectCode: "MATH_SD",
          element: "Bilangan",
          achievementText: "Kutipan",
          sourceDocument: "Dok",
          sourceUrl: "https://kurikulum.kemdikbud.go.id/x",
          retrievedAt: new Date(),
        },
      });
      const subject = await service.createSubject({
        code: "MATH_SD2",
        name: "Matematika SD",
        educationStage: EducationStage.SD,
        phase: CurriculumPhase.FASE_B,
      });
      const unit = await service.createUnit({ subjectId: subject.id, title: "Unit 1", orderIndex: 1 });

      const lesson = await service.createLesson({
        unitId: unit.id,
        title: "Pelajaran Bertaut CP",
        summary: "Ringkasan",
        learningObjective: "Tujuan",
        educationStage: EducationStage.SD,
        phase: CurriculumPhase.FASE_B,
        difficultyLevel: DifficultyLevel.BEGINNER,
        estimatedDurationMinutes: 20,
        orderIndex: 1,
        curriculumAchievementId: achievement.id,
      });

      const fetched = await service.getLesson(lesson.id);
      expect((fetched as any).curriculumAchievementId).toBe(achievement.id);
    });

    it("menautkan curriculumAchievementId lewat updateLesson pada pelajaran DRAFT", async () => {
      const achievement = await mockPrisma.curriculumAchievement.create({
        data: {
          educationStage: EducationStage.SD,
          phase: CurriculumPhase.FASE_B,
          subjectCode: "MATH_SD",
          element: "Aljabar",
          achievementText: "Kutipan lain",
          sourceDocument: "Dok",
          sourceUrl: "https://kurikulum.kemdikbud.go.id/y",
          retrievedAt: new Date(),
        },
      });
      const subject = await service.createSubject({
        code: "MATH_SD3",
        name: "Matematika SD",
        educationStage: EducationStage.SD,
        phase: CurriculumPhase.FASE_B,
      });
      const unit = await service.createUnit({ subjectId: subject.id, title: "Unit 1", orderIndex: 1 });
      const lesson = await service.createLesson({
        unitId: unit.id,
        title: "Pelajaran Tanpa CP",
        summary: "Ringkasan",
        learningObjective: "Tujuan",
        educationStage: EducationStage.SD,
        phase: CurriculumPhase.FASE_B,
        difficultyLevel: DifficultyLevel.BEGINNER,
        estimatedDurationMinutes: 20,
        orderIndex: 1,
      });

      const updated = await service.updateLesson(lesson.id, { curriculumAchievementId: achievement.id });
      expect((updated as any).curriculumAchievementId).toBe(achievement.id);
    });
  });
});

describe("Curriculum Coverage Report (Feature 011 / T078 / FR-011)", () => {
  let mockPrisma: any;
  let service: CurriculumService;

  const ELEMENTS: Record<string, string> = {
    bilangan: "cp-fase-a-matematika-bilangan",
    aljabar: "cp-fase-a-matematika-aljabar",
    pengukuran: "cp-fase-a-matematika-pengukuran",
    geometri: "cp-fase-a-matematika-geometri",
    data: "cp-fase-a-matematika-data-peluang",
  };

  async function seedLesson(gradeLevel: number, cpId: string, i: number, over: Record<string, unknown> = {}) {
    return mockPrisma.lesson.create({
      data: {
        title: `k${gradeLevel} lesson ${i}`,
        summary: "s",
        learningObjective: "lo",
        educationStage: EducationStage.SD,
        phase: CurriculumPhase.FASE_A,
        difficultyLevel: DifficultyLevel.BEGINNER,
        estimatedDurationMinutes: 12,
        orderIndex: i,
        status: ContentStatus.REVIEW,
        listing: "LISTED",
        gradeLevel,
        curriculumAchievementId: cpId,
        ...over,
      },
    });
  }

  /** Fill one grade with 10 LISTED lessons spanning all 5 elements. */
  async function seedFullGrade(gradeLevel: number) {
    const cps = Object.values(ELEMENTS);
    for (let i = 0; i < 10; i++) {
      await seedLesson(gradeLevel, cps[i % cps.length], i);
    }
  }

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    const repo = new CurriculumRepository(mockPrisma);
    service = new CurriculumService(repo, new CsvImportService());
  });

  it("returns a per-grade report for kelas 1-6", async () => {
    const report = await service.getCurriculumCoverage();
    expect(report.coverage.map((g) => g.gradeLevel)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("flags meetsMinimum: false with elementsMissing when a grade is empty", async () => {
    const report = await service.getCurriculumCoverage();
    const k1 = report.coverage.find((g) => g.gradeLevel === 1)!;
    expect(k1.lessonCount).toBe(0);
    expect(k1.meetsMinimum).toBe(false);
    expect(k1.elementsMissing).toEqual([
      "Bilangan",
      "Aljabar",
      "Pengukuran",
      "Geometri",
      "Analisis Data dan Peluang",
    ]);
    expect(report.overallMeetsMinimum).toBe(false);
  });

  it("reports meetsMinimum: true once a grade has >= 10 LISTED lessons covering all 5 elements", async () => {
    await seedFullGrade(3);
    const report = await service.getCurriculumCoverage();
    const k3 = report.coverage.find((g) => g.gradeLevel === 3)!;
    expect(k3.lessonCount).toBe(10);
    expect(k3.elementsMissing).toEqual([]);
    expect(k3.meetsMinimum).toBe(true);
  });

  it("does not count PUBLISHED-only... i.e. counts REVIEW lessons and ignores non-LISTED", async () => {
    await seedFullGrade(2);
    await seedLesson(2, ELEMENTS.bilangan, 99, { listing: "HIDDEN_LEGACY" });
    const report = await service.getCurriculumCoverage();
    const k2 = report.coverage.find((g) => g.gradeLevel === 2)!;
    expect(k2.lessonCount).toBe(10); // the HIDDEN_LEGACY one is excluded
  });

  it("still flags a grade with 10 lessons but a missing element", async () => {
    for (let i = 0; i < 10; i++) await seedLesson(4, ELEMENTS.bilangan, i);
    const report = await service.getCurriculumCoverage();
    const k4 = report.coverage.find((g) => g.gradeLevel === 4)!;
    expect(k4.lessonCount).toBe(10);
    expect(k4.elementsMissing).toContain("Geometri");
    expect(k4.meetsMinimum).toBe(false);
  });
});
