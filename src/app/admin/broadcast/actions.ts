'use server';

import { getAdminContext } from '@/lib/authz';
import { getSiteUrl } from '@/lib/site-url';
import { parseAccountEmailInput, renderAccountEmail, type AccountEmailInput } from '@/lib/account-email';

import {
  EMAIL_FOOTER_ATTACHMENT,
  EMAIL_SENDER_NAME,
  getEmailCredentials,
  getTrenovaTransporter,
  sendTrenovaEmail,
  wrapTrenovaHtml,
} from '@/lib/email';

export async function sendBroadcastEmail(
  emails: string[],
  subject: string,
  htmlContent: string
) {
  try {
    const context = await getAdminContext();
    if (!context) return { success: false, error: 'Akses admin diperlukan.' };
    if (emails.length > 100 || subject.length > 180 || htmlContent.length > 10_000
      || emails.some((email) => !/^\S+@\S+\.\S+$/.test(email) || email.length > 254)) {
      return { success: false, error: 'Jumlah penerima atau isi pesan terlalu besar.' };
    }
    const credentials = getEmailCredentials();

    if (!credentials) {
      return {
        success: false,
        error: "Server configuration error: EMAIL_USER or EMAIL_APP_PASSWORD is not set in environment variables.",
      };
    }

    if (!emails || emails.length === 0) {
      return { success: false, error: "No recipient emails provided." };
    }

    // Reuse the shared Trenova transporter (src/lib/email.ts)
    const transporter = getTrenovaTransporter();
    if (!transporter) {
      return {
        success: false,
        error: "Server configuration error: EMAIL_USER or EMAIL_APP_PASSWORD is not set in environment variables.",
      };
    }

    // Verify connection configuration
    await transporter.verify();

    // Send emails in parallel or sequentially. We use Promise.allSettled to not fail the entire batch if one email fails.
    const results = await Promise.allSettled(
      emails.map((email) => {
        return transporter.sendMail({
          from: `"${EMAIL_SENDER_NAME}" <${credentials.user}>`,
          to: email,
          subject: subject,
          html: wrapTrenovaHtml(htmlContent, true),
          attachments: [EMAIL_FOOTER_ATTACHMENT]
        });
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    await context.admin.from('admin_audit_events').insert({ actor_id: context.user.id,
      action: 'broadcast_email', target: 'recipients', details: { recipient_count: emails.length, successful, failed } });

    return {
      success: true,
      message: `Successfully sent ${successful} emails. Failed to send ${failed} emails.`,
      successfulCount: successful,
      failedCount: failed,
    };
  } catch (error: unknown) {
    console.error("Error sending broadcast email:", error);
    return { success: false, error: (error instanceof Error ? error.message : 'Terjadi kesalahan.') || "Failed to send emails." };
  }
}

export async function sendNewAccountEmail(options: AccountEmailInput) {
  try {
    const context = await getAdminContext();
    if (!context) return { success: false, error: 'Akses admin diperlukan.' };
    if (!getEmailCredentials()) {
      return { success: false, error: "Server configuration error: EMAIL_USER or EMAIL_APP_PASSWORD is not set." };
    }

    const input = parseAccountEmailInput(options);
    if (!input) {
      return { success: false, error: 'Periksa email akun, email penerima, subjek, dan isi pesan. Isi pesan wajib memuat {{reset_link}}.' };
    }

    const { data: linkData, error: linkError } = await context.admin.auth.admin.generateLink({
      type: 'recovery', email: input.accountEmail,
    });
    if (linkError || !linkData.properties?.hashed_token) {
      return { success: false, error: linkError?.message || 'Tautan tidak dapat dibuat.' };
    }

    const recoveryUrl = `${getSiteUrl()}/auth/confirm?type=recovery&token_hash=${encodeURIComponent(linkData.properties.hashed_token)}`;
    const htmlContent = renderAccountEmail(input, recoveryUrl);

    // Reuse the shared Trenova email service (src/lib/email.ts)
    const result = await sendTrenovaEmail({
      to: input.recipientEmail,
      subject: input.subject,
      htmlContent,
      convertNewlines: false, // htmlContent is already formatted HTML
    });

    if (!result.success) {
      console.error("Error sending new account email:", result.message);
      return { success: false, error: result.message };
    }
    await context.admin.from('admin_audit_events').insert({ actor_id: context.user.id,
      action: 'send_password_link', target: input.accountEmail, details: { recipient_email: input.recipientEmail } });

    return {
      success: true,
      message: `Berhasil mengirim detail akun ${input.accountEmail} ke ${input.recipientEmail}`,
    };
  } catch (error: unknown) {
    console.error("Error sending new account email:", error);
    return { success: false, error: (error instanceof Error ? error.message : 'Terjadi kesalahan.') || "Failed to send email." };
  }
}

