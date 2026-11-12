import { randomBytes } from "node:crypto";
import { and, asc, count, eq, isNull, like, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { auth } from "./auth";
import { composeEmail, sendEmail } from "./email";

// The one-time letter to people carried over from the old app: the name changed, the address
// changed, your wishes came along. Its button is a personal login link, so one tap is enough.

export const LINK_DAYS = 30;

/** People who may send the letter: ADMIN_EMAILS, and only with an address they have proven is theirs. */
export async function getAdmin(request: Request) {
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || !session.user.emailVerified) return null;
  return allowed.includes(session.user.email.toLowerCase()) ? session.user : null;
}

/** Accounts that came from the old app; anyone who registered here already knows where we are. */
const imported = and(like(schema.user.id, "bubble\\_%"), eq(schema.user.isAnonymous, false));

export async function relaunchProgress() {
  const [row] = await db
    .select({ total: count(), sent: sql<number>`count(${schema.user.relaunchSentAt})::int` })
    .from(schema.user)
    .where(imported);
  return { total: row.total, sent: row.sent, pending: row.total - row.sent };
}

/**
 * A sign-in link that lives for LINK_DAYS instead of an hour. It is stored exactly the way the
 * magic-link plugin stores its own tokens, so its verify endpoint accepts it: single use, and it
 * marks the address as verified. (This relies on the plugin's storage format; better-auth is pinned.)
 */
async function loginLink(email: string) {
  const ctx = await auth.$context;
  const token = randomBytes(24).toString("base64url");
  await ctx.internalAdapter.createVerificationValue({
    identifier: `magic-link:${token}`,
    value: JSON.stringify({ type: "magic-link", email }),
    expiresAt: new Date(Date.now() + LINK_DAYS * 86400_000),
  });
  const url = new URL("/api/auth/magic-link/verify", new URL(ctx.baseURL).origin);
  url.searchParams.set("token", token);
  url.searchParams.set("callbackURL", "/wishes?tab=mine");
  return url.toString();
}

const plural = (n: number, one: string, few: string, many: string) =>
  n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many;

export function relaunchLetter(wishes: number, url: string) {
  const smallPrint = [
    `Кнопка в письме — твой личный вход, пароль не нужен. Она сработает один раз и действует ${LINK_DAYS} дней.`,
    "Это письмо пришло, потому что у тебя есть аккаунт в «Кнопке желаний». Не хочешь получать от нас письма — просто ответь «стоп».",
  ];
  if (wishes > 0) {
    const n = `${wishes} ${plural(wishes, "желание", "желания", "желаний")}`;
    return {
      subject: "Помнишь своё желание из «Кнопки желаний»?",
      ...composeEmail({
        paragraphs: [
          "Привет!",
          `Когда-то в «Кнопке желаний» появилось твоё желание. Помнишь, какое? А главное — сбылось ли?`,
          `Самое время проверить. Кнопка выросла, получила новое имя — PLOTT — и переехала на новый адрес. Всё твоё переехало вместе с ней: ${n} ${plural(wishes, "ждёт", "ждут", "ждут")} тебя.`,
        ],
        action: "Посмотреть мои желания",
        url,
        after: [
          "Отметь то, что сбылось, загадай новое и загляни в ленту — там можно поддержать желания других.",
          "Обнимаю,\nВиталий, создатель PLOTT",
        ],
        smallPrint,
      }),
    };
  }
  return {
    subject: "«Кнопка желаний» теперь PLOTT — и у неё новый адрес",
    ...composeEmail({
      paragraphs: [
        "Привет!",
        "Когда-то у тебя появился аккаунт в «Кнопке желаний». С тех пор она выросла, получила новое имя — PLOTT — и переехала на новый адрес.",
        "Твой аккаунт переехал вместе с ней. Загляни: там сотни желаний других людей, которые можно поддержать, и кнопка, которая ждёт твоё.",
      ],
      action: "Открыть PLOTT",
      url,
      after: ["Обнимаю,\nВиталий, создатель PLOTT"],
      smallPrint,
    }),
  };
}

async function deliver(user: { id: string; email: string }) {
  const [{ wishes }] = await db
    .select({ wishes: count() })
    .from(schema.wish)
    .where(eq(schema.wish.userId, user.id));
  const letter = relaunchLetter(wishes, await loginLink(user.email));
  await sendEmail({ to: user.email, ...letter });
}

/** Sends the letter to the admin's own address, as their recipients will see it. Marks nothing as sent. */
export const sendRelaunchTest = (admin: { id: string; email: string }) => deliver(admin);

/**
 * Sends to the next few people who have not had the letter. Each is marked only after their own
 * send succeeds, so a failure halfway never loses or repeats anyone.
 */
export async function sendRelaunchChunk(limit: number) {
  const next = await db
    .select({ id: schema.user.id, email: schema.user.email })
    .from(schema.user)
    .where(and(imported, isNull(schema.user.relaunchSentAt)))
    .orderBy(asc(schema.user.createdAt))
    .limit(limit);

  let sent = 0;
  for (const user of next) {
    await deliver(user);
    await db.update(schema.user).set({ relaunchSentAt: new Date() }).where(eq(schema.user.id, user.id));
    sent++;
    // Resend allows only a couple of requests per second.
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  return sent;
}
