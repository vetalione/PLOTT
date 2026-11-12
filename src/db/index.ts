import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// One client per server process; dev hot reloads would otherwise leak connections.
const globalForDb = globalThis as unknown as { __plottSql?: ReturnType<typeof postgres> };

const sql =
  globalForDb.__plottSql ??
  postgres(process.env.DATABASE_URL ?? "postgres://plott:plott@localhost:5432/plott", {
    // Serverless functions each hold their own pool, so keep it small.
    max: process.env.VERCEL ? 1 : 10,
    // Transaction poolers (Neon, Supabase, PgBouncer) cannot keep prepared statements.
    prepare: false,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__plottSql = sql;

export const db = drizzle(sql, { schema });
export { schema };
