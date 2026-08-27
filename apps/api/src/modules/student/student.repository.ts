import { PrismaClient, StudentProfile, EducationStage } from "@prisma/client";

export class StudentRepository {
  constructor(private prisma: PrismaClient) {}

  async createStudentProfile(data: {
    userId: string;
    displayName: string;
    educationStage: EducationStage;
    gradeLevel: number;
    avatarId: string;
    birthDate: Date;
  }): Promise<StudentProfile> {
    return this.prisma.studentProfile.create({
      data,
    });
  }

  async findByUserId(userId: string): Promise<StudentProfile | null> {
    return this.prisma.studentProfile.findUnique({
      where: { userId },
    });
  }

  async findById(id: string): Promise<StudentProfile | null> {
    return this.prisma.studentProfile.findUnique({
      where: { id },
    });
  }

  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      educationStage?: EducationStage;
      gradeLevel?: number;
      avatarId?: string;
    }
  ): Promise<StudentProfile> {
    return this.prisma.studentProfile.update({
      where: { userId },
      data,
    });
  }
}
