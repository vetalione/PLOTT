import { and, count, desc, eq, gt } from "drizzle-orm";
import { db, schema } from "@/db";
import { fail, getViewer, json } from "@/lib/api";
import { toDTO, WISH_MAX_LENGTH } from "@/lib/wishes";

// The viewer's own wishes, newest first.
export async function GET(request: Request) {
  const viewer = await getViewer(request);
  if (!viewer) return json({ wishes: [] });

  const rows = await db
    .select()
    .from(schema.wish)
    .where(eq(schema.wish.userId, viewer.id))
    .orderBy(desc(schema.wish.createdAt))
    .limit(500);

  return json({ wishes: await toDTO(rows, viewer.id) });
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  const viewer = await getViewer(request);
  if (!viewer) return fail(401, "Нужна сессия, чтобы загадать желание.");

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim().replace(/\s+\n/g, "\n") : "";
  if (!text) return fail(400, "Напиши желание.");
  if (text.length > WISH_MAX_LENGTH) return fail(400, `Не длиннее ${WISH_MAX_LENGTH} символов.`);

  let dueDate: string | null = null;
  if (body?.dueDate != null && body.dueDate !== "") {
    if (typeof body.dueDate !== "string" || !DATE.test(body.dueDate) || Number.isNaN(Date.parse(body.dueDate))) {
      return fail(400, "Некорректная дата.");
    }
    dueDate = body.dueDate;
  }

  // A light brake against scripted spam: 20 wishes per hour per person.
  const [{ recent }] = await db
    .select({ recent: count() })
    .from(schema.wish)
    .where(and(eq(schema.wish.userId, viewer.id), gt(schema.wish.createdAt, new Date(Date.now() - 3600_000))));
  if (recent >= 20) return fail(429, "Слишком много желаний за час. Дай вселенной передохнуть.");

  const [row] = await db
    .insert(schema.wish)
    .values({
      userId: viewer.id,
      text,
      dueDate,
      isPublic: body?.isPublic !== false,
      showAuthor: body?.showAuthor !== false,
    })
    .returning();

  const [wish] = await toDTO([row], viewer.id);
  return json({ wish }, 201);
}
