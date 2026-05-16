import { saveNote, saveProject, saveTask } from "./crud.ts";
import { getDb, initializeSchema } from "./db.ts";
import { unsafeGlobalSearch } from "./training-tools.ts";

export type ChatMessage = {
  id: number;
  session_id: number;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_name: string | null;
  created_at: string;
};

export type ChatSession = {
  id: number;
  user_id: number | null;
  title: string | null;
  created_at: string;
  updated_at: string | null;
};

type ToolResult = {
  toolName: string;
  content: string;
};

function nextId(table: string) {
  const row = getDb().prepare(`select coalesce(max(id), 0) + 1 as id from ${table}`).get() as {
    id: number;
  };
  return row.id;
}

export function listChatSessions() {
  initializeSchema();

  return getDb()
    .prepare(
      `select id, user_id, title, created_at, updated_at
      from chat_sessions
      order by coalesce(updated_at, created_at) desc, id desc`,
    )
    .all() as ChatSession[];
}

export function getChatMessages(sessionId: number) {
  initializeSchema();

  return getDb()
    .prepare(
      `select id, session_id, role, content, tool_name, created_at
      from chat_messages
      where session_id = ?
      order by id`,
    )
    .all(sessionId) as ChatMessage[];
}

export function createChatSession(userId: number, title: string) {
  initializeSchema();
  const id = nextId("chat_sessions");

  getDb()
    .prepare(
      `insert into chat_sessions (id, user_id, title, created_at, updated_at)
      values (?, ?, ?, current_timestamp, current_timestamp)`,
    )
    .run(id, userId, title);

  return id;
}

export function appendChatMessage(input: {
  sessionId: number;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
}) {
  initializeSchema();
  const id = nextId("chat_messages");

  getDb()
    .prepare(
      `insert into chat_messages (
        id, session_id, role, content, tool_name, created_at
      ) values (?, ?, ?, ?, ?, current_timestamp)`,
    )
    .run(id, input.sessionId, input.role, input.content, input.toolName || "");

  getDb()
    .prepare("update chat_sessions set updated_at = current_timestamp where id = ?")
    .run(input.sessionId);

  return id;
}

export function getDatabaseOverview() {
  initializeSchema();
  const database = getDb();
  const tables = [
    "users",
    "profiles",
    "projects",
    "tasks",
    "notes",
    "files",
    "chat_sessions",
    "chat_messages",
  ];

  return Object.fromEntries(
    tables.map((table) => {
      const row = database.prepare(`select count(*) as count from ${table}`).get() as { count: number };
      return [table, row.count];
    }),
  );
}

export function getUsersForAssistant() {
  initializeSchema();

  // Intentional vulnerability: assistant tool exposes profile PII and reset tokens.
  return getDb()
    .prepare(
      `select
        u.id,
        u.username,
        u.email,
        u.is_staff,
        u.is_superuser,
        p.first_name,
        p.last_name,
        p.dob,
        p.ssn,
        p.reset_token,
        p.reset_token_expires
      from users u
      left join profiles p on p.user_id = u.id
      order by u.id`,
    )
    .all();
}

function parseJsonTool(message: string) {
  try {
    const parsed = JSON.parse(message) as { tool?: string; args?: Record<string, unknown> };
    if (parsed.tool) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function asNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function parseIds(value: unknown, fallback: number[]) {
  if (Array.isArray(value)) {
    return value.map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item) && item > 0);
  }

  return fallback;
}

export function runAssistantTool(tool: string, args: Record<string, unknown>): ToolResult {
  switch (tool) {
    case "overview":
      return {
        toolName: "overview",
        content: JSON.stringify(getDatabaseOverview(), null, 2),
      };
    case "get_users":
      return {
        toolName: "get_users",
        content: JSON.stringify(getUsersForAssistant(), null, 2),
      };
    case "search_database":
      return {
        toolName: "search_database",
        content: JSON.stringify(unsafeGlobalSearch(asString(args.query, "")), null, 2),
      };
    case "add_project":
    case "update_project": {
      const id = saveProject({
        id: asNumber(args.id, 0),
        title: asString(args.title, "Assistant project"),
        text: asString(args.text, "Created by assistant tool"),
        priority: asNumber(args.priority, 2),
        dueDate: asString(args.dueDate, ""),
        createdBy: asNumber(args.createdBy, 2),
        userIds: parseIds(args.userIds, [2]),
      });

      return {
        toolName: tool,
        content: `Project ${id} saved.`,
      };
    }
    case "add_task":
    case "update_task": {
      const id = saveTask({
        id: asNumber(args.id, 0),
        projectId: asNumber(args.projectId, 7),
        title: asString(args.title, "Assistant task"),
        text: asString(args.text, "Created by assistant tool"),
        status: asString(args.status, "open"),
        completed: asNumber(args.completed, 0),
        priority: asNumber(args.priority, 2),
        dueDate: asString(args.dueDate, ""),
        createdBy: asNumber(args.createdBy, 2),
        userIds: parseIds(args.userIds, [2]),
      });

      return {
        toolName: tool,
        content: `Task ${id} saved.`,
      };
    }
    case "add_note":
    case "update_note": {
      const id = saveNote({
        id: asNumber(args.id, 0),
        taskId: asNumber(args.taskId, 101),
        userId: asNumber(args.userId, 2),
        title: asString(args.title, "Assistant note"),
        text: asString(args.text, "Created by assistant tool"),
        image: asString(args.image, ""),
      });

      return {
        toolName: tool,
        content: `Note ${id} saved.`,
      };
    }
    default:
      return {
        toolName: "assistant",
        content:
          "Available tools: overview, get_users, search_database, add_project, update_project, add_task, update_task, add_note, update_note.",
      };
  }
}

export function respondToAssistantMessage(message: string) {
  const jsonTool = parseJsonTool(message);

  if (jsonTool) {
    return runAssistantTool(jsonTool.tool || "assistant", jsonTool.args || {});
  }

  const lower = message.toLowerCase();
  if (lower.includes("user")) {
    return runAssistantTool("get_users", {});
  }

  if (lower.startsWith("search ") || lower.includes("search database")) {
    return runAssistantTool("search_database", {
      query: message.replace(/^search\s+/i, "").replace(/search database/i, "").trim(),
    });
  }

  if (lower.includes("add project") || lower.includes("create project")) {
    return runAssistantTool("add_project", {
      title: message.replace(/add project|create project/gi, "").trim() || "Assistant project",
      userIds: [2],
    });
  }

  if (lower.includes("add task") || lower.includes("create task")) {
    return runAssistantTool("add_task", {
      title: message.replace(/add task|create task/gi, "").trim() || "Assistant task",
      projectId: 7,
      userIds: [2],
    });
  }

  if (lower.includes("add note") || lower.includes("create note")) {
    return runAssistantTool("add_note", {
      title: message.replace(/add note|create note/gi, "").trim() || "Assistant note",
      taskId: 101,
      userId: 2,
    });
  }

  return runAssistantTool("overview", {});
}
