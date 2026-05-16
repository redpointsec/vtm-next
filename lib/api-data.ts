import { getDb, initializeSchema } from "./db.ts";

export function getApiOverview() {
  initializeSchema();
  const database = getDb();
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

  return {
    app: "vtm-next",
    intentionallyVulnerable: true,
    tables: Object.fromEntries(
      tables.map((table) => {
        const row = database.prepare(`select count(*) as count from ${table}`).get() as { count: number };
        return [table, row.count];
      }),
    ),
    endpoints: [
      "/api",
      "/api/docs",
      "/api/users",
      "/api/projects",
      "/api/tasks",
      "/api/notes",
      "/api/files",
      "/api/chat",
      "/api/search?q=campaign",
      "/api/debug",
      "/api/ping?host=127.0.0.1",
    ],
  };
}

export function getApiDocs() {
  return {
    title: "vtm-next training API",
    warning: "These routes intentionally expose broad data and weak mutation surfaces for security training.",
    routes: [
      {
        path: "/api/users",
        methods: ["GET"],
        notes: "Exposes users, profile DOB, SSN, reset tokens, and groups.",
      },
      {
        path: "/api/projects",
        methods: ["GET", "POST"],
        notes: "Lists projects and accepts form POST create/update from the CRUD page.",
      },
      {
        path: "/api/tasks",
        methods: ["GET", "POST"],
        notes: "Lists tasks and accepts form POST create/update from the CRUD page.",
      },
      {
        path: "/api/notes",
        methods: ["GET", "POST"],
        notes: "Lists notes and accepts form POST create/update from the CRUD page.",
      },
      {
        path: "/api/files",
        methods: ["GET"],
        notes: "Lists uploaded/imported file metadata including remote source URLs.",
      },
      {
        path: "/api/search",
        methods: ["GET"],
        notes: "Runs the intentionally unsafe raw SQL global search.",
      },
      {
        path: "/api/debug",
        methods: ["GET"],
        notes: "Returns request headers and environment data.",
      },
      {
        path: "/api/chat",
        methods: ["GET", "POST"],
        notes: "Lists assistant tools and executes broad read/write assistant actions.",
      },
    ],
  };
}

export function getUsersApiData() {
  initializeSchema();

  // Intentional vulnerability: broad API exposure includes sensitive profile data and reset tokens.
  return getDb()
    .prepare(
      `select
        u.id,
        u.username,
        u.password_hash,
        u.email,
        u.is_staff,
        u.is_superuser,
        u.date_joined,
        u.last_login,
        p.first_name,
        p.last_name,
        p.avatar,
        p.dob,
        p.ssn,
        p.reset_token,
        p.reset_token_expires,
        group_concat(g.name) as groups
      from users u
      left join profiles p on p.user_id = u.id
      left join user_groups ug on ug.user_id = u.id
      left join groups g on g.id = ug.group_id
      group by u.id
      order by u.id`,
    )
    .all();
}

export function getProjectsApiData() {
  initializeSchema();

  return getDb()
    .prepare(
      `select
        p.*,
        group_concat(distinct pu.user_id) as user_ids,
        count(distinct t.id) as task_count
      from projects p
      left join project_users pu on pu.project_id = p.id
      left join tasks t on t.project_id = p.id
      group by p.id
      order by p.id`,
    )
    .all();
}

export function getTasksApiData(projectId?: string | null) {
  initializeSchema();
  const whereClause = projectId ? `where t.project_id = ${projectId}` : "";

  // Intentional vulnerability: projectId is interpolated so API filtering keeps an SQLi surface.
  return getDb()
    .prepare(
      `select
        t.*,
        p.title as project_title,
        group_concat(distinct tu.user_id) as user_ids
      from tasks t
      left join projects p on p.id = t.project_id
      left join task_users tu on tu.task_id = t.id
      ${whereClause}
      group by t.id
      order by t.id`,
    )
    .all();
}

export function getNotesApiData(taskId?: string | null) {
  initializeSchema();
  const whereClause = taskId ? `where n.task_id = ${taskId}` : "";

  // Intentional vulnerability: taskId is interpolated so API filtering keeps an SQLi surface.
  return getDb()
    .prepare(
      `select
        n.*,
        t.title as task_title,
        u.username
      from notes n
      left join tasks t on t.id = n.task_id
      left join users u on u.id = n.user_id
      ${whereClause}
      order by n.id`,
    )
    .all();
}

export function getFilesApiData() {
  initializeSchema();

  return getDb()
    .prepare(
      `select
        f.*,
        u.username as uploaded_by_username,
        p.title as project_title,
        t.title as task_title
      from files f
      left join users u on u.id = f.uploaded_by
      left join projects p on p.id = f.project_id
      left join tasks t on t.id = f.task_id
      order by f.id`,
    )
    .all();
}

export function getChatApiData() {
  initializeSchema();

  return {
    sessions: getDb().prepare("select * from chat_sessions order by id").all(),
    messages: getDb().prepare("select * from chat_messages order by id").all(),
  };
}
