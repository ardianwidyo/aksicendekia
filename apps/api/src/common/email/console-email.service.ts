import { IEmailService, SendParentConsentEmailOptions, SendPasswordResetEmailOptions } from "./email.interface.js";

export class ConsoleEmailService implements IEmailService {
  async sendParentConsentEmail(options: SendParentConsentEmailOptions): Promise<void> {
    console.log("[EMAIL_SERVICE:PARENT_CONSENT]", {
      to: options.toEmail,
      student: options.studentDisplayName,
      link: options.consentLink,
      otp: options.otpCode,
      timestamp: new Date().toISOString(),
    });
  }

  async sendPasswordResetEmail(options: SendPasswordResetEmailOptions): Promise<void> {
    console.log("[EMAIL_SERVICE:PASSWORD_RESET]", {
      to: options.toEmail,
      link: options.resetLink,
      timestamp: new Date().toISOString(),
    });
  }
}
