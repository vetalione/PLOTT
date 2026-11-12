import { and, count, eq, gte, isNotNull, sql, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { getViewer, json } from "@/lib/api";

const DAYS = 30;

// Community totals, two series (daily for the last 30 days, monthly for all time; wished by creation
// date, done by completion date) and the viewer's own numbers.
export async function GET(request: Request) {
  const viewer = await getViewer(request);
  const since = new Date(Date.now() - (DAYS - 1) * 86400_000);
  since.setUTCHours(0, 0, 0, 0);

  const { wish } = schema;
  const day = (col: typeof wish.createdAt | typeof wish.doneAt) =>
    sql<string>`to_char(${col} at time zone 'UTC', 'YYYY-MM-DD')`;

  const month = (col: typeof wish.createdAt | typeof wish.doneAt) =>
    sql<string>`to_char(${col} at time zone 'UTC', 'YYYY-MM')`;

  const [totals, wishedByDay, doneByDay, wishedByMonth, doneByMonth, mine] = await Promise.all([
    db
      .select({
        wishes: count(),
        done: sql<number>`count(*) filter (where ${wish.status} = 'done')::int`,
        claps: sum(wish.clapsCount),
      })
      .from(wish),
    db
      .select({ day: day(wish.createdAt), n: count() })
      .from(wish)
      .where(gte(wish.createdAt, since))
      .groupBy(day(wish.createdAt)),
    db
      .select({ day: day(wish.doneAt), n: count() })
      .from(wish)
      .where(and(isNotNull(wish.doneAt), gte(wish.doneAt, since)))
      .groupBy(day(wish.doneAt)),
    db.select({ month: month(wish.createdAt), n: count() }).from(wish).groupBy(month(wish.createdAt)),
    db
      .select({ month: month(wish.doneAt), n: count() })
      .from(wish)
      .where(isNotNull(wish.doneAt))
      .groupBy(month(wish.doneAt)),
    viewer
      ? db
          .select({
            wishes: count(),
            done: sql<number>`count(*) filter (where ${wish.status} = 'done')::int`,
            claps: sum(wish.clapsCount),
          })
          .from(wish)
          .where(eq(wish.userId, viewer.id))
      : Promise.resolve(null),
  ]);

  const wished = new Map(wishedByDay.map((r) => [r.day, r.n]));
  const done = new Map(doneByDay.map((r) => [r.day, r.n]));
  const series = Array.from({ length: DAYS }, (_, i) => {
    const key = new Date(since.getTime() + i * 86400_000).toISOString().slice(0, 10);
    return { day: key, wished: wished.get(key) ?? 0, done: done.get(key) ?? 0 };
  });

  // Every month from the first wish to now, so quiet stretches show as gaps rather than vanish.
  const wishedM = new Map(wishedByMonth.map((r) => [r.month, r.n]));
  const doneM = new Map(doneByMonth.map((r) => [r.month, r.n]));
  const now = new Date();
  const first = [...wishedM.keys()].sort()[0] ?? now.toISOString().slice(0, 7);
  const months: { month: string; wished: number; done: number }[] = [];
  for (
    let cursor = new Date(Date.UTC(Number(first.slice(0, 4)), Number(first.slice(5, 7)) - 1, 1));
    cursor <= now && months.length < 240;
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  ) {
    const key = cursor.toISOString().slice(0, 7);
    months.push({ month: key, wished: wishedM.get(key) ?? 0, done: doneM.get(key) ?? 0 });
  }

  const shape = (r: { wishes: number; done: number; claps: string | null } | undefined) => ({
    wishes: r?.wishes ?? 0,
    done: r?.done ?? 0,
    claps: Number(r?.claps ?? 0),
  });

  return json({ totals: shape(totals[0]), mine: mine ? shape(mine[0]) : null, series, months });
}
