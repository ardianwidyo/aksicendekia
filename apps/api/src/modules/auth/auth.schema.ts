import { z } from "zod";
import { Role, EducationStage } from "@prisma/client";

export const RegisterUserSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.nativeEnum(Role, { errorMap: () => ({ message: "Peran pengguna tidak valid" }) }),
  // Fields required if registering as SISWA
  displayName: z.string().min(2, "Nama tampilan minimal 2 karakter").optional(),
  educationStage: z.nativeEnum(EducationStage).optional(),
  gradeLevel: z.number().int().min(1).max(12).optional(),
  avatarId: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  parentEmail: z.string().email().optional(),
});

export type RegisterUserDTO = z.infer<typeof RegisterUserSchema>;

export const LoginUserSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginUserDTO = z.infer<typeof LoginUserSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token pemulihan wajib diisi"),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
});

export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;
