import { getDb, seedDatabase } from "../lib/db.ts";

seedDatabase();

const db = getDb();
const tables = [
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

for (const table of tables) {
  const row = db.prepare(`select count(*) as count from ${table}`).get() as {
    count: number;
  };

  console.log(`${table}: ${row.count}`);
}
