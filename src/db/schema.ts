import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/* ── Auth tables (shape expected by better-auth) ───────────────────────── */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  // Guests get a real row so their wishes survive until they register.
  isAnonymous: boolean("is_anonymous").default(false),
  instagram: text("instagram"),
  // When the "we moved" letter went out to someone carried over from the old app.
  relaunchSentAt: timestamp("relaunch_sent_at", { withTimezone: true }),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/* ── App tables ────────────────────────────────────────────────────────── */

export const wish = pgTable(
  "wish",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Null for wishes carried over from the old app whose author never registered.
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    // Groups ownerless wishes that came from one person, so they still share a colour in the feed.
    toneKey: text("tone_key"),
    // Whether a public wish is signed with the author's Instagram handle.
    showAuthor: boolean("show_author").notNull().default(true),
    text: text("text").notNull(),
    dueDate: date("due_date", { mode: "string" }),
    isPublic: boolean("is_public").notNull().default(true),
    status: text("status", { enum: ["wished", "done"] }).notNull().default("wished"),
    doneAt: timestamp("done_at", { withTimezone: true }),
    clapsCount: integer("claps_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("wish_user_idx").on(t.userId, t.createdAt),
    index("wish_public_new_idx").on(t.isPublic, t.createdAt),
    index("wish_public_top_idx").on(t.isPublic, t.clapsCount),
  ],
);

export const clap = pgTable(
  "clap",
  {
    wishId: uuid("wish_id")
      .notNull()
      .references(() => wish.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.wishId, t.userId] })],
);
