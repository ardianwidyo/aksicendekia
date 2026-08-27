import { FastifyRequest, FastifyReply } from "fastify";
import { UnauthorizedError } from "../common/errors/app-error.js";
import { TokenPayload } from "../types/fastify.js";

export async function authenticateHook(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (err) {
    throw new UnauthorizedError("Sesi tidak valid atau telah kedaluwarsa");
  }

  const payload = request.user as TokenPayload;
  if (!payload || !payload.userId || !payload.role) {
    throw new UnauthorizedError("Payload token tidak valid");
  }
}
