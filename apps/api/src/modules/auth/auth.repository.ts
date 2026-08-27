import { PrismaClient, User, RefreshToken, Role, AccountStatus } from "@prisma/client";

export class AuthRepository {
  constructor(private prisma: PrismaClient) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    role: Role;
    status: AccountStatus;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role,
        status: data.status,
      },
    });
  }

  async updateUserStatus(userId: string, status: AccountStatus): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  }

  async revokeRefreshToken(id: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true },
    });
  }

  async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId },
      data: { isRevoked: true },
    });
  }
}
