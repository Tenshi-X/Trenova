'use server';

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

    return {
      success: true,
      message: `Successfully sent ${successful} emails. Failed to send ${failed} emails.`,
      successfulCount: successful,
      failedCount: failed,
    };
  } catch (error: any) {
    console.error("Error sending broadcast email:", error);
    return { success: false, error: error.message || "Failed to send emails." };
  }
}

export async function sendNewAccountEmail(
  email: string,
  passwordInput: string
) {
  try {
    if (!getEmailCredentials()) {
      return { success: false, error: "Server configuration error: EMAIL_USER or EMAIL_APP_PASSWORD is not set." };
    }

    if (!email || !passwordInput) {
      return { success: false, error: "Email and password are required." };
    }

    const subject = "Detail Akun Trenova Intelligence Anda";
    const htmlContent = `Halo Kak,<br/><br/>
Terima kasih telah melakukan pembelian akses Trenova Intelligence.<br/>
Berikut adalah detail login akun Anda:<br/><br/>
<b>Email:</b> ${email}<br/>
<b>Password:</b> ${passwordInput}<br/><br/>
Silakan login melalui tautan berikut:<br/>
<a href="https://trenova-intelligence.vercel.app/login" style="color: #0066cc; text-decoration: none; font-weight: bold;">https://trenova-intelligence.vercel.app/login</a><br/><br/>
Harap simpan informasi ini baik-baik dan jangan membagikannya kepada siapa pun.`;

    // Reuse the shared Trenova email service (src/lib/email.ts)
    const result = await sendTrenovaEmail({
      to: email,
      subject: subject,
      htmlContent,
      convertNewlines: false, // htmlContent is already formatted HTML
    });

    if (!result.success) {
      console.error("Error sending new account email:", result.message);
      return { success: false, error: result.message };
    }

    return {
      success: true,
      message: `Berhasil mengirim detail akun ke ${email}`,
    };
  } catch (error: any) {
    console.error("Error sending new account email:", error);
    return { success: false, error: error.message || "Failed to send email." };
  }
}

