import { StudentRepository } from "./student.repository.js";
import { StudentProfile } from "@prisma/client";
import { NotFoundError } from "../../common/errors/app-error.js";
import { UpdateStudentProfileDTO } from "./student.schema.js";

export class StudentService {
  constructor(private studentRepo: StudentRepository) {}

  async getProfileByUserId(userId: string): Promise<StudentProfile> {
    const profile = await this.studentRepo.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError("Profil siswa tidak ditemukan");
    }
    return profile;
  }

  async getProfileById(id: string): Promise<StudentProfile> {
    const profile = await this.studentRepo.findById(id);
    if (!profile) {
      throw new NotFoundError("Profil siswa tidak ditemukan");
    }
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateStudentProfileDTO): Promise<StudentProfile> {
    return this.studentRepo.updateProfile(userId, dto);
  }
}
