import { listProjects, listUsers } from "@/lib/crud";

export const dynamic = "force-dynamic";

type ProjectsPageProps = {
  searchParams?: Promise<{
    edit?: string;
    saved?: string;
    deleted?: string;
  }>;
};

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams;
  const projects = listProjects();
  const users = listUsers();
  const editing = projects.find((project) => project.id === Number(params?.edit));

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>Create, edit, assign, and inspect project records.</p>
        </div>
      </div>

      <div className="grid two">
        <section className="card">
          <div className="card-header">{editing ? `Edit Project #${editing.id}` : "New Project"}</div>
          <div className="card-body">
            <form className="form-grid" action="/api/projects" method="post">
              <input name="id" type="hidden" defaultValue={editing?.id || ""} />
              <div className="field">
                <label htmlFor="title">Title</label>
                <input id="title" name="title" defaultValue={editing?.title || "New Campaign"} />
              </div>
              <div className="field">
                <label htmlFor="text">Description</label>
                <textarea id="text" name="text" defaultValue={editing?.text || "Draft project details"} />
              </div>
              <div className="grid two">
                <div className="field">
                  <label htmlFor="dueDate">Due date</label>
                  <input id="dueDate" name="dueDate" type="date" defaultValue={editing?.due_date || ""} />
                </div>
                <div className="field">
                  <label htmlFor="priority">Priority</label>
                  <input id="priority" name="priority" type="number" defaultValue={editing?.priority || 2} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="createdBy">Owner</label>
                <select id="createdBy" name="createdBy" defaultValue={editing?.created_by || 3}>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="userIds">Assigned user IDs</label>
                <input
                  id="userIds"
                  name="userIds"
                  defaultValue={
                    editing
                      ? users
                          .filter((user) => editing.members?.split(",").includes(user.username))
                          .map((user) => user.id)
                          .join(",")
                      : "1,2,3"
                  }
                />
              </div>
              {params?.saved ? <p className="form-success">Project saved.</p> : null}
              {params?.deleted ? <p className="form-success">Project deleted.</p> : null}
              <button className="button" type="submit">
                Save project
              </button>
            </form>
          </div>
        </section>

        <section className="card">
          <div className="card-header">Projects</div>
          <div className="card-body table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Members</th>
                  <th>Tasks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>{project.id}</td>
                    <td>{project.title}</td>
                    <td>{project.members || "none"}</td>
                    <td>{project.task_count}</td>
                    <td className="row-actions">
                      <a className="button secondary compact" href={`/projects?edit=${project.id}`}>
                        Edit
                      </a>
                      <form action="/api/projects/delete" method="post">
                        <input name="id" type="hidden" value={project.id} />
                        <button className="button secondary compact" type="submit">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
