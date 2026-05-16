import Link from "next/link";
import { getCurrentTrainingUser } from "@/lib/auth";
import { findTrainingUser } from "@/lib/auth";
import { canManageProjects } from "@/lib/permissions";
import { getDashboardData } from "@/lib/queries";
import { vulnerabilityHighlights } from "@/lib/vulnerabilities";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const currentUser = await getCurrentTrainingUser();
  const fallbackUser = findTrainingUser(process.env.VTM_NEXT_TRAINING_USER || "chris");
  const actor = currentUser || fallbackUser;

  if (!actor) {
    return null;
  }

  const { username, projectLabel, taskLabel, projects, tasks } = getDashboardData(actor);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Operational view for {username}&apos;s intentionally vulnerable task workflows.</p>
        </div>
        {canManageProjects(actor) ? (
          <Link className="button" href="/projects">
            New project
          </Link>
        ) : null}
      </div>

      <div className="grid two">
        <section className="card">
          <div className="card-header">{projectLabel}</div>
          <div className="card-body">
            <table className="table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Due</th>
                  <th>Progress</th>
                  <th>Members</th>
                </tr>
              </thead>
              <tbody>
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <Link href={`/projects?id=${project.id}`}>{project.title}</Link>
                      </td>
                      <td>{project.due ?? "Unscheduled"}</td>
                      <td>{project.progress}%</td>
                      <td>{project.members || "Unassigned"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty-cell" colSpan={4}>
                      No assigned projects found. Seed the SQLite database to populate this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card-header">{taskLabel}</div>
          <div className="card-body">
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <tr key={task.id}>
                      <td>{task.title}</td>
                      <td>
                        <Link href={`/projects?id=${task.projectId}`}>{task.projectTitle}</Link>
                      </td>
                      <td>
                        <span className="badge">{task.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty-cell" colSpan={3}>
                      No assigned tasks found. Seed the SQLite database to populate this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="card-header">Training Surfaces</div>
        <div className="card-body">
          <div className="grid three">
            {vulnerabilityHighlights.map((item) => (
              <div key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
