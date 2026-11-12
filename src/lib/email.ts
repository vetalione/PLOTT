// Email goes through Resend's HTTP API when RESEND_API_KEY is set. In development without a key the
// message is printed to the server log, so magic links stay usable locally.

export const emailEnabled = Boolean(process.env.RESEND_API_KEY) || process.env.NODE_ENV !== "production";

type Mail = { to: string; subject: string; text: string; html: string };

export async function sendEmail({ to, subject, text, html }: Mail) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[email → ${to}] ${subject}\n${text}\n`);
      return;
    }
    throw new Error("Email delivery is not configured (RESEND_API_KEY is missing).");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Кнопка Желаний <onboarding@resend.dev>",
      to,
      subject,
      text,
      html,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
  }
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function linkEmail(opts: { intro: string; action: string; url: string; outro: string }) {
  const text = `Привет!\n\n${opts.intro}\n\n${opts.action}: ${opts.url}\n\n${opts.outro}\n\nКоманда Кнопки Желаний`;
  const html = `<!doctype html><html lang="ru"><body style="margin:0;background:#fbfbfa;font-family:ui-rounded,'SF Pro Rounded',system-ui,sans-serif;color:#141414">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:28px;padding:32px">
<tr><td style="font-size:20px;font-weight:600;padding-bottom:12px">Кнопка Желаний</td></tr>
<tr><td style="font-size:16px;line-height:1.45;color:#6e6e72;padding-bottom:24px">${escapeHtml(opts.intro)}</td></tr>
<tr><td style="padding-bottom:24px"><a href="${escapeHtml(opts.url)}" style="display:inline-block;background:#161616;color:#ffffff;text-decoration:none;font-size:17px;font-weight:600;padding:16px 28px;border-radius:999px">${escapeHtml(opts.action)}</a></td></tr>
<tr><td style="font-size:14px;line-height:1.45;color:#a3a3a6">${escapeHtml(opts.outro)}</td></tr>
</table></td></tr></table></body></html>`;
  return { text, html };
}
