import { Resend } from "resend";

/**
 * Resend Email Client
 */
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const APP_NAME = "Resumarq";

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
    try {
        const { data, error } = await resend.emails.send({
            from: `${APP_NAME} <${FROM_EMAIL}>`,
            to: [to],
            subject,
            html,
        });

        if (error) {
            console.error("Failed to send email:", error);
            throw error;
        }

        console.log("Email sent successfully:", data?.id);
        return data;
    } catch (error) {
        console.error("Email sending error:", error);
        throw error;
    }
}

/**
 * Email Templates
 * 
 * TODO: Migrate to React Email for better design and maintainability.
 */

export function getVerificationEmailHtml(url: string): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify your email</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background: #f4f4f5;">
        <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="font-size: 24px; color: #18181b; margin: 0 0 16px;">Verify your email</h1>
          <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
            Thanks for signing up for ${APP_NAME}! Please verify your email address by clicking the button below.
          </p>
          <a href="${url}" style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Verify Email
          </a>
          <p style="color: #a1a1aa; font-size: 14px; margin: 24px 0 0;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
  `;
}

export function getPasswordResetEmailHtml(url: string): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset your password</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background: #f4f4f5;">
        <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h1 style="font-size: 24px; color: #18181b; margin: 0 0 16px;">Reset your password</h1>
          <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
            We received a request to reset your password. Click the button below to choose a new password.
          </p>
          <a href="${url}" style="display: inline-block; background: #18181b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Reset Password
          </a>
          <p style="color: #a1a1aa; font-size: 14px; margin: 24px 0 0;">
            If you didn't request a password reset, you can safely ignore this email. This link expires in 1 hour.
          </p>
        </div>
      </body>
    </html>
  `;
}
