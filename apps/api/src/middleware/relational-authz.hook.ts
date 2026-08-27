import { FastifyRequest, FastifyReply, preHandlerHookHandler } from "fastify";
import { PrismaClient, Role, AccountStatus } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "../common/errors/app-error.js";
import { TokenPayload } from "../types/fastify.js";

export function createRelationalAuthzHook(
  prisma: PrismaClient,
  getStudentProfileId: (req: FastifyRequest) => string | undefined
): preHandlerHookHandler {
  return async function relationalAuthzHook(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const caller = request.user as TokenPayload | undefined;
    if (!caller) {
      throw new ForbiddenError("Otorisasi relasional membutuhkan identifikasi pemanggil");
    }

    // Admin has universal override
    if (caller.role === Role.ADMIN) {
      return;
    }

    const targetProfileId = getStudentProfileId(request);
    if (!targetProfileId) {
      throw new ForbiddenError("Parameter target siswa tidak ditemukan dalam request");
    }

    // Resolve student profile
    const studentProfile = await prisma.studentProfile.findFirst({
      where: {
        OR: [
          { id: targetProfileId },
          { userId: targetProfileId }
        ]
      }
    });

    if (!studentProfile) {
      throw new NotFoundError("Profil siswa tidak ditemukan");
    }

    // 1. Check if caller is student self
    if (caller.userId === studentProfile.userId) {
      if (caller.status === AccountStatus.PENDING_CONSENT) {
        throw new ForbiddenError("Akun siswa PENDING_CONSENT tidak dapat mengakses data sebelum disetujui wali", "CONSENT_REQUIRED");
      }
      return;
    }

    // 2. Check if caller is verified parent
    if (caller.role === Role.ORANG_TUA) {
      const parentLink = await prisma.parentChildLink.findUnique({
        where: {
          parentId_studentProfileId: {
            parentId: caller.userId,
            studentProfileId: studentProfile.id,
          },
        },
        include: {
          consent: true,
        },
      });

      if (parentLink && parentLink.consent) {
        return; // Verified parent with consent
      }
    }

    // 3. Check if caller is enrolled class teacher
    if (caller.role === Role.GURU) {
      const enrollment = await prisma.classEnrollment.findFirst({
        where: {
          studentProfileId: studentProfile.id,
          class: {
            teacherId: caller.userId,
          },
        },
      });

      if (enrollment) {
        return; // Enrolled class teacher
      }
    }

    // Default reject
    throw new ForbiddenError("Akses ditolak: Anda tidak memiliki hak otorisasi relasional ke data siswa ini");
  };
}
