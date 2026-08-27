import { z } from "zod";
import { EducationStage } from "@prisma/client";

export const UpdateStudentProfileSchema = z.object({
  displayName: z.string().min(2, "Nama tampilan minimal 2 karakter").optional(),
  educationStage: z.nativeEnum(EducationStage).optional(),
  gradeLevel: z.number().int().min(1).max(12).optional(),
  avatarId: z.string().optional(),
});

export type UpdateStudentProfileDTO = z.infer<typeof UpdateStudentProfileSchema>;

export const StudentProfileParamsSchema = z.object({
  studentId: z.string().uuid("ID siswa tidak valid"),
});

export type StudentProfileParamsDTO = z.infer<typeof StudentProfileParamsSchema>;
