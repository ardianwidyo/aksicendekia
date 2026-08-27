import { hash, verify } from "@node-rs/argon2";

export class Argon2Service {
  async hashPassword(password: string): Promise<string> {
    return hash(password, {
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  async verifyPassword(hashString: string, password: string): Promise<boolean> {
    return verify(hashString, password);
  }
}

export const argon2Service = new Argon2Service();
