import { APIError } from "better-auth/api";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { fail, getViewer, json } from "@/lib/api";
import { auth } from "@/lib/auth";

// Sets a first password (accounts created through a magic link have none) or changes the current one.
export async function POST(request: Request) {
  const viewer = await getViewer(request);
  if (!viewer || viewer.isGuest) return fail(401, "Войди, чтобы сменить пароль.");

  const body = await request.json().catch(() => null);
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  if (newPassword.length < 6) return fail(400, "Пароль должен быть не короче 6 символов.");
  if (newPassword.length > 128) return fail(400, "Пароль слишком длинный.");

  const credential = await db
    .select({ id: schema.account.id })
    .from(schema.account)
    .where(and(eq(schema.account.userId, viewer.id), eq(schema.account.providerId, "credential")));

  try {
    if (credential.length === 0) {
      await auth.api.setPassword({ body: { newPassword }, headers: request.headers });
    } else {
      if (!currentPassword) return fail(400, "Введи текущий пароль.");
      await auth.api.changePassword({
        body: { currentPassword, newPassword, revokeOtherSessions: true },
        headers: request.headers,
      });
    }
  } catch (error) {
    if (error instanceof APIError) {
      return fail(400, credential.length === 0 ? "Не удалось задать пароль." : "Текущий пароль не подходит.");
    }
    throw error;
  }
  return json({ ok: true });
}
