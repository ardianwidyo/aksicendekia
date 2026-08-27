import { PrismaClient, Class, ClassEnrollment, EducationStage } from "@prisma/client";

export class ClassRepository {
  constructor(private prisma: PrismaClient) {}

  async createClass(data: {
    teacherId: string;
    name: string;
    educationStage: EducationStage;
    classCode: string;
  }): Promise<Class> {
    return this.prisma.class.create({
      data,
    });
  }

  async findByClassCode(classCode: string): Promise<Class | null> {
    return this.prisma.class.findUnique({
      where: { classCode },
    });
  }

  async findById(id: string): Promise<Class | null> {
    return this.prisma.class.findUnique({
      where: { id },
    });
  }

  async enrollStudent(classId: string, studentProfileId: string): Promise<ClassEnrollment> {
    return this.prisma.classEnrollment.create({
      data: {
        classId,
        studentProfileId,
      },
    });
  }

  async findEnrollment(classId: string, studentProfileId: string): Promise<ClassEnrollment | null> {
    return this.prisma.classEnrollment.findUnique({
      where: {
        classId_studentProfileId: {
          classId,
          studentProfileId,
        },
      },
    });
  }

  async getClassRoster(classId: string) {
    return this.prisma.classEnrollment.findMany({
      where: { classId },
      include: {
        studentProfile: true,
      },
    });
  }

  async findTeacherClasses(teacherId: string): Promise<Class[]> {
    return this.prisma.class.findMany({
      where: { teacherId },
    });
  }
}
