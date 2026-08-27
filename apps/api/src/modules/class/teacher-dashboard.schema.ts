import { z } from "zod";

export const CreateAssignmentSchema = z.object({
  classId: z.string().uuid({ message: "ID kelas harus berupa UUID valid" }),
  lessonId: z.string().uuid({ message: "ID pelajaran harus berupa UUID valid" }),
  title: z.string().min(3, { message: "Judul penugasan minimal 3 karakter" }),
  description: z.string().optional(),
  dueDate: z.string().datetime({ message: "Tenggat waktu harus dalam format ISO datetime valid" }),
});

export type CreateAssignmentDTO = z.infer<typeof CreateAssignmentSchema>;
