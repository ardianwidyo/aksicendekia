import { PrismaClient } from '@prisma/client';
import { MissionMapNodeDTO, MissionMapResponseDTO } from './progress.dto';

export class MissionMapResolver {
  constructor(private prisma: PrismaClient) {}

  async resolveMissionMap(
    subjectId: string,
    studentUserId: string
  ): Promise<MissionMapResponseDTO> {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        units: {
          where: { status: 'PUBLISHED' },
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              where: { status: 'PUBLISHED' },
              orderBy: { orderIndex: 'asc' },
              include: {
                prerequisites: true
              }
            }
          }
        }
      }
    });

    if (!subject) {
      throw new Error(`Mata pelajaran dengan ID ${subjectId} tidak ditemukan`);
    }

    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId: studentUserId }
    });

    const lessonProgressRecords = studentProfile
      ? await this.prisma.studentLessonProgress.findMany({
          where: { studentProfileId: studentProfile.id }
        })
      : [];

    const progressMap = new Map(lessonProgressRecords.map((p) => [p.lessonId, p]));

    // Ratakan daftar pelajaran terurut
    const allLessons = subject.units.flatMap((unit) => unit.lessons);
    const completedLessonIds = new Set(
      lessonProgressRecords.filter((p) => p.isCompleted).map((p) => p.lessonId)
    );

    let hasCurrentNodeBeenAssigned = false;
    const nodes: MissionMapNodeDTO[] = [];
    let sequenceCounter = 1;

    for (const lesson of allLessons) {
      const isLessonCompleted = completedLessonIds.has(lesson.id);
      const progressRecord = progressMap.get(lesson.id);
      const prereqIds = lesson.prerequisites.map((p) => p.prerequisiteLessonId);

      let status: 'COMPLETED' | 'CURRENT' | 'UNLOCKED' | 'LOCKED';

      if (isLessonCompleted) {
        status = 'COMPLETED';
      } else {
        const allPrereqsMet = prereqIds.every((prereqId) => completedLessonIds.has(prereqId));
        if (!allPrereqsMet) {
          status = 'LOCKED';
        } else if (!hasCurrentNodeBeenAssigned) {
          status = 'CURRENT';
          hasCurrentNodeBeenAssigned = true;
        } else {
          status = 'UNLOCKED';
        }
      }

      nodes.push({
        lessonId: lesson.id,
        title: lesson.title,
        sequenceOrder: sequenceCounter++,
        status,
        bestScore: progressRecord?.bestScore ? Number(progressRecord.bestScore) : null,
        prerequisites: prereqIds
      });
    }

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      nodes
    };
  }
}
