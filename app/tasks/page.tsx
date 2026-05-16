import { redirect } from "next/navigation";
import { getCurrentTrainingUser } from "@/lib/auth";
import { listFiles, listNotes, listProjects, listTasks, listUsers } from "@/lib/crud";
import { canManageProjects, canManageTask } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type TasksPageProps = {
  searchParams?: Promise<{
    edit?: string;
    note?: string;
    saved?: string;
    deleted?: string;
    uploaded?: string;
  }>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;
  const currentUser = await getCurrentTrainingUser();

  if (!currentUser) {
    redirect("/login?next=/tasks");
  }

  const projects = listProjects(currentUser);
  const tasks = listTasks(currentUser);
  const notes = listNotes(undefined, currentUser);
  const files = listFiles(currentUser);
  const users = listUsers();
  const editingTask = tasks.find((task) => task.id === Number(params?.edit));
  const editingNote = notes.find((note) => note.id === Number(params?.note));
  const defaultTaskId = editingTask?.id || tasks.at(0)?.id || 101;
  const canManage = canManageProjects(currentUser);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{canManage ? "Tasks" : "My Tasks"}</h1>
          <p>{canManage ? "Manage tasks, notes, and uploaded training files." : "Review assigned tasks and add notes."}</p>
        </div>
      </div>

      <div className="grid two">
        {canManage ? (
        <section className="card">
          <div className="card-header">{editingTask ? `Edit Task #${editingTask.id}` : "New Task"}</div>
          <div className="card-body">
            <form className="form-grid" action="/api/tasks" method="post">
              <input name="id" type="hidden" defaultValue={editingTask?.id || ""} />
              <div className="field">
                <label htmlFor="projectId">Project</label>
                <select id="projectId" name="projectId" defaultValue={editingTask?.project_id || projects.at(0)?.id}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="taskTitle">Title</label>
                <input id="taskTitle" name="title" defaultValue={editingTask?.title || "Create TV ad"} />
              </div>
              <div className="field">
                <label htmlFor="taskText">Text</label>
                <textarea id="taskText" name="text" defaultValue={editingTask?.text || "Initial task text"} />
              </div>
              <div className="grid two">
                <div className="field">
                  <label htmlFor="status">Status</label>
                  <input id="status" name="status" defaultValue={editingTask?.status || "open"} />
                </div>
                <div className="field">
                  <label htmlFor="priority">Priority</label>
                  <input id="priority" name="priority" type="number" defaultValue={editingTask?.priority || 2} />
                </div>
              </div>
              <div className="grid two">
                <div className="field">
                  <label htmlFor="dueDate">Due date</label>
                  <input id="dueDate" name="dueDate" type="date" defaultValue={editingTask?.due_date || ""} />
                </div>
                <div className="field">
                  <label htmlFor="completed">Completed</label>
                  <select id="completed" name="completed" defaultValue={editingTask?.completed || 0}>
                    <option value="0">Open</option>
                    <option value="1">Done</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="userIds">Assigned user IDs</label>
                <input
                  id="userIds"
                  name="userIds"
                  defaultValue={
                    editingTask
                      ? editingTask.user_ids || ""
                      : String(currentUser.id)
                  }
                />
              </div>
              {params?.saved ? <p className="form-success">Record saved.</p> : null}
              {params?.deleted ? <p className="form-success">Record deleted.</p> : null}
              <button className="button" type="submit">
                Save task
              </button>
            </form>
          </div>
        </section>
        ) : null}

        <section className="card">
          <div className="card-header">{editingNote ? `Edit Note #${editingNote.id}` : "New Note"}</div>
          <div className="card-body">
            <form className="form-grid" action="/api/notes" method="post">
              <input name="id" type="hidden" defaultValue={editingNote?.id || ""} />
              <div className="field">
                <label htmlFor="taskId">Task</label>
                <select id="taskId" name="taskId" defaultValue={editingNote?.task_id || defaultTaskId}>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      #{task.id} {task.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="noteTitle">Title</label>
                <input id="noteTitle" name="title" defaultValue={editingNote?.title || "Status note"} />
              </div>
              <div className="field">
                <label htmlFor="noteText">Text</label>
                <textarea id="noteText" name="text" defaultValue={editingNote?.text || "Add note text"} />
              </div>
              <div className="field">
                <label htmlFor="image">Image URL/path</label>
                <input id="image" name="image" defaultValue={editingNote?.image || ""} />
              </div>
              <div className="field">
                <label htmlFor="userId">Author user ID</label>
                <input id="userId" name="userId" type="number" defaultValue={editingNote?.user_id || currentUser.id} />
              </div>
              <button className="button" type="submit">
                Save note
              </button>
            </form>
          </div>
        </section>
      </div>

      <section className="card page-section">
        <div className="card-header">Task Records</div>
        <div className="card-body table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Task</th>
                <th>Project</th>
                <th>Assignees</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.id}</td>
                  <td>{task.title}</td>
                  <td>{task.project_title}</td>
                  <td>{task.assignees || "none"}</td>
                  <td>{task.completed ? "Done" : task.status}</td>
                  <td className="row-actions">
                    {canManageTask(currentUser, task.id) ? (
                      <a className="button secondary compact" href={`/tasks?edit=${task.id}`}>
                        Edit
                      </a>
                    ) : null}
                    <form action="/api/tasks/toggle" method="post">
                      <input name="id" type="hidden" value={task.id} />
                      <button className="button secondary compact" type="submit">
                        Toggle
                      </button>
                    </form>
                    {canManageTask(currentUser, task.id) ? (
                      <form action="/api/tasks/delete" method="post">
                        <input name="id" type="hidden" value={task.id} />
                        <button className="button secondary compact" type="submit">
                          Delete
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid two page-section">
        <section className="card">
          <div className="card-header">Notes</div>
          <div className="card-body table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Task</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((note) => (
                  <tr key={note.id}>
                    <td>{note.id}</td>
                    <td>{note.task_title}</td>
                    <td>{note.title}</td>
                    <td>{note.username || note.user_id}</td>
                    <td className="row-actions">
                      <a className="button secondary compact" href={`/tasks?note=${note.id}`}>
                        Edit
                      </a>
                      {canManage || note.user_id === currentUser.id ? (
                        <form action="/api/notes/delete" method="post">
                          <input name="id" type="hidden" value={note.id} />
                          <button className="button secondary compact" type="submit">
                            Delete
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {canManage ? (
        <section className="card">
          <div className="card-header">Files</div>
          <div className="card-body">
            <div className="grid two">
              <form className="form-grid" action="/api/files/upload" method="post" encType="multipart/form-data">
                <input name="projectId" type="hidden" value={projects.at(0)?.id || 0} />
                <input name="taskId" type="hidden" value={defaultTaskId} />
                <input name="uploadedBy" type="hidden" value="2" />
                <div className="field">
                  <label htmlFor="file">Local file</label>
                  <input id="file" name="file" type="file" />
                </div>
                <button className="button secondary" type="submit">
                  Upload
                </button>
              </form>
              <form className="form-grid" action="/api/files/import" method="post">
                <input name="projectId" type="hidden" value={projects.at(0)?.id || 0} />
                <input name="taskId" type="hidden" value={defaultTaskId} />
                <input name="uploadedBy" type="hidden" value="2" />
                <div className="field">
                  <label htmlFor="sourceUrl">Remote URL</label>
                  <input id="sourceUrl" name="sourceUrl" defaultValue="http://169.254.169.254/latest/meta-data/" />
                </div>
                <button className="button secondary" type="submit">
                  Import URL
                </button>
              </form>
            </div>
            {params?.uploaded ? <p className="form-success stacked-form">File recorded.</p> : null}
            <div className="table-wrap stacked-form">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Source</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => (
                    <tr key={file.id}>
                      <td>{file.id}</td>
                      <td>{file.name}</td>
                      <td>{file.source_url || file.path}</td>
                      <td>
                        <form action="/api/files/delete" method="post">
                          <input name="id" type="hidden" value={file.id} />
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
          </div>
        </section>
        ) : null}
      </div>
    </>
  );
}
