import Database from "better-sqlite3";

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    db = new Database(process.env.VTM_NEXT_DB_PATH || "data/vtm-next.sqlite");
  }

  return db;
}

export function initializeSchema() {
  const database = getDb();

  database.exec(`
    create table if not exists users (
      id integer primary key,
      username text not null unique,
      password_hash text not null,
      email text,
      role text
    );

    create table if not exists projects (
      id integer primary key,
      title text not null,
      text text,
      priority integer default 1,
      due_date text
    );

    create table if not exists tasks (
      id integer primary key,
      project_id integer not null,
      title text not null,
      text text,
      completed integer default 0,
      due_date text
    );

    create table if not exists notes (
      id integer primary key,
      task_id integer not null,
      title text not null,
      text text,
      image text,
      user text
    );
  `);
}
