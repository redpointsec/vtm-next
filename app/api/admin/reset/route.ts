import { NextRequest, NextResponse } from "next/server";
import { getDb, seedDatabase } from "@/lib/db";
import { seedUsers } from "@/lib/seed-data";

// Training utility: restore the baseline seed accounts, credentials, and demo
// data so an instance can be reset quickly after exercises mutate it.
//
// Reachable without a session on purpose — a reset is most needed precisely when
// the baseline credentials have been changed. Set VTM_NEXT_RESET_TOKEN to require
// a shared secret (passed as ?token= or the x-reset-token header); when unset the
// endpoint is open for local-training convenience.

const COUNT_TABLES = [
  "users",
  "groups",
  "profiles",
  "projects",
  "project_users",
  "tasks",
  "task_users",
  "notes",
  "files",
  "chat_sessions",
  "chat_messages",
];

function isAuthorized(request: NextRequest) {
  const expected = process.env.VTM_NEXT_RESET_TOKEN;
  if (!expected) {
    return true;
  }

  const supplied =
    request.headers.get("x-reset-token") ||
    request.nextUrl.searchParams.get("token") ||
    "";

  return supplied === expected;
}

function resetToBaseline(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // seedDatabase() upserts (on conflict do update), so baseline usernames,
  // password hashes, profiles, and demo projects/tasks are restored to their
  // known starting values without dropping data created during training.
  seedDatabase();

  const database = getDb();
  const counts = Object.fromEntries(
    COUNT_TABLES.map((table) => {
      const row = database.prepare(`select count(*) as count from ${table}`).get() as {
        count: number;
      };
      return [table, row.count];
    }),
  );

  return NextResponse.json({
    status: "ok",
    reset: true,
    accounts: seedUsers.map((user) => user.username),
    note: "Baseline seed accounts and demo data restored. Default password is 'test123' for admin/pm/chris and 'password' for alex.",
    counts,
  });
}

export function GET(request: NextRequest) {
  return resetToBaseline(request);
}

export function POST(request: NextRequest) {
  return resetToBaseline(request);
}
