// One-off migration of the old Bubble app's data: users and wishes from its CSV exports.
//
//   node scripts/import-bubble.mjs --users users.csv [--users more.csv] --wishes wishes.csv \
//        [--tz-offset 6] [--skip skip.txt] [--sql import.sql] [--apply]
//
// --sql writes one transaction you can paste into a SQL console; --apply runs it against DATABASE_URL.
// Both are safe to repeat: users are matched by email, wishes by an id derived from Bubble's "unique id".
// The exports hold personal data, so keep them (and the generated SQL) out of the repository.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

try {
  process.loadEnvFile?.(".env.local");
} catch {}

/* ── Arguments ─────────────────────────────────────────────────────────── */

const args = { users: [], wishes: null, skip: null, sql: null, apply: false, tzOffset: 0 };
for (let i = 2; i < process.argv.length; i++) {
  const [flag, value] = [process.argv[i], process.argv[i + 1]];
  if (flag === "--apply") {
    args.apply = true;
    continue;
  }
  if (flag === "--users") args.users.push(value);
  else if (flag === "--wishes") args.wishes = value;
  else if (flag === "--skip") args.skip = value;
  else if (flag === "--sql") args.sql = value;
  else if (flag === "--tz-offset") args.tzOffset = Number(value);
  else throw new Error(`Unknown argument: ${flag}`);
  i++; // every other flag takes a value
}
if (args.users.length === 0 || !args.wishes) {
  console.error("usage: import-bubble.mjs --users <csv> [--users <csv>] --wishes <csv> [--tz-offset h] [--skip file] [--sql out.sql] [--apply]");
  process.exit(1);
}

/* ── CSV and dates ─────────────────────────────────────────────────────── */

function parseCsv(path) {
  const text = readFileSync(path, "utf8").replace(/^﻿/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      [row, field] = [[], ""];
    } else field += c;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((r) => r.length > 1 || r[0] !== "");
  return body.map((r) => Object.fromEntries(header.map((name, i) => [name, r[i] ?? ""])));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Jun 3, 2021 2:41 am" → wall-clock parts, exactly as Bubble printed them in the export's time zone. */
function wallClock(value) {
  const m = /^(\w{3}) (\d{1,2}), (\d{4}) (\d{1,2}):(\d{2}) (am|pm)$/.exec(value.trim());
  if (!m) return null;
  const hour = (Number(m[4]) % 12) + (m[6] === "pm" ? 12 : 0);
  return { year: Number(m[3]), month: MONTHS.indexOf(m[1]), day: Number(m[2]), hour, minute: Number(m[5]) };
}

/** The instant a wall-clock value denotes, given how many hours east of UTC the export was made. */
const toInstant = (w) => new Date(Date.UTC(w.year, w.month, w.day, w.hour - args.tzOffset, w.minute));

/**
 * The old date picker stored "midnight where the wisher is"; untouched it stored "now".
 * A value on the hour is therefore a chosen deadline, and its hour tells which calendar day was meant:
 * midnight east of the export's zone prints as an evening hour of the day before.
 */
function dueDate(value) {
  const w = value ? wallClock(value) : null;
  if (!w || w.minute !== 0) return null;
  const wisherOffset = args.tzOffset - w.hour;
  const date = new Date(Date.UTC(w.year, w.month, w.day + (wisherOffset < -12 ? 1 : 0)));
  return date.toISOString().slice(0, 10);
}

/* ── Normalising ───────────────────────────────────────────────────────── */

const sha = (value) => createHash("sha256").update(value).digest("hex");
const email = (value) => value.trim().toLowerCase();
const sameText = (value) => value.replace(/\s+/g, " ").trim().toLowerCase();

function instagram(raw) {
  const handle = raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "")
    .toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(handle) ? handle : null;
}

function wishUuid(bubbleId) {
  const h = sha(`bubble-wish:${bubbleId}`);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const skip = new Set(
  args.skip
    ? readFileSync(args.skip, "utf8")
        .split("\n")
        .map((line) => line.replace(/#.*$/, "").trim().toLowerCase())
        .filter(Boolean)
    : [],
);
const skipped = [];

/* ── Users: union of the exports, one row per email ────────────────────── */

const users = new Map();
for (const file of args.users) {
  for (const row of parseCsv(file)) {
    const address = email(row.email ?? "");
    if (!address) continue;
    if (skip.has(address)) {
      skipped.push(`user ${address}: on the skip list`);
      continue;
    }
    const created = wallClock(row["Creation Date"] ?? "");
    const next = { email: address, instagram: instagram(row.instagram ?? ""), createdAt: created ? toInstant(created) : new Date() };
    const seen = users.get(address);
    users.set(address, {
      email: address,
      instagram: next.instagram ?? seen?.instagram ?? null,
      createdAt: seen && seen.createdAt < next.createdAt ? seen.createdAt : next.createdAt,
    });
  }
}

/* ── Wishes ────────────────────────────────────────────────────────────── */

const rows = parseCsv(args.wishes);

// A burst of rows modified in the same minute is an old bulk edit, not the moment a wish came true.
const modifiedCounts = new Map();
for (const row of rows) modifiedCounts.set(row["Modified Date"], (modifiedCounts.get(row["Modified Date"]) ?? 0) + 1);

let wishes = [];
for (const row of rows) {
  const text = (row.wish ?? "").trim();
  const id = row["unique id"];
  const label = `wish "${text.replace(/\s+/g, " ").slice(0, 60)}"`;
  if (!text || !id) continue;
  if (skip.has(id) || skip.has(sameText(text))) {
    skipped.push(`${label}: on the skip list`);
    continue;
  }
  if (!row.status && !row.public) {
    skipped.push(`${label}: incomplete record (no status, no visibility)`);
    continue;
  }
  const created = wallClock(row["Creation Date"]);
  if (!created) {
    skipped.push(`${label}: no creation date`);
    continue;
  }
  const createdAt = toInstant(created);
  const owner = email(row.Creator || row.User || "");
  const done = row.status ? row.status.toLowerCase() === "done" : row.Done === "yes";
  const modified = wallClock(row["Modified Date"] ?? "");
  const modifiedAt = modified && modifiedCounts.get(row["Modified Date"]) < 5 ? toInstant(modified) : null;
  const likers = new Set((row["Users likes"] ?? "").split(",").map(email).filter((e) => users.has(e)));

  wishes.push({
    id: wishUuid(id),
    owner: users.has(owner) ? owner : null,
    // Before accounts existed the old app tagged each visitor with a colour; it still groups their wishes.
    toneKey: !users.has(owner) && row["User Color"] ? `bubble:${row["User Color"].slice(0, 7)}` : null,
    text,
    dueDate: dueDate(row["due date"]),
    isPublic: row.public !== "no",
    done,
    doneAt: done ? (modifiedAt && modifiedAt > createdAt ? modifiedAt : createdAt) : null,
    claps: Math.max(Number(row["likes count"]) || 0, likers.size),
    likers,
    createdAt,
  });
}

// A double tap, or a guest wish repeated right after signing up, left near-identical copies minutes apart.
// Keep one: the copy with an owner, then the one with more applause; applause is merged.
const kept = [];
const recent = new Map();
for (const wish of wishes.sort((a, b) => a.createdAt - b.createdAt)) {
  const key = sameText(wish.text);
  const twin = recent.get(key);
  if (twin && wish.createdAt - twin.createdAt < 15 * 60_000 && (!twin.owner || !wish.owner || twin.owner === wish.owner)) {
    const [winner, loser] = !twin.owner && wish.owner ? [wish, twin] : [twin, wish];
    winner.claps = Math.max(winner.claps, loser.claps);
    loser.likers.forEach((liker) => winner.likers.add(liker));
    winner.dueDate ??= loser.dueDate;
    winner.createdAt = twin.createdAt;
    kept[kept.indexOf(twin)] = winner;
    recent.set(key, winner);
    skipped.push(`wish "${wish.text.replace(/\s+/g, " ").slice(0, 60)}": duplicate submitted within minutes`);
    continue;
  }
  kept.push(wish);
  recent.set(key, wish);
}
wishes = kept;

/* ── SQL ───────────────────────────────────────────────────────────────── */

const q = (value) => (value === null || value === undefined ? "null" : `'${String(value).replaceAll("'", "''")}'`);
const ts = (date) => (date ? q(date.toISOString()) : "null");
const claps = wishes.flatMap((w) => [...w.likers].map((liker) => `(${q(w.id)}, ${q(liker)}, ${ts(w.createdAt)})`));

const statements = [
  "set standard_conforming_strings = on",
  `insert into "user" (id, name, email, email_verified, instagram, created_at, updated_at) values
${[...users.values()]
  .map((u) => `  (${q(`bubble_${sha(u.email).slice(0, 24)}`)}, ${q(u.email.split("@")[0])}, ${q(u.email)}, false, ${q(u.instagram)}, ${ts(u.createdAt)}, ${ts(u.createdAt)})`)
  .join(",\n")}
on conflict (email) do update set instagram = coalesce("user".instagram, excluded.instagram)`,
  `insert into wish (id, user_id, tone_key, text, due_date, is_public, status, done_at, claps_count, created_at)
select v.id::uuid, u.id, v.tone_key, v.text, v.due_date::date, v.is_public::boolean, v.status, v.done_at::timestamptz, v.claps::integer, v.created_at::timestamptz
from (values
${wishes
  .map((w) => `  (${q(w.id)}, ${q(w.owner)}, ${q(w.toneKey)}, ${q(w.text)}, ${q(w.dueDate)}, ${q(w.isPublic)}, ${q(w.done ? "done" : "wished")}, ${ts(w.doneAt)}, ${q(w.claps)}, ${ts(w.createdAt)})`)
  .join(",\n")}
) as v(id, owner, tone_key, text, due_date, is_public, status, done_at, claps, created_at)
left join "user" u on u.email = v.owner
on conflict (id) do nothing`,
  ...(claps.length > 0
    ? [
        `insert into clap (wish_id, user_id, created_at)
select w.id, u.id, v.created_at::timestamptz
from (values
${claps.map((c) => `  ${c}`).join(",\n")}
) as v(wish_id, liker, created_at)
join wish w on w.id = v.wish_id::uuid
join "user" u on u.email = v.liker
on conflict do nothing`,
      ]
    : []),
];
const script = `-- Wish Button: data carried over from Bubble. Safe to run more than once.\nbegin;\n\n${statements.join(";\n\n")};\n\ncommit;\n`;

/* ── Report and output ─────────────────────────────────────────────────── */

console.log(`users:  ${users.size}  (${[...users.values()].filter((u) => u.instagram).length} with Instagram)`);
console.log(
  `wishes: ${wishes.length}  (${wishes.filter((w) => w.done).length} done, ${wishes.filter((w) => !w.isPublic).length} private, ` +
    `${wishes.filter((w) => w.owner).length} with an account, ${wishes.filter((w) => w.dueDate).length} with a deadline)`,
);
console.log(`claps:  ${wishes.reduce((sum, w) => sum + w.claps, 0)} in total, ${claps.length} tied to an account`);
console.log(`skipped: ${skipped.length}`);
for (const line of skipped) console.log(`  - ${line}`);

if (args.sql) {
  writeFileSync(args.sql, script);
  console.log(`\nSQL written to ${args.sql} (${Math.round(script.length / 1024)} KB)`);
}
if (args.apply) {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error("--apply needs DATABASE_URL");
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  try {
    await sql.unsafe(script);
    const [count] = await sql`select (select count(*)::int from "user") as users, (select count(*)::int from wish) as wishes, (select count(*)::int from clap) as claps`;
    console.log(`\napplied. database now holds ${count.users} users, ${count.wishes} wishes, ${count.claps} claps`);
  } finally {
    await sql.end();
  }
}
