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
  const subjects: any[] = [];
  const units: any[] = [];
  const lessons: any[] = [];
  const lessonPrerequisites: any[] = [];
  const questionItems: any[] = [];
  const questionHints: any[] = [];
  const studentLessonProgress: any[] = [];
  const lessonContentBlocks: any[] = [];
  const curriculumAchievements: any[] = [];
  const mediaAssets: any[] = [];
  const interactiveWidgetTypes: any[] = [];

  // Accept both `status: "PUBLISHED"` and `status: { in: [...] }`.
  const statusMatches = (value: any, filter: any): boolean => {
    if (filter === undefined) return true;
    if (filter && typeof filter === "object" && Array.isArray(filter.in)) return filter.in.includes(value);
    return value === filter;
  };
  const listingMatches = (value: any, filter: any): boolean => {
    if (filter === undefined) return true;
    return (value ?? "LISTED") === filter;
  };

  // Supports the tiny subset of Prisma numeric filters/ops this mock's callers use.
  const matchesNumberFilter = (value: number, filter: any): boolean => {
    if (filter === undefined) return true;
    if (typeof filter === "number") return value === filter;
    if (filter.gte !== undefined && !(value >= filter.gte)) return false;
    if (filter.gt !== undefined && !(value > filter.gt)) return false;
    if (filter.lte !== undefined && !(value <= filter.lte)) return false;
    if (filter.lt !== undefined && !(value < filter.lt)) return false;
    return true;
  };

  const applyNumericFieldOps = (item: any, data: Record<string, any>): void => {
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        if ("increment" in value) item[key] = (item[key] ?? 0) + value.increment;
        else if ("decrement" in value) item[key] = (item[key] ?? 0) - value.decrement;
        else item[key] = value;
      } else {
        item[key] = value;
      }
    }
    item.updatedAt = new Date();
  };

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

    subject: {
      findUnique: async ({ where }: { where: { id?: string; code?: string } }) => {
        if (where.id) return subjects.find((s) => s.id === where.id) || null;
        if (where.code) return subjects.find((s) => s.code === where.code) || null;
        return null;
      },
      findMany: async ({ where }: { where?: any }) => {
        let res = [...subjects];
        if (where?.educationStage) res = res.filter((s) => s.educationStage === where.educationStage);
        if (where?.status !== undefined) res = res.filter((s) => statusMatches(s.status, where.status));
        return res.map((s) => ({
          ...s,
          units: units
            .filter((u) => u.subjectId === s.id)
            .map((u) => ({
              ...u,
              lessons: lessons.filter((l) => l.unitId === u.id),
            })),
        }));
      },
      create: async ({ data }: { data: any }) => {
        const item = {
          id: randomUUID(),
          code: data.code,
          name: data.name,
          educationStage: data.educationStage,
          phase: data.phase,
          status: data.status || "DRAFT",
          version: data.version || 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        subjects.push(item);
        return item;
      },
      update: async ({ where, data }: { where: { id: string }; data: any }) => {
        const item = subjects.find((s) => s.id === where.id);
        if (!item) throw new Error("Subject not found");
        Object.assign(item, data, { updatedAt: new Date() });
        return item;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const idx = subjects.findIndex((s) => s.id === where.id);
        if (idx === -1) throw new Error("Subject not found");
        return subjects.splice(idx, 1)[0];
      },
    },

    unit: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        return units.find((u) => u.id === where.id) || null;
      },
      findMany: async ({ where }: { where?: any }) => {
        let res = [...units];
        if (where?.subjectId) res = res.filter((u) => u.subjectId === where.subjectId);
        if (where?.status !== undefined) res = res.filter((u) => statusMatches(u.status, where.status));
        return res;
      },
      create: async ({ data }: { data: any }) => {
        const item = {
          id: randomUUID(),
          subjectId: data.subject?.connect?.id || data.subjectId,
          title: data.title,
          description: data.description || null,
          orderIndex: data.orderIndex,
          status: data.status || "DRAFT",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        units.push(item);
        return item;
      },
      update: async ({ where, data }: { where: { id: string }; data: any }) => {
        const item = units.find((u) => u.id === where.id);
        if (!item) throw new Error("Unit not found");
        Object.assign(item, data, { updatedAt: new Date() });
        return item;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const idx = units.findIndex((u) => u.id === where.id);
        if (idx === -1) throw new Error("Unit not found");
        return units.splice(idx, 1)[0];
      },
    },

    lesson: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const l = lessons.find((item) => item.id === where.id);
        if (!l) return null;
        const prereqs = lessonPrerequisites.filter((p) => p.lessonId === l.id);
        const qItems = questionItems.filter((q) => q.lessonId === l.id);
        return {
          ...l,
          prerequisites: prereqs.map((p) => ({ prerequisiteLessonId: p.prerequisiteLessonId })),
          curriculumAchievement:
            curriculumAchievements.find((c) => c.id === l.curriculumAchievementId) ?? null,
          questionItems: qItems.map((q) => ({
            ...q,
            hints: questionHints.filter((h) => h.questionItemId === q.id),
          })),
        };
      },
      findFirst: async ({ where }: { where?: any }) => {
        let res = [...lessons];
        if (where?.id) res = res.filter((l) => l.id === where.id);
        if (where?.unitId) res = res.filter((l) => l.unitId === where.unitId);
        if (where?.status !== undefined) res = res.filter((l) => statusMatches(l.status, where.status));
        if (where?.listing !== undefined) res = res.filter((l) => listingMatches(l.listing, where.listing));
        const l = res[0];
        if (!l) return null;
        const prereqs = lessonPrerequisites.filter((p) => p.lessonId === l.id);
        let qItems = questionItems.filter((q) => q.lessonId === l.id);
        if (where?.questionItems?.where?.status !== undefined) {
          qItems = qItems.filter((q) => statusMatches(q.status, where.questionItems.where.status));
        }
        return {
          ...l,
          prerequisites: prereqs.map((p) => ({ prerequisiteLessonId: p.prerequisiteLessonId })),
          curriculumAchievement:
            curriculumAchievements.find((c) => c.id === l.curriculumAchievementId) ?? null,
          contentBlocks: lessonContentBlocks
            .filter((b) => b.lessonId === l.id)
            .sort((a, b) => a.orderIndex - b.orderIndex),
          questionItems: qItems.map((q) => ({
            ...q,
            hints: questionHints.filter((h) => h.questionItemId === q.id),
          })),
        };
      },
      findMany: async ({ where }: { where?: any }) => {
        let res = [...lessons];
        if (where?.unitId) res = res.filter((l) => l.unitId === where.unitId);
        if (where?.status !== undefined) res = res.filter((l) => statusMatches(l.status, where.status));
        if (where?.listing !== undefined) res = res.filter((l) => listingMatches(l.listing, where.listing));

        return res.map((l) => ({
          ...l,
          prerequisites: lessonPrerequisites.filter((p) => p.lessonId === l.id).map((p) => ({ prerequisiteLessonId: p.prerequisiteLessonId })),
        }));
      },
      create: async ({ data }: { data: any }) => {
        const item = {
          id: randomUUID(),
          unitId: data.unit?.connect?.id || data.unitId,
          title: data.title,
          summary: data.summary,
          learningObjective: data.learningObjective,
          educationStage: data.educationStage,
          phase: data.phase,
          difficultyLevel: data.difficultyLevel,
          estimatedDurationMinutes: data.estimatedDurationMinutes,
          orderIndex: data.orderIndex,
          status: data.status || "DRAFT",
          version: data.version || 1,
          parentVersionId: data.parentVersion?.connect?.id || data.parentVersionId || null,
          listing: data.listing || "LISTED",
          supersededByLessonId: data.supersededByLessonId ?? null,
          curriculumAchievementId: data.curriculumAchievement?.connect?.id ?? data.curriculumAchievementId ?? null,
          reviewerNote: data.reviewerNote ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        lessons.push(item);
        return item;
      },
      update: async ({ where, data }: { where: { id: string }; data: any }) => {
        const item = lessons.find((l) => l.id === where.id);
        if (!item) throw new Error("Lesson not found");
        const { curriculumAchievement, ...rest } = data;
        Object.assign(item, rest, { updatedAt: new Date() });
        if (curriculumAchievement?.connect?.id !== undefined) {
          item.curriculumAchievementId = curriculumAchievement.connect.id;
        } else if (curriculumAchievement?.disconnect) {
          item.curriculumAchievementId = null;
        }
        return item;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const idx = lessons.findIndex((l) => l.id === where.id);
        if (idx === -1) throw new Error("Lesson not found");
        return lessons.splice(idx, 1)[0];
      },
    },

    lessonPrerequisite: {
      findMany: async ({ where }: { where?: any }) => {
        let res = [...lessonPrerequisites];
        if (where?.lessonId) res = res.filter((p) => p.lessonId === where.lessonId);
        return res;
      },
      createMany: async ({ data }: { data: Array<{ lessonId: string; prerequisiteLessonId: string }> }) => {
        for (const item of data) {
          lessonPrerequisites.push(item);
        }
        return { count: data.length };
      },
      deleteMany: async ({ where }: { where: { lessonId: string } }) => {
        let count = 0;
        for (let i = lessonPrerequisites.length - 1; i >= 0; i--) {
          if (lessonPrerequisites[i].lessonId === where.lessonId) {
            lessonPrerequisites.splice(i, 1);
            count++;
          }
        }
        return { count };
      },
    },

    lessonContentBlock: {
      findMany: async ({ where }: { where?: any }) => {
        let res = [...lessonContentBlocks];
        if (where?.lessonId) res = res.filter((b) => b.lessonId === where.lessonId);
        if (where?.status !== undefined) res = res.filter((b) => statusMatches(b.status, where.status));
        return res.sort((a, b) => a.orderIndex - b.orderIndex);
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        lessonContentBlocks.find((b) => b.id === where.id) || null,
      create: async ({ data }: { data: any }) => {
        const item = { id: data.id || randomUUID(), status: data.status || "DRAFT", ...data };
        lessonContentBlocks.push(item);
        return item;
      },
      update: async ({ where, data }: { where: { id: string }; data: any }) => {
        const item = lessonContentBlocks.find((b) => b.id === where.id);
        if (!item) throw new Error("LessonContentBlock not found");
        applyNumericFieldOps(item, data);
        return item;
      },
      updateMany: async ({ where, data }: { where?: any; data: any }) => {
        let count = 0;
        for (const item of lessonContentBlocks) {
          if (where?.lessonId !== undefined && item.lessonId !== where.lessonId) continue;
          if (!matchesNumberFilter(item.orderIndex, where?.orderIndex)) continue;
          applyNumericFieldOps(item, data);
          count++;
        }
        return { count };
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const idx = lessonContentBlocks.findIndex((b) => b.id === where.id);
        if (idx === -1) throw new Error("LessonContentBlock not found");
        return lessonContentBlocks.splice(idx, 1)[0];
      },
      deleteMany: async ({ where }: { where?: any }) => {
        let count = 0;
        for (let i = lessonContentBlocks.length - 1; i >= 0; i--) {
          if (!where?.lessonId || lessonContentBlocks[i].lessonId === where.lessonId) {
            lessonContentBlocks.splice(i, 1);
            count++;
          }
        }
        return { count };
      },
    },

    curriculumAchievement: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        curriculumAchievements.find((c) => c.id === where.id) || null,
      findFirst: async ({ where }: { where?: any }) =>
        curriculumAchievements.find(
          (c) =>
            (!where?.phase || c.phase === where.phase) &&
            (!where?.subjectCode || c.subjectCode === where.subjectCode) &&
            (!where?.element || c.element === where.element),
        ) || null,
      findMany: async () => [...curriculumAchievements],
      create: async ({ data }: { data: any }) => {
        const item = { id: data.id || randomUUID(), createdAt: new Date(), updatedAt: new Date(), ...data };
        curriculumAchievements.push(item);
        return item;
      },
      upsert: async ({ where, create, update }: { where: { id: string }; create: any; update: any }) => {
        const existing = curriculumAchievements.find((c) => c.id === where.id);
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const item = { id: where.id, ...create };
        curriculumAchievements.push(item);
        return item;
      },
      count: async ({ where }: { where?: any } = {}) => {
        let res = [...curriculumAchievements];
        if (where?.id?.in) res = res.filter((c) => where.id.in.includes(c.id));
        return res.length;
      },
    },

    mediaAsset: {
      findUnique: async ({ where }: { where: { id?: string; storageKey?: string } }) => {
        if (where.id) return mediaAssets.find((a) => a.id === where.id) || null;
        if (where.storageKey) return mediaAssets.find((a) => a.storageKey === where.storageKey) || null;
        return null;
      },
      findMany: async () => [...mediaAssets],
      create: async ({ data }: { data: any }) => {
        const item = {
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          widthPx: null,
          heightPx: null,
          durationSeconds: null,
          altText: null,
          licenseNote: null,
          attribution: null,
          ...data,
        };
        mediaAssets.push(item);
        return item;
      },
    },

    interactiveWidgetType: {
      findMany: async () => [...interactiveWidgetTypes],
      upsert: async ({ where, create, update }: { where: { id: string }; create: any; update: any }) => {
        const existing = interactiveWidgetTypes.find((w) => w.id === where.id);
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const item = { id: where.id, ...create };
        interactiveWidgetTypes.push(item);
        return item;
      },
    },

    questionItem: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const q = questionItems.find((item) => item.id === where.id);
        if (!q) return null;
        return {
          ...q,
          hints: questionHints.filter((h) => h.questionItemId === q.id),
        };
      },
      findFirst: async ({ where }: { where?: any }) => {
        let res = [...questionItems];
        if (where?.id) res = res.filter((q) => q.id === where.id);
        if (where?.lessonId) res = res.filter((q) => q.lessonId === where.lessonId);
        if (where?.status) res = res.filter((q) => q.status === where.status);
        const q = res[0];
        if (!q) return null;
        return {
          ...q,
          hints: questionHints.filter((h) => h.questionItemId === q.id),
        };
      },
      findMany: async ({ where }: { where?: any }) => {
        let res = [...questionItems];
        if (where?.lessonId) res = res.filter((q) => q.lessonId === where.lessonId);
        if (where?.status) res = res.filter((q) => q.status === where.status);
        return res.map((q) => ({
          ...q,
          hints: questionHints.filter((h) => h.questionItemId === q.id),
        }));
      },
      create: async ({ data }: { data: any }) => {
        const item = {
          id: randomUUID(),
          lessonId: data.lesson?.connect?.id || data.lessonId,
          questionType: data.questionType,
          promptText: data.promptText,
          contentPayload: data.contentPayload,
          explanation: data.explanation,
          orderIndex: data.orderIndex,
          status: data.status || "DRAFT",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        questionItems.push(item);
        return item;
      },
      update: async ({ where, data }: { where: { id: string }; data: any }) => {
        const item = questionItems.find((q) => q.id === where.id);
        if (!item) throw new Error("QuestionItem not found");
        Object.assign(item, data, { updatedAt: new Date() });
        return item;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const idx = questionItems.findIndex((q) => q.id === where.id);
        if (idx === -1) throw new Error("QuestionItem not found");
        return questionItems.splice(idx, 1)[0];
      },
    },

    questionHint: {
      createMany: async ({ data }: { data: Array<{ questionItemId: string; stepOrder: number; hintText: string }> }) => {
        for (const item of data) {
          questionHints.push({ id: randomUUID(), ...item, createdAt: new Date() });
        }
        return { count: data.length };
      },
      deleteMany: async ({ where }: { where: { questionItemId: string } }) => {
        let count = 0;
        for (let i = questionHints.length - 1; i >= 0; i--) {
          if (questionHints[i].questionItemId === where.questionItemId) {
            questionHints.splice(i, 1);
            count++;
          }
        }
        return { count };
      },
    },

    studentLessonProgress: {
      findMany: async ({ where }: { where: { studentProfileId: string; isCompleted?: boolean } }) => {
        return studentLessonProgress.filter((p) => p.studentProfileId === where.studentProfileId && (where.isCompleted === undefined || p.isCompleted === where.isCompleted));
      },
      upsert: async ({ where, create, update }: { where: any; create: any; update: any }) => {
        let p = studentLessonProgress.find((item) => item.studentProfileId === where.studentProfileId_lessonId.studentProfileId && item.lessonId === where.studentProfileId_lessonId.lessonId);
        if (p) {
          Object.assign(p, update, { updatedAt: new Date() });
        } else {
          p = {
            id: randomUUID(),
            studentProfileId: create.studentProfileId,
            lessonId: create.lessonId,
            isCompleted: create.isCompleted || false,
            completedAt: create.completedAt || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          studentLessonProgress.push(p);
        }
        return p;
      },
    },

    studentProgress: {
      findUnique: async ({ where }: { where: { studentId: string } }) => {
        return (mockPrisma as any)._studentProgresses?.find((sp: any) => sp.studentId === where.studentId) || null;
      },
      create: async ({ data }: { data: any }) => {
        if (!(mockPrisma as any)._studentProgresses) (mockPrisma as any)._studentProgresses = [];
        const item = {
          id: randomUUID(),
          studentId: data.studentId,
          timezone: data.timezone || "Asia/Jakarta",
          totalXp: data.totalXp || 0,
          level: data.level || 1,
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (mockPrisma as any)._studentProgresses.push(item);
        return item;
      },
      update: async ({ where, data }: { where: { studentId: string }; data: any }) => {
        const item = (mockPrisma as any)._studentProgresses?.find((sp: any) => sp.studentId === where.studentId);
        if (!item) throw new Error("StudentProgress not found");
        Object.assign(item, data, { updatedAt: new Date() });
        return item;
      },
    },

    xpTransaction: {
      create: async ({ data }: { data: any }) => {
        if (!(mockPrisma as any)._xpTransactions) (mockPrisma as any)._xpTransactions = [];
        const item = {
          id: randomUUID(),
          studentId: data.studentId,
          amount: data.amount,
          source: data.source,
          referenceId: data.referenceId || null,
          createdAt: new Date(),
        };
        (mockPrisma as any)._xpTransactions.push(item);
        return item;
      },
    },

    $transaction: async (fn: any) => {
      if (typeof fn === "function") {
        return fn(mockPrisma);
      }
      return Promise.all(fn);
    },
  };

  return mockPrisma as unknown as PrismaClient;
}
