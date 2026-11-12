// Fills an empty database with a handful of demo wishes so the feed and the chart have something to show.
// Development only: `npm run db:seed`.
import postgres from "postgres";

// Local runs pick the connection string up from .env.local; on a host it comes from the environment.
try {
  process.loadEnvFile?.(".env.local");
} catch {}

const sql = postgres(process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "postgres://plott:plott@localhost:5432/plott", { max: 1 });

const people = [
  { id: "demo-maya", email: "maya@demo.invalid", instagram: "maya.dreams" },
  { id: "demo-leo", email: "leo@demo.invalid", instagram: "leo_on_the_road" },
  { id: "demo-sam", email: "sam@demo.invalid", instagram: null },
  { id: "demo-priya", email: "priya@demo.invalid", instagram: "priya.makes" },
];

const wishes = [
  ["demo-maya", "Переехать к морю и снять светлую квартиру с большим балконом", 24, 26, false],
  ["demo-leo", "Проехать на велосипеде от Лиссабона до Порту", 17, 21, false],
  ["demo-sam", "Выпустить своё приложение", 14, 19, true],
  ["demo-priya", "Открыть маленькую керамическую мастерскую", 9, 15, false],
  ["demo-maya", "Научиться играть на пианино хотя бы одну пьесу Шопена", 6, 12, true],
  ["demo-leo", "Пробежать полумарафон без остановок", 6, 9, false],
  ["demo-sam", "Чтобы у всех моих друзей всё получилось", 5, 7, false],
  ["demo-priya", "Увидеть северное сияние", 3, 5, false],
  ["demo-maya", "Завести собаку из приюта", 2, 3, true],
  ["demo-leo", "Выступить на стендапе и не забыть текст", 1, 2, false],
  ["demo-sam", "Выспаться", 0, 1, false],
  ["demo-priya", "Круто встретить Новый год", 0, 0, false],
];

for (const p of people) {
  await sql`insert into "user" (id, name, email, instagram) values (${p.id}, ${p.email.split("@")[0]}, ${p.email}, ${p.instagram})
            on conflict (id) do nothing`;
}

const [{ count }] = await sql`select count(*)::int from wish where user_id like 'demo-%'`;
if (count === 0) {
  for (const [userId, text, claps, daysAgo, done] of wishes) {
    await sql`insert into wish (user_id, text, is_public, status, done_at, claps_count, created_at)
              values (${userId}, ${text}, true, ${done ? "done" : "wished"},
                      ${done ? sql`now() - make_interval(days => ${Math.max(0, daysAgo - 6)})` : null},
                      ${claps}, now() - make_interval(days => ${daysAgo}, hours => ${(daysAgo * 5) % 11}))`;
  }
  console.log(`seed: added ${wishes.length} demo wishes`);
} else {
  console.log("seed: demo wishes already present");
}
await sql.end();
