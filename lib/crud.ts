import { getDb, initializeSchema } from "./db.ts";
import type { Actor } from "./permissions.ts";
import { projectScopeWhere, taskScopeWhere } from "./permissions.ts";

export type UserOption = {
  id: number;
  username: string;
};

export type ProjectRecord = {
  id: number;
  title: string;
  text: string | null;
  priority: number | null;
  due_date: string | null;
  created_by: number | null;
  members: string | null;
  user_ids: string | null;
  task_count: number;
};

export type TaskRecord = {
  id: number;
  project_id: number;
  project_title: string;
  title: string;
  text: string | null;
  status: string | null;
  completed: number | null;
  priority: number | null;
  due_date: string | null;
  assignees: string | null;
  user_ids: string | null;
};

export type NoteRecord = {
  id: number;
  task_id: number;
  task_title: string;
  user_id: number | null;
  username: string | null;
  title: string;
  text: string | null;
  image: string | null;
  created_at: string;
};

export type FileRecord = {
  id: number;
  uploaded_by: number | null;
  project_id: number | null;
  task_id: number | null;
  name: string;
  path: string;
  source_url: string | null;
  content_type: string | null;
  size: number | null;
};

function nextId(table: string) {
  const database = getDb();
  const row = database.prepare(`select coalesce(max(id), 0) + 1 as id from ${table}`).get() as {
    id: number;
  };
  return row.id;
}

export function listUsers() {
  initializeSchema();
  return getDb()
    .prepare("select id, username from users order by username")
    .all() as UserOption[];
}

export function listProjects(actor?: Actor) {
  initializeSchema();
  const whereClause = actor ? `where ${projectScopeWhere(actor, "p")}` : "";
  return getDb()
    .prepare(
      `
        select
          p.id,
          p.title,
          p.text,
          p.priority,
          p.due_date,
          p.created_by,
          group_concat(distinct u.username) as members,
          group_concat(distinct u.id) as user_ids,
          count(distinct t.id) as task_count
        from projects p
        left join project_users pu on pu.project_id = p.id
        left join users u on u.id = pu.user_id
        left join tasks t on t.project_id = p.id
        ${whereClause}
        group by p.id
        order by p.id desc
      `,
    )
    .all(actor ? { actorId: actor.id } : {}) as ProjectRecord[];
}

export function listTasks(actor?: Actor) {
  initializeSchema();
  const whereClause = actor ? `where ${taskScopeWhere(actor, "t", "p")}` : "";
  return getDb()
    .prepare(
      `
        select
          t.id,
          t.project_id,
          p.title as project_title,
          t.title,
          t.text,
          t.status,
          t.completed,
          t.priority,
          t.due_date,
          group_concat(distinct u.username) as assignees,
          group_concat(distinct u.id) as user_ids
        from tasks t
        left join projects p on p.id = t.project_id
        left join task_users tu on tu.task_id = t.id
        left join users u on u.id = tu.user_id
        ${whereClause}
        group by t.id
        order by t.id desc
      `,
    )
    .all(actor ? { actorId: actor.id } : {}) as TaskRecord[];
}

export function listNotes(taskId?: number, actor?: Actor) {
  initializeSchema();
  const taskScope = actor ? taskScopeWhere(actor, "t", "p") : "1 = 1";
  const sql = `
    select
      n.id,
      n.task_id,
      t.title as task_title,
      n.user_id,
      u.username,
      n.title,
      n.text,
      n.image,
      n.created_at
    from notes n
    left join tasks t on t.id = n.task_id
    left join projects p on p.id = t.project_id
    left join users u on u.id = n.user_id
    where ${taskScope}
    ${taskId ? `and n.task_id = ${taskId}` : ""}
    order by n.id desc
  `;

  // Intentional vulnerability: taskId is interpolated to keep an unsafe query surface.
  return getDb().prepare(sql).all(actor ? { actorId: actor.id } : {}) as NoteRecord[];
}

export function listFiles(actor?: Actor) {
  initializeSchema();
  if (!actor) {
    return getDb()
      .prepare("select * from files order by id desc")
      .all() as FileRecord[];
  }

  return getDb()
    .prepare(
      `
        select distinct f.*
        from files f
        left join projects p on p.id = f.project_id
        left join tasks t on t.id = f.task_id
        where ${projectScopeWhere(actor, "p")}
          or ${taskScopeWhere(actor, "t", "p")}
        order by f.id desc
      `,
    )
    .all({ actorId: actor.id }) as FileRecord[];
}

function replaceAssignments(table: "project_users" | "task_users", idColumn: "project_id" | "task_id", id: number, userIds: number[]) {
  const database = getDb();
  database.prepare(`delete from ${table} where ${idColumn} = ?`).run(id);

  const insert = database.prepare(`insert into ${table} (${idColumn}, user_id, role) values (?, ?, ?)`);
  for (const userId of userIds) {
    if (Number.isFinite(userId) && userId > 0) {
      insert.run(id, userId, "member");
    }
  }
}

export function saveProject(input: {
  id?: number;
  title: string;
  text: string;
  priority: number;
  dueDate: string;
  createdBy: number;
  userIds: number[];
}) {
  initializeSchema();
  const database = getDb();
  const projectId = input.id && input.id > 0 ? input.id : nextId("projects");

  database.transaction(() => {
    database
      .prepare(
        `insert into projects (
          id, title, text, priority, due_date, created_by, created_at, updated_at
        ) values (?, ?, ?, ?, ?, ?, current_timestamp, current_timestamp)
        on conflict(id) do update set
          title = excluded.title,
          text = excluded.text,
          priority = excluded.priority,
          due_date = excluded.due_date,
          created_by = excluded.created_by,
          updated_at = current_timestamp`,
      )
      .run(projectId, input.title, input.text, input.priority, input.dueDate, input.createdBy);

    replaceAssignments("project_users", "project_id", projectId, input.userIds);
  })();

  return projectId;
}

export function deleteProject(id: number) {
  initializeSchema();
  const database = getDb();

  // Intentional authorization gap: deletes cascade manually by supplied project ID only.
  database.transaction(() => {
    database.prepare("delete from files where project_id = ?").run(id);
    database.prepare("delete from notes where task_id in (select id from tasks where project_id = ?)").run(id);
    database.prepare("delete from task_users where task_id in (select id from tasks where project_id = ?)").run(id);
    database.prepare("delete from tasks where project_id = ?").run(id);
    database.prepare("delete from project_users where project_id = ?").run(id);
    database.prepare("delete from projects where id = ?").run(id);
  })();
}

export function saveTask(input: {
  id?: number;
  projectId: number;
  title: string;
  text: string;
  status: string;
  completed: number;
  priority: number;
  dueDate: string;
  createdBy: number;
  userIds: number[];
}) {
  initializeSchema();
  const database = getDb();
  const taskId = input.id && input.id > 0 ? input.id : nextId("tasks");

  database.transaction(() => {
    database
      .prepare(
        `insert into tasks (
          id, project_id, title, text, status, completed, priority, due_date,
          created_by, created_at, updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, current_timestamp, current_timestamp)
        on conflict(id) do update set
          project_id = excluded.project_id,
          title = excluded.title,
          text = excluded.text,
          status = excluded.status,
          completed = excluded.completed,
          priority = excluded.priority,
          due_date = excluded.due_date,
          created_by = excluded.created_by,
          updated_at = current_timestamp`,
      )
      .run(
        taskId,
        input.projectId,
        input.title,
        input.text,
        input.status,
        input.completed,
        input.priority,
        input.dueDate,
        input.createdBy,
      );

    replaceAssignments("task_users", "task_id", taskId, input.userIds);
  })();

  return taskId;
}

export function deleteTask(id: number) {
  initializeSchema();
  const database = getDb();

  database.transaction(() => {
    database.prepare("delete from files where task_id = ?").run(id);
    database.prepare("delete from notes where task_id = ?").run(id);
    database.prepare("delete from task_users where task_id = ?").run(id);
    database.prepare("delete from tasks where id = ?").run(id);
  })();
}

export function toggleTask(id: number) {
  initializeSchema();
  getDb()
    .prepare(
      `update tasks
      set completed = case when completed = 1 then 0 else 1 end,
          status = case when completed = 1 then 'open' else 'done' end,
          updated_at = current_timestamp
      where id = ?`,
    )
    .run(id);
}

export function saveNote(input: {
  id?: number;
  taskId: number;
  userId: number;
  title: string;
  text: string;
  image: string;
}) {
  initializeSchema();
  const noteId = input.id && input.id > 0 ? input.id : nextId("notes");

  getDb()
    .prepare(
      `insert into notes (
        id, task_id, user_id, title, text, image, created_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, current_timestamp, current_timestamp)
      on conflict(id) do update set
        task_id = excluded.task_id,
        user_id = excluded.user_id,
        title = excluded.title,
        text = excluded.text,
        image = excluded.image,
        updated_at = current_timestamp`,
    )
    .run(noteId, input.taskId, input.userId, input.title, input.text, input.image);

  return noteId;
}

export function deleteNote(id: number) {
  initializeSchema();
  getDb().prepare("delete from notes where id = ?").run(id);
}

export function saveFileRecord(input: {
  uploadedBy: number;
  projectId: number;
  taskId: number;
  name: string;
  path: string;
  sourceUrl: string;
  contentType: string;
  size: number;
}) {
  initializeSchema();
  const fileId = nextId("files");

  getDb()
    .prepare(
      `insert into files (
        id, uploaded_by, project_id, task_id, name, path, source_url,
        content_type, size, uploaded_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, current_timestamp)`,
    )
    .run(
      fileId,
      input.uploadedBy,
      input.projectId,
      input.taskId,
      input.name,
      input.path,
      input.sourceUrl,
      input.contentType,
      input.size,
    );

  return fileId;
}

export function deleteFile(id: number) {
  initializeSchema();
  getDb().prepare("delete from files where id = ?").run(id);
}
