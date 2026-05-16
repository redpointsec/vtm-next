import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const dbPath = path.join(os.tmpdir(), `vtm-next-preservation-${process.pid}.sqlite`);
process.env.VTM_NEXT_DB_PATH = dbPath;
process.env.VTM_NEXT_AUTH_SECRET = "";

const { getDb, seedDatabase } = await import("../lib/db.ts");
const {
  authenticateWeakUser,
  createWeakSessionToken,
  findTrainingUser,
  verifyWeakSessionToken,
} = await import("../lib/auth.ts");
const { getUsersApiData, getTasksApiData } = await import("../lib/api-data.ts");
const { getUsersForAssistant, respondToAssistantMessage } = await import("../lib/chatbot-tools.ts");
const { listProjects, listTasks } = await import("../lib/crud.ts");
const { canManageProject } = await import("../lib/permissions.ts");
const { getDashboardData } = await import("../lib/queries.ts");
const { isAuthRoute, isPublicRoute } = await import("../lib/route-policy.ts");
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

test("roles resolve from group membership", () => {
  assert.equal(findTrainingUser("admin")?.role, "admin");
  assert.equal(findTrainingUser("pm")?.role, "project_manager");
  assert.equal(findTrainingUser("chris")?.role, "team_member");
});

test("project and task visibility follows admin, PM, and assigned-user scopes", () => {
  const admin = findTrainingUser("admin");
  const pm = findTrainingUser("pm");
  const chris = findTrainingUser("chris");

  assert.ok(admin);
  assert.ok(pm);
  assert.ok(chris);
  assert.equal(listProjects(admin).length, 3);
  assert.deepEqual(
    listProjects(pm).map((project) => project.id).sort((a, b) => a - b),
    [7, 9],
  );
  assert.deepEqual(
    listProjects(chris).map((project) => project.id).sort((a, b) => a - b),
    [7, 9],
  );
  assert.deepEqual(
    listTasks(chris).map((task) => task.id).sort((a, b) => a - b),
    [101, 102, 202],
  );
});

test("PM can manage only projects they manage", () => {
  const pm = findTrainingUser("pm");

  assert.ok(pm);
  assert.equal(canManageProject(pm, 7), true);
  assert.equal(canManageProject(pm, 9), true);
  assert.equal(canManageProject(pm, 12), false);
});

test("dashboard labels and counts reflect role scope", () => {
  const admin = findTrainingUser("admin");
  const pm = findTrainingUser("pm");
  const chris = findTrainingUser("chris");

  assert.ok(admin);
  assert.ok(pm);
  assert.ok(chris);
  assert.equal(getDashboardData(admin).projectLabel, "All Projects");
  assert.equal(getDashboardData(admin).projects.length, 3);
  assert.equal(getDashboardData(pm).projectLabel, "Managed Projects");
  assert.equal(getDashboardData(pm).projects.length, 2);
  assert.equal(getDashboardData(chris).projectLabel, "My Projects");
  assert.equal(getDashboardData(chris).projects.length, 2);
});

test("route policy keeps auth bare and selected training pages public", () => {
  assert.equal(isAuthRoute("/login"), true);
  assert.equal(isPublicRoute("/dashboard"), true);
  assert.equal(isPublicRoute("/debug"), true);
  assert.equal(isPublicRoute("/api/docs"), true);
  assert.equal(isPublicRoute("/"), false);
  assert.equal(isPublicRoute("/projects"), false);
  assert.equal(isPublicRoute("/api/users"), false);
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
