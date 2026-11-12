// Applies pending SQL migrations from ./drizzle. Runs before `next start` (Railway, Docker, VPS)
// and inside `vercel-build` (Vercel), so a deploy never serves code ahead of its schema.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Local runs pick the connection string up from .env.local; on a host it comes from the environment.
try {
  process.loadEnvFile?.(".env.local");
} catch {}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("migrate: DATABASE_URL is not set — add a Postgres database and expose its URL.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
try {
  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  console.log("migrate: database is up to date");
} finally {
  await sql.end();
}
