import { FastifyRequest, FastifyReply } from "fastify";
import { ForbiddenError } from "../common/errors/app-error.js";
import { Role, AccountStatus } from "@prisma/client";
import { TokenPayload } from "../types/fastify.js";

export async function consentGateHook(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const user = request.user as TokenPayload | undefined;
  if (!user) {
    return;
  }

  if (user.role === Role.SISWA && user.status === AccountStatus.PENDING_CONSENT) {
    throw new ForbiddenError(
      "Akun siswa di bawah 18 tahun belum memiliki persetujuan orang tua/wali yang aktif. Akses ke endpoint ini ditolak.",
      "CONSENT_REQUIRED"
    );
  }
}
