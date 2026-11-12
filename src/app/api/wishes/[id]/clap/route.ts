import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { fail, getViewer, json } from "@/lib/api";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Toggles the viewer's applause for a public wish. Registered accounts only, one clap per person.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer(request);
  if (!viewer || viewer.isGuest) return fail(401, "Зарегистрируйся, чтобы поддерживать желания.");
  if (!UUID.test(id)) return fail(404, "Желание не найдено.");

  const result = await db.transaction(async (tx) => {
    const [target] = await tx
      .select({ id: schema.wish.id })
      .from(schema.wish)
      .where(and(eq(schema.wish.id, id), eq(schema.wish.isPublic, true)));
    if (!target) return null;

    const inserted = await tx
      .insert(schema.clap)
      .values({ wishId: id, userId: viewer.id })
      .onConflictDoNothing()
      .returning({ wishId: schema.clap.wishId });

    const clapped = inserted.length > 0;
    if (!clapped) {
      await tx.delete(schema.clap).where(and(eq(schema.clap.wishId, id), eq(schema.clap.userId, viewer.id)));
    }
    const [row] = await tx
      .update(schema.wish)
      .set({ clapsCount: sql`greatest(${schema.wish.clapsCount} + ${clapped ? 1 : -1}, 0)` })
      .where(eq(schema.wish.id, id))
      .returning({ clapsCount: schema.wish.clapsCount });
    return { clapped, clapsCount: row.clapsCount };
  });

  if (!result) return fail(404, "Желание не найдено.");
  return json(result);
}
