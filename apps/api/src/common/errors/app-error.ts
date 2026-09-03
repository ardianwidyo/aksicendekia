export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number = 400, code: string = "BAD_REQUEST") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Permintaan tidak valid", code: string = "BAD_REQUEST") {
    super(message, 400, code);
  }
}

export class UnprocessableEntityError extends AppError {
  public readonly violations?: unknown;

  constructor(message: string, code: string = "UNPROCESSABLE_ENTITY", violations?: unknown) {
    super(message, 422, code);
    this.violations = violations;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Autentikasi gagal atau token tidak valid", code: string = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Akses ditolak", code: string = "FORBIDDEN") {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Sumber daya tidak ditemukan", code: string = "NOT_FOUND") {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Konflik data", code: string = "CONFLICT") {
    super(message, 409, code);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = "Batas percobaan terlampaui. Coba lagi nanti", code: string = "TOO_MANY_REQUESTS") {
    super(message, 429, code);
  }
}

export class PaywallLimitError extends AppError {
  constructor(
    message: string = "Kuota paket gratis telah habis. Tingkatkan ke Pro untuk akses tanpa batas!",
    code: string = "PAYWALL_LIMIT_REACHED"
  ) {
    super(message, 403, code);
  }
}

