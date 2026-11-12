import { auth } from "@/lib/auth";

export async function getViewer(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return null;
  return {
    id: session.user.id,
    isGuest: Boolean(session.user.isAnonymous),
  };
}

export const json = (data: unknown, status = 200) => Response.json(data, { status });
export const fail = (status: number, error: string) => Response.json({ error }, { status });

const INSTAGRAM = /^[a-zA-Z0-9._]{1,30}$/;

/** Accepts "@name", "name" or a profile URL; returns the bare handle, "" for empty, null for junk. */
export function normalizeInstagram(raw: unknown): string | null {
  if (raw == null) return "";
  if (typeof raw !== "string") return null;
  const handle = raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
  if (handle === "") return "";
  return INSTAGRAM.test(handle) ? handle.toLowerCase() : null;
}
