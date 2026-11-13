import { createHash } from "node:crypto";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";

export type WishDTO = {
  id: string;
  text: string;
  dueDate: string | null;
  isPublic: boolean;
  status: "wished" | "done";
  doneAt: string | null;
  createdAt: string;
  clapsCount: number;
  mine: boolean;
  clapped: boolean;
  instagram: string | null;
  /** 0–359: the author's colour. Same author, same hue; it says nothing else about who they are. */
  hue: number;
};

// How far (in degrees of hue) a hand-picked colour keeps everyone else away, so it stays that person's own.
const RESERVE = 18;
const hueDistance = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

/**
 * A stable hue per author. It is a one-way hash, so the feed can show that two wishes share an
 * author without ever sending the author's id to other people. Hues that were picked for someone
 * by hand are off limits: an author who would land near one is moved to a free hue instead.
 */
export function authorHue(
  row: { id: string; userId: string | null; toneKey: string | null },
  reserved: number[] = [],
) {
  const digest = createHash("sha256").update(`plott-tone:${row.userId ?? row.toneKey ?? row.id}`).digest();
  const hue = digest.readUInt16BE(0) % 360;
  if (!reserved.some((r) => hueDistance(hue, r) <= RESERVE)) return hue;
  const free = Array.from({ length: 360 }, (_, h) => h).filter((h) => !reserved.some((r) => hueDistance(h, r) <= RESERVE));
  return free.length > 0 ? free[digest.readUInt16BE(2) % free.length] : hue;
}

/** The few authors whose colour was picked by hand instead of derived: user id → hue. */
async function pickedHues() {
  const picked = await db
    .select({ id: schema.user.id, hue: schema.user.toneHue })
    .from(schema.user)
    .where(isNotNull(schema.user.toneHue));
  return new Map(picked.map((p) => [p.id, ((p.hue! % 360) + 360) % 360]));
}

type Row = typeof schema.wish.$inferSelect & { instagram?: string | null };

export async function toDTO(rows: Row[], viewerId: string | null): Promise<WishDTO[]> {
  let clapped = new Set<string>();
  if (viewerId && rows.length > 0) {
    const mine = await db
      .select({ wishId: schema.clap.wishId })
      .from(schema.clap)
      .where(
        and(
          eq(schema.clap.userId, viewerId),
          inArray(
            schema.clap.wishId,
            rows.map((r) => r.id),
          ),
        ),
      );
    clapped = new Set(mine.map((m) => m.wishId));
  }
  const picked = await pickedHues();
  const reserved = [...picked.values()];
  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    dueDate: r.dueDate,
    isPublic: r.isPublic,
    status: r.status,
    doneAt: r.doneAt ? r.doneAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    clapsCount: r.clapsCount,
    mine: viewerId !== null && r.userId === viewerId,
    clapped: clapped.has(r.id),
    instagram: r.isPublic && r.showAuthor ? (r.instagram ?? null) : null,
    hue: (r.userId ? picked.get(r.userId) : undefined) ?? authorHue(r, reserved),
  }));
}

export const WISH_MAX_LENGTH = 280;
