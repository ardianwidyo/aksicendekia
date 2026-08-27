import { Role, AccountStatus } from "@prisma/client";

export interface TokenPayload {
  userId: string;
  role: Role;
  status: AccountStatus;
  familyId?: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user: TokenPayload;
  }
}
