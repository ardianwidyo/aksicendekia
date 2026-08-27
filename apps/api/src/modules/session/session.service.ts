import { randomUUID } from 'crypto';
import { SessionRepository } from './session.repository';
import { toClientQuestionDTO } from './session-mapper';
import { gradeQuestion } from './session-grader';
import { OutboxPublisher } from '../../common/events/outbox-publisher';
import { NotFoundError, ForbiddenError, ConflictError } from '../../common/errors/app-error';
import {
  AnswerEvaluationResultDTO,
  SessionSummaryDTO,
  SessionHistoryItemDTO
} from './session.dto';
import { PrismaClient } from '@prisma/client';

export class SessionService {
  constructor(
    private sessionRepo: SessionRepository,
    private prisma?: PrismaClient
  ) {}

  async createSession(studentId: string, lessonId: string) {
    const lesson = await this.sessionRepo.findLessonWithSubject(lessonId);

    if (!lesson) {
      throw new NotFoundError('Pelajaran tidak ditemukan');
    }

    if (lesson.status !== 'PUBLISHED') {
      throw new ForbiddenError('Hanya pelajaran terbit (PUBLISHED) yang dapat diakses');
    }

    // Check Parental Control Daily Time Limit
    if (this.prisma) {
      const parentalControl = await this.prisma.parentalControlSetting.findUnique({
        where: { studentUserId: studentId },
      });

      if (parentalControl && parentalControl.dailyTimeLimitMinutes !== null) {
        const progress = await this.prisma.studentProgress.findUnique({
          where: { studentId },
        });
        const timezoneStr = progress?.timezone || "Asia/Jakarta";
        const now = new Date();
        const todayStr = now.toLocaleDateString("en-CA", { timeZone: timezoneStr });
        const startOfToday = new Date(`${todayStr}T00:00:00.000Z`);

        const todaySessions = await this.prisma.learningSession.findMany({
          where: {
            studentId,
            startedAt: { gte: startOfToday },
          },
        });

        const todayTimeSpentSeconds = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
        const todayTimeSpentMinutes = Math.round(todayTimeSpentSeconds / 60);

        if (todayTimeSpentMinutes >= parentalControl.dailyTimeLimitMinutes) {
          throw new ForbiddenError(
            "Batas waktu belajar harian yang ditetapkan orang tua telah tercapai. Istirahatlah sejenak!",
            "DAILY_TIME_LIMIT_EXCEEDED"
          );
        }
      }
    }

    // Check prerequisites
    if (lesson.prerequisites && lesson.prerequisites.length > 0 && this.prisma) {
      const studentProfile = await this.prisma.studentProfile.findUnique({
        where: { userId: studentId }
      });

      if (studentProfile) {
        const completedPrereqs = await this.prisma.studentLessonProgress.count({
          where: {
            studentProfileId: studentProfile.id,
            lessonId: { in: lesson.prerequisites.map((p) => p.prerequisiteLessonId) },
            isCompleted: true
          }
        });

        if (completedPrereqs < lesson.prerequisites.length) {
          throw new ForbiddenError('Pelajaran ini masih terkunci karena prasyarat belum terpenuhi');
        }
      }
    }

    const questions = await this.sessionRepo.findPublishedQuestions(lessonId);
    if (!questions || questions.length === 0) {
      throw new ConflictError('Pelajaran ini belum memiliki butir soal terbit');
    }

    // Check for active non-expired session
    const existingActive = await this.sessionRepo.findActiveSession(studentId, lessonId);
    if (existingActive) {
      if (new Date() < existingActive.expiresAt) {
        return this.getActiveSession(studentId, existingActive.id);
      }
      // Stale session, will create new one
    }

    // Shuffle question orders
    const shuffledQuestions = [...questions].sort(() => 0.5 - Math.random());
    const questionOrders = shuffledQuestions.map((q, idx) => ({
      id: randomUUID(),
      questionId: q.id,
      sequenceOrder: idx
    }));

    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours

    const session = await this.sessionRepo.createLearningSession({
      id: sessionId,
      studentId,
      lessonId,
      totalQuestions: questions.length,
      expiresAt,
      questionOrders
    });

    // Write Outbox Event inside transaction if prisma available
    if (this.prisma) {
      await OutboxPublisher.publishEvent(this.prisma, {
        aggregateId: sessionId,
        eventType: 'learning.session.started',
        payload: {
          sessionId,
          studentId,
          lessonId,
          subjectId: lesson.unit.subject.id,
          totalQuestions: questions.length
        }
      });
    }

    const activeQuestion = shuffledQuestions[0];
    const currentQuestionDTO = toClientQuestionDTO(activeQuestion);

    return {
      sessionId: session.id,
      lessonId: session.lessonId,
      status: session.status,
      currentIndex: 0,
      totalQuestions: questions.length,
      expiresAt: session.expiresAt.toISOString(),
      currentQuestion: currentQuestionDTO
    };
  }

  async getActiveSession(studentId: string, sessionId: string) {
    const session = await this.sessionRepo.findSessionById(sessionId);

    if (!session) {
      throw new NotFoundError('Sesi belajar tidak ditemukan');
    }

    if (session.studentId !== studentId) {
      throw new ForbiddenError('Anda tidak memiliki akses ke sesi belajar ini');
    }

    // Check expiration
    if (new Date() > session.expiresAt && session.status !== 'COMPLETED') {
      if (session.status !== 'EXPIRED') {
        await this.sessionRepo.updateSessionStatus(sessionId, 'EXPIRED');
        if (this.prisma) {
          await OutboxPublisher.publishEvent(this.prisma, {
            aggregateId: sessionId,
            eventType: 'learning.session.expired',
            payload: {
              sessionId,
              studentId: session.studentId,
              lessonId: session.lessonId,
              lastActivityAt: session.lastActivityAt.toISOString()
            }
          });
        }
      }
      throw new ConflictError('Sesi telah kedaluwarsa setelah 24 jam tanpa aktivitas', 'SESSION_EXPIRED');
    }

    const activeOrder = session.questionOrders.find((o) => o.sequenceOrder === session.currentIndex);
    const activeQuestionDTO = activeOrder ? toClientQuestionDTO(activeOrder.question) : null;

    return {
      sessionId: session.id,
      lessonId: session.lessonId,
      status: session.status,
      currentIndex: session.currentIndex,
      totalQuestions: session.totalQuestions,
      correctCount: session.correctCount,
      currentQuestion: activeQuestionDTO
    };
  }

  async submitAnswer(
    studentId: string,
    sessionId: string,
    input: { questionId: string; answer: any; timeSpentSeconds: number },
    idempotencyKey: string
  ): Promise<AnswerEvaluationResultDTO> {
    // 1. Idempotency Check
    const existingAnswer = await this.sessionRepo.findExistingAnswerByIdempotencyKey(idempotencyKey);
    if (existingAnswer) {
      const { isCorrect, correctAnswerDetails } = gradeQuestion(
        existingAnswer.question.questionType,
        existingAnswer.question.contentPayload,
        existingAnswer.studentAnswer
      );
      const session = await this.sessionRepo.findSessionById(sessionId);
      return {
        sessionId,
        questionId: existingAnswer.questionId,
        isCorrect: existingAnswer.isCorrect,
        explanation: existingAnswer.question.explanation,
        correctAnswer: correctAnswerDetails,
        sessionProgress: {
          currentIndex: session?.currentIndex ?? 0,
          totalQuestions: session?.totalQuestions ?? 0,
          isCompleted: session?.status === 'COMPLETED'
        }
      };
    }

    const session = await this.sessionRepo.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError('Sesi belajar tidak ditemukan');
    }

    if (session.studentId !== studentId) {
      throw new ForbiddenError('Anda tidak memiliki akses ke sesi belajar ini');
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new ConflictError(`Sesi belajar tidak dapat menerima jawaban (status: ${session.status})`);
    }

    if (new Date() > session.expiresAt) {
      await this.sessionRepo.updateSessionStatus(sessionId, 'EXPIRED');
      throw new ConflictError('Sesi telah kedaluwarsa setelah 24 jam tanpa aktivitas', 'SESSION_EXPIRED');
    }

    const activeOrder = session.questionOrders.find((o) => o.sequenceOrder === session.currentIndex);
    if (!activeOrder || activeOrder.questionId !== input.questionId) {
      throw new ConflictError('Butir soal yang dijawab tidak sesuai dengan urutan aktif sesi saat ini');
    }

    const question = activeOrder.question;
    const { isCorrect, correctAnswerDetails } = gradeQuestion(
      question.questionType,
      question.contentPayload,
      input.answer
    );

    const newCorrectCount = session.correctCount + (isCorrect ? 1 : 0);
    const newIncorrectCount = session.incorrectCount + (isCorrect ? 0 : 1);
    const newCurrentIndex = session.currentIndex + 1;

    const { session: updatedSession } = await this.sessionRepo.recordAnswerAndUpdateSession({
      sessionId,
      questionId: input.questionId,
      studentAnswer: input.answer,
      isCorrect,
      hintUsedCount: 0,
      timeSpentSec: input.timeSpentSeconds,
      idempotencyKey,
      newCurrentIndex,
      correctCount: newCorrectCount,
      incorrectCount: newIncorrectCount,
      durationSeconds: input.timeSpentSeconds
    });

    // Write Outbox Event for Answered Question
    if (this.prisma) {
      await OutboxPublisher.publishEvent(this.prisma, {
        aggregateId: sessionId,
        eventType: 'learning.session.question_answered',
        payload: {
          sessionId,
          studentId,
          lessonId: session.lessonId,
          questionId: input.questionId,
          questionType: question.questionType,
          isCorrect,
          timeSpentSeconds: input.timeSpentSeconds,
          hintUsedCount: 0
        }
      });
    }

    const isCompleted = newCurrentIndex >= session.totalQuestions;

    return {
      sessionId,
      questionId: input.questionId,
      isCorrect,
      explanation: question.explanation,
      correctAnswer: correctAnswerDetails,
      sessionProgress: {
        currentIndex: newCurrentIndex,
        totalQuestions: session.totalQuestions,
        isCompleted
      }
    };
  }

  async getHint(studentId: string, sessionId: string, questionId: string) {
    const session = await this.sessionRepo.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError('Sesi belajar tidak ditemukan');
    }

    if (session.studentId !== studentId) {
      throw new ForbiddenError('Anda tidak memiliki akses ke sesi belajar ini');
    }

    const activeOrder = session.questionOrders.find((o) => o.questionId === questionId);
    if (!activeOrder) {
      throw new NotFoundError('Butir soal tidak ditemukan pada sesi ini');
    }

    const hints = activeOrder.question.hints || [];
    if (hints.length === 0) {
      throw new NotFoundError('Tidak ada petunjuk tersedia untuk soal ini');
    }

    // Currently returns first hint
    const firstHint = hints[0];
    return {
      questionId,
      hintTier: firstHint.stepOrder,
      hintText: firstHint.hintText,
      remainingHints: hints.length - 1
    };
  }

  async pauseSession(studentId: string, sessionId: string) {
    const session = await this.sessionRepo.findSessionById(sessionId);
    if (!session) throw new NotFoundError('Sesi belajar tidak ditemukan');
    if (session.studentId !== studentId) throw new ForbiddenError('Akses ditolak');

    const updated = await this.sessionRepo.updateSessionStatus(sessionId, 'PAUSED');
    return { sessionId, status: updated.status, updatedAt: updated.lastActivityAt.toISOString() };
  }

  async resumeSession(studentId: string, sessionId: string) {
    const session = await this.sessionRepo.findSessionById(sessionId);
    if (!session) throw new NotFoundError('Sesi belajar tidak ditemukan');
    if (session.studentId !== studentId) throw new ForbiddenError('Akses ditolak');

    if (new Date() > session.expiresAt) {
      await this.sessionRepo.updateSessionStatus(sessionId, 'EXPIRED');
      throw new ConflictError('Sesi telah kedaluwarsa setelah 24 jam tanpa aktivitas', 'SESSION_EXPIRED');
    }

    const updated = await this.sessionRepo.updateSessionStatus(sessionId, 'IN_PROGRESS');
    return { sessionId, status: updated.status, updatedAt: updated.lastActivityAt.toISOString() };
  }

  async completeSession(studentId: string, sessionId: string): Promise<SessionSummaryDTO> {
    const session = await this.sessionRepo.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundError('Sesi belajar tidak ditemukan');
    }

    if (session.studentId !== studentId) {
      throw new ForbiddenError('Anda tidak memiliki akses ke sesi belajar ini');
    }

    // Idempotent Completion Guard: If already completed, return cached summary
    if (session.status === 'COMPLETED') {
      return this.buildSessionSummaryDTO(session);
    }

    const percentageScore = Number(((session.correctCount / session.totalQuestions) * 100).toFixed(2));
    const completedAt = new Date();

    const updatedSession = await this.sessionRepo.updateSessionStatus(sessionId, 'COMPLETED', {
      score: percentageScore,
      completedAt
    });

    // Write Outbox Event for Session Completed
    if (this.prisma) {
      await OutboxPublisher.publishEvent(this.prisma, {
        aggregateId: sessionId,
        eventType: 'learning.session.completed',
        payload: {
          sessionId,
          studentId,
          lessonId: session.lessonId,
          subjectId: session.lesson.unit.subject.id,
          score: percentageScore,
          totalQuestions: session.totalQuestions,
          correctCount: session.correctCount,
          incorrectCount: session.incorrectCount,
          totalDurationSeconds: session.durationSeconds
        }
      });

      // Also record student lesson progress
      const studentProfile = await this.prisma.studentProfile.findUnique({
        where: { userId: studentId }
      });
      if (studentProfile) {
        await this.prisma.studentLessonProgress.upsert({
          where: {
            studentProfileId_lessonId: {
              studentProfileId: studentProfile.id,
              lessonId: session.lessonId
            }
          },
          create: {
            studentProfileId: studentProfile.id,
            lessonId: session.lessonId,
            isCompleted: true,
            completedAt
          },
          update: {
            isCompleted: true,
            completedAt
          }
        });

        // Also update matching lesson assignments for student
        const matchingAssignments = await this.prisma.lessonAssignment.findMany({
          where: { lessonId: session.lessonId }
        });

        for (const assign of matchingAssignments) {
          await this.prisma.studentAssignmentProgress.upsert({
            where: {
              assignmentId_studentUserId: {
                assignmentId: assign.id,
                studentUserId: studentId,
              },
            },
            create: {
              assignmentId: assign.id,
              studentUserId: studentId,
              status: "SUBMITTED",
              score: Math.round(percentageScore),
              accuracy: percentageScore,
              completedAt,
            },
            update: {
              status: "SUBMITTED",
              score: Math.round(percentageScore),
              accuracy: percentageScore,
              completedAt,
            },
          });
        }
      }
    }

    const reloadedSession = await this.sessionRepo.findSessionById(sessionId);
    return this.buildSessionSummaryDTO(reloadedSession || session);
  }

  async getStudentSessionHistory(
    studentId: string,
    page: number,
    limit: number
  ): Promise<{ data: SessionHistoryItemDTO[]; pagination: any }> {
    const { items, total } = await this.sessionRepo.getStudentSessions(studentId, page, limit);

    const data: SessionHistoryItemDTO[] = items.map((s) => ({
      sessionId: s.id,
      lessonTitle: s.lesson.title,
      subjectName: s.lesson.unit.subject.name,
      score: s.score ? Number(s.score) : null,
      status: s.status,
      completedAt: s.completedAt ? s.completedAt.toISOString() : null,
      durationSeconds: s.durationSeconds
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  private buildSessionSummaryDTO(session: any): SessionSummaryDTO {
    const incorrectAnswers = (session.answers || []).filter((a: any) => !a.isCorrect);

    const incorrectQuestionsSummary = incorrectAnswers.map((a: any) => {
      const { correctAnswerDetails } = gradeQuestion(
        a.question.questionType,
        a.question.contentPayload,
        a.studentAnswer
      );

      return {
        questionId: a.questionId,
        prompt: a.question.promptText,
        studentAnswer: a.studentAnswer,
        correctAnswer: correctAnswerDetails,
        explanation: a.question.explanation
      };
    });

    return {
      sessionId: session.id,
      lessonId: session.lessonId,
      status: session.status,
      score: session.score ? Number(session.score) : 0,
      totalQuestions: session.totalQuestions,
      correctCount: session.correctCount,
      incorrectCount: session.incorrectCount,
      durationSeconds: session.durationSeconds,
      completedAt: session.completedAt ? session.completedAt.toISOString() : null,
      incorrectQuestionsSummary
    };
  }
}
