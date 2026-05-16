import { getDb, initializeSchema } from "./db.ts";
import type { Actor } from "./permissions.ts";
import { isAdmin, isProjectManager, projectScopeWhere, taskScopeWhere } from "./permissions.ts";

export type DashboardProject = {
  id: number;
  title: string;
  due: string | null;
  progress: number;
  members: string;
};

export type DashboardTask = {
  id: number;
  title: string;
  projectId: number;
  projectTitle: string;
  status: "Done" | "Open";
};

export type DashboardData = {
  username: string;
  projectLabel: string;
  taskLabel: string;
  projects: DashboardProject[];
  tasks: DashboardTask[];
};

type ProjectRow = {
  id: number;
  title: string;
  due: string | null;
  completed_count: number;
  task_count: number;
  members: string | null;
};

type TaskRow = {
  id: number;
  title: string;
  project_id: number;
  project_title: string;
  completed: number;
};

export function getDashboardData(actor: Actor): DashboardData {
  initializeSchema();

  const database = getDb();
  const projectScope = projectScopeWhere(actor, "p");
  const taskScope = taskScopeWhere(actor, "t", "p");

  const projects = database
    .prepare(
      `
        select
          p.id,
          p.title,
          p.due_date as due,
          coalesce(sum(case when t.completed = 1 then 1 else 0 end), 0) as completed_count,
          count(t.id) as task_count,
          group_concat(distinct member.username) as members
        from projects p
        left join project_users all_assignments on all_assignments.project_id = p.id
        left join users member on member.id = all_assignments.user_id
        left join tasks t on t.project_id = p.id
        where ${projectScope}
        group by p.id, p.title, p.due_date
        order by coalesce(p.due_date, '9999-12-31'), p.id
      `,
    )
    .all({ actorId: actor.id }) as ProjectRow[];

  const tasks = database
    .prepare(
      `
        select
          t.id,
          t.title,
          t.project_id,
          p.title as project_title,
          t.completed
        from tasks t
        join projects p on p.id = t.project_id
        where ${taskScope}
        order by t.completed asc, coalesce(t.due_date, '9999-12-31'), t.id
      `,
    )
    .all({ actorId: actor.id }) as TaskRow[];

  return {
    username: actor.username,
    projectLabel: isAdmin(actor) ? "All Projects" : isProjectManager(actor) ? "Managed Projects" : "My Projects",
    taskLabel: isAdmin(actor) ? "All Tasks" : isProjectManager(actor) ? "Project Tasks" : "My Tasks",
    projects: projects.map((project) => ({
      id: project.id,
      title: project.title,
      due: project.due,
      progress:
        project.task_count === 0
          ? 0
          : Math.round((project.completed_count / project.task_count) * 100),
      members: project.members?.split(",").join(", ") ?? "",
    })),
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      projectId: task.project_id,
      projectTitle: task.project_title,
      status: task.completed === 1 ? "Done" : "Open",
    })),
  };
}
