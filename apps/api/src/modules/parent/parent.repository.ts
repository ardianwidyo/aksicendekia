import { PrismaClient, ParentChildLink, ParentalConsent, VerificationMethod } from "@prisma/client";

export class ParentRepository {
  constructor(private prisma: PrismaClient) {}

  async createParentChildLink(parentId: string, studentProfileId: string): Promise<ParentChildLink> {
    return this.prisma.parentChildLink.create({
      data: {
        parentId,
        studentProfileId,
      },
    });
  }

  async findLink(parentId: string, studentProfileId: string): Promise<ParentChildLink | null> {
    return this.prisma.parentChildLink.findUnique({
      where: {
        parentId_studentProfileId: {
          parentId,
          studentProfileId,
        },
      },
      include: {
        consent: true,
      },
    });
  }

  async recordConsent(data: {
    linkId: string;
    parentUserId: string;
    verificationMethod: VerificationMethod;
    consentVersion?: string;
  }): Promise<ParentalConsent> {
    return this.prisma.parentalConsent.create({
      data: {
        linkId: data.linkId,
        parentUserId: data.parentUserId,
        verificationMethod: data.verificationMethod,
        consentVersion: data.consentVersion || "v1.0",
      },
    });
  }

  async findChildrenByParentId(parentId: string) {
    return this.prisma.parentChildLink.findMany({
      where: { parentId },
      include: {
        studentProfile: true,
        consent: true,
      },
    });
  }
}
