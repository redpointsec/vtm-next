export default function TasksPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>Task and note workflows will mirror VTM with Next.js route handlers.</p>
        </div>
      </div>

      <div className="grid two">
        <section className="card">
          <div className="card-header">Task Editor</div>
          <div className="card-body">
            <form className="form-grid" action="/api/tasks" method="post">
              <div className="field">
                <label htmlFor="task_title">Title</label>
                <input id="task_title" name="title" defaultValue="Create TV ad" />
              </div>
              <div className="field">
                <label htmlFor="task_text">Text</label>
                <textarea id="task_text" name="text" defaultValue="Initial task text" />
              </div>
              <button className="button" type="submit">
                Save task
              </button>
            </form>
          </div>
        </section>

        <section className="card">
          <div className="card-header">Notes</div>
          <div className="card-body">
            <form className="form-grid" action="/api/notes" method="post">
              <div className="field">
                <label htmlFor="note_title">Title</label>
                <input id="note_title" name="title" defaultValue="Status note" />
              </div>
              <div className="field">
                <label htmlFor="note_text">Text</label>
                <textarea id="note_text" name="text" defaultValue="Add note text" />
              </div>
              <button className="button" type="submit">
                Save note
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
