import { createHash, randomUUID } from "crypto";

export function cryptoHash(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function generateUUID(): string {
  return randomUUID();
}

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
