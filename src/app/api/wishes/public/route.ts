import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getViewer, json } from "@/lib/api";
import { toDTO } from "@/lib/wishes";

const PAGE = 30;

// Everyone's public wishes: `sort=new` (default) or `sort=top` by applause.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sort = url.searchParams.get("sort") === "top" ? "top" : "new";
  const offset = Math.max(0, Math.min(5000, Number(url.searchParams.get("offset")) || 0));
  const viewer = await getViewer(request);

  const rows = await db
    .select({ wish: schema.wish, instagram: schema.user.instagram })
    .from(schema.wish)
    .innerJoin(schema.user, eq(schema.user.id, schema.wish.userId))
    .where(and(eq(schema.wish.isPublic, true)))
    .orderBy(
      ...(sort === "top"
        ? [desc(schema.wish.clapsCount), desc(schema.wish.createdAt)]
        : [desc(schema.wish.createdAt)]),
    )
    .limit(PAGE + 1)
    .offset(offset);

  const page = rows.slice(0, PAGE).map((r) => ({ ...r.wish, instagram: r.instagram }));
  return json({
    wishes: await toDTO(page, viewer?.id ?? null),
    nextOffset: rows.length > PAGE ? offset + PAGE : null,
  });
}
