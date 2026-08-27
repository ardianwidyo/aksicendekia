import { ClassRepository } from "./class.repository.js";
import { StudentRepository } from "../student/student.repository.js";
import { Class, ClassEnrollment, EducationStage } from "@prisma/client";
import { NotFoundError, ConflictError } from "../../common/errors/app-error.js";
import { createHash } from "crypto";

export class ClassService {
  constructor(
    private classRepo: ClassRepository,
    private studentRepo: StudentRepository
  ) {}

  private generateClassCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "AKSI-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createClass(teacherId: string, name: string, educationStage: EducationStage): Promise<Class> {
    let classCode = this.generateClassCode();
    let existing = await this.classRepo.findByClassCode(classCode);
    while (existing) {
      classCode = this.generateClassCode();
      existing = await this.classRepo.findByClassCode(classCode);
    }

    return this.classRepo.createClass({
      teacherId,
      name,
      educationStage,
      classCode,
    });
  }

  async joinClass(studentUserId: string, classCode: string): Promise<ClassEnrollment> {
    const targetClass = await this.classRepo.findByClassCode(classCode.toUpperCase());
    if (!targetClass) {
      throw new NotFoundError("Kode kelas tidak ditemukan");
    }

    const studentProfile = await this.studentRepo.findByUserId(studentUserId);
    if (!studentProfile) {
      throw new NotFoundError("Profil siswa tidak ditemukan");
    }

    const existingEnrollment = await this.classRepo.findEnrollment(targetClass.id, studentProfile.id);
    if (existingEnrollment) {
      throw new ConflictError("Siswa sudah terdaftar di kelas ini");
    }

    return this.classRepo.enrollStudent(targetClass.id, studentProfile.id);
  }

  async getClassRoster(classId: string) {
    const targetClass = await this.classRepo.findById(classId);
    if (!targetClass) {
      throw new NotFoundError("Kelas tidak ditemukan");
    }
    return this.classRepo.getClassRoster(classId);
  }

  async getTeacherClasses(teacherId: string): Promise<Class[]> {
    return this.classRepo.findTeacherClasses(teacherId);
  }
}
