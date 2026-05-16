import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const dbPath = path.join(os.tmpdir(), `vtm-next-preservation-${process.pid}.sqlite`);
process.env.VTM_NEXT_DB_PATH = dbPath;
process.env.VTM_NEXT_AUTH_SECRET = "";

const { getDb, seedDatabase } = await import("../lib/db.ts");
const { authenticateWeakUser, createWeakSessionToken, verifyWeakSessionToken } = await import("../lib/auth.ts");
const { getUsersApiData, getTasksApiData } = await import("../lib/api-data.ts");
const { getUsersForAssistant, respondToAssistantMessage } = await import("../lib/chatbot-tools.ts");
const { unsafeGlobalSearch, runPingUnsafe } = await import("../lib/training-tools.ts");

seedDatabase();

test.after(() => {
  getDb().close();
  fs.rmSync(dbPath, { force: true });
});

test("seed data keeps weak training accounts available", () => {
  const chris = authenticateWeakUser("chris", "test123");

  assert.equal(chris?.username, "chris");
  assert.equal(chris?.id, 2);
});

test("weak session tokens remain long lived and signed with default secret", async () => {
  const token = await createWeakSessionToken({
    id: 2,
    username: "chris",
    email: "chris@tm.com",
    role: "team_member",
  });
  const verified = await verifyWeakSessionToken(token);
  const issuedAt = Number(verified.payload.iat);
  const expiresAt = Number(verified.payload.exp);

  assert.equal(verified.payload.username, "chris");
  assert.ok(expiresAt - issuedAt >= 60 * 60 * 24 * 360);
});

test("global search exposes sensitive profile fields", () => {
  const results = unsafeGlobalSearch("chris-reset-token");

  assert.ok(results.some((result) => result.source === "profile" && result.extra?.includes("chris-reset-token")));
});

test("global search keeps a raw SQL injection surface", () => {
  const results = unsafeGlobalSearch("%' or 1=1 or 'x' like '%");

  assert.ok(results.length > 10);
});

test("API user data exposes password hashes, SSNs, and reset tokens", () => {
  const users = getUsersApiData() as Array<{
    username: string;
    password_hash: string;
    ssn: string;
    reset_token: string;
  }>;
  const chris = users.find((user) => user.username === "chris");

  assert.ok(chris?.password_hash.includes("md5$"));
  assert.equal(chris?.ssn, "222-33-4444");
  assert.equal(chris?.reset_token, "chris-reset-token");
});

test("API task filter keeps unsafe SQL interpolation reachable", () => {
  const tasks = getTasksApiData("7 or 1=1") as Array<{ id: number }>;

  assert.ok(tasks.length >= 5);
});

test("chatbot user tool exposes PII and reset tokens", () => {
  const users = getUsersForAssistant() as Array<{
    username: string;
    ssn: string;
    reset_token: string;
  }>;
  const chris = users.find((user) => user.username === "chris");

  assert.equal(chris?.ssn, "222-33-4444");
  assert.equal(chris?.reset_token, "chris-reset-token");
});

test("chatbot write tool can add a project without an authorization check", () => {
  const response = respondToAssistantMessage(
    JSON.stringify({
      tool: "add_project",
      args: {
        title: "Phase 7 Assistant Project",
        text: "Created during preservation test",
        userIds: [2],
      },
    }),
  );
  const row = getDb()
    .prepare("select title from projects where title = ?")
    .get("Phase 7 Assistant Project") as { title: string } | undefined;

  assert.equal(response.toolName, "add_project");
  assert.equal(row?.title, "Phase 7 Assistant Project");
});

test("ping utility executes a shell command built from user input", () => {
  const output = runPingUnsafe("127.0.0.1");

  assert.match(output, /127\.0\.0\.1|localhost|packets transmitted|round-trip|PING/i);
});
