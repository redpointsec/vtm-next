import type { TrainingUser } from "./auth.ts";
import { getDb, initializeSchema } from "./db.ts";

export type Actor = Pick<TrainingUser, "id" | "username" | "role">;

export function isAdmin(user: Actor | null | undefined) {
  return user?.role === "admin";
}

export function isProjectManager(user: Actor | null | undefined) {
  return user?.role === "project_manager";
}

export function canManageProjects(user: Actor | null | undefined) {
  return isAdmin(user) || isProjectManager(user);
}

export function canViewAdminTools(user: Actor | null | undefined) {
  return isAdmin(user);
}

export function canManageProject(user: Actor | null | undefined, projectId: number) {
  if (!user) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  if (!isProjectManager(user)) {
    return false;
  }

  initializeSchema();
  const row = getDb()
    .prepare(
      `select 1 as allowed
      from projects p
      left join project_users pu on pu.project_id = p.id and pu.user_id = ?
      where p.id = ?
        and (p.created_by = ? or pu.role in ('owner', 'manager'))`,
    )
    .get(user.id, projectId, user.id) as { allowed: number } | undefined;

  return Boolean(row);
}

export function canViewProject(user: Actor | null | undefined, projectId: number) {
  if (!user) {
    return false;
  }

  if (isAdmin(user) || canManageProject(user, projectId)) {
    return true;
  }

  initializeSchema();
  const row = getDb()
    .prepare("select 1 as allowed from project_users where project_id = ? and user_id = ?")
    .get(projectId, user.id) as { allowed: number } | undefined;

  return Boolean(row);
}

export function canManageTask(user: Actor | null | undefined, taskId: number) {
  if (!user) {
    return false;
  }

  if (isAdmin(user)) {
    return true;
  }

  initializeSchema();
  const row = getDb()
    .prepare("select project_id from tasks where id = ?")
    .get(taskId) as { project_id: number } | undefined;

  return row ? canManageProject(user, row.project_id) : false;
}

export function canViewTask(user: Actor | null | undefined, taskId: number) {
  if (!user) {
    return false;
  }

  if (canManageTask(user, taskId)) {
    return true;
  }

  initializeSchema();
  const row = getDb()
    .prepare("select 1 as allowed from task_users where task_id = ? and user_id = ?")
    .get(taskId, user.id) as { allowed: number } | undefined;

  return Boolean(row);
}

export function projectScopeWhere(user: Actor, alias = "p") {
  if (isAdmin(user)) {
    return "1 = 1";
  }

  if (isProjectManager(user)) {
    return `(${alias}.created_by = @actorId or exists (
      select 1 from project_users scope_pu
      where scope_pu.project_id = ${alias}.id
        and scope_pu.user_id = @actorId
        and scope_pu.role in ('owner', 'manager')
    ))`;
  }

  return `exists (
    select 1 from project_users scope_pu
    where scope_pu.project_id = ${alias}.id
      and scope_pu.user_id = @actorId
  )`;
}

export function taskScopeWhere(user: Actor, taskAlias = "t", projectAlias = "p") {
  if (isAdmin(user)) {
    return "1 = 1";
  }

  if (isProjectManager(user)) {
    return `(${projectAlias}.created_by = @actorId or exists (
      select 1 from project_users scope_pu
      where scope_pu.project_id = ${projectAlias}.id
        and scope_pu.user_id = @actorId
        and scope_pu.role in ('owner', 'manager')
    ))`;
  }

  return `exists (
    select 1 from task_users scope_tu
    where scope_tu.task_id = ${taskAlias}.id
      and scope_tu.user_id = @actorId
  )`;
}
