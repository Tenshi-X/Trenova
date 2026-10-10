export const DEFAULT_ACCOUNT_SUBJECT = 'Atur Kata Sandi Akun Trenova Anda';
export const DEFAULT_ACCOUNT_CONTENT = `Halo Kak,

Terima kasih telah melakukan pembelian akses Trenova Intelligence.
Berikut adalah email login akun Anda: {{account_email}}

Buat kata sandi Anda melalui tautan aman berikut:
{{reset_link}}

Setelah mengatur kata sandi, Anda dapat masuk ke Trenova.
Salam hangat,
Tim Trenova`;

export type AccountEmailInput = {
  accountEmail: string; recipientEmail: string; subject: string; content: string;
};

export function parseAccountEmailInput(value: AccountEmailInput): AccountEmailInput | null {
  if (!value || [value.accountEmail, value.recipientEmail, value.subject, value.content]
    .some((item) => typeof item !== 'string')) return null;
  const accountEmail = value.accountEmail.trim().toLowerCase();
  const recipientEmail = value.recipientEmail.trim().toLowerCase();
  const subject = value.subject.trim();
  const content = value.content.trim();
  if ([accountEmail, recipientEmail].some((email) => !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email) || email.length > 254)
    || !subject || subject.length > 180 || /[\r\n]/.test(subject)
    || !content || content.length > 10000 || !content.includes('{{reset_link}}')) return null;
  return { accountEmail, recipientEmail, subject, content };
}

export function renderAccountEmail(input: AccountEmailInput, recoveryUrl: string): string {
  const escape = (text: string) => text.replace(/[&<>"']/g, (char) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
  return escape(input.content)
    .replace(/\{\{account_email\}\}/g, () => escape(input.accountEmail))
    .replace(/\{\{reset_link\}\}/g, () => `<a href="${escape(recoveryUrl)}">Atur kata sandi</a>`)
    .replace(/\r?\n/g, '<br/>');
}
