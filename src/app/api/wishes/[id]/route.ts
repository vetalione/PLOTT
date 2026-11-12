import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { fail, getViewer, json } from "@/lib/api";
import { toDTO } from "@/lib/wishes";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Ctx = { params: Promise<{ id: string }> };

// Owner-only edits: mark done / not done, switch visibility.
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const viewer = await getViewer(request);
  if (!viewer) return fail(401, "Войди, чтобы управлять желаниями.");
  if (!UUID.test(id)) return fail(404, "Желание не найдено.");

  const body = await request.json().catch(() => null);
  const patch: Partial<typeof schema.wish.$inferInsert> = {};
  if (body?.status === "done") Object.assign(patch, { status: "done", doneAt: new Date() });
  if (body?.status === "wished") Object.assign(patch, { status: "wished", doneAt: null });
  if (typeof body?.isPublic === "boolean") patch.isPublic = body.isPublic;
  if (typeof body?.showAuthor === "boolean") patch.showAuthor = body.showAuthor;
  if (Object.keys(patch).length === 0) return fail(400, "Нечего менять.");

  const [row] = await db
    .update(schema.wish)
    .set(patch)
    .where(and(eq(schema.wish.id, id), eq(schema.wish.userId, viewer.id)))
    .returning();
  if (!row) return fail(404, "Желание не найдено.");

  const [wish] = await toDTO([row], viewer.id);
  return json({ wish });
}

export async function DELETE(request: Request, { params }: Ctx) {
  const { id } = await params;
  const viewer = await getViewer(request);
  if (!viewer) return fail(401, "Войди, чтобы управлять желаниями.");
  if (!UUID.test(id)) return fail(404, "Желание не найдено.");

  const deleted = await db
    .delete(schema.wish)
    .where(and(eq(schema.wish.id, id), eq(schema.wish.userId, viewer.id)))
    .returning({ id: schema.wish.id });
  if (deleted.length === 0) return fail(404, "Желание не найдено.");
  return json({ ok: true });
}
