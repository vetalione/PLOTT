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

/**
 * A stable hue per author. It is a one-way hash, so the feed can show that two wishes share an
 * author without ever sending the author's id to other people.
 */
export function authorHue(row: { id: string; userId: string | null; toneKey: string | null }) {
  const key = row.userId ?? row.toneKey ?? row.id;
  return createHash("sha256").update(`plott-tone:${key}`).digest().readUInt16BE(0) % 360;
}

/** The few authors whose colour was picked by hand instead of derived. */
async function pickedHues(rows: { userId: string | null }[]) {
  const ids = [...new Set(rows.map((r) => r.userId).filter((id): id is string => id !== null))];
  if (ids.length === 0) return new Map<string, number>();
  const picked = await db
    .select({ id: schema.user.id, hue: schema.user.toneHue })
    .from(schema.user)
    .where(and(inArray(schema.user.id, ids), isNotNull(schema.user.toneHue)));
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
  const picked = await pickedHues(rows);
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
    hue: (r.userId ? picked.get(r.userId) : undefined) ?? authorHue(r),
  }));
}

export const WISH_MAX_LENGTH = 280;
