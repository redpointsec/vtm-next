import Link from "next/link";
import { vulnerabilityHighlights } from "@/lib/vulnerabilities";

const projects = [
  {
    id: 7,
    title: "Marketing Campaign",
    due: "2026-06-01",
    progress: 42,
    members: "chris, ken",
  },
  {
    id: 9,
    title: "iOS App Development",
    due: "2026-06-12",
    progress: 18,
    members: "pm",
  },
];

const tasks = [
  ["Advertising", "Marketing Campaign", "Open"],
  ["Record radio commercial", "Marketing Campaign", "Open"],
  ["Build onboarding screen", "iOS App Development", "Done"],
];

export default function DashboardPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Operational view for intentionally vulnerable task workflows.</p>
        </div>
        <Link className="button" href="/projects">
          New project
        </Link>
      </div>

      <div className="grid two">
        <section className="card">
          <div className="card-header">Assigned Projects</div>
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
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <Link href={`/projects?id=${project.id}`}>{project.title}</Link>
                    </td>
                    <td>{project.due}</td>
                    <td>{project.progress}%</td>
                    <td>{project.members}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card-header">My Tasks</div>
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
                {tasks.map(([task, project, status]) => (
                  <tr key={`${project}-${task}`}>
                    <td>{task}</td>
                    <td>{project}</td>
                    <td>
                      <span className="badge">{status}</span>
                    </td>
                  </tr>
                ))}
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
