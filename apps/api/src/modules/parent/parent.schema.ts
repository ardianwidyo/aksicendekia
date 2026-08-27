import { z } from "zod";
import { EducationStage } from "@prisma/client";

export const AddChildSchema = z.object({
  displayName: z.string().min(2, "Nama tampilan anak minimal 2 karakter"),
  email: z.string().email("Format email anak tidak valid"),
  password: z.string().min(8, "Password anak minimal 8 karakter"),
  educationStage: z.nativeEnum(EducationStage),
  gradeLevel: z.number().int().min(1).max(12),
  avatarId: z.string(),
  birthDate: z.string().datetime(),
});

export type AddChildDTO = z.infer<typeof AddChildSchema>;

export const ApproveConsentSchema = z.object({
  consentToken: z.string().optional(),
  otpCode: z.string().length(6, "Kode OTP harus 6 digit").optional(),
  studentProfileId: z.string().uuid("ID siswa tidak valid").optional(),
});

export type ApproveConsentDTO = z.infer<typeof ApproveConsentSchema>;
