// Email goes through Resend's HTTP API when RESEND_API_KEY is set. In development without a key the
// message is printed to the server log, so login links stay usable locally.

export const emailEnabled = Boolean(process.env.RESEND_API_KEY) || process.env.NODE_ENV !== "production";

export class EmailError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type Mail = { to: string; subject: string; text: string; html: string };

export async function sendEmail({ to, subject, text, html }: Mail) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[email → ${to}] ${subject}\n${text}\n`);
      return;
    }
    throw new EmailError("Email delivery is not configured (RESEND_API_KEY is missing).", 503);
  }

  // Replies go to a real person's inbox; the same address doubles as the way to opt out.
  const replyTo = process.env.EMAIL_REPLY_TO;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "PLOTT <onboarding@resend.dev>",
      to,
      subject,
      text,
      html,
      ...(replyTo && {
        reply_to: replyTo,
        headers: { "List-Unsubscribe": `<mailto:${replyTo}?subject=unsubscribe>` },
      }),
    }),
  });
  if (!res.ok) {
    throw new EmailError(`Resend responded ${res.status}: ${(await res.text()).slice(0, 300)}`, res.status);
  }
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * One plain, letter-like layout for every message: a few paragraphs, one button, small print.
 * No images and a single link, which is also what keeps it out of spam folders.
 */
export function composeEmail(opts: {
  paragraphs: string[];
  action: string;
  url: string;
  after?: string[];
  smallPrint: string[];
}) {
  const after = opts.after ?? [];
  const text = [...opts.paragraphs, `${opts.action}: ${opts.url}`, ...after, ...opts.smallPrint].join("\n\n");
  const p = (line: string, style: string) =>
    `<tr><td style="${style}">${escapeHtml(line).replaceAll("\n", "<br>")}</td></tr>`;
  const body = "font-size:17px;line-height:1.5;color:#141414;padding-bottom:16px";
  const html = `<!doctype html><html lang="ru"><body style="margin:0;background:#fbfbfa;font-family:ui-rounded,'SF Pro Rounded',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#141414">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#ffffff;border-radius:28px;padding:32px">
<tr><td style="font-size:20px;font-weight:700;letter-spacing:.04em;padding-bottom:20px">PLOTT</td></tr>
${opts.paragraphs.map((line) => p(line, body)).join("\n")}
<tr><td style="padding:8px 0 24px"><a href="${escapeHtml(opts.url)}" style="display:inline-block;background:#161616;color:#ffffff;text-decoration:none;font-size:17px;font-weight:600;padding:16px 28px;border-radius:999px">${escapeHtml(opts.action)}</a></td></tr>
${after.map((line) => p(line, body)).join("\n")}
${opts.smallPrint.map((line) => p(line, "font-size:13px;line-height:1.45;color:#8a8a8e;padding-top:8px")).join("\n")}
</table></td></tr></table></body></html>`;
  return { text, html };
}

/** The short service letters: "here is your link". */
export const linkEmail = (opts: { intro: string; action: string; url: string; outro: string }) =>
  composeEmail({
    paragraphs: ["Привет!", opts.intro],
    action: opts.action,
    url: opts.url,
    smallPrint: [opts.outro, "Команда PLOTT"],
  });
