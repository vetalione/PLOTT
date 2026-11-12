import { fail, json } from "@/lib/api";
import { EmailError } from "@/lib/email";
import { getAdmin, relaunchLetter, relaunchProgress, sendRelaunchChunk, sendRelaunchTest } from "@/lib/relaunch";

// A chunk is a handful of sends with a pause between them; give it room on serverless hosts.
export const maxDuration = 60;

const CHUNK = 5;

// Progress by default; ?preview=wishes or ?preview=empty renders the letter itself (its link goes nowhere).
export async function GET(request: Request) {
  if (!(await getAdmin(request))) return fail(403, "Только для администратора.");
  const preview = new URL(request.url).searchParams.get("preview");
  if (preview) {
    const letter = relaunchLetter(preview === "empty" ? 0 : 3, "#");
    return new Response(letter.html.replace("<body", `<body data-subject="${letter.subject}"`), {
      headers: { "Content-Type": "text/html; charset=utf-8", "X-Subject": encodeURIComponent(letter.subject) },
    });
  }
  return json(await relaunchProgress());
}

// { mode: "test" } sends the letter to the admin; { mode: "send" } sends to the next few recipients.
export async function POST(request: Request) {
  const admin = await getAdmin(request);
  if (!admin) return fail(403, "Только для администратора.");
  const body = await request.json().catch(() => null);

  try {
    if (body?.mode === "test") {
      await sendRelaunchTest(admin);
      return json({ ok: true });
    }
    if (body?.mode === "send") {
      const sentNow = await sendRelaunchChunk(CHUNK);
      return json({ sentNow, ...(await relaunchProgress()) });
    }
  } catch (error) {
    if (error instanceof EmailError) {
      const hint =
        error.status === 429
          ? "Почтовый сервис просит подождать: достигнут лимит отправки. Продолжи позже — уже отправленные не повторятся."
          : error.status === 503
            ? "Отправка почты не настроена: нужен RESEND_API_KEY."
            : `Почтовый сервис отклонил письмо (${error.status}). Проверь домен отправителя и EMAIL_FROM.`;
      return Response.json({ error: hint, ...(await relaunchProgress()) }, { status: 502 });
    }
    throw error;
  }
  return fail(400, "Неизвестное действие.");
}
