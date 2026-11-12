import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { fail, getViewer, json, normalizeInstagram } from "@/lib/api";
import { emailEnabled } from "@/lib/email";
import { getAdmin } from "@/lib/relaunch";

// Who is looking, plus what the deployment can do (email-based flows need a mail provider).
export async function GET(request: Request) {
  const viewer = await getViewer(request);
  const features = { email: emailEnabled };
  if (!viewer) return json({ user: null, features });

  const [[row], credential] = await Promise.all([
    db
      .select({ email: schema.user.email, instagram: schema.user.instagram })
      .from(schema.user)
      .where(eq(schema.user.id, viewer.id)),
    db
      .select({ id: schema.account.id })
      .from(schema.account)
      .where(and(eq(schema.account.userId, viewer.id), eq(schema.account.providerId, "credential"))),
  ]);

  return json({
    user: {
      id: viewer.id,
      isGuest: viewer.isGuest,
      email: viewer.isGuest ? null : row?.email ?? null,
      instagram: row?.instagram ?? null,
      hasPassword: credential.length > 0,
      isAdmin: Boolean(await getAdmin(request)),
    },
    features,
  });
}

export async function PATCH(request: Request) {
  const viewer = await getViewer(request);
  if (!viewer || viewer.isGuest) return fail(401, "Войди, чтобы менять настройки.");

  const body = await request.json().catch(() => null);
  const instagram = normalizeInstagram(body?.instagram);
  if (instagram === null) return fail(400, "Ник может содержать латиницу, цифры, точку и подчёркивание.");

  await db
    .update(schema.user)
    .set({ instagram: instagram || null, updatedAt: new Date() })
    .where(eq(schema.user.id, viewer.id));
  return json({ instagram: instagram || null });
}
