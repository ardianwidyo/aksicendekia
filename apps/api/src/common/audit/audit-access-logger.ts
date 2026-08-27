import { PrismaClient, Role, AccessType } from "@prisma/client";

export interface LogStudentAccessParams {
  accessorUserId: string;
  accessorRole: Role;
  targetStudentId: string;
  accessType: AccessType;
  endpoint: string;
  ipAddress: string;
  userAgent: string;
}

export async function logStudentAccess(prisma: PrismaClient, params: LogStudentAccessParams): Promise<void> {
  try {
    await prisma.studentDataAccessLog.create({
      data: {
        accessorUserId: params.accessorUserId,
        accessorRole: params.accessorRole,
        targetStudentId: params.targetStudentId,
        accessType: params.accessType,
        endpoint: params.endpoint,
        ipAddress: params.ipAddress || "127.0.0.1",
        userAgent: params.userAgent || "Unknown",
      },
    });
  } catch (error) {
    // Non-blocking catch to ensure system availability while logging failure details to console
    console.error("Failed to insert student data access log:", error);
  }
}
