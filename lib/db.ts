import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import {
  seedChatMessages,
  seedChatSessions,
  seedFiles,
  seedGroups,
  seedNotes,
  seedProjects,
  seedTasks,
  seedUsers,
} from "./seed-data.ts";

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    const dbPath = process.env.VTM_NEXT_DB_PATH || "data/vtm-next.sqlite";
    const dbDir = path.dirname(dbPath);

    if (dbDir && dbDir !== ".") {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
  }

  return db;
}

export function initializeSchema() {
  const database = getDb();

  // No foreign-key enforcement here: VTM intentionally keeps loose data edges
  // so training flows can demonstrate authorization and object-reference flaws.
  database.exec(`
    create table if not exists users (
      id integer primary key,
      username text not null unique,
      password_hash text not null,
      email text,
      is_staff integer not null default 0,
      is_superuser integer not null default 0,
      date_joined text not null default current_timestamp,
      last_login text
    );

    create table if not exists groups (
      id integer primary key,
      name text not null unique
    );

    create table if not exists user_groups (
      user_id integer not null,
      group_id integer not null,
      primary key (user_id, group_id)
    );

    create table if not exists profiles (
      id integer primary key,
      user_id integer not null unique,
      first_name text,
      last_name text,
      email text,
      avatar text,
      dob text,
      ssn text,
      reset_token text,
      reset_token_expires text
    );

    create table if not exists projects (
      id integer primary key,
      title text not null,
      text text,
      priority integer default 1,
      due_date text,
      created_by integer,
      created_at text not null default current_timestamp,
      updated_at text
    );

    create table if not exists project_users (
      project_id integer not null,
      user_id integer not null,
      role text,
      primary key (project_id, user_id)
    );

    create table if not exists tasks (
      id integer primary key,
      project_id integer not null,
      title text not null,
      text text,
      status text default 'open',
      completed integer default 0,
      priority integer default 1,
      due_date text,
      created_by integer,
      created_at text not null default current_timestamp,
      updated_at text
    );

    create table if not exists task_users (
      task_id integer not null,
      user_id integer not null,
      role text,
      primary key (task_id, user_id)
    );

    create table if not exists notes (
      id integer primary key,
      task_id integer not null,
      user_id integer,
      title text not null,
      text text,
      image text,
      created_at text not null default current_timestamp,
      updated_at text
    );

    create table if not exists files (
      id integer primary key,
      uploaded_by integer,
      project_id integer,
      task_id integer,
      name text not null,
      path text not null,
      source_url text,
      content_type text,
      size integer default 0,
      uploaded_at text not null default current_timestamp
    );

    create table if not exists chat_sessions (
      id integer primary key,
      user_id integer,
      title text,
      created_at text not null default current_timestamp,
      updated_at text
    );

    create table if not exists chat_messages (
      id integer primary key,
      session_id integer not null,
      role text not null,
      content text not null,
      tool_name text,
      created_at text not null default current_timestamp
    );
  `);
}

export function seedDatabase() {
  const database = getDb();
  initializeSchema();

  const now = new Date().toISOString();

  const insertGroup = database.prepare(`
    insert into groups (id, name)
    values (@id, @name)
    on conflict(id) do update set name = excluded.name
  `);

  const insertUser = database.prepare(`
    insert into users (
      id, username, password_hash, email, is_staff, is_superuser, date_joined
    )
    values (
      @id, @username, @passwordHash, @email, @isStaff, @isSuperuser, @now
    )
    on conflict(id) do update set
      username = excluded.username,
      password_hash = excluded.password_hash,
      email = excluded.email,
      is_staff = excluded.is_staff,
      is_superuser = excluded.is_superuser
  `);

  const insertUserGroup = database.prepare(`
    insert into user_groups (user_id, group_id)
    values (@userId, @groupId)
    on conflict(user_id, group_id) do nothing
  `);

  const insertProfile = database.prepare(`
    insert into profiles (
      id, user_id, first_name, last_name, email, avatar, dob, ssn,
      reset_token, reset_token_expires
    )
    values (
      @id, @userId, @firstName, @lastName, @email, @avatar, @dob, @ssn,
      @resetToken, @resetTokenExpires
    )
    on conflict(id) do update set
      user_id = excluded.user_id,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      email = excluded.email,
      avatar = excluded.avatar,
      dob = excluded.dob,
      ssn = excluded.ssn,
      reset_token = excluded.reset_token,
      reset_token_expires = excluded.reset_token_expires
  `);

  const insertProject = database.prepare(`
    insert into projects (
      id, title, text, priority, due_date, created_by, created_at
    )
    values (
      @id, @title, @text, @priority, @dueDate, @createdBy, @now
    )
    on conflict(id) do update set
      title = excluded.title,
      text = excluded.text,
      priority = excluded.priority,
      due_date = excluded.due_date,
      created_by = excluded.created_by,
      updated_at = @now
  `);

  const insertProjectUser = database.prepare(`
    insert into project_users (project_id, user_id, role)
    values (@projectId, @userId, @role)
    on conflict(project_id, user_id) do update set role = excluded.role
  `);

  const insertTask = database.prepare(`
    insert into tasks (
      id, project_id, title, text, status, completed, priority, due_date,
      created_by, created_at
    )
    values (
      @id, @projectId, @title, @text, @status, @completed, @priority,
      @dueDate, @createdBy, @now
    )
    on conflict(id) do update set
      project_id = excluded.project_id,
      title = excluded.title,
      text = excluded.text,
      status = excluded.status,
      completed = excluded.completed,
      priority = excluded.priority,
      due_date = excluded.due_date,
      created_by = excluded.created_by,
      updated_at = @now
  `);

  const insertTaskUser = database.prepare(`
    insert into task_users (task_id, user_id, role)
    values (@taskId, @userId, @role)
    on conflict(task_id, user_id) do update set role = excluded.role
  `);

  const insertNote = database.prepare(`
    insert into notes (
      id, task_id, user_id, title, text, image, created_at
    )
    values (
      @id, @taskId, @userId, @title, @text, @image, @now
    )
    on conflict(id) do update set
      task_id = excluded.task_id,
      user_id = excluded.user_id,
      title = excluded.title,
      text = excluded.text,
      image = excluded.image,
      updated_at = @now
  `);

  const insertFile = database.prepare(`
    insert into files (
      id, uploaded_by, project_id, task_id, name, path, source_url,
      content_type, size, uploaded_at
    )
    values (
      @id, @uploadedBy, @projectId, @taskId, @name, @path, @sourceUrl,
      @contentType, @size, @now
    )
    on conflict(id) do update set
      uploaded_by = excluded.uploaded_by,
      project_id = excluded.project_id,
      task_id = excluded.task_id,
      name = excluded.name,
      path = excluded.path,
      source_url = excluded.source_url,
      content_type = excluded.content_type,
      size = excluded.size
  `);

  const insertChatSession = database.prepare(`
    insert into chat_sessions (id, user_id, title, created_at)
    values (@id, @userId, @title, @now)
    on conflict(id) do update set
      user_id = excluded.user_id,
      title = excluded.title,
      updated_at = @now
  `);

  const insertChatMessage = database.prepare(`
    insert into chat_messages (
      id, session_id, role, content, tool_name, created_at
    )
    values (
      @id, @sessionId, @role, @content, @toolName, @now
    )
    on conflict(id) do update set
      session_id = excluded.session_id,
      role = excluded.role,
      content = excluded.content,
      tool_name = excluded.tool_name
  `);

  database.transaction(() => {
    for (const group of seedGroups) {
      insertGroup.run(group);
    }

    for (const user of seedUsers) {
      insertUser.run({ ...user, now });

      for (const groupId of user.groups) {
        insertUserGroup.run({ userId: user.id, groupId });
      }

      insertProfile.run({
        id: user.id,
        userId: user.id,
        email: user.email,
        ...user.profile,
      });
    }

    for (const project of seedProjects) {
      insertProject.run({ ...project, now });

      for (const userId of project.users) {
        insertProjectUser.run({
          projectId: project.id,
          userId,
          role: userId === project.createdBy ? "owner" : "member",
        });
      }
    }

    for (const task of seedTasks) {
      insertTask.run({ ...task, now });

      for (const userId of task.users) {
        insertTaskUser.run({
          taskId: task.id,
          userId,
          role: userId === task.createdBy ? "creator" : "assignee",
        });
      }
    }

    for (const note of seedNotes) {
      insertNote.run({ ...note, now });
    }

    for (const file of seedFiles) {
      insertFile.run({ ...file, now });
    }

    for (const session of seedChatSessions) {
      insertChatSession.run({ ...session, now });
    }

    for (const message of seedChatMessages) {
      insertChatMessage.run({ ...message, now });
    }
  })();
}
