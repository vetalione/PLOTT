import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { anonymous, magicLink } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { linkEmail, sendEmail } from "./email";

// Vercel and Railway both publish the deployment's hostname; anywhere else set BETTER_AUTH_URL.
const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : undefined);

// A site answers on both example.com and www.example.com, and hosts differ on which one is primary.
// Whichever is configured, requests from its twin are our own too.
function wwwTwin(url: string | undefined) {
  if (!url) return undefined;
  const twin = new URL(url);
  if (!twin.hostname.includes(".") || /^[\d.]+$/.test(twin.hostname)) return undefined;
  twin.hostname = twin.hostname.startsWith("www.") ? twin.hostname.slice(4) : `www.${twin.hostname}`;
  return twin.origin;
}

const trustedOrigins = [
  wwwTwin(baseURL),
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`,
].filter((v): v is string => Boolean(v));

export const auth = betterAuth({
  baseURL,
  trustedOrigins,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  user: {
    additionalFields: {
      instagram: { type: "string", required: false, input: true },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "PLOTT: сброс пароля",
        ...linkEmail({
          intro: "Вы запросили сброс пароля. Нажмите кнопку ниже, чтобы задать новый.",
          action: "Задать новый пароль",
          url,
          outro: "Ссылка действует один час. Если это были не вы — просто проигнорируйте письмо.",
        }),
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 90,
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    anonymous({
      emailDomainName: "guest.plott.invalid",
      // A guest who signs up or logs in keeps everything they wished for as a guest.
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        await db
          .update(schema.wish)
          .set({ userId: newUser.user.id })
          .where(eq(schema.wish.userId, anonymousUser.user.id));
      },
    }),
    magicLink({
      expiresIn: 60 * 60,
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: "PLOTT: ссылка для входа",
          ...linkEmail({
            intro: "Вы запросили волшебную ссылку для входа в свою учётную запись.",
            action: "Войти",
            url,
            outro: "Ссылка сработает один раз и действует в течение часа.",
          }),
        });
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
