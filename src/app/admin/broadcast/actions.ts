'use server';

import nodemailer from 'nodemailer';
import path from 'path';

export async function sendBroadcastEmail(
  emails: string[],
  subject: string,
  htmlContent: string
) {
  try {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_APP_PASSWORD;

    if (!user || !pass) {
      return {
        success: false,
        error: "Server configuration error: EMAIL_USER or EMAIL_APP_PASSWORD is not set in environment variables.",
      };
    }

    if (!emails || emails.length === 0) {
      return { success: false, error: "No recipient emails provided." };
    }

    // Create a transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass,
      },
    });

    // Verify connection configuration
    await transporter.verify();

    // Send emails in parallel or sequentially. We use Promise.allSettled to not fail the entire batch if one email fails.
    const results = await Promise.allSettled(
      emails.map((email) => {
        return transporter.sendMail({
          from: `"Trenova" <${user}>`,
          to: email,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px;">
              <div style="margin-bottom: 20px;">
                ${htmlContent.replace(/\n/g, '<br/>')}
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
          `,
          attachments: [
            {
              filename: 'footer-email.png',
              path: path.join(process.cwd(), 'public', 'footer-email.png'),
              cid: 'footer_email_img'
            }
          ]
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
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_APP_PASSWORD;

    if (!user || !pass) {
      return { success: false, error: "Server configuration error: EMAIL_USER or EMAIL_APP_PASSWORD is not set." };
    }

    if (!email || !passwordInput) {
      return { success: false, error: "Email and password are required." };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    await transporter.verify();

    const subject = "Detail Akun Trenova Intelligence Anda";
    const htmlContent = `Halo Kak,<br/><br/>
Terima kasih telah melakukan pembelian akses Trenova Intelligence.<br/>
Berikut adalah detail login akun Anda:<br/><br/>
<b>Email:</b> ${email}<br/>
<b>Password:</b> ${passwordInput}<br/><br/>
Silakan login melalui tautan berikut:<br/>
<a href="https://trenova-intelligence.vercel.app/login" style="color: #0066cc; text-decoration: none; font-weight: bold;">https://trenova-intelligence.vercel.app/login</a><br/><br/>
Harap simpan informasi ini baik-baik dan jangan membagikannya kepada siapa pun.`;

    await transporter.sendMail({
      from: `"Trenova" <${user}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px;">
          <div style="margin-bottom: 20px;">
            ${htmlContent}
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
      `,
      attachments: [
        {
          filename: 'footer-email.png',
          path: path.join(process.cwd(), 'public', 'footer-email.png'),
          cid: 'footer_email_img'
        }
      ]
    });

    return {
      success: true,
      message: `Berhasil mengirim detail akun ke ${email}`,
    };
  } catch (error: any) {
    console.error("Error sending new account email:", error);
    return { success: false, error: error.message || "Failed to send email." };
  }
}

