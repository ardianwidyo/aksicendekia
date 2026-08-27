export interface SendParentConsentEmailOptions {
  toEmail: string;
  studentDisplayName: string;
  consentLink: string;
  otpCode: string;
}

export interface SendPasswordResetEmailOptions {
  toEmail: string;
  resetLink: string;
}

export interface IEmailService {
  sendParentConsentEmail(options: SendParentConsentEmailOptions): Promise<void>;
  sendPasswordResetEmail(options: SendPasswordResetEmailOptions): Promise<void>;
}
