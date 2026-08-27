import { PrismaClient, Role, RiskReason } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "../../common/errors/app-error.js";
import { CreateAssignmentDTO } from "./teacher-dashboard.schema.js";

function sanitizeCsvValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`; // Sanitize formula injection
  }
  return str;
}

export class TeacherDashboardService {
  constructor(private prisma: PrismaClient) {}

  private async verifyTeacherClassOwnership(teacherUserId: string, classId: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!cls) {
      throw new NotFoundError("Kelas tidak ditemukan");
    }

    if (cls.teacherId !== teacherUserId) {
      throw new ForbiddenError(
        "Akses ditolak: Anda tidak memiliki wewenang atas kelas ini",
        "FORBIDDEN_TEACHER_CLASS_REQUIRED"
      );
    }

    return cls;
  }

  async getTeacherClasses(teacherUserId: string) {
    const classes = await this.prisma.class.findMany({
      where: { teacherId: teacherUserId },
      include: {
        enrollments: true,
        assignments: true,
      },
      orderBy: { name: "asc" },
    });

    return classes.map((c) => ({
      classId: c.id,
      className: c.name,
      educationStage: c.educationStage,
      classCode: c.classCode,
      studentCount: c.enrollments.length,
      assignmentCount: c.assignments.length,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  async getClassStudentProgress(teacherUserId: string, classId: string) {
    await this.verifyTeacherClassOwnership(teacherUserId, classId);

    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { classId },
      include: {
        studentProfile: {
          include: {
            user: true,
            lessonProgress: true,
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return [];
    }

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Calculate class 14-day activity average
    const studentUserIds = enrollments.map((e) => e.studentProfile.userId);

    const recentSessions = await this.prisma.learningSession.findMany({
      where: {
        studentId: { in: studentUserIds },
        startedAt: { gte: fourteenDaysAgo },
      },
    });

    const studentActivitySeconds: Record<string, number> = {};
    for (const id of studentUserIds) {
      studentActivitySeconds[id] = 0;
    }
    for (const session of recentSessions) {
      studentActivitySeconds[session.studentId] =
        (studentActivitySeconds[session.studentId] || 0) + session.durationSeconds;
    }

    const totalClassSeconds = Object.values(studentActivitySeconds).reduce((a, b) => a + b, 0);
    const classAvgActivitySeconds = enrollments.length > 0 ? totalClassSeconds / enrollments.length : 0;

    // Overdue assignments per student
    const overdueAssignments = await this.prisma.studentAssignmentProgress.findMany({
      where: {
        studentUserId: { in: studentUserIds },
        status: "OVERDUE",
      },
    });

    const overdueCountMap: Record<string, number> = {};
    for (const oa of overdueAssignments) {
      overdueCountMap[oa.studentUserId] = (overdueCountMap[oa.studentUserId] || 0) + 1;
    }

    // Build progress per student
    const result = [];

    for (const env of enrollments) {
      const sp = env.studentProfile;
      const sUserId = sp.userId;

      // 5 recent sessions for accuracy calculation
      const last5Sessions = await this.prisma.learningSession.findMany({
        where: {
          studentId: sUserId,
          status: "COMPLETED",
        },
        orderBy: { completedAt: "desc" },
        take: 5,
      });

      let averageAccuracy = 0;
      if (last5Sessions.length > 0) {
        const scores = last5Sessions.map((s) => (s.score ? Number(s.score) : 0));
        averageAccuracy = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
      }

      const totalLearningMinutes = Math.round((studentActivitySeconds[sUserId] || 0) / 60);
      const completedLessons = sp.lessonProgress.filter((p) => p.isCompleted).length;

      // Behind Student Risk Assessment Algorithm
      const riskReasons: RiskReason[] = [];
      if (last5Sessions.length > 0 && averageAccuracy < 60) {
        riskReasons.push("LOW_ACCURACY");
      }
      if (
        classAvgActivitySeconds > 0 &&
        (studentActivitySeconds[sUserId] || 0) < 0.3 * classAvgActivitySeconds
      ) {
        riskReasons.push("LOW_ACTIVITY");
      }
      if ((overdueCountMap[sUserId] || 0) > 0) {
        riskReasons.push("OVERDUE_ASSIGNMENT");
      }

      const riskStatus = riskReasons.length > 0 ? "BEHIND" : "ON_TRACK";
      const lastActiveAt =
        last5Sessions.length > 0 && last5Sessions[0].completedAt
          ? last5Sessions[0].completedAt.toISOString()
          : null;

      result.push({
        studentId: sUserId,
        studentProfileId: sp.id,
        displayName: sp.displayName,
        avatarId: sp.avatarId,
        educationStage: sp.educationStage,
        gradeLevel: sp.gradeLevel,
        totalLearningMinutes,
        lessonsCompleted: completedLessons,
        averageAccuracy,
        riskStatus,
        riskReasons,
        lastActiveAt,
      });
    }

    return result;
  }

  async getItemAccuracyAnalysis(teacherUserId: string, classId: string, lessonId?: string) {
    await this.verifyTeacherClassOwnership(teacherUserId, classId);

    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { classId },
      select: { studentProfile: { select: { userId: true } } },
    });

    const studentUserIds = enrollments.map((e) => e.studentProfile.userId);
    if (studentUserIds.length === 0) {
      return [];
    }

    const sessionAnswers = await this.prisma.sessionAnswer.findMany({
      where: {
        session: {
          studentId: { in: studentUserIds },
          ...(lessonId ? { lessonId } : {}),
        },
      },
      include: {
        question: {
          include: {
            lesson: {
              include: {
                unit: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const questionStatsMap: Record<
      string,
      {
        questionId: string;
        promptText: string;
        lessonTitle: string;
        subjectName: string;
        totalAttempts: number;
        correctAttempts: number;
        wrongAttempts: number;
      }
    > = {};

    for (const ans of sessionAnswers) {
      const q = ans.question;
      if (!questionStatsMap[q.id]) {
        questionStatsMap[q.id] = {
          questionId: q.id,
          promptText: q.promptText,
          lessonTitle: q.lesson.title,
          subjectName: q.lesson.unit.subject.name,
          totalAttempts: 0,
          correctAttempts: 0,
          wrongAttempts: 0,
        };
      }

      questionStatsMap[q.id].totalAttempts += 1;
      if (ans.isCorrect) {
        questionStatsMap[q.id].correctAttempts += 1;
      } else {
        questionStatsMap[q.id].wrongAttempts += 1;
      }
    }

    const items = Object.values(questionStatsMap).map((item) => ({
      questionId: item.questionId,
      questionTextSnippet:
        item.promptText.length > 80 ? item.promptText.substring(0, 80) + "..." : item.promptText,
      lessonTitle: item.lessonTitle,
      subjectName: item.subjectName,
      totalAttempts: item.totalAttempts,
      correctAttempts: item.correctAttempts,
      wrongAttempts: item.wrongAttempts,
      accuracyRate: Math.round((item.correctAttempts / (item.totalAttempts || 1)) * 1000) / 10,
    }));

    // Sort by lowest accuracy rate (highest error rate) descending
    items.sort((a, b) => a.accuracyRate - b.accuracyRate);

    return items;
  }

  async createAssignment(teacherUserId: string, dto: CreateAssignmentDTO) {
    await this.verifyTeacherClassOwnership(teacherUserId, dto.classId);

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
    });

    if (!lesson) {
      throw new NotFoundError("Pelajaran yang akan ditugaskan tidak ditemukan");
    }

    const assignment = await this.prisma.lessonAssignment.create({
      data: {
        classId: dto.classId,
        teacherUserId,
        lessonId: dto.lessonId,
        title: dto.title,
        description: dto.description || null,
        dueDate: new Date(dto.dueDate),
      },
    });

    // Populate initial progress for all currently enrolled students
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { classId: dto.classId },
      include: { studentProfile: true },
    });

    if (enrollments.length > 0) {
      await this.prisma.studentAssignmentProgress.createMany({
        data: enrollments.map((env) => ({
          assignmentId: assignment.id,
          studentUserId: env.studentProfile.userId,
          status: "NOT_STARTED",
        })),
        skipDuplicates: true,
      });
    }

    return assignment;
  }

  async getAssignmentProgress(teacherUserId: string, assignmentId: string) {
    const assignment = await this.prisma.lessonAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        lesson: true,
        studentProgresses: {
          include: {
            studentUser: {
              include: {
                studentProfile: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError("Penugasan tidak ditemukan");
    }

    await this.verifyTeacherClassOwnership(teacherUserId, assignment.classId);

    const now = new Date();

    const students = assignment.studentProgresses.map((sp) => {
      let status = sp.status;
      if (status !== "SUBMITTED" && now > assignment.dueDate) {
        status = "OVERDUE";
      }

      return {
        studentId: sp.studentUserId,
        displayName: sp.studentUser.studentProfile?.displayName || "Siswa",
        status,
        score: sp.score ?? 0,
        accuracy: sp.accuracy ?? 0,
        completedAt: sp.completedAt ? sp.completedAt.toISOString() : undefined,
      };
    });

    const completedCount = students.filter((s) => s.status === "SUBMITTED").length;
    const inProgressCount = students.filter((s) => s.status === "IN_PROGRESS").length;
    const overdueCount = students.filter((s) => s.status === "OVERDUE").length;

    const scores = students.filter((s) => s.score !== undefined).map((s) => s.score || 0);
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return {
      assignmentId: assignment.id,
      title: assignment.title,
      lessonTitle: assignment.lesson.title,
      dueDate: assignment.dueDate.toISOString(),
      totalStudents: students.length,
      completedCount,
      inProgressCount,
      overdueCount,
      averageScore,
      students,
    };
  }

  async exportClassCsv(teacherUserId: string, classId: string): Promise<string> {
    const cls = await this.verifyTeacherClassOwnership(teacherUserId, classId);
    const students = await this.getClassStudentProgress(teacherUserId, classId);

    const headers = [
      "ID Siswa",
      "Nama Tampilan",
      "Jenjang",
      "Kelas",
      "Sesi Selesai",
      "Waktu Belajar (Menit)",
      "Akurasi Rata-rata (%)",
      "Status Risiko",
      "Alasan Risiko",
      "Aktivitas Terakhir",
    ];

    const rows = [headers.join(",")];

    for (const s of students) {
      const row = [
        sanitizeCsvValue(s.studentId),
        sanitizeCsvValue(s.displayName),
        sanitizeCsvValue(s.educationStage),
        sanitizeCsvValue(s.gradeLevel),
        sanitizeCsvValue(s.lessonsCompleted),
        sanitizeCsvValue(s.totalLearningMinutes),
        sanitizeCsvValue(s.averageAccuracy),
        sanitizeCsvValue(s.riskStatus === "BEHIND" ? "Perlu Pendampingan" : "Lancar"),
        sanitizeCsvValue(s.riskReasons.join("; ") || "-"),
        sanitizeCsvValue(s.lastActiveAt || "-"),
      ];
      rows.push(row.join(","));
    }

    return rows.join("\n");
  }
}
