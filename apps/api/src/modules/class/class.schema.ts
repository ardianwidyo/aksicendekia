import { z } from "zod";
import { EducationStage } from "@prisma/client";

export const CreateClassSchema = z.object({
  name: z.string().min(3, "Nama kelas minimal 3 karakter"),
  educationStage: z.nativeEnum(EducationStage, { errorMap: () => ({ message: "Jenjang kelas tidak valid" }) }),
});

export type CreateClassDTO = z.infer<typeof CreateClassSchema>;

export const JoinClassSchema = z.object({
  classCode: z.string().min(6).max(12, "Kode kelas tidak valid"),
});

export type JoinClassDTO = z.infer<typeof JoinClassSchema>;

export const ClassParamsSchema = z.object({
  classId: z.string().uuid("ID kelas tidak valid"),
});

export type ClassParamsDTO = z.infer<typeof ClassParamsSchema>;
