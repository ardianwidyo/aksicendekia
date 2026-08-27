import { LeaderboardRepository } from './leaderboard.repository';
import { AppError, ForbiddenError, NotFoundError } from '../../common/errors/app-error';

export class LeaderboardService {
  constructor(private repository: LeaderboardRepository) {}

  private getStartOfWeekDate(): Date {
    const now = new Date();
    const day = now.getUTCDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + diffToMonday);
    monday.setUTCHours(0, 0, 0, 0);
    return monday;
  }

  async getClassLeaderboard(
    classId: string,
    currentUserId: string,
    currentUserRole: string
  ) {
    const cls = await this.repository.findClassById(classId);
    if (!cls) {
      throw new NotFoundError('Kelas tidak ditemukan');
    }

    // Check authorization: Must be enrolled student, teacher, or linked parent
    if (currentUserRole === 'SISWA') {
      const isEnrolled = await this.repository.isStudentInClass(currentUserId, classId);
      if (!isEnrolled) {
        throw new ForbiddenError('FORBIDDEN_CLASS_ACCESS: Anda bukan anggota kelas ini');
      }
    } else if (currentUserRole === 'GURU') {
      const isTeacher = await this.repository.isTeacherOfClass(currentUserId, classId);
      if (!isTeacher) {
        throw new ForbiddenError('FORBIDDEN_CLASS_ACCESS: Anda bukan guru pengajar kelas ini');
      }
    }

    const weekStartDate = this.getStartOfWeekDate();
    const rawStudents = await this.repository.getClassStudentsWeeklyXp(classId, weekStartDate);

    // Sort students by weeklyXp DESC, then firstXpTimestamp ASC, then displayName ASC
    const sortedStudents = [...rawStudents].sort((a, b) => {
      if (b.weeklyXp !== a.weeklyXp) {
        return b.weeklyXp - a.weeklyXp;
      }
      if (a.firstXpTimestamp !== b.firstXpTimestamp) {
        return a.firstXpTimestamp - b.firstXpTimestamp;
      }
      return a.displayName.localeCompare(b.displayName);
    });

    const isTeacherAccess = currentUserRole === 'GURU';

    // Filter students for display
    const visibleStudents = sortedStudents.filter((s) => {
      if (isTeacherAccess) return true; // Teacher sees all
      // If student is hidden, only show if it's the current user themselves
      if (s.isHiddenFromLeaderboard) {
        return s.userId === currentUserId;
      }
      return true;
    });

    // Compute ranks for visible list
    const topStudentsWithRank = visibleStudents
      .filter((s) => !s.isHiddenFromLeaderboard || s.userId === currentUserId)
      .map((s, idx) => ({
        rank: idx + 1,
        displayName: s.displayName,
        avatarToken: s.avatarToken,
        weeklyXp: s.weeklyXp,
        userId: s.userId,
        isHidden: s.isHiddenFromLeaderboard
      }));

    // Find current user's pinned rank entry
    const myStudentRaw = sortedStudents.find((s) => s.userId === currentUserId);
    let myRank;
    if (myStudentRaw) {
      const myRankIndex = sortedStudents.findIndex((s) => s.userId === currentUserId);
      myRank = {
        rank: myRankIndex + 1,
        displayName: myStudentRaw.displayName,
        avatarToken: myStudentRaw.avatarToken,
        weeklyXp: myStudentRaw.weeklyXp,
        isHidden: myStudentRaw.isHiddenFromLeaderboard
      };
    }

    // Prepare Top 10 response without internal userId
    const top10 = topStudentsWithRank
      .filter((s) => !s.isHidden || s.userId === currentUserId)
      .slice(0, 10)
      .map(({ rank, displayName, avatarToken, weeklyXp }) => ({
        rank,
        displayName,
        avatarToken,
        weeklyXp
      }));

    return {
      classId: cls.id,
      className: cls.name,
      weekStartDate: weekStartDate.toISOString().split('T')[0],
      topStudents: top10,
      myRank
    };
  }

  async getStudentPrivacy(studentUserId: string) {
    const setting = await this.repository.getStudentPrivacySetting(studentUserId);
    return {
      studentUserId,
      isHiddenFromLeaderboard: setting?.isHiddenFromLeaderboard ?? false,
      isPrivacyLocked: setting?.isPrivacyLocked ?? false,
      updatedAt: setting?.updatedAt ? setting.updatedAt.toISOString() : new Date().toISOString()
    };
  }

  async updateStudentPrivacy(studentUserId: string, isHiddenFromLeaderboard: boolean) {
    const setting = await this.repository.getStudentPrivacySetting(studentUserId);

    if (setting?.isPrivacyLocked) {
      throw new AppError(
        'Pengaturan privasi telah dikunci oleh orang tua. Siswa tidak dapat mengubah status visibilitas.',
        403,
        'PRIVACY_SETTINGS_LOCKED_BY_PARENT'
      );
    }

    const updated = await this.repository.updateStudentPrivacySetting(studentUserId, {
      isHiddenFromLeaderboard
    });

    return {
      studentUserId: updated.studentUserId,
      isHiddenFromLeaderboard: updated.isHiddenFromLeaderboard,
      isPrivacyLocked: updated.isPrivacyLocked,
      updatedAt: updated.updatedAt.toISOString()
    };
  }

  async setParentPrivacyLock(
    parentId: string,
    studentUserId: string,
    isPrivacyLocked: boolean,
    overrideIsHiddenFromLeaderboard?: boolean
  ) {
    const isParent = await this.repository.isParentOfStudent(parentId, studentUserId);
    if (!isParent) {
      throw new ForbiddenError('FORBIDDEN_PARENT_ACCESS: Anda bukan orang tua terverifikasi dari siswa ini');
    }

    const updated = await this.repository.updateStudentPrivacySetting(studentUserId, {
      isPrivacyLocked,
      ...(overrideIsHiddenFromLeaderboard !== undefined && {
        isHiddenFromLeaderboard: overrideIsHiddenFromLeaderboard
      })
    });

    return {
      studentUserId: updated.studentUserId,
      isHiddenFromLeaderboard: updated.isHiddenFromLeaderboard,
      isPrivacyLocked: updated.isPrivacyLocked,
      updatedAt: updated.updatedAt.toISOString()
    };
  }
}
