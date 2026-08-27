import { PrismaClient, Role, AccountStatus, EducationStage, VerificationMethod, User, StudentProfile, ParentChildLink, ParentalConsent, Class, ClassEnrollment, RefreshToken } from "@prisma/client";
import { randomUUID } from "crypto";

export function createMockPrismaClient(): PrismaClient {
  const users: User[] = [];
  const studentProfiles: StudentProfile[] = [];
  const parentChildLinks: ParentChildLink[] = [];
  const parentalConsents: ParentalConsent[] = [];
  const classes: Class[] = [];
  const classEnrollments: ClassEnrollment[] = [];
  const refreshTokens: RefreshToken[] = [];

  const mockPrisma = {
    user: {
      findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id) return users.find((u) => u.id === where.id) || null;
        if (where.email) return users.find((u) => u.email === where.email?.toLowerCase()) || null;
        return null;
      },
      findFirst: async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id) return users.find((u) => u.id === where.id) || null;
        if (where.email) return users.find((u) => u.email === where.email?.toLowerCase()) || null;
        return null;
      },
      create: async ({ data }: { data: { email: string; passwordHash: string; role: Role; status: AccountStatus } }) => {
        const newUser: User = {
          id: randomUUID(),
          email: data.email.toLowerCase(),
          passwordHash: data.passwordHash,
          role: data.role,
          status: data.status,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        users.push(newUser);
        return newUser;
      },
      update: async ({ where, data }: { where: { id: string }; data: { status?: AccountStatus; passwordHash?: string } }) => {
        const u = users.find((item) => item.id === where.id);
        if (!u) throw new Error("User not found");
        if (data.status) u.status = data.status;
        if (data.passwordHash) u.passwordHash = data.passwordHash;
        u.updatedAt = new Date();
        return u;
      },
    },

    studentProfile: {
      create: async ({ data }: { data: { userId: string; displayName: string; educationStage: EducationStage; gradeLevel: number; avatarId: string; birthDate: Date } }) => {
        const newProfile: StudentProfile = {
          id: randomUUID(),
          userId: data.userId,
          displayName: data.displayName,
          educationStage: data.educationStage,
          gradeLevel: data.gradeLevel,
          avatarId: data.avatarId,
          birthDate: data.birthDate,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        studentProfiles.push(newProfile);
        return newProfile;
      },
      findUnique: async ({ where }: { where: { userId?: string; id?: string } }) => {
        if (where.userId) return studentProfiles.find((sp) => sp.userId === where.userId) || null;
        if (where.id) return studentProfiles.find((sp) => sp.id === where.id) || null;
        return null;
      },
      findFirst: async ({ where }: { where: { id?: string; userId?: string; OR?: Array<{ id?: string; userId?: string }> } }) => {
        if (where.OR) {
          for (const cond of where.OR) {
            if (cond.id) {
              const res = studentProfiles.find((sp) => sp.id === cond.id);
              if (res) return res;
            }
            if (cond.userId) {
              const res = studentProfiles.find((sp) => sp.userId === cond.userId);
              if (res) return res;
            }
          }
        }
        if (where.id) return studentProfiles.find((sp) => sp.id === where.id) || null;
        if (where.userId) return studentProfiles.find((sp) => sp.userId === where.userId) || null;
        return null;
      },
      update: async ({ where, data }: { where: { userId: string }; data: Partial<StudentProfile> }) => {
        const sp = studentProfiles.find((p) => p.userId === where.userId);
        if (!sp) throw new Error("StudentProfile not found");
        Object.assign(sp, data);
        sp.updatedAt = new Date();
        return sp;
      },
    },

    parentChildLink: {
      create: async ({ data }: { data: { parentId: string; studentProfileId: string } }) => {
        const newLink: ParentChildLink = {
          id: randomUUID(),
          parentId: data.parentId,
          studentProfileId: data.studentProfileId,
          createdAt: new Date(),
        };
        parentChildLinks.push(newLink);
        return newLink;
      },
      findUnique: async ({ where }: { where: { parentId_studentProfileId?: { parentId: string; studentProfileId: string } } }) => {
        if (where.parentId_studentProfileId) {
          const l = parentChildLinks.find(
            (item) => item.parentId === where.parentId_studentProfileId!.parentId && item.studentProfileId === where.parentId_studentProfileId!.studentProfileId
          );
          if (!l) return null;
          const consent = parentalConsents.find((c) => c.linkId === l.id) || null;
          return { ...l, consent };
        }
        return null;
      },
      findMany: async ({ where }: { where: { parentId: string } }) => {
        const links = parentChildLinks.filter((l) => l.parentId === where.parentId);
        return links.map((l) => ({
          ...l,
          studentProfile: studentProfiles.find((sp) => sp.id === l.studentProfileId)!,
          consent: parentalConsents.find((c) => c.linkId === l.id) || null,
        }));
      },
    },

    parentalConsent: {
      create: async ({ data }: { data: { linkId: string; parentUserId: string; verificationMethod: VerificationMethod; consentVersion?: string } }) => {
        const newConsent: ParentalConsent = {
          id: randomUUID(),
          linkId: data.linkId,
          parentUserId: data.parentUserId,
          consentedAt: new Date(),
          verificationMethod: data.verificationMethod,
          consentVersion: data.consentVersion || "v1.0",
        };
        parentalConsents.push(newConsent);
        return newConsent;
      },
    },

    class: {
      create: async ({ data }: { data: { teacherId: string; name: string; educationStage: EducationStage; classCode: string } }) => {
        const newClass: Class = {
          id: randomUUID(),
          teacherId: data.teacherId,
          name: data.name,
          educationStage: data.educationStage,
          classCode: data.classCode,
          createdAt: new Date(),
        };
        classes.push(newClass);
        return newClass;
      },
      findUnique: async ({ where }: { where: { classCode?: string; id?: string } }) => {
        if (where.classCode) return classes.find((c) => c.classCode === where.classCode) || null;
        if (where.id) return classes.find((c) => c.id === where.id) || null;
        return null;
      },
      findMany: async ({ where }: { where: { teacherId: string } }) => {
        return classes.filter((c) => c.teacherId === where.teacherId);
      },
    },

    classEnrollment: {
      create: async ({ data }: { data: { classId: string; studentProfileId: string } }) => {
        const newEnrollment: ClassEnrollment = {
          id: randomUUID(),
          classId: data.classId,
          studentProfileId: data.studentProfileId,
          enrolledAt: new Date(),
        };
        classEnrollments.push(newEnrollment);
        return newEnrollment;
      },
      findUnique: async ({ where }: { where: { classId_studentProfileId?: { classId: string; studentProfileId: string } } }) => {
        if (where.classId_studentProfileId) {
          return (
            classEnrollments.find(
              (e) => e.classId === where.classId_studentProfileId!.classId && e.studentProfileId === where.classId_studentProfileId!.studentProfileId
            ) || null
          );
        }
        return null;
      },
      findFirst: async ({ where }: { where: { studentProfileId?: string; class?: { teacherId?: string; is?: { teacherId?: string } } } }) => {
        return (
          classEnrollments.find((e) => {
            if (where.studentProfileId && e.studentProfileId !== where.studentProfileId) {
              return false;
            }
            if (where.class) {
              const teacherIdFilter = where.class.teacherId || where.class.is?.teacherId;
              if (teacherIdFilter) {
                const targetClass = classes.find((c) => c.id === e.classId);
                if (!targetClass || targetClass.teacherId !== teacherIdFilter) {
                  return false;
                }
              }
            }
            return true;
          }) || null
        );
      },
      findMany: async ({ where }: { where: { classId: string } }) => {
        const enrs = classEnrollments.filter((e) => e.classId === where.classId);
        return enrs.map((e) => ({
          ...e,
          studentProfile: studentProfiles.find((sp) => sp.id === e.studentProfileId)!,
        }));
      },
    },

    refreshToken: {
      create: async ({ data }: { data: { userId: string; tokenHash: string; familyId: string; expiresAt: Date } }) => {
        const newRt: RefreshToken = {
          id: randomUUID(),
          userId: data.userId,
          tokenHash: data.tokenHash,
          familyId: data.familyId,
          isRevoked: false,
          expiresAt: data.expiresAt,
          createdAt: new Date(),
        };
        refreshTokens.push(newRt);
        return newRt;
      },
      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        return refreshTokens.find((rt) => rt.tokenHash === where.tokenHash) || null;
      },
      update: async ({ where, data }: { where: { id: string }; data: { isRevoked?: boolean } }) => {
        const rt = refreshTokens.find((r) => r.id === where.id);
        if (!rt) throw new Error("RefreshToken not found");
        if (data.isRevoked !== undefined) rt.isRevoked = data.isRevoked;
        return rt;
      },
      updateMany: async ({ where, data }: { where: { familyId: string }; data: { isRevoked?: boolean } }) => {
        let count = 0;
        for (const rt of refreshTokens) {
          if (rt.familyId === where.familyId) {
            if (data.isRevoked !== undefined) rt.isRevoked = data.isRevoked;
            count++;
          }
        }
        return { count };
      },
    },
  };

  return mockPrisma as unknown as PrismaClient;
}
