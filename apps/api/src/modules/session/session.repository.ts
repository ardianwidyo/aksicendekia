import { PrismaClient, SessionStatus, Prisma } from '@prisma/client';

export class SessionRepository {
  constructor(private prisma: PrismaClient) {}

  async findLessonWithSubject(lessonId: string) {
    return this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        unit: {
          include: {
            subject: true
          }
        },
        prerequisites: true
      }
    });
  }

  async findPublishedQuestions(lessonId: string) {
    return this.prisma.questionItem.findMany({
      where: {
        lessonId,
        status: 'PUBLISHED'
      },
      include: {
        hints: {
          orderBy: { stepOrder: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });
  }

  async findSessionById(sessionId: string) {
    return this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: {
        lesson: {
          include: {
            unit: {
              include: {
                subject: true
              }
            }
          }
        },
        questionOrders: {
          orderBy: { sequenceOrder: 'asc' },
          include: {
            question: {
              include: {
                hints: { orderBy: { stepOrder: 'asc' } }
              }
            }
          }
        },
        answers: {
          include: {
            question: true
          }
        }
      }
    });
  }

  async findActiveSession(studentId: string, lessonId: string) {
    return this.prisma.learningSession.findFirst({
      where: {
        studentId,
        lessonId,
        status: { in: ['IN_PROGRESS', 'PAUSED'] }
      },
      orderBy: { startedAt: 'desc' }
    });
  }

  async createLearningSession(data: {
    id: string;
    studentId: string;
    lessonId: string;
    totalQuestions: number;
    expiresAt: Date;
    questionOrders: Array<{ id: string; questionId: string; sequenceOrder: number }>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.learningSession.create({
        data: {
          id: data.id,
          studentId: data.studentId,
          lessonId: data.lessonId,
          totalQuestions: data.totalQuestions,
          expiresAt: data.expiresAt,
          status: 'IN_PROGRESS',
          currentIndex: 0
        }
      });

      await tx.sessionQuestionOrder.createMany({
        data: data.questionOrders.map((o) => ({
          id: o.id,
          sessionId: session.id,
          questionId: o.questionId,
          sequenceOrder: o.sequenceOrder
        }))
      });

      return session;
    });
  }

  async findExistingAnswerByIdempotencyKey(idempotencyKey: string) {
    return this.prisma.sessionAnswer.findUnique({
      where: { idempotencyKey },
      include: { question: true }
    });
  }

  async findAnswerBySessionAndQuestion(sessionId: string, questionId: string) {
    return this.prisma.sessionAnswer.findUnique({
      where: {
        sessionId_questionId: { sessionId, questionId }
      },
      include: { question: true }
    });
  }

  async recordAnswerAndUpdateSession(data: {
    sessionId: string;
    questionId: string;
    studentAnswer: Prisma.InputJsonValue;
    isCorrect: boolean;
    hintUsedCount: number;
    timeSpentSec: number;
    idempotencyKey: string;
    newCurrentIndex: number;
    correctCount: number;
    incorrectCount: number;
    durationSeconds: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const answer = await tx.sessionAnswer.create({
        data: {
          sessionId: data.sessionId,
          questionId: data.questionId,
          studentAnswer: data.studentAnswer,
          isCorrect: data.isCorrect,
          hintUsedCount: data.hintUsedCount,
          timeSpentSec: data.timeSpentSec,
          idempotencyKey: data.idempotencyKey
        }
      });

      const updatedSession = await tx.learningSession.update({
        where: { id: data.sessionId },
        data: {
          currentIndex: data.newCurrentIndex,
          correctCount: data.correctCount,
          incorrectCount: data.incorrectCount,
          durationSeconds: { increment: data.timeSpentSec },
          lastActivityAt: new Date()
        }
      });

      return { answer, session: updatedSession };
    });
  }

  async updateSessionStatus(
    sessionId: string,
    status: SessionStatus,
    extraData?: { score?: number; completedAt?: Date }
  ) {
    return this.prisma.learningSession.update({
      where: { id: sessionId },
      data: {
        status,
        ...(extraData?.score !== undefined && { score: new Prisma.Decimal(extraData.score) }),
        ...(extraData?.completedAt !== undefined && { completedAt: extraData.completedAt }),
        lastActivityAt: new Date()
      }
    });
  }

  async getStudentSessions(studentId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.learningSession.findMany({
        where: { studentId },
        include: {
          lesson: {
            include: {
              unit: {
                include: { subject: true }
              }
            }
          }
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.learningSession.count({
        where: { studentId }
      })
    ]);

    return { items, total };
  }

  async findStaleExpiredSessions() {
    return this.prisma.learningSession.findMany({
      where: {
        status: { in: ['IN_PROGRESS', 'PAUSED'] },
        expiresAt: { lt: new Date() }
      }
    });
  }

  async bulkMarkExpired(sessionIds: string[]) {
    if (sessionIds.length === 0) return;
    await this.prisma.learningSession.updateMany({
      where: { id: { in: sessionIds } },
      data: { status: 'EXPIRED' }
    });
  }
}
