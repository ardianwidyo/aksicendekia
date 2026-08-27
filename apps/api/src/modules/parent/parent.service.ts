import { ParentRepository } from "./parent.repository.js";
import { AuthRepository } from "../auth/auth.repository.js";
import { StudentRepository } from "../student/student.repository.js";
import { Argon2Service } from "../auth/argon2.service.js";
import { Role, AccountStatus, VerificationMethod, StudentProfile, ParentChildLink, ParentalConsent } from "@prisma/client";
import { AddChildDTO } from "./parent.schema.js";
import { ConflictError, NotFoundError, AppError } from "../../common/errors/app-error.js";

type ParentLinkWithConsent = ParentChildLink & { consent?: ParentalConsent | null };

export class ParentService {
  constructor(
    private parentRepo: ParentRepository,
    private authRepo: AuthRepository,
    private studentRepo: StudentRepository,
    private argon2: Argon2Service
  ) {}

  async addChild(parentId: string, dto: AddChildDTO): Promise<{ childProfile: StudentProfile }> {
    const parentUser = await this.authRepo.findUserById(parentId);
    if (!parentUser || parentUser.role !== Role.ORANG_TUA) {
      throw new AppError("Akun orang tua/wali tidak valid");
    }

    const existingUser = await this.authRepo.findUserByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError("Email anak sudah terdaftar di sistem");
    }

    const passwordHash = await this.argon2.hashPassword(dto.password);

    // Create child user directly as ACTIVE since parent created it
    const childUser = await this.authRepo.createUser({
      email: dto.email,
      passwordHash,
      role: Role.SISWA,
      status: AccountStatus.ACTIVE,
    });

    const childProfile = await this.studentRepo.createStudentProfile({
      userId: childUser.id,
      displayName: dto.displayName,
      educationStage: dto.educationStage,
      gradeLevel: dto.gradeLevel,
      avatarId: dto.avatarId,
      birthDate: new Date(dto.birthDate),
    });

    const link = await this.parentRepo.createParentChildLink(parentId, childProfile.id);

    // Automatically record parental consent
    await this.parentRepo.recordConsent({
      linkId: link.id,
      parentUserId: parentId,
      verificationMethod: VerificationMethod.DIRECT_PARENT_DASHBOARD,
      consentVersion: "v1.0",
    });

    return { childProfile };
  }

  async approveConsent(
    parentUserId: string,
    studentProfileId: string,
    verificationMethod: VerificationMethod = VerificationMethod.EMAIL_LINK
  ): Promise<void> {
    const studentProfile = await this.studentRepo.findById(studentProfileId);
    if (!studentProfile) {
      throw new NotFoundError("Profil siswa tidak ditemukan");
    }

    let link: ParentLinkWithConsent | null = await this.parentRepo.findLink(parentUserId, studentProfile.id);
    if (!link) {
      const created = await this.parentRepo.createParentChildLink(parentUserId, studentProfile.id);
      link = { ...created, consent: null };
    }

    if (link.consent) {
      return; // Already consented
    }

    await this.parentRepo.recordConsent({
      linkId: link.id,
      parentUserId,
      verificationMethod,
      consentVersion: "v1.0",
    });

    // Activate student account
    await this.authRepo.updateUserStatus(studentProfile.userId, AccountStatus.ACTIVE);
  }

  async getChildren(parentId: string) {
    return this.parentRepo.findChildrenByParentId(parentId);
  }
}
