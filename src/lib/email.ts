import nodemailer from 'nodemailer';
import path from 'path';

/**
 * Shared Trenova email service.
 *
 * This is the single source of truth for outgoing transactional email.
 * It reuses the existing Gmail SMTP configuration (EMAIL_USER / EMAIL_APP_PASSWORD)
 * and the standard Trenova HTML email wrapper + footer block that the app already ships.
 *
 * Used by:
 *  - src/app/admin/broadcast/actions.ts (broadcast + new account emails)
 *  - src/app/api/feedback/route.ts       (customer feedback)
 */

type TrenovaTransporter = ReturnType<typeof nodemailer.createTransport>;

export const EMAIL_SENDER_NAME = 'Trenova';

/** Inline (CID) footer image used by every Trenova email. */
export const EMAIL_FOOTER_ATTACHMENT = {
  filename: 'footer-email.png',
  path: path.join(process.cwd(), 'public', 'footer-email.png'),
  cid: 'footer_email_img',
};

/** Returns the configured Gmail credentials, or null when the environment is incomplete. */
export function getEmailCredentials(): { user: string; pass: string } | null {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return { user, pass };
}

/** Builds the Gmail SMTP transporter, or null when credentials are missing. */
export function getTrenovaTransporter(): TrenovaTransporter | null {
  const credentials = getEmailCredentials();
  if (!credentials) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: credentials.user,
      pass: credentials.pass,
    },
  });
}

/**
 * Wraps inner HTML with the standard Trenova layout (max-width wrapper + footer block).
 * `convertNewlines` mirrors the original behaviour: plain-text templates got `\n` → `<br/>`,
 * already-formatted HTML templates were passed through untouched.
 */
export function wrapTrenovaHtml(content: string, convertNewlines = true): string {
  const body = convertNewlines ? content.replace(/\n/g, '<br/>') : content;

  return `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px;">
      <div style="margin-bottom: 20px;">
        ${body}
      </div>
      <div style="margin-top: 20px;">
        <img src="cid:footer_email_img" alt="Trenova Footer" style="max-width: 250px; height: auto; margin-bottom: 15px; display: block;" />
        <div style="font-size: 14px; color: #000; line-height: 1.5;">
          <strong style="display: block; margin-bottom: 5px;">Trenova Intelligence</strong>
          <div><strong>Website:</strong> <a href="https://trenova-intelligence.vercel.app" style="color: #0066cc; text-decoration: none; font-weight: bold;">https://trenova-intelligence.vercel.app</a></div>
          <div><strong>Email:</strong> <a href="mailto:trenova151@gmail.com" style="color: #0066cc; text-decoration: none; font-weight: bold;">trenova151@gmail.com</a></div>
          <div><strong>Telegram: 6287734881107</strong></div>
        </div>
      </div>
    </div>
  `;
}

export type SendTrenovaEmailOptions = {
  /** Recipient address. */
  to: string;
  subject: string;
  /** Inner HTML (the wrapper + footer are added automatically). */
  htmlContent: string;
  /** Convert `\n` to `<br/>` inside `htmlContent` (default: true). */
  convertNewlines?: boolean;
  /** Optional reply-to (e.g. the customer's own email address). */
  replyTo?: string;
};

export type SendTrenovaEmailResult = {
  success: boolean;
  message: string;
};

/**
 * Sends a single email through the shared Trenova transporter.
 * Never throws — always resolves with `{ success, message }`.
 */
export async function sendTrenovaEmail({
  to,
  subject,
  htmlContent,
  convertNewlines = true,
  replyTo,
}: SendTrenovaEmailOptions): Promise<SendTrenovaEmailResult> {
  const credentials = getEmailCredentials();

  if (!credentials) {
    return {
      success: false,
      message: 'Server configuration error: EMAIL_USER or EMAIL_APP_PASSWORD is not set in environment variables.',
    };
  }

  if (!to) {
    return { success: false, message: 'No recipient email provided.' };
  }

  try {
    const transporter = getTrenovaTransporter();
    if (!transporter) {
      return {
        success: false,
        message: 'Server configuration error: EMAIL_USER or EMAIL_APP_PASSWORD is not set in environment variables.',
      };
    }

    await transporter.verify();

    await transporter.sendMail({
      from: `"${EMAIL_SENDER_NAME}" <${credentials.user}>`,
      to,
      ...(replyTo ? { replyTo } : {}),
      subject,
      html: wrapTrenovaHtml(htmlContent, convertNewlines),
      attachments: [EMAIL_FOOTER_ATTACHMENT],
    });

    return { success: true, message: `Email sent to ${to}` };
  } catch (error: unknown) {
    console.error('Error sending Trenova email:', error);
    const message = error instanceof Error ? error.message : 'Failed to send email.';
    return { success: false, message };
  }
}
