import { PrismaClient } from '@prisma/client';

export class LeaderboardRepository {
  constructor(private prisma: PrismaClient) {}

  async findClassById(classId: string) {
    return this.prisma.class.findUnique({
      where: { id: classId }
    });
  }

  async isStudentInClass(userId: string, classId: string): Promise<boolean> {
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId }
    });

    if (!studentProfile) {
      return false;
    }

    const enrollment = await this.prisma.classEnrollment.findUnique({
      where: {
        classId_studentProfileId: {
          classId,
          studentProfileId: studentProfile.id
        }
      }
    });

    return !!enrollment;
  }

  async isTeacherOfClass(userId: string, classId: string): Promise<boolean> {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId }
    });
    return cls?.teacherId === userId;
  }

  async isParentOfStudent(parentId: string, studentUserId: string): Promise<boolean> {
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId: studentUserId }
    });

    if (!studentProfile) return false;

    const link = await this.prisma.parentChildLink.findUnique({
      where: {
        parentId_studentProfileId: {
          parentId,
          studentProfileId: studentProfile.id
        }
      }
    });

    return !!link;
  }

  async getClassStudentsWeeklyXp(classId: string, weekStartDate: Date) {
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { classId },
      include: {
        studentProfile: {
          include: {
            user: {
              include: {
                studentPrivacySetting: true,
                xpTransactions: {
                  where: {
                    createdAt: {
                      gte: weekStartDate
                    }
                  },
                  orderBy: {
                    createdAt: 'asc'
                  }
                }
              }
            }
          }
        }
      }
    });

    return enrollments.map((e) => {
      const user = e.studentProfile.user;
      const privacy = user.studentPrivacySetting;
      const xpTx = user.xpTransactions || [];

      const weeklyXp = xpTx.reduce((sum, tx) => sum + tx.amount, 0);
      const firstXpTimestamp = xpTx.length > 0 ? xpTx[0].createdAt.getTime() : Infinity;

      return {
        userId: user.id,
        displayName: e.studentProfile.displayName,
        avatarToken: e.studentProfile.avatarId,
        weeklyXp,
        firstXpTimestamp,
        isHiddenFromLeaderboard: privacy?.isHiddenFromLeaderboard ?? false,
        isPrivacyLocked: privacy?.isPrivacyLocked ?? false
      };
    });
  }

  async getStudentPrivacySetting(studentUserId: string) {
    return this.prisma.studentPrivacySetting.findUnique({
      where: { studentUserId }
    });
  }

  async updateStudentPrivacySetting(
    studentUserId: string,
    data: { isHiddenFromLeaderboard?: boolean; isPrivacyLocked?: boolean }
  ) {
    return this.prisma.studentPrivacySetting.upsert({
      where: { studentUserId },
      create: {
        studentUserId,
        isHiddenFromLeaderboard: data.isHiddenFromLeaderboard ?? false,
        isPrivacyLocked: data.isPrivacyLocked ?? false
      },
      update: {
        ...(data.isHiddenFromLeaderboard !== undefined && {
          isHiddenFromLeaderboard: data.isHiddenFromLeaderboard
        }),
        ...(data.isPrivacyLocked !== undefined && {
          isPrivacyLocked: data.isPrivacyLocked
        })
      }
    });
  }
}
