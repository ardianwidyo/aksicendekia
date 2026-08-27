import { Role, AccountStatus, User, RefreshToken } from "@prisma/client";
import { AuthRepository } from "./auth.repository.js";
import { StudentRepository } from "../student/student.repository.js";
import { ParentRepository } from "../parent/parent.repository.js";
import { Argon2Service } from "./argon2.service.js";
import { IEmailService } from "../../common/email/email.interface.js";
import { RegisterUserDTO, LoginUserDTO } from "./auth.schema.js";
import { AppError, ConflictError, UnauthorizedError } from "../../common/errors/app-error.js";
import { cryptoHash, generateUUID, calculateAge } from "../../common/utils/crypto.js";

export class AuthService {
  constructor(
    private authRepo: AuthRepository,
    private studentRepo: StudentRepository,
    private parentRepo: ParentRepository,
    private argon2: Argon2Service,
    private emailService: IEmailService
  ) {}

  async register(dto: RegisterUserDTO): Promise<{ user: User; requiresConsent: boolean }> {
    const existing = await this.authRepo.findUserByEmail(dto.email);
    if (existing) {
      throw new ConflictError("Email sudah terdaftar di sistem");
    }

    const passwordHash = await this.argon2.hashPassword(dto.password);
    let initialStatus: AccountStatus = AccountStatus.ACTIVE;
    let requiresConsent = false;

    if (dto.role === Role.SISWA) {
      if (!dto.displayName || !dto.educationStage || !dto.gradeLevel || !dto.avatarId || !dto.birthDate) {
        throw new AppError("Data profil siswa tidak lengkap");
      }

      const birthDate = new Date(dto.birthDate);
      const age = calculateAge(birthDate);

      if (age < 18) {
        initialStatus = AccountStatus.PENDING_CONSENT;
        requiresConsent = true;
      }
    }

    const user = await this.authRepo.createUser({
      email: dto.email,
      passwordHash,
      role: dto.role,
      status: initialStatus,
    });

    if (dto.role === Role.SISWA && dto.displayName && dto.educationStage && dto.gradeLevel && dto.avatarId && dto.birthDate) {
      const studentProfile = await this.studentRepo.createStudentProfile({
        userId: user.id,
        displayName: dto.displayName,
        educationStage: dto.educationStage,
        gradeLevel: dto.gradeLevel,
        avatarId: dto.avatarId,
        birthDate: new Date(dto.birthDate),
      });

      if (requiresConsent && dto.parentEmail) {
        const parentUser = await this.authRepo.findUserByEmail(dto.parentEmail);
        if (parentUser) {
          await this.parentRepo.createParentChildLink(parentUser.id, studentProfile.id);
        }

        await this.emailService.sendParentConsentEmail({
          toEmail: dto.parentEmail,
          studentDisplayName: dto.displayName,
          consentLink: `http://localhost:3000/parent/consent/${studentProfile.id}`,
          otpCode: "123456",
        });
      }
    }

    return { user, requiresConsent };
  }

  async login(dto: LoginUserDTO): Promise<{ user: User }> {
    const user = await this.authRepo.findUserByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError("Kombinasi email atau password salah");
    }

    const isValid = await this.argon2.verifyPassword(user.passwordHash, dto.password);
    if (!isValid) {
      throw new UnauthorizedError("Kombinasi email atau password salah");
    }

    return { user };
  }

  async createInitialRefreshToken(userId: string, refreshTokenPlain: string, familyId: string): Promise<RefreshToken> {
    const tokenHash = cryptoHash(refreshTokenPlain);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return this.authRepo.createRefreshToken({
      userId,
      tokenHash,
      familyId,
      expiresAt,
    });
  }

  async handleRefreshTokenRotation(refreshTokenPlain: string): Promise<{
    userId: string;
    familyId: string;
    newTokenPlain: string;
  }> {
    const tokenHash = cryptoHash(refreshTokenPlain);
    const existing = await this.authRepo.findRefreshToken(tokenHash);

    if (!existing) {
      throw new UnauthorizedError("Refresh token tidak dikenali");
    }

    // Reuse detection
    if (existing.isRevoked) {
      await this.authRepo.revokeRefreshTokenFamily(existing.familyId);
      throw new UnauthorizedError(
        "Deteksi penggunaan ulang refresh token! Seluruh sesi aktif telah dibatalkan demi keamanan.",
        "TOKEN_REUSE_DETECTED"
      );
    }

    if (new Date() > existing.expiresAt) {
      await this.authRepo.revokeRefreshToken(existing.id);
      throw new UnauthorizedError("Refresh token telah kedaluwarsa");
    }

    // Revoke current token
    await this.authRepo.revokeRefreshToken(existing.id);

    // Issue new token in same family
    const newTokenPlain = generateUUID();
    const newTokenHash = cryptoHash(newTokenPlain);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.authRepo.createRefreshToken({
      userId: existing.userId,
      tokenHash: newTokenHash,
      familyId: existing.familyId,
      expiresAt,
    });

    return {
      userId: existing.userId,
      familyId: existing.familyId,
      newTokenPlain,
    };
  }
}
